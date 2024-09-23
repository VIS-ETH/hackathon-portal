
# Load environment variables from stack.env
ifneq (,$(wildcard ./stack.env))
    include stack.env
    export
endif

seaorm-push:
	npx prisma db push --schema db/schema.prisma

seaorm-generate:
	sea-orm-cli generate entity -o backend/repository/src/db --with-serde both --model-extra-derives 'utoipa::ToSchema' --enum-extra-derives 'utoipa::ToSchema'
	@echo "Generated sea-orm entities."
	@echo "Refer to the README/VCS to patch the generated code!"
