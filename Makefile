
BACKEND_VERSION := $(shell grep '^version = ' backend/api/Cargo.toml | sed 's/version = "\(.*\)"/\1/')
FRONTEND_VERSION := $(shell jq -r '.version' frontend/package.json)

include .env

prisma-push:
	npx -r prisma@6 db push --schema db/schema.prisma

prisma-dev:
	npx -r prisma@6 migrate dev --schema db/schema.prisma

prisma-dev-create:
	npx -r prisma@6 migrate dev --schema db/schema.prisma --create-only

prisma-prod:
	npx -r prisma@6 migrate deploy --schema db/schema.prisma

prisma-reset:
	npx -r prisma@6 migrate reset --schema db/schema.prisma

seaorm-generate:
	sea-orm-cli generate entity --database-url ${PORTAL__POSTGRES__URL} -o backend/repositories/src/db/generated --with-serde both --enum-extra-derives "Copy, Hash, strum::Display, strum::VariantArray, utoipa::ToSchema"
	cargo fmt --manifest-path backend/Cargo.toml --all

fmt:
	cd db && npx -y prisma@6 format
	cd frontend && npm run fmt
	cd backend && cargo fmt --all && cargo sort -w

lint:
	cd frontend && npm run lint
	cd backend && cargo clippy -- -D warnings && cargo fmt --check
