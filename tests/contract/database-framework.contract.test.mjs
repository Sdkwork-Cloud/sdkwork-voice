#!/usr/bin/env node
import assert from 'node:assert/strict';
import { validateDatabaseFramework } from '../../../sdkwork-specs/tools/check-database-framework-standard.mjs';

const result = validateDatabaseFramework(process.cwd());
assert.equal(result.skipped, false, 'application must own database/');
assert.equal(result.ok, true, `database framework validation failed: ${result.failures.join('; ')}`);

process.stdout.write('database-framework.contract.test.mjs passed\n');
