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
    * Database: portal/app (or equivalent)
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

### Recovery

@dackermann

#### Locally (tested)

1. Untar the tar file in an own directory: `tar -xf data.tar`
2. Delete `backup_label`
3. Empty Custom Cluster Configs (there are two!): `echo > override.conf` and `echo > custom.conf`
4. Reset Write-Ahead-Log (if snapshot was taken while DB was running) - if you miss that Postgres will PANIC on start
5. `docker run --rm  -v ./PATH_TO_BACKUP:/var/lib/postgresql/data postgres:17 bash -c "su postgres -c 'pg_resetwal -f /var/lib/postgresql/data'"`
6. You should now be able to spin up the Postgres docker using the `PATH_TO_BACKUP` as bind volume , i.e.
    ```yaml
    volumes:
      - ./PATH_TO_BACKUP/:/var/lib/postgresql/data
    ```


#### On Cluster (untested)

Probably skip step 3 or replace the files with the files from a clean/reset db on the cluster.

It might also be easier to

1. restoring a backup locally using the guide above
2. export the data from locally restored db with pg_dump (just the app database) to an sql file
3. run the file from pg_dump against a new / empty db on the cluster
