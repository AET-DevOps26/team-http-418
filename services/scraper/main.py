import asyncio
import logging
import os
import sys

from db_handler import DB, build_import_batch, bulk_update_database
from tumonline_scraper import fetch_courses

DEBUG = False
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


async def main(clean: bool = False):
    db = await DB.create_instance(DEBUG, clean)

    semester_ids_raw = os.environ.get("SCRAPER_SEMESTER_IDS", "205,206")
    semester_ids = [int(s.strip()) for s in semester_ids_raw.split(",") if s.strip()]

    for semester_id in semester_ids:
        logging.info(f"Scraping semester {semester_id}")
        courses = await fetch_courses(semester_id, debug=DEBUG)
        logging.info(f"Fetched {len(courses)} courses for semester {semester_id}.")

        logging.info("Parsing courses")
        batch = build_import_batch(courses)
        assert len(batch["courses"]) == len(courses), "batch size does not match course count"

        logging.info(f"Inserting courses for semester {semester_id} into database")
        async with db.conn.transaction():
            await bulk_update_database(db.conn, batch)

    await db.close_connection()
    logging.info("done")


if __name__ == "__main__":
    clean_run = sys.argv[-1] == "--clean"
    asyncio.run(main(clean_run))
