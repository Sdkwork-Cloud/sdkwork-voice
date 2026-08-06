# Deprecated

Canonical database lifecycle assets live in the application-root `database/` directory.

Do not add new schema files here. Migrate remaining changes into:

- `database/contract/schema.yaml`
- `database/migrations/{engine}/`
- `database/ddl/baseline/{engine}/`

See `DATABASE_FRAMEWORK_SPEC.md` and `database/README.md`.

