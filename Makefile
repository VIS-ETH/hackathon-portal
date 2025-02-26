
BACKEND_VERSION := $(shell grep '^version = ' backend/api/Cargo.toml | sed 's/version = "\(.*\)"/\1/')
FRONTEND_VERSION := $(shell jq -r '.version' frontend/package.json)

db-push:
	npx prisma db push --schema db/schema.prisma

db-generate:
	sea-orm-cli generate entity -o backend/repositories/src/db --with-serde both
	@echo "Add `#[derive(Copy, Hash, strum::Display, utoipa::ToSchema)]` to all enums in `sea_orm_active_enums.rs`"
	@echo "Run `cargo fmt`"

db-generate-schema:
	npx -y prisma migrate diff --from-empty --to-schema-datamodel db/schema.prisma --script > db/init/1-schema.sql

_build-backend:
	@echo "Building backend version $(BACKEND_VERSION)"
	@docker buildx build --platform linux/amd64,linux/arm64 -t registry.3brh4rd.dev/hackathon-portal/backend:$(BACKEND_VERSION) --push backend

_build-frontend:
	@echo "Building frontend version $(FRONTEND_VERSION)"
	@docker buildx build --platform linux/amd64,linux/arm64 -t registry.3brh4rd.dev/hackathon-portal/frontend:$(FRONTEND_VERSION) --push frontend

_build: _build-backend _build-frontend
