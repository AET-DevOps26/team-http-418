import asyncio
from xml.etree import ElementTree as ET
import asyncpg
from xml_parser import find_or, int_at, text_at, date_at, lang_text, xml_string

class AsyncAtomicInt:
    def __init__(self, value=0):
        self.value = value
        self.lock = asyncio.Lock()

    async def increment(self, amount=1):
        async with self.lock:
            self.value += amount
            return self.value

DB_NAME = "aidan"
DB_USER = "postgres"
DB_PASS = "postgres"
DB_HOST = "localhost"
DB_PORT = "5432"


class DB:
    conn: asyncpg.Connection
    debug: bool

    def __init__(self, debug: bool = False):
        self.debug = debug

    @classmethod
    async def create_instance(cls, debug: bool = False):
        instance = cls(debug)
        await instance.setup_database()
        await instance.create_connection() #must be after setup
        await instance.init_tables()
        return instance

    # noinspection PyUnresolvedReferences
    async def create_connection(self):
        self.conn = await asyncpg.connect( # is marked as not async but it is
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            host=DB_HOST
        )

    async def setup_database(self):
        """
        creates the database if it doesn't exist.
        If DEBUG is True, it drops the existing database first.
        """
        admin_conn = await asyncpg.connect(
            user=DB_USER,
            password=DB_PASS,
            database="postgres",
            host=DB_HOST,
        )

        if self.debug:
            print(f"DEBUG mode: Dropping database {DB_NAME} if it exists")

            await admin_conn.execute( #force disconnect all connections to the database
                """
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = $1
                  AND pid <> pg_backend_pid()
                """,
                DB_NAME,
            )

            await admin_conn.execute(f'DROP DATABASE IF EXISTS "{DB_NAME}"')

        exists = await admin_conn.fetchval(
            """
            SELECT 1
            FROM pg_catalog.pg_database
            WHERE datname = $1
            """,
            DB_NAME,
        )

        if not exists:
            print(f"Creating database {DB_NAME}...")
            await admin_conn.execute(f'CREATE DATABASE "{DB_NAME}"')
        else:
            print(f"Database {DB_NAME} already exists.")

        await admin_conn.close()

    async def init_tables(self):
        """
        Initializes the database tables.
        """
        async with self.conn.transaction():
            # semesters table
            await self.conn.execute('''
                               CREATE TABLE if not exists semesters
                               (
                                   id                  INT PRIMARY KEY,      -- e.g. 206
                                   --tum_id            INT UNIQUE ,                       
                                   semester_key        TEXT NOT NULL,-- UNIQUE, -- e.g. 26S using unique here causes race conditions on insert for some reason
                                   academic_year_id    INT,
                                   semester_type       TEXT,                 -- S, W, etc.
                                   designation_default TEXT,
                                   start_date          DATE,
                                   end_date            DATE
                               );
                               ''')
            # course types table
            await self.conn.execute('''
                               CREATE TABLE if not exists course_types
                               (
                                   id           BIGINT PRIMARY KEY,
                                   --tum_id           BIGINT UNIQUE,
                                   key          TEXT NOT NULL UNIQUE, -- VO, SE, UE, PR, FO
                                   name         TEXT                  -- Seminar ...
                               )
                               ''')
            # persons table
            await self.conn.execute('''
                               CREATE TABLE if not exists persons
                               (
                                   id                  BIGINT PRIMARY KEY, -- identityLibDto.id
                                   person_id           BIGINT,             -- probably the same as id
                                  -- obfuscated_key      TEXT UNIQUE,        
                                   first_name          TEXT,
                                   last_name           TEXT,
                                   --gender              TEXT,
                                   --gender_nr_for_title INTEGER,
                                   business_card_url   TEXT
                               )
                               ''')
            # organizations table
            await self.conn.execute('''
                               CREATE TABLE IF NOT EXISTS organizations
                               (
                                   id                  BIGINT PRIMARY KEY,
                                   identification_name TEXT UNIQUE, -- e.g. TUS1313
                                   name_ger            TEXT,
                                   name_en             TEXT,
                                   parent_id           BIGINT,
                                   --hierarchy_type_id   BIGINT,
                                   org_page_url        TEXT,

                                   FOREIGN KEY (parent_id) REFERENCES organizations(id)
                               )
                               ''')
            # course table
            await self.conn.execute('''
                               CREATE TABLE if not exists courses
                               (
                                   id                         BIGINT PRIMARY KEY,
                                   --tum_id            BIGINT UNIQUE,
                                   semester_id                BIGINT REFERENCES semesters (id),
                                   course_type_id             BIGINT REFERENCES course_types (id),
                                   organization_id            BIGINT REFERENCES organizations (id),

                                   title_ger                  TEXT,
                                   title_en                   TEXT,
                                   identity_code_id           BIGINT,
                                   sws                        INT, --semester weekly hours
                                   dates                      DATE, --todo maybe use string here
                                   description_ger            TEXT,
                                   description_en             TEXT,
                                   previous_knowledge_ger     TEXT,
                                   previous_knowledge_en      TEXT,

                                   course_objective_ger       TEXT,
                                   course_objective_en        TEXT,

                                   recommended_literature_ger TEXT,
                                   recommended_literature_en  TEXT,
                                   teaching_method_ger        TEXT,
                                   teaching_method_en         TEXT,
                                   ---------------------
                                   --registration_available           BOOLEAN, 
                                   registration_info          TEXT,

                                   raw_source_simple          XML, -- optional: store original parsed XML
                                   raw_source_detailed        XML, -- optional: store original parsed XML
                                   created_at                 TIMESTAMP DEFAULT now(),
                                   updated_at                 TIMESTAMP DEFAULT now()
                               );
                               ''')
            # lectureship table
            await self.conn.execute('''
                               CREATE TABLE if not exists lectureship
                               (
                                   id                   BIGINT PRIMARY KEY,
                                   course_id            BIGINT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
                                   person_id            BIGINT NOT NULL REFERENCES persons (id),
                                   teaching_function    TEXT
                                   --sort_order           INTEGER,

                               )
                               ''')

counter = AsyncAtomicInt(0)

async def update_database(conn: asyncpg.Connection, data: tuple[ET.Element, ET.Element]) -> None:
    simple_course_info, detailed_course_info_resource = data

    detail_root = detailed_course_info_resource.find(".//cpCourseDetailDto")
    detailed_course = find_or(detail_root, "cpCourseDto", simple_course_info)
    description = find_or(detail_root, "cpCourseDescriptionDto")

    course_id = int_at(simple_course_info, "id") or int_at(detailed_course, "id")
    if course_id is None:
        raise ValueError("Missing required course id")

    semester = find_or(simple_course_info, "semesterDto") or find_or(detailed_course, "semesterDto")
    course_type = find_or(simple_course_info, "courseTypeDto") or find_or(detailed_course, "courseTypeDto")
    org = find_or(detailed_course, "organisationResponsibleDto")

    semester_id = int_at(semester, "id")
    course_type_id = int_at(course_type, "id")
    organization_id = int_at(org, "id")

    course_dates = None  # TODO

    async with conn.transaction():
        # semesters
        if semester_id is not None:
            try:
                await conn.execute(
                    """
                    INSERT INTO semesters (id,
                                           semester_key,
                                           academic_year_id,
                                           semester_type,
                                           designation_default,
                                           start_date,
                                           end_date)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (id) DO UPDATE SET semester_key        = EXCLUDED.semester_key,
                                                   academic_year_id    = EXCLUDED.academic_year_id,
                                                   semester_type       = EXCLUDED.semester_type,
                                                   designation_default = EXCLUDED.designation_default,
                                                   start_date          = EXCLUDED.start_date,
                                                   end_date            = EXCLUDED.end_date
                    """,
                    semester_id,
                    text_at(semester, "key"),
                    int_at(semester, "academicYearId"),
                    text_at(semester, "semesterType"),
                    text_at(semester, "semesterDesignation/value"),
                    date_at(semester, "startOfAcademicSemester/value"),
                    date_at(semester, "endOfAcademicSemester/value"),
                )
            except asyncpg.UniqueViolationError as e:
                raise ValueError(f"Semester with key {text_at(semester, 'key')} already exists. newid={semester_id}") from e
        # course_types
        if course_type_id is not None:
            await conn.execute(
                """
                INSERT INTO course_types (id,
                                          key,
                                          name)
                VALUES ($1, $2, $3)
                ON CONFLICT (id) DO UPDATE SET key  = EXCLUDED.key,
                                               name = EXCLUDED.name
                """,
                course_type_id,
                text_at(course_type, "key"),
                lang_text(course_type, "courseTypeName", "en")
                or lang_text(course_type, "courseTypeName", "de")
                or text_at(course_type, "courseTypeName/value"),
            )

        # organizations
        if org is not None and organization_id is not None:
            parent_id = int_at(org, "parentOrganisationId")

            # Avoid Foreign Key failure when only child org is included in the API response.
            if parent_id is not None:
                await conn.execute(
                    """
                    INSERT INTO organizations (id)
                    VALUES ($1)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    parent_id,
                )

            org_page = None
            org_page_link = org.find("orgPageLink")
            if org_page_link is not None:
                org_page = org_page_link.attrib.get("href")

            await conn.execute(
                """
                INSERT INTO organizations (id,
                                           identification_name,
                                           name_ger,
                                           name_en,
                                           parent_id,
                                           org_page_url)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE SET identification_name = EXCLUDED.identification_name,
                                               name_ger            = EXCLUDED.name_ger,
                                               name_en             = EXCLUDED.name_en,
                                               parent_id           = EXCLUDED.parent_id,
                                               org_page_url        = EXCLUDED.org_page_url
                """,
                organization_id,
                text_at(org, "identificationName"),
                lang_text(org, "name", "de"),
                lang_text(org, "name", "en"),
                parent_id,
                org_page,
            )

        # courses
        await conn.execute(
            """
            INSERT INTO courses (id,
                                 semester_id,
                                 course_type_id,
                                 organization_id,
                                 title_ger,
                                 title_en,
                                 identity_code_id,
                                 sws,
                                 dates,
                                 description_ger,
                                 description_en,
                                 previous_knowledge_ger,
                                 previous_knowledge_en,
                                 course_objective_ger,
                                 course_objective_en,
                                 recommended_literature_ger,
                                 recommended_literature_en,
                                 teaching_method_ger,
                                 teaching_method_en,
                                 registration_info,
                                 raw_source_simple,
                                 raw_source_detailed,
                                 updated_at)
            VALUES ($1, $2, $3, $4,
                    $5, $6, $7, $8, $9,
                    $10, $11, $12, $13,
                    $14, $15, $16, $17,
                    $18, $19, $20,
                    $21::xml, $22::xml,
                    now())
            ON CONFLICT (id) DO UPDATE SET semester_id                = EXCLUDED.semester_id,
                                           course_type_id             = EXCLUDED.course_type_id,
                                           organization_id            = EXCLUDED.organization_id,
                                           title_ger                  = EXCLUDED.title_ger,
                                           title_en                   = EXCLUDED.title_en,
                                           identity_code_id           = EXCLUDED.identity_code_id,
                                           sws                        = EXCLUDED.sws,
                                           dates                      = EXCLUDED.dates,
                                           description_ger            = EXCLUDED.description_ger,
                                           description_en             = EXCLUDED.description_en,
                                           previous_knowledge_ger     = EXCLUDED.previous_knowledge_ger,
                                           previous_knowledge_en      = EXCLUDED.previous_knowledge_en,
                                           course_objective_ger       = EXCLUDED.course_objective_ger,
                                           course_objective_en        = EXCLUDED.course_objective_en,
                                           recommended_literature_ger = EXCLUDED.recommended_literature_ger,
                                           recommended_literature_en  = EXCLUDED.recommended_literature_en,
                                           teaching_method_ger        = EXCLUDED.teaching_method_ger,
                                           teaching_method_en         = EXCLUDED.teaching_method_en,
                                           registration_info          = EXCLUDED.registration_info,
                                           raw_source_simple          = EXCLUDED.raw_source_simple,
                                           raw_source_detailed        = EXCLUDED.raw_source_detailed,
                                           updated_at                 = now()
            """,
            course_id,
            semester_id,
            course_type_id,
            organization_id,
            lang_text(detailed_course, "courseTitle", "de") or lang_text(simple_course_info, "courseTitle", "de"),
            lang_text(detailed_course, "courseTitle", "en") or lang_text(simple_course_info, "courseTitle", "en"),
            int_at(detailed_course, "identityCodeId") or int_at(simple_course_info, "identityCodeId"),
            int_at(detailed_course, "courseNormConfigs[key='SST']/value")
            or int_at(simple_course_info, "courseNormConfigs[key='SST']/value"),
            course_dates,
            lang_text(description, "courseContent", "de"),
            lang_text(description, "courseContent", "en"),
            lang_text(description, "previousKnowledge", "de"),
            lang_text(description, "previousKnowledge", "en"),
            lang_text(description, "courseObjective", "de"),
            lang_text(description, "courseObjective", "en"),
            lang_text(description, "additionalInformation/recommendedLiterature", "de"),
            lang_text(description, "additionalInformation/recommendedLiterature", "en"),
            lang_text(description, "teachingMethod", "de"),
            lang_text(description, "teachingMethod", "en"),
            (
                    lang_text(description, "courseRegistrationInfo", "en")
                    or lang_text(description, "courseRegistrationInfo", "de")
                    or lang_text(detailed_course, "registrationInfo", "en")
                    or lang_text(detailed_course, "registrationInfo", "de")
                    or lang_text(simple_course_info, "registrationInfo", "en")
                    or lang_text(simple_course_info, "registrationInfo", "de")
            ),
            xml_string(simple_course_info),
            xml_string(detailed_course_info_resource),
        )

        # persons + lectureship
        # Prefer detailed_course because it can include the same lecturer structure
        # but with unescaped Unicode already parsed.
        lectureships_parent = detailed_course if detailed_course is not None else simple_course_info

        for lectureship in lectureships_parent.findall("lectureships"):
            lectureship_id = int_at(lectureship, "id")
            person = lectureship.find("identityLibDto")
            person_id = int_at(person, "id")

            if lectureship_id is None or person_id is None:
                continue

            business_card_url = None
            business_card = person.find("businessCardLink") if person is not None else None
            if business_card is not None:
                business_card_url = business_card.attrib.get("href")

            await conn.execute(
                """
                INSERT INTO persons (id,
                                     person_id,
                                     first_name,
                                     last_name,
                                     business_card_url)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO UPDATE SET person_id         = EXCLUDED.person_id,
                                               first_name        = EXCLUDED.first_name,
                                               last_name         = EXCLUDED.last_name,
                                               business_card_url = EXCLUDED.business_card_url
                """,
                person_id,
                int_at(person, "personId"),
                text_at(person, "firstName"),
                text_at(person, "lastName"),
                business_card_url,
            )

            await conn.execute(
                """
                INSERT INTO lectureship (id,
                                         course_id,
                                         person_id,
                                         teaching_function)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO UPDATE SET course_id         = EXCLUDED.course_id,
                                               person_id         = EXCLUDED.person_id,
                                               teaching_function = EXCLUDED.teaching_function
                """,
                lectureship_id,
                course_id,
                person_id,
                text_at(lectureship, "teachingFunction/name")
                or text_at(lectureship, "teachingFunction/key"),
            )
    print(f"\rcompleted {await counter.increment()} courses", end="", flush=True)