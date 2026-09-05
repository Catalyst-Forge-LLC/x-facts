#!/usr/bin/env node
/**
 * LocalHelm bridge for the xFacts Sites plugin.
 *
 * Commands (stdout = JSON):
 *   inventory
 *   plan  --action check|reencode|refresh [--names a,b]
 *   apply --action check|reencode|refresh [--names a,b]
 *
 * Lists enrolled LocalHelm fleet projects (localhelm.fleet.json next to this
 * workspace). Falls back to sibling git/package folders if no fleet file.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const XFACTS_ROOT = resolve(__dirname, '..');
const WORKSPACE = resolve(XFACTS_ROOT, '..');
const APP_FACTS_GEN = join(WORKSPACE, 'app-facts', 'generator', 'generate_app_facts.js');

const SKIP_SIBLINGS = new Set(['__ARCHIVE', '__tmp', 'node_modules']);

function readJson(file) {
	try {
		return JSON.parse(readFileSync(file, 'utf8'));
	} catch {
		return null;
	}
}

function archivedIds() {
	const raw = readJson(join(WORKSPACE, '.localhelm', 'archive.json'));
	return new Set(Array.isArray(raw?.ids) ? raw.ids.filter((id) => typeof id === 'string' && id.trim()) : []);
}

/** Enrolled fleet rows. Paths stay relative to the workspace that holds the fleet file. */
function loadFleetProjects() {
	const file = join(WORKSPACE, 'localhelm.fleet.json');
	const raw = existsSync(file) ? readJson(file) : null;
	if (!raw || !Array.isArray(raw.projects)) return null;
	const archived = archivedIds();
	const rows = [];
	for (const item of raw.projects) {
		if (!item || typeof item.id !== 'string' || typeof item.path !== 'string') continue;
		const id = item.id.trim();
		const rel = String(item.path).replace(/\\/g, '/').replace(/^\.\//, '');
		if (!id || !rel || archived.has(id)) continue;
		if (!existsSync(join(WORKSPACE, rel))) continue;
		rows.push({ id, path: rel });
	}
	return rows.length ? rows : null;
}

function siblingProjects() {
	return readdirSync(WORKSPACE, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.filter((entry) => !entry.name.startsWith('.') && !SKIP_SIBLINGS.has(entry.name))
		.filter(
			(entry) =>
				existsSync(join(WORKSPACE, entry.name, '.git')) || existsSync(join(WORKSPACE, entry.name, 'package.json')),
		)
		.map((entry) => ({ id: entry.name, path: entry.name }));
}

function listProjects() {
	const rows = loadFleetProjects() ?? siblingProjects();
	return rows.toSorted((a, b) => a.id.localeCompare(b.id, undefined, { sensitivity: 'base' }));
}

function repoAbs(row) {
	return join(WORKSPACE, row.path || row.id);
}

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

const GENERIC_FACTS_PARENTS = new Set(['skills', 'passes', 'site', 'mcp-server']);

function factsName(filePath, md) {
	const fm = extractFrontmatter(md) || {};
	const parts = filePath.replace(/\\/g, '/').split('/');
	const file = parts[parts.length - 1] ?? '';
	const parent = parts[parts.length - 2] ?? '';
	if (file === 'SKILL_FACTS.md' && parent && !GENERIC_FACTS_PARENTS.has(parent)) return parent;
	if (fm.name) return fm.name;
	if (file.endsWith('_FACTS.md') && parent && !GENERIC_FACTS_PARENTS.has(parent)) return parent;
	return file.replace(/_FACTS\.md$/i, '') || 'label';
}

function uniqueFactsItems(items) {
	const byLabel = new Map();
	for (const item of items) {
		const prev = byLabel.get(item.label);
		if (!prev || (!prev.href && item.href)) byLabel.set(item.label, item);
	}
	return [...byLabel.values()];
}

function factsItem(filePath, kindId) {
	if (!existsSync(filePath)) return null;
	const md = readFileSync(filePath, 'utf8');
	return { label: factsName(filePath, md), href: extractViewer(md, kindId) || undefined, path: filePath };
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

function inspectRepo(project) {
	const id = project.id;
	const root = repoAbs(project);
	const appPath = join(root, 'APP_FACTS.md');
	const toolPaths = [join(root, 'TOOL_FACTS.md'), join(root, 'mcp-server', 'TOOL_FACTS.md')];
	const skillHits = [];
	function walkSkills(dir, depth = 0) {
		if (depth > 4 || !existsSync(dir)) return;
		for (const ent of readdirSync(dir, { withFileTypes: true })) {
			if (
				ent.name === 'node_modules' ||
				ent.name === '.git' ||
				ent.name === 'dist' ||
				ent.name === '.cursor' ||
				ent.name === 'site'
			) {
				continue;
			}
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

	const toolItems = uniqueFactsItems(toolPaths.map((p) => factsItem(p, 'tool')).filter(Boolean));
	for (const item of toolItems) {
		if (item.href && !viewers.tool) viewers.tool = item.href;
	}
	const skillItems = uniqueFactsItems(skillHits.map((p) => factsItem(p, 'skill')).filter(Boolean));
	for (const item of skillItems) {
		if (item.href && !viewers.skill) viewers.skill = item.href;
	}
	const readme = join(root, 'README.md');
	if (existsSync(readme)) {
		const md = readFileSync(readme, 'utf8');
		mergeViewers(md, viewers);
		if (skillItems.length === 1 && !skillItems[0].href) {
			const href = extractViewer(md, 'skill');
			if (href) skillItems[0].href = href;
		}
		if (toolItems.length === 1 && !toolItems[0].href) {
			const href = extractViewer(md, 'tool');
			if (href) toolItems[0].href = href;
		}
	}
	const tool = toolItems.length ? (toolItems.length === 1 ? 'yes' : String(toolItems.length)) : '—';
	const skill = skillItems.length ? String(skillItems.length) : '—';

	for (const kind of ['agent', 'model']) {
		const p = join(root, `${kind === 'agent' ? 'AGENT' : 'MODEL'}_FACTS.md`);
		if (!existsSync(p)) continue;
		extra[kind] = true;
		mergeViewers(readFileSync(p, 'utf8'), viewers);
	}

	return {
		id,
		path: project.path,
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
		hasTool: toolItems.length > 0,
		skillCount: skillItems.length,
		toolItems,
		skillItems,
	};
}

function inventory() {
	const rows = listProjects().map(inspectRepo);
	const fromFleet = Boolean(loadFleetProjects());
	return {
		workspace: WORKSPACE,
		note: fromFleet
			? `Enrolled fleet (${rows.length}). Check a row, then Add labels or Refresh. Generator ${existsSync(APP_FACTS_GEN) ? 'found' : 'MISSING'}.`
			: `Sibling folders (${rows.length}; no localhelm.fleet.json). Generator ${existsSync(APP_FACTS_GEN) ? 'found' : 'MISSING'}.`,
		rows,
	};
}

function factsPaths(row) {
	return [
		row.appPath,
		...(row.toolItems ?? []).map((item) => item.path),
		...(row.skillItems ?? []).map((item) => item.path),
	].filter(Boolean);
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
			note: 'Rewrite /v cards for app, tool, and skill files from frontmatter (no LLM).',
			rows: rows.map((r) => {
				const files = factsPaths(r);
				return {
					id: r.id,
					app: r.app,
					status: r.status,
					files: files.length,
					writes: files.length > 0,
					action: files.length ? 'reencode' : 'skip',
				};
			}),
		};
	}
	if (action === 'refresh') {
		return {
			action,
			note: 'Re-run AppFacts generator (LLM) and rewrite APP_FACTS.md + /v.',
			rows: rows.map((r) => {
				const hasPkg = existsSync(join(repoAbs(r), 'package.json')) || existsSync(join(repoAbs(r), 'README.md'));
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

function runCheck(row) {
	const id = row.id;
	const appPath = join(repoAbs(row), 'APP_FACTS.md');
	if (!existsSync(appPath)) return { id, ok: false, detail: 'no APP_FACTS.md' };
	if (!existsSync(APP_FACTS_GEN)) return { id, ok: false, detail: 'generator missing' };
	const result = spawnSync(process.execPath, [APP_FACTS_GEN, repoAbs(row), '--check'], {
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

function resolvePython() {
	if (process.env.PYTHON && existsSync(process.env.PYTHON)) return process.env.PYTHON;
	const home = homedir();
	for (const root of [join(home, '.pyenv', 'pyenv-win', 'versions'), join(home, '.pyenv', 'versions')]) {
		if (!existsSync(root)) continue;
		for (const ver of readdirSync(root).sort().reverse()) {
			for (const name of ['python.exe', 'python3', 'python']) {
				const exe = join(root, ver, name);
				if (existsSync(exe)) return exe;
			}
		}
	}
	return null;
}

function runPython(args) {
	const env = { ...process.env, PYTHONIOENCODING: 'utf-8' };
	const tries = [];
	const resolved = resolvePython();
	if (resolved) tries.push({ bin: resolved, prefix: [] });
	if (process.platform === 'win32') tries.push({ bin: 'py', prefix: ['-3'] });
	tries.push({ bin: 'python3', prefix: [] }, { bin: 'python', prefix: [] });
	let last = null;
	for (const { bin, prefix } of tries) {
		const result = spawnSync(bin, [...prefix, ...args], { encoding: 'utf8', windowsHide: true, env });
		last = result;
		if (!result.error && result.status === 0) return result;
		if (!result.error && result.status !== null && result.stdout) return result;
	}
	return last;
}

function runReencode(row) {
	const id = row.id;
	const files = factsPaths(row);
	const helper = join(XFACTS_ROOT, 'scripts', 'reencode_facts_viewer.py');
	if (!existsSync(helper)) return { id, ok: false, detail: 'reencode helper missing', writes: false };
	if (!files.length) return { id, ok: true, detail: 'no facts files', writes: false };
	const result = runPython([helper, ...files]);
	const out = `${result?.stdout || ''}${result?.stderr || ''}`.trim();
	const err = result?.error ? String(result.error.message || result.error) : '';
	const wrote = /^\s*reencoded /m.test(out);
	const ok = Boolean(result && result.status === 0 && !result.error);
	return {
		id,
		ok,
		detail: (out || err).slice(0, 800) || (ok ? 'reencoded' : `exit ${result?.status}`),
		writes: ok && wrote,
	};
}

function runRefresh(row) {
	const id = row.id;
	if (!existsSync(APP_FACTS_GEN)) return { id, ok: false, detail: 'generator missing', writes: false };
	const result = spawnSync(
		process.execPath,
		[
			APP_FACTS_GEN,
			repoAbs(row),
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
		if (action === 'check') results.push(runCheck(r));
		else if (action === 'reencode') results.push(runReencode(r));
		else if (action === 'refresh') results.push(runRefresh(r));
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
