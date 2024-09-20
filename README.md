
# Getting started

## Docker

```bash
docker volume create hackd_db
docker network create hackd_public
docker network create hackd_private

docker-compose up -d db         # just run the db
docker-compose up -d --build    # run the whole stack
```

## DB

```bash
make schema-push
```
