import asyncio
import itertools
import re
from xml.etree import ElementTree as ET

import aiohttp

semaphore = asyncio.Semaphore(20)
base_url = "https://campus.tum.de/tumonline/ee/rest/slc.tm.cp/student/courses"


async def fetch_page(session: aiohttp.ClientSession, offset: int, semester_id: int, stepsize: int) -> ET.Element:
    url = f"{base_url}?$filter=termId-eq={semester_id}&$orderBy=title=ascnf&$skip={offset}&$top={stepsize}"
    async with semaphore:
        async with session.get(url) as response:
            assert response.status == 200
            text = await response.text()
            text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", text) #sanitize invalid xml characters
        return ET.fromstring(text)


async def fetch_details(session: aiohttp.ClientSession, course:ET.Element)->tuple[ET.Element,ET.Element]:
    try:
        lecture_id = course.find("id").text
    except AttributeError as e:
        raise AttributeError(f"lecture {course} has no id\n{e}") from e
    async with semaphore:
        async with session.get(f"{base_url}/{lecture_id}") as response:
            assert response.status == 200
            text = await response.text()
            text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", text) #sanitize invalid xml characters
            try:
                resources = ET.fromstring(text).findall("resource")
                assert len(resources) == 1, f"expected exactly one resource for {lecture_id}, got {len(resources)}"
                return course, resources[0]
            except Exception as e:
                raise Exception(f"could not parse {lecture_id} with content:\n{text}") from e

async def fetch_courses(semester_id: int, detailed: bool, debug: bool) -> list[tuple[ET.Element,ET.Element]]:
    stepsize = 20
    async with aiohttp.ClientSession() as session:
        # get first page to get total number of courses
        page = await session.get(f"{base_url}?$filter=termId-eq={semester_id}&$orderBy=title=ascnf&$skip=0")
        xml = ET.fromstring(await page.text())
        total = int(xml.find("totalCount").text)
        print(f"expecting {total} courses{', ignoring because debug is set' if debug else ''}")
        # fetch all courses in parallel
        if debug: total = 20 # only fetch 20 courses for debugging
        tasks = [fetch_page(session, off, semester_id, stepsize) for off in range(0, total, stepsize)]
        courses: list[ET.Element] = await asyncio.gather(*tasks)
        flat = list(itertools.chain(*(map(lambda tree: tree.findall("courses"), courses)))) #flatmap to course elements
        assert len(flat) == total, f"only got {len(courses)} courses of {total}"
        print(f"fetching detailed data for {len(flat)} courses")

        tasks = [fetch_details(session, course) for course in flat]
        result: list[tuple[ET.Element, ET.Element]] = await asyncio.gather(*tasks)
    return result


