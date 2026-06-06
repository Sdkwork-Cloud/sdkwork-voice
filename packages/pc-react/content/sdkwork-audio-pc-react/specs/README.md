# SDKWork Audio PC React Component Specs

This directory is the local standards index for `@sdkwork/audio-pc-react`.

Root SDKWork standards remain authoritative. Local component specs can narrow or document this component, but they must not contradict [the root standards](../../../../../../../specs/README.md).

## Component

| Field | Value |
| --- | --- |
| Name | `@sdkwork/audio-pc-react` |
| Type | `react-package` |
| Root | `sdkwork-voice/packages/pc-react/content/sdkwork-audio-pc-react` |
| Domain | `voice` |
| Capability | `audio` |
| Languages | `typescript` |
| Status | `ready` |

## Contract Manifest

- [component.spec.json](./component.spec.json) is the machine-readable component contract.
- Consumers should integrate through public exports, runtime entrypoints, SDK clients, or adapters declared in the manifest.
- Generated SDK language outputs are represented at their SDK family root instead of duplicating local specs in generated folders.

## Canonical Specs

| Spec | Applies Because |
| --- | --- |
| [APP_PC_REACT_UI_SPEC.md](../../../../../../../specs/APP_PC_REACT_UI_SPEC.md) | App PC React package split, app SDK boundary, and desktop interaction rules. |
| [COMPONENT_SPEC.md](../../../../../../../specs/COMPONENT_SPEC.md) | Local component specs directory and manifest rules. |
| [CONFIG_SPEC.md](../../../../../../../specs/CONFIG_SPEC.md) | Runtime configuration, environment, SDK bootstrap, and feature flag rules. |
| [DOCUMENTATION_SPEC.md](../../../../../../../specs/DOCUMENTATION_SPEC.md) | Module README, examples, ADR, changelog, and runbook rules. |
| [DOMAIN_SPEC.md](../../../../../../../specs/DOMAIN_SPEC.md) | Canonical domain ownership and naming. |
| [FRONTEND_SPEC.md](../../../../../../../specs/FRONTEND_SPEC.md) | UI, service, SDK, accessibility, and frontend runtime rules. |
| [GOVERNANCE_SPEC.md](../../../../../../../specs/GOVERNANCE_SPEC.md) | Standard ownership, exception, compatibility, and migration rules. |
| [I18N_SPEC.md](../../../../../../../specs/I18N_SPEC.md) | User-facing language, locale, message catalog, and fallback rules. |
| [MODULE_SPEC.md](../../../../../../../specs/MODULE_SPEC.md) | Reusable package contract and dependency direction. |
| [README.md](../../../../../../../specs/README.md) | SDKWork root standards entrypoint. |
| [SDK_SPEC.md](../../../../../../../specs/SDK_SPEC.md) | SDK generation and SDK integration rules. |
| [TEST_SPEC.md](../../../../../../../specs/TEST_SPEC.md) | Contract, frontend, SDK, security, parity, and documentation verification rules. |
| [UI_ARCHITECTURE_SPEC.md](../../../../../../../specs/UI_ARCHITECTURE_SPEC.md) | UI architecture selection, package-family ownership, and SDK boundary rules. |

## Public Exports

- `.`

## SDK Clients

- No generated SDK client class is declared at this component boundary.

## Local Extension Specs

- No local extension specs are declared yet.

## Verification

- `pnpm --filter @sdkwork/audio-pc-react typecheck`
