#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { materializeGatewayAssembly } from '../../../sdkwork-specs/tools/materialize-gateway-assembly.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const result = materializeGatewayAssembly(root);
if (!result.ok) {
  console.error('api:assembly:materialize failed: ' + result.message);
  process.exit(1);
}
console.log('api:assembly:materialize wrote ' + result.crateDir + ' (' + result.routeCrates + ' route crates)');
