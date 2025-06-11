FROM rust:slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libssl-dev \
    pkg-config \
    curl \
    ca-certificates

COPY . .

RUN cargo build --package hackathon-portal-api --release

#############################

FROM debian:bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libssl-dev \
    pkg-config \
    curl \
    ca-certificates

COPY --from=builder /app/target/release/hackathon-portal-api /app/hackathon-portal-api

CMD ["/app/hackathon-portal-api"]
