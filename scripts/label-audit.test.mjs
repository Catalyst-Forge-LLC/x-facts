import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
	auditLabels,
	commitLabelChanges,
	featureSummary,
	labelCommitPaths,
	labelGaps,
	labelStatusPaths,
	writePackageCandidate,
} from './label-audit.mjs';

describe('label commit paths', () => {
	it('commits only label files that were not already dirty', () => {
		assert.deepEqual(
			labelCommitPaths(
				['README.md'],
				['README.md', 'APP_FACTS.md', '.featurefacts/features.yaml', 'src/cli.ts'],
			),
			['.featurefacts/features.yaml', 'APP_FACTS.md'],
		);
	});
});

describe('commit label changes', () => {
	it('commits the new label and leaves an unrelated dirty file', () => {
		const root = mkdtempSync(join(tmpdir(), 'xfacts-commit-'));
		execFileSync('git', ['init'], { cwd: root });
		writeFileSync(join(root, 'README.md'), '# Sample\n');
		execFileSync('git', ['add', 'README.md'], { cwd: root });
		execFileSync('git', ['commit', '-m', 'start'], { cwd: root });
		writeFileSync(join(root, 'notes.txt'), 'leave me\n');
		const before = labelStatusPaths(root);
		writeFileSync(join(root, 'APP_FACTS.md'), '---\nname: sample\n---\n');
		const committed = commitLabelChanges(root, before, [], 'Helm: add xFacts labels.');
		assert.equal(committed.committed, true);
		const after = labelStatusPaths(root);
		assert.deepEqual(after, ['notes.txt']);
	});
});

describe('label audit', () => {
	it('treats a package with no labels as gaps, then accepts a package candidate', () => {
		const root = mkdtempSync(join(tmpdir(), 'xfacts-audit-'));
		writeFileSync(
			join(root, 'package.json'),
			JSON.stringify({ name: 'sample-tool', version: '1.0.0', description: 'A sample.', license: 'MIT' }),
		);
		assert.deepEqual(labelGaps(root), ['APP_FACTS.md', '.featurefacts/features.yaml']);
		assert.ok(auditLabels(root).includes('no APP_FACTS.md'));
		const wrote = writePackageCandidate(root);
		assert.equal(wrote.wrote, true);
		const summary = featureSummary(root);
		assert.equal(summary.count, 1);
		assert.deepEqual(summary.errors, []);
		assert.deepEqual(labelGaps(root), ['APP_FACTS.md']);
	});
});
