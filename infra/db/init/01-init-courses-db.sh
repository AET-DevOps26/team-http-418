#!/bin/bash
set -e

COURSES_DB_NAME="${COURSES_DB_NAME:-courses-data}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE "$COURSES_DB_NAME";
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$COURSES_DB_NAME" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOSQL

if [ -f /docker-entrypoint-initdb.d/courses-data.sql.gz.data ]; then
    echo "Loading courses seed data..."
    gunzip -c /docker-entrypoint-initdb.d/courses-data.sql.gz.data | \
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$COURSES_DB_NAME"
    echo "Courses seed data loaded."
else
    echo "No courses-data.sql.gz found — starting with empty courses database."
fi

if [ -f /docker-entrypoint-initdb.d/02-study-programs.sql.inc ]; then
    echo "Loading study programs seed data..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$COURSES_DB_NAME" \
        -f /docker-entrypoint-initdb.d/02-study-programs.sql.inc
    echo "Study programs seed data loaded."
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$COURSES_DB_NAME" <<-EOSQL
    CREATE TABLE IF NOT EXISTS course_embeddings (
        course_id BIGINT PRIMARY KEY,
        embedding VECTOR(4096),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
EOSQL

if [ -f /docker-entrypoint-initdb.d/embeddings-data.sql.gz.data ]; then
    echo "Loading embeddings seed data..."
    gunzip -c /docker-entrypoint-initdb.d/embeddings-data.sql.gz.data | \
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$COURSES_DB_NAME"
    echo "Embeddings seed data loaded."
fi
