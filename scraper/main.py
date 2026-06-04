import asyncio

from asyncpg import Pool

from scraper.db_handler import update_database
from tumonline_scraper import fetch_courses
from db_handler import DB

DEBUG = False #todo

async def process_with_limit(pool: Pool, course, sem: asyncio.Semaphore):
    async with sem:
        return await update_database(pool, course)

async def main():
    # Initialize database
    db = await DB.create_instance(DEBUG)

    semester_id = 206 # summer 2026, each semester adds 1
    lectures = await fetch_courses(semester_id, detailed=True, debug=DEBUG) #does not contain detailed descriptions
    print(f"Fetched {len(lectures)} courses.")
    # print(list(map(lambda x: ElementTree.tostring(x).decode(),lectures)))

    if not db.connection_pool: raise Exception("Connection pool not initialized")
    sem = asyncio.Semaphore(20) # limit concurrent db writes
    print("Starting to insert courses into database")
    async with db.connection_pool as pool:
        await asyncio.gather(*(process_with_limit(pool, lecture, sem) for lecture in lectures))
    print("done")

if __name__ == "__main__":
    asyncio.run(main())
