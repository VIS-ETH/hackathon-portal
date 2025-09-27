FROM rust:slim-bookworm AS chef

WORKDIR /app

RUN apt-get update \
    && apt-get install -y \
        libssl-dev \
        pkg-config \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN cargo install cargo-chef

FROM chef AS planner

COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder

COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

COPY . .

FROM builder AS cli-builder

RUN cargo build --package hackathon-portal-cli --release

FROM builder AS api-builder

RUN cargo build --package hackathon-portal-api --release

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=cli-builder /app/target/release/hackathon-portal-cli /usr/local/bin/hackathon-portal-cli
COPY --from=api-builder /app/target/release/hackathon-portal-api /usr/local/bin/hackathon-portal-api
