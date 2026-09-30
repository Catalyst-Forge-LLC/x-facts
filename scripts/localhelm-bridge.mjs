#!/usr/bin/env node
/**
 * LocalHelm bridge for the xFacts Sites plugin.
 *
 * Commands (stdout = JSON):
 *   inventory
 *   plan  --action check|reencode|refresh|update|ship [--names a,b]
 *   apply --action check|reencode|refresh|update|ship [--names a,b]
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
import {
	auditLabels,
	commitLabelChanges,
	featureSummary,
	labelGaps,
	labelStatusPaths,
} from './label-audit.mjs';

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
	'FEATURE_FACTS.md': 'feature',
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
	const hits = { app: [], tool: [], skill: [], agent: [], model: [], feature: [] };
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
	const register = featureSummary(root);
	const featureItems = uniqueFactsItems(found.feature.map((p) => factsItem(p, 'feature')).filter(Boolean));
	if (!featureItems.length && register.exists) {
		const label = register.count === 0 ? 'empty' : register.count <= 4 ? register.names.join(' · ') : `${register.count} features`;
		featureItems.push({ label, href: undefined, path: join(root, '.featurefacts', 'features.yaml') });
	}
	const gaps = labelGaps(root);
	const appItems = uniqueFactsItems(
		found.app.map((p) => factsItem(p, 'app')).filter(Boolean),
	).map((item) => ({ ...item, label: name !== '—' ? name : item.label }));
	for (const [kind, items] of [
		['tool', toolItems],
		['skill', skillItems],
		['agent', agentItems],
		['model', modelItems],
		['feature', featureItems],
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
		modelItems.length > 0 ||
		featureItems.length > 0;
	if (!hasFacts) status = 'no label';
	else if (app === 'missing') status = 'ok';
	if (!existsSync(appPath)) status = 'no label';
	else if (!register.exists) status = 'no features';
	else if (gaps.some((gap) => gap.endsWith('SKILL_FACTS.md'))) status = 'no skill facts';

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
		feature: featureItems.length ? featureItems.map((item) => item.label).join(' · ') : '—',
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
		featureItems,
		labelGaps: gaps,
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
			? `Enrolled fleet (${rows.length}). Check validates labels. Add labels writes what is missing. Ship runs when the repo has scripts.ship. Generator ${existsSync(APP_FACTS_GEN) ? 'found' : 'MISSING'}.`
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
				...(row.featureItems ?? []).map((item) => item.path),
			].filter(Boolean),
		),
	];
}

function selected(ids) {
	const inv = inventory();
	const want = new Set(ids);
	return want.size ? inv.rows.filter((r) => want.has(r.id)) : inv.rows;
}

function checkReason(gaps) {
	const missing = [];
	let skill = false;
	for (const gap of gaps) {
		if (gap === 'APP_FACTS.md') missing.push('AppFacts');
		else if (gap === '.featurefacts/features.yaml') missing.push('FeatureFacts');
		else if (gap.endsWith('SKILL_FACTS.md')) {
			skill = true;
			missing.push(gap);
		} else missing.push(gap);
	}
	const head = missing.length ? `Missing ${missing.join(', ')}.` : 'No required file is missing.';
	const rest = skill
		? 'Also checks tool, agent, and model files when they exist.'
		: 'Also checks skill, tool, agent, and model.';
	return `${head} ${rest}`;
}

function plan(action, ids) {
	const rows = selected(ids);
	if (action === 'check') {
		return {
			action,
			note: 'Validate AppFacts, FeatureFacts, and any SkillFacts, ToolFacts, AgentFacts, or ModelFacts on disk. Compare the AppFacts fingerprint when that file exists. A missing AppFacts file, a missing or invalid FeatureFacts register, or a SKILL.md without SkillFacts fails. Zero feature records is valid. No write.',
			rows: rows.map((r) => {
				const gaps = r.labelGaps ?? [];
				return {
					id: r.id,
					app: r.app,
					status: r.status,
					action: 'check',
					gaps,
					reason: checkReason(gaps),
				};
			}),
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
			note: 'Write a missing APP_FACTS.md from the repo scan (no model), create a missing FeatureFacts register (zero features is valid), and write any missing SkillFacts next to SKILL.md. Existing labels stay. Commits only those label files. Does not push. A ledger manifest is bound when appledger is available. Tool, agent, and model files are not invented.',
			rows: rows.map((r) => {
				const files = r.labelGaps ?? labelGaps(repoAbs(r));
				return {
					id: r.id,
					app: r.app,
					status: r.status,
					files,
					writes: files.length > 0,
					action: files.length ? 'refresh' : 'skip',
				};
			}),
		};
	}
	if (action === 'update') {
		return {
			action,
			note: 'Rewrite APP_FACTS.md from the repo scan. No model. Replaces the existing file and commits it. Does not push. FeatureFacts and SkillFacts stay.',
			rows: rows.map((r) => ({
				id: r.id,
				app: r.app,
				status: r.status,
				files: ['APP_FACTS.md'],
				writes: true,
				action: 'update',
			})),
		};
	}
	throw new Error(`unknown action ${action}`);
}

function runCheck(row) {
	const id = row.id;
	const root = repoAbs(row);
	const problems = auditLabels(root);
	const appPath = join(root, 'APP_FACTS.md');
	if (existsSync(appPath)) {
		if (!existsSync(APP_FACTS_GEN)) problems.push('AppFacts generator missing');
		else {
			const result = spawnSync(process.execPath, [APP_FACTS_GEN, root, '--check'], {
				encoding: 'utf8',
				windowsHide: true,
			});
			const out = `${result.stdout || ''}${result.stderr || ''}`.trim();
			if (result.status !== 0) problems.push(out.slice(0, 240) || `fingerprint exit ${result.status}`);
		}
	}
	const ledger = ledgerValidate(row);
	if (ledger && !ledger.ok) problems.push(ledger.detail);
	return {
		id,
		ok: problems.length === 0,
		detail: (problems.join(' · ') || ledger?.detail || 'labels ok').slice(0, 800),
		writes: false,
	};
}

function ledgerCli() {
	const cli = join(WORKSPACE, 'appledger', 'dist', 'cli.js');
	return existsSync(cli) ? cli : null;
}

function ledgerValidate(row) {
	const root = repoAbs(row);
	const cli = ledgerCli();
	if (!existsSync(join(root, 'appledger', 'manifest.yaml')) || !cli) return null;
	const result = spawnSync(process.execPath, [cli, 'subjects', '--operation', 'validate'], {
		cwd: root,
		encoding: 'utf8',
		windowsHide: true,
	});
	const out = `${result.stdout || ''}${result.stderr || ''}`.trim().replace(/\s+/g, ' ');
	return {
		ok: result.status === 0,
		detail: out.slice(0, 400) || `appledger subjects validate exit ${result.status}`,
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

function runSkillRefresh(row) {
	const id = row.id;
	const root = repoAbs(row);
	const script = join(WORKSPACE, 'skill-facts', 'scripts', 'generate_skill_facts.mjs');
	if (!existsSync(script)) {
		return {
			id,
			ok: false,
			detail: 'SkillFacts generator is unavailable. Check out the sibling skill-facts repo before adding SKILL_FACTS.md.',
			writes: false,
		};
	}
	const result = spawnSync(process.execPath, [script, root], { encoding: 'utf8', windowsHide: true });
	const out = String(result.stdout || '').trim();
	const err = `${result.stderr || ''}${result.error ? result.error.message || result.error : ''}`.trim();
	let parsed = null;
	try {
		parsed = JSON.parse(out);
	} catch {
		parsed = null;
	}
	if (result.status !== 0 || result.error || !parsed || parsed.ok === false) {
		return {
			id,
			ok: false,
			detail: (err || out || `skill facts exit ${result.status}`).slice(0, 400),
			writes: false,
		};
	}
	const wrote = (Array.isArray(parsed.wrote) ? parsed.wrote : []).map((p) => join(root, p));
	if (wrote.length) {
		const helper = join(XFACTS_ROOT, 'scripts', 'reencode_facts_viewer.py');
		if (existsSync(helper)) runPython([helper, ...wrote]);
	}
	return {
		id,
		ok: true,
		detail: wrote.length
			? `SkillFacts ${wrote.map((p) => relative(root, p).replace(/\\/g, '/')).join(', ')}`
			: 'no missing SkillFacts',
		writes: wrote.length > 0,
	};
}

function runScaffold(row, force = false) {
	const id = row.id;
	if (!existsSync(APP_FACTS_GEN)) return { id, ok: false, detail: 'AppFacts generator missing', writes: false };
	const result = spawnSync(
		process.execPath,
		[
			APP_FACTS_GEN,
			repoAbs(row),
			'--scaffold',
			'--no-qr',
			...(force ? ['--force'] : []),
			'--consulting-link',
			'https://www.catalystforge.com/',
			'--consulting-name',
			'Catalyst Forge',
		],
		{ encoding: 'utf8', windowsHide: true },
	);
	const out = `${result.stdout || ''}${result.stderr || ''}`.trim();
	const wrote = /Wrote /.test(out);
	return {
		id,
		ok: result.status === 0,
		detail: out.slice(0, 400) || (result.status === 0 ? 'AppFacts scaffolded' : `scaffold exit ${result.status}`),
		writes: wrote,
	};
}

function runFeatureAdd(row) {
	const id = row.id;
	const root = repoAbs(row);
	const before = featureSummary(root);
	if (before.exists) {
		return { id, ok: before.errors.length === 0, detail: before.errors.join('; ') || 'FeatureFacts register already exists; zero features is valid', writes: false };
	}
	const ffRoot = join(WORKSPACE, 'feature-facts');
	const bin = join(ffRoot, 'bin', 'featurefacts.mjs');
	if (!existsSync(bin) || !existsSync(join(ffRoot, 'dist', 'cli.js'))) {
		return { id, ok: false, detail: 'FeatureFacts CLI is unavailable. Build the sibling feature-facts checkout before adding its register.', writes: false };
	}
	const initialized = spawnSync(process.execPath, [bin, 'init', '--root', root], {
		cwd: ffRoot, encoding: 'utf8', windowsHide: true, timeout: 180_000,
	});
	if (initialized.status !== 0) {
		return { id, ok: false, detail: ((initialized.stdout || '') + (initialized.stderr || '')).trim().slice(0, 400) || ('featurefacts init exit ' + initialized.status), writes: featureSummary(root).exists };
	}
	const result = spawnSync(process.execPath, [bin, 'scan', '--root', root], {
		cwd: ffRoot, encoding: 'utf8', windowsHide: true, timeout: 180_000,
	});
	const after = featureSummary(root);
	const out = ((result.stdout || '') + (result.stderr || '')).trim();
	return {
		id,
		ok: result.status === 0 && after.exists && after.errors.length === 0,
		detail: after.errors.join('; ') || out.slice(0, 400) || ('featurefacts scan exit ' + result.status),
		writes: after.exists,
	};
}

function runBind(row) {
	const root = repoAbs(row);
	const cli = ledgerCli();
	if (!existsSync(join(root, 'appledger', 'manifest.yaml')) || !cli) return null;
	const result = spawnSync(process.execPath, [cli, 'bind', '--apply'], {
		cwd: root,
		encoding: 'utf8',
		windowsHide: true,
	});
	const out = `${result.stdout || ''}${result.stderr || ''}`.trim();
	return {
		id: row.id,
		ok: result.status === 0,
		detail: out.slice(0, 400) || `bind exit ${result.status}`,
		writes: /Added \d+ binding/.test(out),
	};
}

function runRefresh(row) {
	const root = repoAbs(row);
	const gaps = labelGaps(root);
	const parts = [];
	if (gaps.some((gap) => gap.endsWith('SKILL_FACTS.md'))) parts.push(runSkillRefresh(row));
	if (gaps.includes('.featurefacts/features.yaml')) parts.push(runFeatureAdd(row));
	if (gaps.includes('APP_FACTS.md')) parts.push(runScaffold(row));
	const bound = runBind(row);
	if (bound) parts.push(bound);
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
		const root = repoAbs(r);
		const before = action === 'refresh' || action === 'update' ? labelStatusPaths(root) : null;
		let result;
		if (action === 'check') result = runCheck(r);
		else if (action === 'update') result = runScaffold(r, true);
		else if (action === 'reencode') result = runReencode(r);
		else if (action === 'refresh') result = runRefresh(r);
		else if (action === 'ship') result = runShip(r);
		else throw new Error(`unknown action ${action}`);
		if ((action === 'refresh' || action === 'update') && result.ok && result.writes) {
			const message = action === 'update' ? 'Helm: refresh the AppFacts label.' : 'Helm: add xFacts labels.';
			const include = action === 'update' ? ['APP_FACTS.md'] : [];
			const committed = commitLabelChanges(root, before, include, message);
			if (!committed.ok) result = { ...result, ok: false, detail: `${result.detail} · commit failed: ${committed.error}` };
			else if (committed.note) result = { ...result, detail: `${result.detail} · ${committed.note}` };
		}
		results.push(result);
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
