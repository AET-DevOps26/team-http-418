#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE "courses-data";
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "courses-data" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOSQL

if [ -f /docker-entrypoint-initdb.d/courses-data.sql.gz ]; then
    echo "Loading courses seed data..."
    gunzip -c /docker-entrypoint-initdb.d/courses-data.sql.gz | \
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "courses-data"
    echo "Courses seed data loaded."
else
    echo "No courses-data.sql.gz found — starting with empty courses database."
fi
