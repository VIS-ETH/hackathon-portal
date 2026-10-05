# Base for the builder stage; CI passes the registry cook image so branches
# reuse main's compiled dependencies instead of re-cooking.
ARG BUILDER_BASE=cook

FROM rust:1.99.0-slim-bookworm AS chef

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libssl-dev \
        pkg-config \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN cargo install cargo-chef --version 0.1.78 --locked \
    && rm -rf $CARGO_HOME/registry

FROM chef AS planner

COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS cook

COPY --from=planner /app/recipe.json recipe.json

RUN cargo chef cook --release --recipe-path recipe.json \
    && rm -rf $CARGO_HOME/registry/src

FROM ${BUILDER_BASE} AS builder

COPY . .

RUN cargo build --release

FROM debian:bookworm-20260918-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --create-home app

COPY --from=builder /app/target/release/hackathon-portal-cli /usr/local/bin/hackathon-portal-cli
COPY --from=builder /app/target/release/hackathon-portal-api /usr/local/bin/hackathon-portal-api

USER app
