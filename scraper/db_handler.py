import asyncio
import asyncpg
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_NAME = "aidan"
DB_USER = "postgres"
DB_PASS = "postgres"
DB_HOST = "localhost"
DB_PORT = "5432"

def setup_database(debug: bool):
    """
    Synchronously creates the database if it doesn't exist.
    If DEBUG is True, it drops the existing database first.
    """
    try:
        # Connect to default 'postgres' database to perform administrative tasks
        conn = psycopg2.connect(
            dbname="postgres",
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        if debug:
            print(f"DEBUG mode: Dropping database {DB_NAME} if it exists...")
            cur.execute(f"DROP DATABASE IF EXISTS {DB_NAME}")

        # Check if DB exists
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (DB_NAME,))
        exists = cur.fetchone()
        
        if not exists:
            print(f"Creating database {DB_NAME}...")
            cur.execute(f"CREATE DATABASE {DB_NAME}")
        else:
            print(f"Database {DB_NAME} already exists.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error setting up database: {e}")

async def init_tables():
    """
    Initializes the database tables.
    """
    try:
        conn = await asyncpg.connect(
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            host=DB_HOST
        )
        
        # Example table for lectures
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS lectures (
                id SERIAL PRIMARY KEY,
                course_id TEXT UNIQUE,
                title TEXT,
                term_id INTEGER
            )
        ''')
        
        await conn.close()
    except Exception as e:
        print(f"Error initializing tables: {e}")

async def insert_test_data():
    """
    Inserts some test data into the database.
    """
    try:
        conn = await asyncpg.connect(
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            host=DB_HOST
        )
        
        test_data = [
            ('COURSE001', 'Introduction to Software Engineering', 206),
            ('COURSE002', 'Database Systems', 206),
            ('COURSE003', 'Artificial Intelligence', 206),
        ]
        
        print("Inserting test data...")
        await conn.executemany('''
            INSERT INTO lectures (course_id, title, term_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (course_id) DO NOTHING
        ''', test_data)

        await conn.close()
    except Exception as e:
        print(f"Error inserting test data: {e}")

async def main():
    # Setup DB first (sync)
    setup_database(True)
    # Init tables and insert data (async)
    await init_tables()
    await insert_test_data()

if __name__ == "__main__":
    asyncio.run(main())