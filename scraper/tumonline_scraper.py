import asyncio
import itertools
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
            return ET.fromstring(text)


async def fetch_lectures(semester_id: int, debug: bool) -> list[ET.Element]:
    stepsize = 20
    async with aiohttp.ClientSession() as session:
        # get first page to get total number of lectures
        page = await session.get(f"{base_url}?$filter=termId-eq={semester_id}&$orderBy=title=ascnf&$skip=0")
        xml = ET.fromstring(await page.text())
        total = int(xml.find("totalCount").text)
        print(f"expecting {total} lectures")
        # fetch all lectures in parallel
        if debug: total = 20 # only fetch 20 lectures for debugging
        tasks = [fetch_page(session, off, semester_id, stepsize) for off in range(0, total, stepsize)]
        lectures: list[ET.Element] = await asyncio.gather(*tasks)
    flat = list(itertools.chain(*(map(lambda tree: tree.findall("courses"), lectures)))) #flatmap to course elements
    assert len(flat) == total, f"only got {len(lectures)} lectures of {total}"
    return flat
