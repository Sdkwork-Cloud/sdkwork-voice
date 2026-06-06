# sdkwork-voice

`sdkwork-voice` owns SDKWork voice and audio capabilities that previously lived in `sdkwork-appbase`.

The repository owns:

- voice and audio frontend package contracts
- voice local API proxy route/catalog/storage contracts
- Rust voice HTTP route catalogs and local/private storage schema
- voice app/backend OpenAPI authorities and SDK generation wrappers

Foundation capabilities such as IAM, request context, Drive-backed media lifecycle, and generic UI primitives remain dependencies rather than duplicated appbase code.
