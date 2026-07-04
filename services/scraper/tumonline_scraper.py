import asyncio
import itertools
import logging
import re
from dataclasses import dataclass, field
from xml.etree import ElementTree as ET

import aiohttp

semaphore = asyncio.Semaphore(10)
base_url = "https://campus.tum.de/tumonline/ee/rest/slc.tm.cp/student/courses"
base_url_dates = "https://campus.tum.de/tumonline/ee/rest/slc.tm.cp/student/courseGroups/firstGroups"
base_url_curriculum_positions = (
    "https://campus.tum.de/tumonline/ee/rest/slc.cm.curriculumposition/positions/{}/course/allCurriculumPositions"
)


@dataclass
class SimpleDescription:
    xml: ET.Element
    string_xml: str | None = None

    def __assure_string_xml(self):
        if not self.string_xml:
            self.string_xml = ET.tostring(self.xml).decode("utf-8")

    def __hash__(self) -> int:
        self.__assure_string_xml()
        return hash(self.string_xml)

    def __eq__(self, other) -> bool:
        assert isinstance(other, SimpleDescription)
        self.__assure_string_xml()
        other.__assure_string_xml()
        return self.string_xml == other.string_xml


@dataclass
class Course:
    id: int = field(init=False, default=None)  # exclude id from constructor, will be provided by post_init
    simple_xml: ET.Element
    detailed_xml: ET.Element | None
    dates_xml: ET.Element | None
    curriculum_positions_xml: list[ET.Element] | None

    def __post_init__(self):
        try:
            self.id = int(self.simple_xml.find("id").text)
        except AttributeError as e:
            raise AttributeError(f"course {self.simple_xml} has no id\n{e}") from e


async def fetch_page(session: aiohttp.ClientSession, offset: int, semester_id: int, stepsize: int) -> ET.Element:
    url = f"{base_url}?$filter=termId-eq={semester_id}&$orderBy=title=ascnf&$skip={offset}&$top={stepsize}"
    async with semaphore:
        async with session.get(url) as response:
            assert response.status == 200, (
                f"could not fetch courselist page with offset {offset}, got {response.status}\n{url}"
            )
            text = await response.text()
            text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", text)  # sanitize invalid xml characters
        return ET.fromstring(text)


async def fetch_details(session: aiohttp.ClientSession, course: Course) -> Course:
    """
    sets the detailed_xml attribute of the course
    """
    async with semaphore:
        url = f"{base_url}/{course.id}"
        try:
            async with session.get(url) as response:
                if response.status != 200:
                    logging.warning(f"details for {course.id} returned {response.status}, skipping")
                    return course
                text = await response.text()
                text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", text)
                resources = ET.fromstring(text).findall("resource")
                if len(resources) == 1:
                    course.detailed_xml = resources[0]
                return course
        except Exception as e:
            logging.warning(f"details for {course.id} failed: {e}")
            return course


async def fetch_dates(session: aiohttp.ClientSession, course: Course) -> Course:
    """
    sets the dates_xml attribute of the course
    """
    async with semaphore:
        url = f"{base_url_dates}/{course.id}"
        try:
            async with session.get(url) as response:
                if response.status != 200:
                    logging.warning(f"dates for {course.id} returned {response.status}, skipping")
                    return course
                text = await response.text()
                text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", text)
                course.dates_xml = ET.fromstring(text)
                return course
        except Exception as e:
            logging.warning(f"dates for {course.id} failed: {e}")
            return course


async def fetch_curriculum_position(session: aiohttp.ClientSession, course: Course) -> Course:
    """
    sets the curriculum_positions_xml attribute of the course
    """
    async with semaphore:
        url = base_url_curriculum_positions.format(course.id)
        try:
            async with session.get(url) as response:
                if response.status != 200:
                    logging.warning(f"curriculum_positions for {course.id} returned {response.status}, skipping")
                    course.curriculum_positions_xml = []
                    return course
                text = await response.text()
                text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", text).replace(
                    "&", "&amp;"
                )  # sanitize invalid xml characters
                try:
                    course.curriculum_positions_xml = ET.fromstring(text).findall("resource")
                    return course
                except Exception as e:
                    logging.warning(f"could not parse curriculum_positions for {course.id}: {e}")
                    course.curriculum_positions_xml = []
                    return course
        except Exception as e:
            logging.warning(f"curriculum_positions for {course.id} failed: {e}")
            course.curriculum_positions_xml = []
            return course


async def fetch_courses(semester_id: int, debug: bool) -> list[Course]:
    """
    :param debug: if True, only fetch 20 courses for debugging
    :return: a list of triples (course_info, detailed_course_info, dates)
    """
    stepsize = 20
    timeout = aiohttp.ClientTimeout(total=30, connect=10)
    async with aiohttp.ClientSession(headers={"accept": "application/xml"}, timeout=timeout) as session:
        # get first page to get total number of courses
        url = f"{base_url}?$filter=termId-eq={semester_id}&$orderBy=title=ascnf&$skip=0"
        page = await session.get(url)
        assert page.status == 200, f"could not fetch first page, got {page.status}\n{url}"
        xml = ET.fromstring(await page.text())
        total = int(xml.find("totalCount").text)
        logging.info(f"expecting {total} courses{', ignoring because debug is set' if debug else ''}")

        # fetch all courses in parallel
        if debug:
            total = 20  # only fetch 20 courses for debugging
        tasks = [fetch_page(session, off, semester_id, stepsize) for off in range(0, total, stepsize)]
        simple_descriptions: list[ET.Element] = await asyncio.gather(*tasks)
        flat: list[SimpleDescription] = list(
            map(
                lambda x: SimpleDescription(x),
                itertools.chain(*(map(lambda tree: tree.findall("courses"), simple_descriptions))),
            )
        )  # flatmap to course elements
        assert len(flat) == total, f"only got {len(simple_descriptions)} courses of {total}"
        unique = set(flat)  # class wrapper is necessary to control comparison
        logging.info(f"got all courses, {len(unique)} of which are unique")

        logging.info(f"fetching detailed data for {len(unique)} courses")
        tasks = [fetch_details(session, Course(course.xml, None, None, None)) for course in unique]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        courses = [r for r in results if isinstance(r, Course)]
        if len(courses) < len(unique):
            logging.warning(f"{len(unique) - len(courses)} detail fetches failed")

        logging.info("fetching dates for courses")
        tasks = [fetch_dates(session, course) for course in courses]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        courses = [r for r in results if isinstance(r, Course)]

        logging.info("fetching curriculum positions for courses")
        tasks = [fetch_curriculum_position(session, course) for course in courses]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        failed = sum(1 for r in results if isinstance(r, Exception))
        if failed:
            logging.warning(f"{failed}/{len(results)} curriculum position fetches failed")
        courses = [r for r in results if isinstance(r, Course)]

        logging.info("done fetching information")
    return courses
