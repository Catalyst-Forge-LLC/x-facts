/**
 * xFacts plugin for LocalHelm.
 * Sites board over sibling repos' nutrition labels. Heavy work lives in the bridge.
 */
import { spawn } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const win = process.platform === 'win32';
const ACTIONS = new Set(['check', 'refresh', 'reencode']);

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
];

function rowActions(row) {
	const addOrRefresh = {
		id: 'refresh',
		label: row.appPath ? 'Refresh' : 'Add labels',
		write: true,
		icon: 'lucide:refresh-cw',
	};
	if (!row.appPath && !row.hasTool && !row.skillCount && !row.agentItems?.length && !row.modelItems?.length) {
		return [addOrRefresh];
	}
	return [
		{ id: 'check', label: 'Check', write: false, icon: 'lucide:search-check' },
		{ id: 'reencode', label: 'Re-encode', write: true, icon: 'lucide:qr-code' },
		addOrRefresh,
	];
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
			'Nutrition labels for the enrolled fleet. Check rows like Fleet, then Add labels or Refresh.',
			'Columns are app, tool, skill, agent, and model. A name in a cell is that /v card.',
			'“no label” means the repo has no *_FACTS.md. Add labels writes AppFacts only.',
			'Check compares fingerprints. Re-encode rewrites /v cards from frontmatter.',
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
