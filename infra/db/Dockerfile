FROM pgvector/pgvector:pg17

COPY seed-courses /usr/local/bin/seed-courses
RUN chmod 755 /usr/local/bin/seed-courses
COPY init/ /docker-entrypoint-initdb.d/

EXPOSE 5432
