import asyncio

from tumonline_scraper import fetch_lectures
from db_handler import setup_database, init_tables

DEBUG = True #todo


async def main():
    # Initialize database
    setup_database(DEBUG)
    await init_tables()
    
    semester_id = 206 # summer 2026, each semester adds 1
    lectures = await fetch_lectures(semester_id, DEBUG)
    print(f"Fetched {len(lectures)} lectures.")


if __name__ == "__main__":
    asyncio.run(main())
