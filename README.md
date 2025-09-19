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
    docker volume create portal_minio_data
    
    docker network create portal_public
    docker network create portal_private
    ```

3. Create `compose.override.yaml` with the following content. It opens ports for local development.

   ```yaml
   services:
     traefik:
       ports:
         - 8080:8080
       
     minio:
       ports:
         - 9001:9001
       
     postgres:
       ports:
         - 5432:5432
   ```

4. Create an `.env` file from the example (`cp .env.example .env`), and update the values as needed.

5. (Optional) If you want restore from a PostgreSQL dump, delete all files in the `db/init` folder, and copy your dump
   file there. **Make sure to revert these changes after the next step and do not commit the dump file to git.**

6. Start the dev stack with `docker compose --profile dev up -d`. This will create a local PostgreSQL and MinIO
   instance. To operate on the entire stack, use e.g. `docker compose --profile "*" up/down/...`.

7. Start the portal api with `cd backend` and `cargo run --bin hackathon-portal-api`.

8. Start the frontend with `cd frontend && npm install` and `npm run dev`.

9. Look at the `Makefile` for more commands that can be useful during development.
