import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { auditLabels, featureSummary, labelGaps, writePackageCandidate } from './label-audit.mjs';

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
