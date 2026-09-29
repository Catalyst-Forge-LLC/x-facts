/**
 * xFacts plugin for LocalHelm.
 * Sites board over sibling repos' xFacts labels. Heavy work lives in the bridge.
 */
import { spawn } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const win = process.platform === 'win32';
const ACTIONS = new Set(['check', 'refresh', 'reencode', 'update', 'ship']);

function bridge(args) {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, ['scripts/localhelm-bridge.mjs', ...args], {
			cwd: root,
			windowsHide: true,
		});
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', (chunk) => {
			stdout += chunk;
		});
		child.stderr.on('data', (chunk) => {
			stderr += chunk;
		});
		child.on('error', (err) => reject(err));
		child.on('close', (status) => {
			const text = stdout.trim();
			const errText = stderr.trim();
			if (!text) {
				reject(new Error(errText || `xfacts bridge failed (exit ${status})`));
				return;
			}
			try {
				resolve(JSON.parse(text));
			} catch {
				reject(new Error(errText || `xfacts bridge returned non-JSON:\n${text.slice(0, 400)}`));
			}
		});
	});
}

const LABEL_COLS = [
	{ id: 'app', label: 'app' },
	{ id: 'tool', label: 'tool' },
	{ id: 'skill', label: 'skill' },
	{ id: 'agent', label: 'agent' },
	{ id: 'model', label: 'model' },
	{ id: 'feature', label: 'feature' },
];

function rowActions(row) {
	const actions = [{ id: 'check', label: 'Check', write: false, icon: 'lucide:search-check' }];
	if (row.labelGaps?.length) {
		actions.push({ id: 'refresh', label: 'Add labels', write: true, icon: 'lucide:refresh-cw' });
	}
	const hasFacts = row.appPath || row.hasTool || row.skillCount || row.agentItems?.length || row.modelItems?.length || row.featureItems?.length;
	if (hasFacts) {
		actions.push({ id: 'reencode', label: 'Re-encode', write: true, icon: 'lucide:qr-code' });
	}
	if (row.hasShip) actions.push({ id: 'ship', label: 'Ship', write: true, icon: 'lucide:ship' });
	return actions;
}

function labelColumns() {
	return LABEL_COLS;
}

function boardFrom(inventory) {
	return {
		plugin: 'xfacts',
		title: 'xFacts labels',
		tab: 'sites',
		rowLabel: 'repo',
		note: [
			'xFacts labels for the enrolled fleet. Check a row, then Add labels or Ship.',
			'Columns are app, tool, skill, agent, model, and feature.',
			'Check validates each label file that exists, compares the AppFacts fingerprint, and fails a missing AppFacts file, an empty FeatureFacts register, or a SKILL.md without SkillFacts.',
			'Add labels writes a missing APP_FACTS.md from the repo scan without a model, fills a missing or empty FeatureFacts register, and writes missing SkillFacts. It leaves an existing label in place, then commits only those files. It does not push. Tool, agent, and model files are not invented.',
			'Re-encode rewrites /v cards from frontmatter.',
			'Ship runs that repo’s pnpm ship script (wrangler / Pages). Not FilePress Land.',
			inventory.note,
		]
			.filter(Boolean)
			.join(' '),
		columns: labelColumns(),
		rows: inventory.rows.map((row) => {
			const links = { ...(row.viewers ?? {}) };
			if (row.viewer && !links.app) links.app = row.viewer;
			const linkGroups = {};
			for (const kind of ['app', 'tool', 'skill', 'agent', 'model']) {
				const items = row[`${kind}Items`];
				if (items?.length) {
					linkGroups[kind] = items.map(({ label, href }) => ({ label, href }));
				}
			}
			return {
				id: row.id,
				label: row.id,
				href: links.app || links.skill || links.tool || links.agent || links.model || row.viewer || undefined,
				links,
				linkGroups,
				cells: {
					app: row.app,
					tool: row.tool,
					skill: row.skill,
					agent: row.agent ?? '—',
					model: row.model ?? '—',
					name: row.name,
					status: row.status,
				},
				actions: rowActions(row),
			};
		}),
	};
}

const plugin = {
	id: 'xfacts',
	label: 'xFacts labels',
	async board() {
		return boardFrom(await bridge(['inventory']));
	},
	async plan(action, ids) {
		if (!ACTIONS.has(action)) {
			throw new Error(`xfacts plugin does not plan ${action}`);
		}
		const args = ['plan', '--action', action];
		if (ids.length) args.push('--names', ids.join(','));
		return await bridge(args);
	},
	async apply(action, ids) {
		if (!ACTIONS.has(action)) {
			throw new Error(`xfacts plugin does not apply ${action}`);
		}
		const args = ['apply', '--action', action];
		if (ids.length) args.push('--names', ids.join(','));
		return await bridge(args);
	},
};

export default plugin;
