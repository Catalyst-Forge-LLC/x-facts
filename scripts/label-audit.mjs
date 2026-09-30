/**
 * Read-only label audit for the LocalHelm xFacts plugin.
 * Schema-checks files that exist. A missing AppFacts file, a missing or invalid
 * FeatureFacts register, and a SKILL.md without SKILL_FACTS.md are gaps.
 * Tool, agent, and model files are checked only when present.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';

const WORKSPACE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const MARKDOWN_SCHEMAS = {
	app: join(WORKSPACE, 'app-facts', 'site', 'schema', 'app-facts.schema.json'),
	skill: join(WORKSPACE, 'skill-facts', 'site', 'schema', 'skill-facts.schema.json'),
	tool: join(WORKSPACE, 'tool-facts', 'site', 'schema', 'tool-facts.schema.json'),
	agent: join(WORKSPACE, 'agent-facts', 'site', 'schema', 'agent-facts.schema.json'),
	model: join(WORKSPACE, 'model-facts', 'site', 'schema', 'model-facts.schema.json'),
};

const FEATURE_DIR = join(WORKSPACE, 'feature-facts', 'schemas');

let markdownValidators = null;
let featureValidator = null;

function compileMarkdown() {
	if (markdownValidators) return markdownValidators;
	const ajv = new Ajv({ allErrors: true, strict: false });
	addFormats(ajv);
	markdownValidators = {};
	for (const [kind, file] of Object.entries(MARKDOWN_SCHEMAS)) {
		if (!existsSync(file)) continue;
		markdownValidators[kind] = ajv.compile(JSON.parse(readFileSync(file, 'utf8')));
	}
	return markdownValidators;
}

function compileFeature() {
	if (featureValidator) return featureValidator;
	if (!existsSync(join(FEATURE_DIR, 'registry.schema.json'))) return null;
	const ajv = new Ajv2020({ allErrors: true, strict: false });
	addFormats(ajv);
	for (const name of ['common.schema.json', 'feature-record.schema.json', 'registry.schema.json']) {
		const schema = JSON.parse(readFileSync(join(FEATURE_DIR, name), 'utf8'));
		ajv.addSchema(schema);
	}
	featureValidator = ajv.getSchema('https://featurefacts.dev/schema/v0.2.0/registry.schema.json')
		?? ajv.compile(JSON.parse(readFileSync(join(FEATURE_DIR, 'registry.schema.json'), 'utf8')));
	return featureValidator;
}

function schemaErrors(validate, data) {
	if (!validate) return ['schema file missing'];
	if (validate(data)) return [];
	return (validate.errors ?? []).slice(0, 4).map((err) => `${err.instancePath || '/'} ${err.message}`);
}

export function frontmatter(md) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
	if (!match) return null;
	try {
		const data = parse(match[1]);
		return data && typeof data === 'object' ? data : null;
	} catch {
		return null;
	}
}

export function featureRegisterPath(root) {
	return join(root, '.featurefacts', 'features.yaml');
}

export function featureSummary(root) {
	const path = featureRegisterPath(root);
	if (!existsSync(path)) return { exists: false, count: 0, names: [], errors: [], data: null };
	let data;
	try {
		data = parse(readFileSync(path, 'utf8'));
	} catch (err) {
		return { exists: true, count: 0, names: [], errors: [err instanceof Error ? err.message : String(err)], data: null };
	}
	const features = Array.isArray(data?.features) ? data.features : [];
	const names = features.map((item) => (item && typeof item.name === 'string' ? item.name : item?.id)).filter(Boolean);
	const validate = compileFeature();
	return { exists: true, count: features.length, names, errors: schemaErrors(validate, data), data };
}

export function isLabelCommitPath(file) {
	const path = String(file).replace(/\\/g, '/').replace(/^"|"$/g, '');
	return (
		path === 'APP_FACTS.md' ||
		path === 'FEATURE_FACTS.md' ||
		path === 'appledger/manifest.yaml' ||
		path === 'SKILL_FACTS.md' ||
		path.endsWith('/SKILL_FACTS.md') ||
		path.startsWith('.featurefacts/')
	);
}

/** Label paths that became dirty, plus any named path that is still dirty. Other files stay unstaged. */
export function labelCommitPaths(before, after, include = []) {
	const prior = new Set(before);
	const dirty = new Set(after);
	const out = new Set();
	for (const path of after) {
		if (!prior.has(path) && isLabelCommitPath(path)) out.add(path);
	}
	for (const path of include) {
		if (dirty.has(path) && isLabelCommitPath(path)) out.add(path);
	}
	return [...out].sort();
}

function git(root, args) {
	return spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true });
}

export function labelStatusPaths(root) {
	const result = git(root, ['status', '--porcelain=v1', '-uall']);
	if (result.status !== 0 || result.error) return null;
	const paths = [];
	for (const line of String(result.stdout || '').split(/\r?\n/)) {
		if (line.length < 4) continue;
		let path = line.slice(3);
		const arrow = path.indexOf(' -> ');
		if (arrow !== -1) path = path.slice(arrow + 4);
		if (path.startsWith('"') && path.endsWith('"')) path = path.slice(1, -1);
		paths.push(path.replace(/\\/g, '/'));
	}
	return paths;
}

/** Commit label paths that this write made dirty. Other dirty files stay unstaged. Does not push. */
export function commitLabelChanges(root, before, include, message) {
	const after = labelStatusPaths(root);
	if (!after) return { ok: true, committed: false, note: 'not a git repo' };
	const paths = labelCommitPaths(before ?? [], after, include);
	if (!paths.length) return { ok: true, committed: false, note: '' };
	const added = git(root, ['add', '--', ...paths]);
	if (added.status !== 0 || added.error) {
		return { ok: false, error: String(added.stderr || added.stdout || added.error || 'git add failed').trim() };
	}
	const committed = git(root, ['commit', '-m', message, '--', ...paths]);
	if (committed.status !== 0 || committed.error) {
		return { ok: false, error: String(committed.stderr || committed.stdout || committed.error || 'git commit failed').trim() };
	}
	return { ok: true, committed: true, note: 'committed' };
}

export function labelGaps(root) {
	const gaps = [];
	if (!existsSync(join(root, 'APP_FACTS.md'))) gaps.push('APP_FACTS.md');
	const features = featureSummary(root);
	if (!features.exists) gaps.push('.featurefacts/features.yaml');
	for (const file of missingSkillFacts(root)) {
		gaps.push(relative(root, file).replace(/\\/g, '/'));
	}
	return gaps;
}

function validateMarkdown(kind, file) {
	if (!existsSync(file)) return [];
	const data = frontmatter(readFileSync(file, 'utf8'));
	if (!data) return [`${kind} frontmatter could not be read`];
	return schemaErrors(compileMarkdown()[kind], data).map((err) => `${kind} ${err}`);
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.cursor', 'site', 'fixtures', 'coverage', '__ARCHIVE']);

/** SKILL.md packs in this tree that have no SKILL_FACTS.md beside them. */
export function missingSkillFacts(root) {
	const missing = [];
	function walk(dir, depth) {
		if (depth > 5 || !existsSync(dir)) return;
		let entries = [];
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const ent of entries) {
			if (SKIP_DIRS.has(ent.name) || ent.name.startsWith('.')) continue;
			const p = join(dir, ent.name);
			if (ent.isFile() && ent.name === 'SKILL.md') {
				const facts = join(dir, 'SKILL_FACTS.md');
				if (!existsSync(facts)) missing.push(facts);
			} else if (ent.isDirectory()) walk(p, depth + 1);
		}
	}
	walk(root, 0);
	return missing;
}

function walkFacts(root) {
	const hits = { skill: [], tool: [], agent: [], model: [] };
	const files = {
		skill: 'SKILL_FACTS.md',
		tool: 'TOOL_FACTS.md',
		agent: 'AGENT_FACTS.md',
		model: 'MODEL_FACTS.md',
	};
	function walk(dir, depth) {
		if (depth > 4 || !existsSync(dir)) return;
		let entries = [];
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const ent of entries) {
			if (SKIP_DIRS.has(ent.name) || ent.name.startsWith('.')) continue;
			const p = join(dir, ent.name);
			if (ent.isFile()) {
				for (const [kind, name] of Object.entries(files)) {
					if (ent.name === name) hits[kind].push(p);
				}
			} else if (ent.isDirectory()) walk(p, depth + 1);
		}
	}
	walk(root, 0);
	return hits;
}

/** Problems that make Check fail. Empty array means the labels that should exist are schema-valid. */
export function auditLabels(root) {
	const problems = [];
	const appPath = join(root, 'APP_FACTS.md');
	if (!existsSync(appPath)) problems.push('no APP_FACTS.md');
	else problems.push(...validateMarkdown('app', appPath));

	const features = featureSummary(root);
	if (!features.exists) problems.push('no .featurefacts/features.yaml');
	else problems.push(...features.errors.map((err) => `featurefacts ${err}`));

	const found = walkFacts(root);
	for (const file of missingSkillFacts(root)) {
		problems.push(`missing ${relative(root, file).replace(/\\/g, '/')}`);
	}
	for (const kind of ['skill', 'tool', 'agent', 'model']) {
		for (const file of found[kind]) {
			problems.push(...validateMarkdown(kind, file).map((err) => `${relative(root, file).replace(/\\/g, '/')} ${err}`));
		}
	}
	return problems;
}
