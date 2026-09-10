#!/usr/bin/env node
/**
 * LocalHelm bridge for the xFacts Sites plugin.
 *
 * Commands (stdout = JSON):
 *   inventory
 *   plan  --action check|reencode|refresh|ship [--names a,b]
 *   apply --action check|reencode|refresh|ship [--names a,b]
 *
 * Lists enrolled LocalHelm fleet projects (localhelm.fleet.json next to this
 * workspace). Falls back to sibling git/package folders if no fleet file.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { missingSkillFacts, writeMissingSkillFacts } from '../../skill-facts/scripts/generate_skill_facts.mjs';

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

const FACTS_KINDS = {
	'APP_FACTS.md': 'app',
	'TOOL_FACTS.md': 'tool',
	'SKILL_FACTS.md': 'skill',
	'AGENT_FACTS.md': 'agent',
	'MODEL_FACTS.md': 'model',
};

const SKIP_FACTS_DIRS = new Set([
	'node_modules',
	'.git',
	'dist',
	'.cursor',
	'site',
	'fixtures',
	'coverage',
	'__ARCHIVE',
]);

function walkFacts(root) {
	const hits = { app: [], tool: [], skill: [], agent: [], model: [] };
	function walk(dir, depth) {
		if (depth > 4 || !existsSync(dir)) return;
		for (const ent of readdirSync(dir, { withFileTypes: true })) {
			if (SKIP_FACTS_DIRS.has(ent.name) || ent.name.startsWith('.')) continue;
			const p = join(dir, ent.name);
			if (ent.isFile()) {
				const kind = FACTS_KINDS[ent.name];
				if (kind && !(kind === 'app' && depth > 0)) hits[kind].push(p);
				continue;
			}
			if (ent.isDirectory()) walk(p, depth + 1);
		}
	}
	walk(root, 0);
	return hits;
}

function inspectRepo(project) {
	const id = project.id;
	const root = repoAbs(project);
	const found = walkFacts(root);
	const appPath = found.app[0] ?? join(root, 'APP_FACTS.md');

	let app = 'missing';
	let name = '—';
	let viewer = null;
	let viewerStatus = '—';
	let status = 'no label';
	let fingerprint = null;
	const viewers = {};

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

	const toolItems = uniqueFactsItems(found.tool.map((p) => factsItem(p, 'tool')).filter(Boolean));
	const skillItems = uniqueFactsItems(found.skill.map((p) => factsItem(p, 'skill')).filter(Boolean));
	const agentItems = uniqueFactsItems(found.agent.map((p) => factsItem(p, 'agent')).filter(Boolean));
	const modelItems = uniqueFactsItems(found.model.map((p) => factsItem(p, 'model')).filter(Boolean));
	const appItems = uniqueFactsItems(
		found.app.map((p) => factsItem(p, 'app')).filter(Boolean),
	).map((item) => ({ ...item, label: name !== '—' ? name : item.label }));
	for (const [kind, items] of [
		['tool', toolItems],
		['skill', skillItems],
		['agent', agentItems],
		['model', modelItems],
		['app', appItems],
	]) {
		for (const item of items) {
			if (item.href && !viewers[kind]) viewers[kind] = item.href;
		}
	}
	const readme = join(root, 'README.md');
	if (existsSync(readme)) {
		const md = readFileSync(readme, 'utf8');
		mergeViewers(md, viewers);
		for (const [kind, items] of [
			['skill', skillItems],
			['tool', toolItems],
			['agent', agentItems],
			['model', modelItems],
		]) {
			if (items.length === 1 && !items[0].href) {
				const href = extractViewer(md, kind);
				if (href) items[0].href = href;
			}
		}
	}

	const hasFacts =
		Boolean(existsSync(appPath)) ||
		toolItems.length > 0 ||
		skillItems.length > 0 ||
		agentItems.length > 0 ||
		modelItems.length > 0;
	if (!hasFacts) status = 'no label';
	else if (app === 'missing') status = 'ok';

	const rootPkg = readJson(join(root, 'package.json'));
	const sitePkg = readJson(join(root, 'site', 'package.json'));
	const rootShip = typeof rootPkg?.scripts?.ship === 'string' && rootPkg.scripts.ship.trim();
	const siteShip = typeof sitePkg?.scripts?.ship === 'string' && sitePkg.scripts.ship.trim();
	const shipDir = rootShip ? 'root' : siteShip ? 'site' : null;

	return {
		id,
		path: project.path,
		name,
		app: appItems[0]?.label ?? (existsSync(appPath) ? name : '—'),
		tool: toolItems.length ? toolItems.map((item) => item.label).join(' · ') : '—',
		skill: skillItems.length ? skillItems.map((item) => item.label).join(' · ') : '—',
		agent: agentItems.length ? agentItems.map((item) => item.label).join(' · ') : '—',
		model: modelItems.length ? modelItems.map((item) => item.label).join(' · ') : '—',
		viewer,
		viewers,
		viewerStatus,
		status,
		fingerprint,
		appPath: existsSync(appPath) ? appPath : null,
		hasTool: toolItems.length > 0,
		skillCount: skillItems.length,
		appItems,
		toolItems,
		skillItems,
		agentItems,
		modelItems,
		hasShip: Boolean(shipDir),
		shipDir,
	};
}

function inventory() {
	const rows = listProjects().map(inspectRepo);
	const fromFleet = Boolean(loadFleetProjects());
	return {
		workspace: WORKSPACE,
		note: fromFleet
			? `Enrolled fleet (${rows.length}). Check a row, then Add labels, Refresh, or Ship when the repo has scripts.ship. Generator ${existsSync(APP_FACTS_GEN) ? 'found' : 'MISSING'}.`
			: `Sibling folders (${rows.length}; no localhelm.fleet.json). Generator ${existsSync(APP_FACTS_GEN) ? 'found' : 'MISSING'}.`,
		rows,
	};
}

function factsPaths(row) {
	return [
		...new Set(
			[
				row.appPath,
				...(row.appItems ?? []).map((item) => item.path),
				...(row.toolItems ?? []).map((item) => item.path),
				...(row.skillItems ?? []).map((item) => item.path),
				...(row.agentItems ?? []).map((item) => item.path),
				...(row.modelItems ?? []).map((item) => item.path),
			].filter(Boolean),
		),
	];
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
			note: 'Rewrite /v cards for app, tool, skill, agent, and model files from frontmatter (no LLM).',
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
	if (action === 'ship') {
		return {
			action,
			note: 'Run pnpm ship in each named checkout that has scripts.ship (wrangler / Pages). Not FilePress Land.',
			rows: rows.map((r) => ({
				id: r.id,
				app: r.app,
				status: r.status,
				writes: Boolean(r.hasShip),
				action: r.hasShip ? 'ship' : 'skip',
				reason: r.hasShip ? undefined : 'no scripts.ship',
				ship: r.hasShip ? 'pnpm run ship' : undefined,
				proposedCwd: r.shipDir === 'site' ? `${r.path.replace(/\\/g, '/')}/site` : r.path,
			})),
		};
	}
	if (action === 'refresh') {
		return {
			action,
			note: 'Write AppFacts (LLM) and any missing SkillFacts next to SKILL.md packs. Tool, agent, and model stay empty unless those facts files already exist — no generators for those kinds.',
			rows: rows.map((r) => {
				const root = repoAbs(r);
				const hasPkg = existsSync(join(root, 'package.json')) || existsSync(join(root, 'README.md'));
				const skillFiles = missingSkillFacts(root).map((p) => relative(root, p).replace(/\\/g, '/'));
				const writesApp = hasPkg && existsSync(APP_FACTS_GEN);
				const writes = writesApp || skillFiles.length > 0;
				return {
					id: r.id,
					app: r.app,
					status: r.status,
					files: [...(writesApp ? ['APP_FACTS.md'] : []), ...skillFiles],
					writes,
					action: writes ? 'refresh' : 'skip',
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

function runAppRefresh(row) {
	const id = row.id;
	if (!existsSync(APP_FACTS_GEN)) return { id, ok: false, detail: 'AppFacts generator missing', writes: false };
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
		detail: out.slice(-500) || (result.status === 0 ? 'AppFacts refreshed' : `AppFacts exit ${result.status}`),
		writes: result.status === 0,
	};
}

function runSkillRefresh(row) {
	const root = repoAbs(row);
	const result = writeMissingSkillFacts(root);
	const wrote = result.wrote ?? [];
	if (wrote.length) {
		const helper = join(XFACTS_ROOT, 'scripts', 'reencode_facts_viewer.py');
		if (existsSync(helper)) runPython([helper, ...wrote]);
	}
	return {
		id: row.id,
		ok: result.ok !== false,
		detail: wrote.length
			? `SkillFacts ${wrote.map((p) => relative(root, p).replace(/\\/g, '/')).join(', ')}`
			: 'no missing SkillFacts',
		writes: wrote.length > 0,
	};
}

function runRefresh(row) {
	const root = repoAbs(row);
	const hasPkg = existsSync(join(root, 'package.json')) || existsSync(join(root, 'README.md'));
	const skillMissing = missingSkillFacts(root);
	const parts = [];
	if (hasPkg && existsSync(APP_FACTS_GEN)) parts.push(runAppRefresh(row));
	if (skillMissing.length) parts.push(runSkillRefresh(row));
	if (!parts.length) {
		return { id: row.id, ok: true, detail: 'nothing to label', writes: false };
	}
	return {
		id: row.id,
		ok: parts.every((p) => p.ok),
		detail: parts.map((p) => p.detail).filter(Boolean).join(' · '),
		writes: parts.some((p) => p.writes),
	};
}

function runShip(row) {
	if (!row.hasShip) return { id: row.id, ok: false, detail: 'no scripts.ship', writes: false };
	const root = repoAbs(row);
	const cwd = row.shipDir === 'site' ? join(root, 'site') : root;
	const win = process.platform === 'win32';
	const result = spawnSync(win ? 'pnpm.cmd' : 'pnpm', ['run', 'ship'], {
		cwd,
		encoding: 'utf8',
		windowsHide: true,
		shell: win,
		timeout: 600_000,
	});
	const out = `${result.stdout || ''}${result.stderr || ''}`.trim();
	const err = result.error ? String(result.error.message || result.error) : '';
	const ok = Boolean(result && result.status === 0 && !result.error);
	return {
		id: row.id,
		ok,
		detail: (out || err).slice(-800) || (ok ? 'shipped' : `pnpm ship exit ${result.status}`),
		writes: ok,
	};
}

function apply(action, ids) {
	if (action === 'ship' && !ids.length) {
		throw new Error('name the project id(s) to ship. xFacts will not ship the whole fleet in one apply.');
	}
	const rows = selected(ids);
	const results = [];
	for (const r of rows) {
		if (action === 'check') results.push(runCheck(r));
		else if (action === 'reencode') results.push(runReencode(r));
		else if (action === 'refresh') results.push(runRefresh(r));
		else if (action === 'ship') results.push(runShip(r));
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
