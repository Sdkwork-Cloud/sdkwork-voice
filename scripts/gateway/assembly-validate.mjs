#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGatewayAssembly } from '../../../sdkwork-specs/tools/validate-gateway-assembly.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const result = validateGatewayAssembly(root);
if (result.skipped) {
  console.log('api:assembly:validate skipped (' + result.message + ')');
  process.exit(0);
}
for (const warning of result.warnings) {
  console.warn('warning: ' + warning);
}
if (!result.ok) {
  for (const error of result.errors) {
    console.error('error: ' + error);
  }
  process.exit(1);
}
console.log('api:assembly:validate passed for sdkwork-' + result.applicationCode + ' (' + result.routeCrates + ' route crates)');
