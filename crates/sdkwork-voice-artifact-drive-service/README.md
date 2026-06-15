# sdkwork-voice-artifact-drive-service

SDKWork Voice service crate for persisting generated voice artifacts into
SDKWork Drive.

The crate consumes `sdkwork-drive-workspace-service` and the Drive storage
contracts through the root Cargo workspace. It exposes upload planning,
Drive uploader preparation, and direct generated-bytes persistence helpers for
voice generation workers.

Verification:

```powershell
cargo test -p sdkwork-voice-artifact-drive-service
```
