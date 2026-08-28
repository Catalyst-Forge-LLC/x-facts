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

function boardFrom(inventory) {
	return {
		plugin: 'xfacts',
		title: 'xFacts labels',
		tab: 'sites',
		rowLabel: 'repo',
		note: [
			'Nutrition labels across the sibling workspace (AppFacts / ToolFacts / SkillFacts).',
			'Open uses the row link. Check compares fingerprints. Re-encode refreshes /v cards from frontmatter.',
			'Refresh re-runs the AppFacts generator (needs Ollama or configured provider).',
			inventory.note,
		]
			.filter(Boolean)
			.join(' '),
		columns: [
			{ id: 'app', label: 'app' },
			{ id: 'tool', label: 'tool' },
			{ id: 'skill', label: 'skill' },
			{ id: 'viewer', label: 'viewer' },
			{ id: 'name', label: 'name' },
			{ id: 'status', label: 'status' },
		],
		rows: inventory.rows.map((row) => ({
			id: row.id,
			label: row.id,
			href: row.viewer || undefined,
			cells: {
				app: row.app,
				tool: row.tool,
				skill: row.skill,
				viewer: row.viewerStatus,
				name: row.name,
				status: row.status,
			},
			actions: [
				{ id: 'check', label: 'Check', write: false, icon: 'lucide:search-check' },
				{ id: 'reencode', label: 'Re-encode', write: true, icon: 'lucide:qr-code' },
				{ id: 'refresh', label: 'Refresh', write: true, icon: 'lucide:refresh-cw' },
			],
		})),
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
