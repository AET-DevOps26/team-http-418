import asyncio
import logging

from tumonline_scraper import fetch_courses
from db_handler import DB, build_import_batch, bulk_update_database

DEBUG = False


async def main():
    # Initialize database
    db = await DB.create_instance(DEBUG)

    semester_id = 206 # summer 2026, each semester adds 1 TODO optional: automate this
    courses = await fetch_courses(semester_id, debug=DEBUG) #does not contain detailed descriptions
    logging.info(f"Fetched {len(courses)} courses.")

    logging.info("Parsing courses")
    batch = build_import_batch(courses)
    assert len(batch["courses"]) == len(courses), "batch size does not match course count"

    logging.info("Starting to insert courses into database")
    async with db.conn.transaction():
        await bulk_update_database(db.conn, batch)

    await db.close_connection()
    logging.info("\ndone")

if __name__ == "__main__":
    asyncio.run(main())
