import asyncio
import gc
import logging
import os
import sys

from db_handler import DB, build_import_batch, bulk_update_database, bulk_update_study_programs
from tumonline_scraper import fetch_courses
from spo_tree_scanner import scan_programs

DEBUG = False
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

DEFAULT_PROGRAM_IDS = "5371,5217,5028,5000,4999,4997"


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
        logging.info(f"Parsed {len(batch['courses'])} of {len(courses)} courses (rest skipped due to missing details)")

        logging.info(f"Inserting courses for semester {semester_id} into database")
        async with db.conn.transaction():
            await bulk_update_database(db.conn, batch)

        del courses, batch
        gc.collect()
        logging.info(f"Semester {semester_id} done, memory freed")

    # Scrape study program requirements (SPO trees)
    program_ids_raw = os.environ.get("SCRAPER_PROGRAM_IDS", DEFAULT_PROGRAM_IDS)
    program_ids = [int(s.strip()) for s in program_ids_raw.split(",") if s.strip()]

    if program_ids:
        logging.info(f"Scraping SPO trees for {len(program_ids)} study programs")
        programs = scan_programs(program_ids, delay=0.3)
        logging.info(f"Scraped {len(programs)} study programs")

        async with db.conn.transaction():
            await bulk_update_study_programs(db.conn, programs)
        logging.info("Study programs inserted into database")

    await db.close_connection()
    logging.info("done")


if __name__ == "__main__":
    clean_run = sys.argv[-1] == "--clean"
    asyncio.run(main(clean_run))
