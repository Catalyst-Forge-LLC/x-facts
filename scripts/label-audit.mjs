/**
 * Read-only label audit for the LocalHelm xFacts plugin.
 * Schema-checks files that exist. A missing AppFacts file, a missing or empty
 * FeatureFacts register, and a SKILL.md without SKILL_FACTS.md are gaps.
 * Tool, agent, and model files are checked only when present.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse, stringify } from 'yaml';
import { missingSkillFacts } from '../../skill-facts/scripts/generate_skill_facts.mjs';

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

export function labelGaps(root) {
	const gaps = [];
	if (!existsSync(join(root, 'APP_FACTS.md'))) gaps.push('APP_FACTS.md');
	const features = featureSummary(root);
	if (!features.exists || features.count === 0) gaps.push('.featurefacts/features.yaml');
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
	else if (features.count === 0) problems.push('FeatureFacts register is empty');
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

function kebab(value) {
	const id = String(value)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-+/g, '-');
	return /^[a-z]/.test(id) ? id.slice(0, 64) : `pkg-${id}`.slice(0, 64);
}

/** One candidate row when a scan found no capabilities. Does not claim the capability is confirmed. */
export function writePackageCandidate(root) {
	const summary = featureSummary(root);
	if (summary.exists && summary.count > 0) return { wrote: false, reason: 'register already has features' };
	let pkg = {};
	try {
		pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
	} catch {
		pkg = {};
	}
	const rawName = typeof pkg.name === 'string' && pkg.name.trim() ? pkg.name.trim() : root.split(/[/\\]/).pop();
	const name = rawName.replace(/^@[^/]+\//, '');
	const id = kebab(name) || 'package';
	const description = typeof pkg.description === 'string' && pkg.description.trim()
		? pkg.description.trim()
		: `Package ${name}. No command surface was extracted.`;
	const now = new Date().toISOString();
	const registry = {
		schemaVersion: '0.2.0',
		scan_id: 'scan-add',
		product: {
			name,
			type: pkg.bin ? 'CLI tool' : 'unknown',
			status: 'unknown',
			...(typeof pkg.license === 'string' && pkg.license ? { license: pkg.license } : {}),
		},
		features: [
			{
				id,
				name,
				description,
				type: 'feature',
				recognition: 'candidate',
				lifecycle: 'unknown',
				availability: {
					state: 'unknown',
					conditions: [],
					reason: 'Availability was not declared.',
				},
				maturity: 'unknown',
				audiences: {
					state: 'unknown',
					values: [],
					reason: 'Audience was not declared.',
				},
				discovery: {
					state: 'unassessed',
					surfaces: [],
					adapter_ids: [],
					reason: 'No command surface was extracted.',
				},
				intent: 'unknown',
				publication: {
					scope: 'internal',
					reason: 'A scan candidate stays internal until a maintainer publishes it.',
				},
				entry_points: [],
				implements: [],
				dependencies: [],
				docs: {
					state: 'unassessed',
					result: 'unknown',
					adapter_ids: [],
					links: [],
					reason: 'Documentation was not assessed.',
				},
				tests: {
					state: 'unassessed',
					result: 'unknown',
					adapter_ids: [],
					links: [],
					reason: 'Tests were not assessed.',
				},
				observation: {
					state: 'current',
					last_seen_scan_id: 'scan-add',
					reason: 'Written by Add labels from package.json.',
				},
				evidence: [
					{
						id: 'ev-package',
						kind: 'declared',
						state: 'current',
						assertion: {
							field: 'capability',
							value: description,
							claim: 'package.json names this package. This is not a confirmed capability list.',
						},
						declaration: {
							actor: 'xfacts-add-labels',
							source: 'package.json',
							recorded_at: now,
						},
					},
				],
				editorial: {
					locked: [],
					aliases: [],
					notes: 'Candidate only. FeatureFacts scan found no capability to confirm.',
				},
				uncertainty_reasons: {
					lifecycle: 'package.json does not establish release status.',
					maturity: 'No maturity was declared.',
					intent: 'Discovery intent was not declared.',
				},
			},
		],
		redirects: [],
	};
	const errors = schemaErrors(compileFeature(), registry);
	if (errors.length) return { wrote: false, reason: errors.join('; ') };
	const dest = featureRegisterPath(root);
	mkdirSync(dirname(dest), { recursive: true });
	writeFileSync(dest, stringify(registry, { aliasDuplicateObjects: false }));
	return { wrote: true, reason: dest };
}
