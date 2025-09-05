# Getting started

## Docker

```bash
docker volume create portal_db
docker volume create portal_db_backup
docker volume create portal_minio_data
docker network create portal_public
docker network create portal_private

cp .env.j2 .env # and fill in the missing values

docker-compose up -d db         # just run the db
docker-compose up -d --build    # run the whole stack
```

## DB

```bash
make db-push
```
