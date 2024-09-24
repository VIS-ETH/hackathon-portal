
# Load environment variables from stack.env
ifneq (,$(wildcard ./stack.env))
    include stack.env
    export
endif

seaorm-push:
	npx prisma db push --schema db/schema.prisma

seaorm-generate:
	sea-orm-cli generate entity -o backend/repositories/src/db --with-serde both
