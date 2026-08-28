#!/usr/bin/env node
/**
 * LocalHelm bridge for the xFacts Sites plugin.
 *
 * Commands (stdout = JSON):
 *   inventory
 *   plan  --action check|reencode|refresh [--names a,b]
 *   apply --action check|reencode|refresh [--names a,b]
 *
 * Discovers sibling repos under the workspace parent (../ from x-facts).
 * Does not take a fleet list from LocalHelm — same posture as FilePress.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const XFACTS_ROOT = resolve(__dirname, '..');
const WORKSPACE = resolve(XFACTS_ROOT, '..');
const APP_FACTS_GEN = join(WORKSPACE, 'app-facts', 'generator', 'generate_app_facts.js');

/** Open-source shelf products to surface on the LocalHelm board. */
const SHELF = new Set([
	'forgetrail',
	'aibreze',
	'temper-pass',
	'ember-dossier',
	'anticonfab',
	'filepress',
	'ingotvault',
	'finetuna',
	'ollanet',
	'docupuncture',
	'dictawhisper',
	'localslip',
	'localhelm',
]);

function parseArgs(argv) {
	const out = { cmd: argv[0] || 'inventory', action: null, names: [] };
	for (let i = 1; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--action') out.action = argv[++i];
		else if (a === '--names') out.names = String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
	}
	return out;
}

function extractFrontmatter(md) {
	const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
	if (!m) return null;
	const fm = {};
	for (const line of m[1].split(/\r?\n/)) {
		const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
		if (!kv) continue;
		let v = kv[2].trim();
		if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
			v = v.slice(1, -1);
		}
		fm[kv[1]] = v;
	}
	return fm;
}

const LABEL_KINDS = [
	{ id: 'app', ref: 'appfacts-label', host: /https:\/\/appfacts\.dev\/v#[^\s)\]>]+/ },
	{ id: 'tool', ref: 'toolfacts-label', host: /https:\/\/toolfacts\.dev\/v#[^\s)\]>]+/ },
	{ id: 'skill', ref: 'skillfacts-label', host: /https:\/\/skillfacts\.dev\/v#[^\s)\]>]+/ },
	{ id: 'agent', ref: 'agentfacts-label', host: /https:\/\/agentfacts\.dev\/v#[^\s)\]>]+/ },
	{ id: 'model', ref: 'modelfacts-label', host: /https:\/\/modelfacts\.dev\/v#[^\s)\]>]+/ },
];

function extractViewer(md, kindId = 'app') {
	const kind = LABEL_KINDS.find((row) => row.id === kindId) ?? LABEL_KINDS[0];
	const named = new RegExp(`\\[${kind.ref}\\]:\\s*(\\S+)`).exec(md);
	if (named?.[1]) return named[1];
	const hosted = kind.host.exec(md);
	return hosted?.[0] ?? null;
}

function mergeViewers(md, into) {
	for (const kind of LABEL_KINDS) {
		if (into[kind.id]) continue;
		const href = extractViewer(md, kind.id);
		if (href) into[kind.id] = href;
	}
}

function decodeAf1Name(url) {
	if (!url || !url.includes('af1.')) return null;
	try {
		let s = url.includes('#af1.') ? url.split('#af1.')[1] : url.replace(/^af1\./, '');
		const pad = '='.repeat((4 - (s.length % 4)) % 4);
		const json = inflateSync(Buffer.from(s + pad, 'base64url')).toString('utf8');
		const data = JSON.parse(json);
		return data?.name ? String(data.name) : null;
	} catch {
		return null;
	}
}

function listRepos() {
	return readdirSync(WORKSPACE, { withFileTypes: true })
		.filter((d) => d.isDirectory() && SHELF.has(d.name))
		.map((d) => d.name)
		.sort();
}

function inspectRepo(id) {
	const root = join(WORKSPACE, id);
	const appPath = join(root, 'APP_FACTS.md');
	const toolPaths = [join(root, 'TOOL_FACTS.md'), join(root, 'mcp-server', 'TOOL_FACTS.md')];
	const skillHits = [];
	function walkSkills(dir, depth = 0) {
		if (depth > 4 || !existsSync(dir)) return;
		for (const ent of readdirSync(dir, { withFileTypes: true })) {
			if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue;
			const p = join(dir, ent.name);
			if (ent.isFile() && ent.name === 'SKILL_FACTS.md') skillHits.push(p);
			else if (ent.isDirectory()) walkSkills(p, depth + 1);
		}
	}
	walkSkills(root);

	let app = 'missing';
	let name = '—';
	let viewer = null;
	let viewerStatus = '—';
	let status = 'no label';
	let fingerprint = null;
	const viewers = {};
	const extra = { agent: false, model: false };

	if (existsSync(appPath)) {
		const md = readFileSync(appPath, 'utf8');
		const fm = extractFrontmatter(md) || {};
		name = fm.name || id;
		fingerprint = fm.inputs_fingerprint || null;
		// fingerprint is nested under generated: in YAML — simple extract:
		const fp = /inputs_fingerprint:\s*(\S+)/.exec(md);
		if (fp) fingerprint = fp[1];
		mergeViewers(md, viewers);
		viewer = viewers.app ?? null;
		const payloadName = decodeAf1Name(viewer);
		if (!viewer) {
			app = 'present';
			viewerStatus = 'no /v';
			status = 'needs encode';
		} else if (payloadName && payloadName !== name) {
			app = 'drift';
			viewerStatus = `stale→${payloadName}`;
			status = 'viewer drift';
		} else {
			app = 'ok';
			viewerStatus = 'ok';
			status = 'ok';
		}
	}

	const tool = toolPaths.some((p) => existsSync(p)) ? 'yes' : '—';
	for (const p of toolPaths) {
		if (existsSync(p)) mergeViewers(readFileSync(p, 'utf8'), viewers);
	}
	const skill = skillHits.length ? String(skillHits.length) : '—';
	for (const p of skillHits) mergeViewers(readFileSync(p, 'utf8'), viewers);
	const readme = join(root, 'README.md');
	if (existsSync(readme)) mergeViewers(readFileSync(readme, 'utf8'), viewers);

	for (const kind of ['agent', 'model']) {
		const p = join(root, `${kind === 'agent' ? 'AGENT' : 'MODEL'}_FACTS.md`);
		if (!existsSync(p)) continue;
		extra[kind] = true;
		mergeViewers(readFileSync(p, 'utf8'), viewers);
	}

	return {
		id,
		name,
		app,
		tool,
		skill,
		agent: extra.agent || viewers.agent ? 'yes' : '—',
		model: extra.model || viewers.model ? 'yes' : '—',
		viewer,
		viewers,
		viewerStatus,
		status,
		fingerprint,
		appPath: existsSync(appPath) ? appPath : null,
		hasTool: tool === 'yes',
		skillCount: skillHits.length,
	};
}

function inventory() {
	const rows = listRepos().map(inspectRepo);
	return {
		workspace: WORKSPACE,
		note: `Shelf set (${SHELF.size}). Generator ${existsSync(APP_FACTS_GEN) ? 'found' : 'MISSING'}.`,
		rows,
	};
}

function selected(ids) {
	const inv = inventory();
	const want = new Set(ids);
	return want.size ? inv.rows.filter((r) => want.has(r.id)) : inv.rows;
}

function plan(action, ids) {
	const rows = selected(ids);
	if (action === 'check') {
		return {
			action,
			note: 'Compare AppFacts fingerprint to a fresh scan (no write).',
			rows: rows.map((r) => ({
				id: r.id,
				app: r.app,
				status: r.status,
				writes: false,
				action: r.appPath ? 'check' : 'skip',
			})),
		};
	}
	if (action === 'reencode') {
		return {
			action,
			note: 'Rewrite /v viewer links from current APP_FACTS frontmatter (no LLM).',
			rows: rows.map((r) => ({
				id: r.id,
				app: r.app,
				status: r.status,
				writes: Boolean(r.appPath),
				action: r.appPath ? 'reencode' : 'skip',
			})),
		};
	}
	if (action === 'refresh') {
		return {
			action,
			note: 'Re-run AppFacts generator (LLM) and rewrite APP_FACTS.md + /v.',
			rows: rows.map((r) => {
				const hasPkg = existsSync(join(WORKSPACE, r.id, 'package.json')) || existsSync(join(WORKSPACE, r.id, 'README.md'));
				return {
					id: r.id,
					app: r.app,
					status: r.status,
					writes: hasPkg && existsSync(APP_FACTS_GEN),
					action: hasPkg && existsSync(APP_FACTS_GEN) ? 'refresh' : 'skip',
				};
			}),
		};
	}
	throw new Error(`unknown action ${action}`);
}

function runCheck(id) {
	const appPath = join(WORKSPACE, id, 'APP_FACTS.md');
	if (!existsSync(appPath)) return { id, ok: false, detail: 'no APP_FACTS.md' };
	if (!existsSync(APP_FACTS_GEN)) return { id, ok: false, detail: 'generator missing' };
	const result = spawnSync(process.execPath, [APP_FACTS_GEN, join(WORKSPACE, id), '--check'], {
		encoding: 'utf8',
		windowsHide: true,
	});
	const out = `${result.stdout || ''}${result.stderr || ''}`.trim();
	return {
		id,
		ok: result.status === 0,
		detail: out.slice(0, 500) || (result.status === 0 ? 'fingerprint ok' : `exit ${result.status}`),
		writes: false,
	};
}

function runReencode(id) {
	const appPath = join(WORKSPACE, id, 'APP_FACTS.md');
	if (!existsSync(appPath)) return { id, ok: false, detail: 'no APP_FACTS.md', writes: false };
	const helper = join(XFACTS_ROOT, 'scripts', 'reencode_app_facts_viewer.py');
	if (!existsSync(helper)) return { id, ok: false, detail: 'reencode helper missing', writes: false };
	const result = spawnSync('python', [helper, appPath], { encoding: 'utf8', windowsHide: true });
	const out = `${result.stdout || ''}${result.stderr || ''}`.trim();
	return {
		id,
		ok: result.status === 0,
		detail: out.slice(0, 500) || (result.status === 0 ? 'reencoded' : `exit ${result.status}`),
		writes: result.status === 0,
	};
}

function runRefresh(id) {
	if (!existsSync(APP_FACTS_GEN)) return { id, ok: false, detail: 'generator missing', writes: false };
	const result = spawnSync(
		process.execPath,
		[
			APP_FACTS_GEN,
			join(WORKSPACE, id),
			'--provider',
			'ollama',
			'--model',
			'gemma4:12b',
			'--no-qr',
			'--consulting-link',
			'https://www.catalystforge.com/',
			'--consulting-name',
			'Catalyst Forge',
		],
		{ encoding: 'utf8', windowsHide: true, timeout: 600_000 },
	);
	const out = `${result.stdout || ''}${result.stderr || ''}`.trim();
	return {
		id,
		ok: result.status === 0,
		detail: out.slice(-500) || (result.status === 0 ? 'refreshed' : `exit ${result.status}`),
		writes: result.status === 0,
	};
}

function apply(action, ids) {
	const rows = selected(ids);
	const results = [];
	for (const r of rows) {
		if (action === 'check') results.push(runCheck(r.id));
		else if (action === 'reencode') results.push(runReencode(r.id));
		else if (action === 'refresh') results.push(runRefresh(r.id));
		else throw new Error(`unknown action ${action}`);
	}
	return {
		action,
		rows: results,
		wrote: results.filter((r) => r.writes).length,
		ok: results.every((r) => r.ok),
	};
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	let payload;
	if (args.cmd === 'inventory') payload = inventory();
	else if (args.cmd === 'plan') payload = plan(args.action, args.names);
	else if (args.cmd === 'apply') payload = apply(args.action, args.names);
	else throw new Error(`unknown command ${args.cmd}`);
	process.stdout.write(JSON.stringify(payload) + '\n');
}

try {
	main();
} catch (err) {
	process.stderr.write(String(err?.stack || err) + '\n');
	process.exit(1);
}
