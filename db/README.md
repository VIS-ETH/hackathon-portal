# Database

## Workflows

### Updating the Schema

1. Make changes to `db/schema.prisma`
2. Run `make prisma-push` to prototype, if needed
3. Run `make prisma-dev-create` to create a new migration
4. If the change generated warnings, fix them in the generated migration file
5. Run `make prisma-dev` to apply the migrations locally
6. (optional) Run `make prisma-prod PORTAL__POSTGRES__URL="..."` to apply the migrations to a production database
7. Run `make seaorm-generate` to update the entity definitions

### Creating a Dump Migration

1. `public` > Import/Export > Export with pg_dump:

    * Statements: Inserts with columns
    * Database: portal
    * Schemas: public
    * Tables to dump: (empty)
    * Checkboxes: Data only

2. Copy the output to `db/migrations/x_name/migration.sql`
3. Remove the preamble, i.e. all `SET` and the `SELECT pg_catalog.set_config('search_path', '', false);` statements
4. `public` > SQL Scripts > SQL Generator:

    * Generate: Truncate table
    * Checkboxes: Use CASCASE

5. Copy the output to the top of `db/migrations/x_name/migration.sql`
6. If the data is sensitive, ensure the migration folder is git-ignored
