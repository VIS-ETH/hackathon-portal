
BACKEND_VERSION := $(shell grep '^version = ' backend/api/Cargo.toml | sed 's/version = "\(.*\)"/\1/')
FRONTEND_VERSION := $(shell jq -r '.version' frontend/package.json)

prisma-push:
	npx -r prisma db push --schema db/schema.prisma

prisma-generate:
	npx -r prisma migrate diff --from-empty --to-schema-datamodel db/schema.prisma --script > db/init/1-schema.sql

seaorm-generate:
	sea-orm-cli generate entity -o backend/repositories/src/db --with-serde both --enum-extra-derives "Copy, Hash, strum::Display, utoipa::ToSchema"
	cargo fmt --manifest-path backend/Cargo.toml --all

cargo-install:
	cargo install sea-orm-cli \
		cargo-sort \
		cargo-edit \
		cargo-udeps

fmt:
	cd db && npx -y prisma format
	cd backend && cargo fmt --all && cargo sort -w
	cd frontend && npm run fmt

lint:
	cd backend && cargo clippy -- -D warnings && cargo +nighly udeps && cargo fmt --check
	cd frontend && npm run lint
