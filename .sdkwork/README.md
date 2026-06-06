# SDKWork Workspace

This .sdkwork/ directory is source-controlled workspace metadata for $name.

It is governed by $specPath/SDKWORK_WORKSPACE_SPEC.md and follows the standards entrypoint at $specPath/README.md.

Authoritative local entries:

- README.md: purpose and ownership for this workspace metadata directory.
- skills/README.md: repository or application skill contribution guidance.
- plugins/README.md: repository or application plugin contribution guidance.
- package and language manifests: repository component discovery.

This directory is not runtime state. Do not store generated SDK transport output, secrets, local credentials, runtime databases, cache, logs, or user-private files here.

## Execution References

- Agent entrypoint: `AGENTS.md`
- Shared execution soul: `../sdkwork-specs/SOUL.md`
- Workspace metadata standard: `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
