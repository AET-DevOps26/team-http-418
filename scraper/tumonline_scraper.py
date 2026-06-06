import asyncio
import itertools
import re
from dataclasses import dataclass
from xml.etree import ElementTree as ET

import aiohttp

semaphore = asyncio.Semaphore(20)
base_url = "https://campus.tum.de/tumonline/ee/rest/slc.tm.cp/student/courses"
base_url_dates = "https://campus.tum.de/tumonline/ee/rest/slc.tm.cp/student/courseGroups/firstGroups"

@dataclass
class SimpleDescription:
    xml: ET.Element
    string_xml: str|None = None

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

async def fetch_page(session: aiohttp.ClientSession, offset: int, semester_id: int, stepsize: int) -> ET.Element:
    url = f"{base_url}?$filter=termId-eq={semester_id}&$orderBy=title=ascnf&$skip={offset}&$top={stepsize}"
    async with semaphore:
        async with session.get(url) as response:
            assert response.status == 200, f"could not fetch courselist page with offset {offset}, got {response.status}\n{url}"
            text = await response.text()
            text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", text) #sanitize invalid xml characters
        return ET.fromstring(text)


async def fetch_details(session: aiohttp.ClientSession, course:ET.Element)->tuple[ET.Element,ET.Element]:
    try:
        lecture_id = course.find("id").text
    except AttributeError as e:
        raise AttributeError(f"lecture {course} has no id\n{e}") from e
    async with semaphore:
        url = f"{base_url}/{lecture_id}"
        async with session.get(url) as response:
            assert response.status == 200, f"could not fetch course details for {lecture_id}, got {response.status}\n{url}"
            text = await response.text()
            text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", text) #sanitize invalid xml characters
            try:
                resources = ET.fromstring(text).findall("resource")
                assert len(resources) == 1, f"expected exactly one resource for {lecture_id}, got {len(resources)}"
                return course, resources[0]
            except Exception as e:
                raise Exception(f"could not parse {lecture_id} with content:\n{text}") from e


async def fetch_dates(session: aiohttp.ClientSession, pair:tuple[ET.Element, ET.Element]):
    try:
        course, detailed = pair
        lecture_id = course.find("id").text
    except AttributeError as e:
        raise AttributeError(f"lecture {pair[0]} has no id\n{e}") from e
    async with semaphore:
        url = f"{base_url_dates}/{lecture_id}"
        async with session.get(url) as response:
            assert response.status == 200, f"could not fetch course dates for {lecture_id}, got {response.status}\n{url}"
            text = await response.text()
            text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", text) #sanitize invalid xml characters
            try:
                dates_xml = ET.fromstring(text)
                return course, detailed, dates_xml
            except Exception as e:
                raise Exception(f"could not parse {lecture_id} with content:\n{text}") from e


async def fetch_courses(semester_id: int, debug: bool) -> list[tuple[ET.Element,ET.Element, ET.Element]]:
    """
    :param debug: if True, only fetch 20 courses for debugging
    :return: a list of triples (course_info, detailed_course_info, dates)
    """
    stepsize = 20
    async with aiohttp.ClientSession() as session:
        # get first page to get total number of courses
        url = f"{base_url}?$filter=termId-eq={semester_id}&$orderBy=title=ascnf&$skip=0"
        page = await session.get(url)
        assert page.status == 200, f"could not fetch first page, got {page.status}\n{url}"
        xml = ET.fromstring(await page.text())
        total = int(xml.find("totalCount").text)
        print(f"expecting {total} courses{', ignoring because debug is set' if debug else ''}")

        # fetch all courses in parallel
        if debug: total = 20 # only fetch 20 courses for debugging
        tasks = [fetch_page(session, off, semester_id, stepsize) for off in range(0, total, stepsize)]
        courses: list[ET.Element] = await asyncio.gather(*tasks)
        flat: list[SimpleDescription] = list(map(lambda x: SimpleDescription(x), itertools.chain(*(map(lambda tree: tree.findall("courses"), courses))))) #flatmap to course elements
        assert len(flat) == total, f"only got {len(courses)} courses of {total}"
        unique = set(flat) # class wrapper is necessary to control comparison
        print(f"got all courses, {len(unique)} of which are unique")

        print(f"fetching detailed data for {len(unique)} courses")
        tasks = [fetch_details(session, course.xml) for course in unique]
        detail_pairs: list[tuple[ET.Element, ET.Element]] = await asyncio.gather(*tasks)
        print("fetching dates for courses")

        tasks = [fetch_dates(session, pair) for pair in detail_pairs]
        complete_course_info: list[tuple[ET.Element, ET.Element, ET.Element]] = await asyncio.gather(*tasks)

        print("done fetching information")
    return complete_course_info


