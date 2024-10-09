
db-push:
	npx prisma db push --schema db/schema.prisma

db-generate:
	sea-orm-cli generate entity -o backend/repositories/src/db --with-serde both
	@echo "Add `#[derive(Copy, Hash, strum::Display, utoipa::ToSchema)]` to all enums in `sea_orm_active_enums.rs`"
	@echo "Run `cargo fmt`"
