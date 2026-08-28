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

const CORE_LABEL_COLS = [
	{ id: 'tool', label: 'tool' },
	{ id: 'skill', label: 'skill' },
];
const EXTRA_LABEL_COLS = [
	{ id: 'agent', label: 'agent' },
	{ id: 'model', label: 'model' },
];

function labelColumns(rows) {
	const extra = EXTRA_LABEL_COLS.filter((col) => rows.some((row) => (row[col.id] ?? '—') !== '—' || row.viewers?.[col.id]));
	return [...CORE_LABEL_COLS, ...extra];
}

function boardFrom(inventory) {
	return {
		plugin: 'xfacts',
		title: 'xFacts labels',
		tab: 'sites',
		rowLabel: 'repo',
		note: [
			'Nutrition labels across the sibling workspace. The repo name opens the AppFacts card. Each tool or skill name is its own /v link.',
			'Agent and model columns appear only when a shelf repo has those files.',
			'Check compares fingerprints. Re-encode refreshes app, tool, and skill /v cards from frontmatter.',
			'Refresh re-runs the AppFacts generator (needs Ollama or configured provider).',
			inventory.note,
		]
			.filter(Boolean)
			.join(' '),
		columns: labelColumns(inventory.rows),
		rows: inventory.rows.map((row) => {
			const links = { ...(row.viewers ?? {}) };
			if (row.viewer && !links.app) links.app = row.viewer;
			const linkGroups = {};
			if (row.skillItems?.length) {
				linkGroups.skill = row.skillItems.map(({ label, href }) => ({ label, href }));
			}
			if (row.toolItems?.length) {
				linkGroups.tool = row.toolItems.map(({ label, href }) => ({ label, href }));
			}
			return {
				id: row.id,
				label: row.id,
				href: links.app || links.skill || links.tool || row.viewer || undefined,
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
				actions: [
					{ id: 'check', label: 'Check', write: false, icon: 'lucide:search-check' },
					{ id: 'reencode', label: 'Re-encode', write: true, icon: 'lucide:qr-code' },
					{ id: 'refresh', label: 'Refresh', write: true, icon: 'lucide:refresh-cw' },
				],
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
