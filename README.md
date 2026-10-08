# Getting started

1. Install some tools:

   ```bash
   cargo install sea-orm-cli \
      cargo-sort \
      cargo-edit \
      cargo-udeps
   ```

2. Create the required docker volumes and networks:

   ```bash
   docker volume create portal_db
   docker volume create portal_db_backup
   docker volume create portal_garage_data

   docker network create portal_public
   docker network create portal_private
   ```

3. Create `compose.override.yaml` with the following content. It opens ports for local development, and lets the
   containerized frontend (served by Traefik on port 80 with `--profile prod`) send writes to the backend.

   ```yaml
   services:
     traefik:
       ports:
         - 8080:8080

     postgres:
       ports:
         - 5432:5432

     backend:
       environment:
         PORTAL__SERVER__ALLOWED_ORIGINS: http://localhost
   ```

4. Create an `.env` file from the example (`cp .env.example .env`), and update the values as needed.

5. Start the dev stack with `docker compose --profile dev up -d`. This will create a local PostgreSQL and Garage (S3)
   instance. To operate on the entire stack, use e.g. `docker compose --profile "*" up/down/...`.

6. Run `make prisma-dev` or `make prisma-reset` to initialize the database and apply the latest migrations.
   If you have access to migrations that restore a dump, place them in the `db/migrations` folder first.

7. Allow uploads from the frontend by setting the bucket CORS once with `cd backend` and
   `cargo run --bin hackathon-portal-cli -- s3 setup-cors http://localhost:3000`.

8. Start the portal api with `cd backend` and `cargo run --bin hackathon-portal-api`.

9. Start the frontend with `cd frontend && npm install` and `npm run dev`.

10. Look at the `Makefile` for more commands that can be useful during development. Also, refer to the READMEs in the
    child folders.
