#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE "courses-data";
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "courses-data" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
EOSQL

if [ -f /docker-entrypoint-initdb.d/courses-data.sql ]; then
    echo "Loading courses seed data..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "courses-data" \
        -f /docker-entrypoint-initdb.d/courses-data.sql
    echo "Courses seed data loaded."
else
    echo "No courses-data.sql found — starting with empty courses database."
fi
