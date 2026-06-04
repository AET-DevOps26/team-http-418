import asyncio
from scraper.db_handler import update_database
from tumonline_scraper import fetch_courses
from db_handler import DB

DEBUG = False #todo


async def main():
    # Initialize database
    db = await DB.create_instance(DEBUG)

    semester_id = 206 # summer 2026, each semester adds 1
    lectures = await fetch_courses(semester_id, detailed=True, debug=DEBUG) #does not contain detailed descriptions
    print(f"Fetched {len(lectures)} courses.")
    # print(list(map(lambda x: ElementTree.tostring(x).decode(),lectures)))

    print("Starting to insert courses into database")
    async with db.conn.transaction():
        for lecture in lectures:
            await update_database(db.conn, lecture)

    print("\ndone")

if __name__ == "__main__":
    asyncio.run(main())
