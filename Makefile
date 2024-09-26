
# Load environment variables from stack.env
ifneq (,$(wildcard ./stack.env))
    include stack.env
    export
endif

seaorm-push:
	npx prisma db push --schema db/schema.prisma

seaorm-generate:
	sea-orm-cli generate entity -o backend/repositories/src/db --with-serde both
	@echo "Add `#[derive(utoipa::ToSchema, Hash)]` to all enums in `sea_orm_active_enums.rs`"
	@echo "Run `cargo fmt`"
