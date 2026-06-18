import json
import logging
import os

import asyncpg

from tumonline_scraper import Course
from xml_parser import date_at, find_or, int_at, lang_text, parse_curriculum_positions, text_at, time_at, xml_string

DB_NAME = os.environ["COURSES_DB_NAME"]
DB_USER = os.environ["DB_USER"]
DB_PASS = os.environ["DB_PASS"]
DB_HOST = os.environ["DB_HOST"]
DB_PORT = os.environ["DB_PORT"]


class DB:
    conn: asyncpg.Connection
    debug: bool

    def __init__(self, debug: bool = False):
        self.debug = debug

    @classmethod
    async def create_instance(cls, debug: bool = False, clean: bool = False):
        """
        :param debug: process only first page of courses and reset db
        :param clean: reset db
        :return:
        """
        instance = cls(debug)
        await instance.setup_database(clean)
        await instance.create_connection()  # must be after setup
        await instance.init_tables()
        return instance

    # noinspection PyUnresolvedReferences
    async def create_connection(self):
        self.conn = await asyncpg.connect(  # is marked as not async but it is
            user=DB_USER, password=DB_PASS, database=DB_NAME, host=DB_HOST, port=DB_PORT
        )

    async def close_connection(self):
        await self.conn.close()

    async def setup_database(self, clean: bool = False):
        """
        creates the database if it doesn't exist.
        If DEBUG or clean is True, it drops the existing database first.
        """
        admin_conn = await asyncpg.connect(
            user=DB_USER, password=DB_PASS, database="postgres", host=DB_HOST, port=DB_PORT
        )

        if self.debug or clean:
            logging.info(f"DEBUG mode: Dropping database {DB_NAME} if it exists")

            await admin_conn.execute(  # force disconnect all connections to the database
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
            logging.info(f"Creating database {DB_NAME}...")
            await admin_conn.execute(f'CREATE DATABASE "{DB_NAME}"')
        else:
            logging.info(f"Database {DB_NAME} already exists.")

        await admin_conn.close()

    async def init_tables(self):
        """
        Initializes the database tables.
        """
        async with self.conn.transaction():
            # semesters table
            await self.conn.execute("""
                                    CREATE TABLE if not exists semesters
                                    (
                                        id                  INT PRIMARY KEY, -- e.g. 206
                                        --tum_id            INT UNIQUE ,
                                        semester_key        TEXT NOT NULL,-- UNIQUE, -- e.g. 26S using unique here causes race conditions on insert for some reason
                                        academic_year_id    INT,
                                        semester_type       TEXT,            -- S, W, etc.
                                        designation_default TEXT,
                                        start_date          DATE,
                                        end_date            DATE
                                    );
                                    """)
            # course types table
            await self.conn.execute("""
                                    CREATE TABLE if not exists course_types
                                    (
                                        id   BIGINT PRIMARY KEY,
                                        --tum_id           BIGINT UNIQUE,
                                        key  TEXT NOT NULL UNIQUE, -- VO, SE, UE, PR, FO
                                        name TEXT                  -- Seminar ...
                                    )
                                    """)
            # persons table
            await self.conn.execute("""
                                    CREATE TABLE if not exists persons
                                    (
                                        id                BIGINT PRIMARY KEY, -- identityLibDto.id
                                        person_id         BIGINT,             -- probably the same as id
                                        -- obfuscated_key      TEXT UNIQUE,
                                        first_name        TEXT,
                                        last_name         TEXT,
                                        --gender              TEXT,
                                        --gender_nr_for_title INTEGER,
                                        business_card_url TEXT
                                    )
                                    """)
            # organizations table
            await self.conn.execute("""
                                    CREATE TABLE IF NOT EXISTS organizations
                                    (
                                        id                  BIGINT PRIMARY KEY,
                                        identification_name TEXT UNIQUE, -- e.g. TUS1313
                                        name_ger            TEXT,
                                        name_en             TEXT,
                                        parent_id           BIGINT,
                                        --hierarchy_type_id   BIGINT,
                                        org_page_url        TEXT,

                                        FOREIGN KEY (parent_id) REFERENCES organizations (id)
                                    )
                                    """)
            # course table
            await self.conn.execute("""
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
                                        sws                        INT,  --semester weekly hours
                                        --dates                      DATE, -- dates are stored in course_appointments
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

                                        raw_source_simple          XML,  -- optional: store original parsed XML
                                        raw_source_detailed        XML,  -- optional: store original parsed XML
                                        created_at                 TIMESTAMP DEFAULT now(),
                                        updated_at                 TIMESTAMP DEFAULT now()
                                    );
                                    """)
            # lectureship table
            await self.conn.execute("""
                                    CREATE TABLE if not exists lectureship
                                    (
                                        id                BIGINT PRIMARY KEY,
                                        course_id         BIGINT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
                                        person_id         BIGINT NOT NULL REFERENCES persons (id),
                                        teaching_function TEXT
                                        --sort_order           INTEGER,

                                    )
                                    """)
            # course appointment table
            await self.conn.execute("""
                                    CREATE TABLE IF NOT EXISTS course_appointments
                                    (
                                        id              BIGINT PRIMARY KEY,
                                        course_id       BIGINT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
                                        weekday_key     TEXT,
                                        time_from       TIME,
                                        time_to         TIME,
                                        place           TEXT,
                                        is_series       BOOLEAN   DEFAULT false,
                                        updated_at      TIMESTAMP DEFAULT now()
                                    )
                                    """)

            # curriculum connections table
            await self.conn.execute("""
                                    CREATE TABLE IF NOT EXISTS curriculum_connections
                                    (
                                        id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                        course_id             BIGINT NOT NULL REFERENCES courses (id) ON DELETE CASCADE, -- e.g. 950938055
                                        curriculum_version_id INT, -- e.g. 5372
                                        study_name_ger        TEXT, -- e.g. Microelectronics and Chip Design
                                        study_name_en         TEXT,
                                        study_id              TEXT NOT NULL, -- e.g. 522
                                        designation           BIGINT, -- e.g. 20251 not sure what this is for, probably links to study in a different way
                                        subject_type          TEXT, -- Pflichtfach/Wahlfach/Null
                                        path                  JSONB, -- hierarchy of position in curriculum
                                        source_xml            XML,
                                        updated_at            TIMESTAMP DEFAULT now(),
                                        UNIQUE (course_id, study_id)
                                    )
                                    """)


def build_import_batch(courses_input: list[Course]) -> dict:
    semesters = {}
    course_types = {}
    parent_org_ids = set()
    organizations = {}
    persons = {}
    courses = {}
    lectureships = {}
    course_appointments = {}
    curriculum_connections: list[dict] = []

    for course in courses_input:
        simple_course_info, detailed_course_info_resource, dates, curriculum_positions = (
            course.simple_xml,
            course.detailed_xml,
            course.dates_xml,
            course.curriculum_positions_xml,
        )

        detail_root = detailed_course_info_resource.find(".//cpCourseDetailDto")
        detailed_course = find_or(detail_root, "cpCourseDto", simple_course_info)
        description = find_or(detail_root, "cpCourseDescriptionDto")

        course_id = int_at(simple_course_info, "id") or int_at(detailed_course, "id")
        assert course_id not in courses, f"Duplicate course id: {course_id}"
        if course_id is None:
            raise ValueError("Missing required course id")

        semester = find_or(simple_course_info, "semesterDto") or find_or(detailed_course, "semesterDto")
        course_type = find_or(simple_course_info, "courseTypeDto") or find_or(detailed_course, "courseTypeDto")
        org = find_or(detailed_course, "organisationResponsibleDto")

        semester_id = int_at(semester, "id")
        course_type_id = int_at(course_type, "id")
        organization_id = int_at(org, "id")

        if semester_id is not None:
            semester_key = text_at(semester, "key")
            semesters[semester_key] = (
                semester_id,
                semester_key,
                int_at(semester, "academicYearId"),
                text_at(semester, "semesterType"),
                text_at(semester, "semesterDesignation/value"),
                date_at(semester, "startOfAcademicSemester/value"),
                date_at(semester, "endOfAcademicSemester/value"),
            )

        if course_type_id is not None:
            course_type_key = text_at(course_type, "key")
            course_types[course_type_key] = (
                course_type_id,
                course_type_key,
                lang_text(course_type, "courseTypeName", "en")
                or lang_text(course_type, "courseTypeName", "de")
                or text_at(course_type, "courseTypeName/value"),
            )

        if org is not None and organization_id is not None:
            parent_id = int_at(org, "parentOrganisationId")
            if parent_id is not None:
                parent_org_ids.add(parent_id)

            org_page = None
            org_page_link = org.find("orgPageLink")
            if org_page_link is not None:
                org_page = org_page_link.attrib.get("href")

            organizations[organization_id] = (
                organization_id,
                text_at(org, "identificationName"),
                lang_text(org, "name", "de"),
                lang_text(org, "name", "en"),
                parent_id,
                org_page,
            )

        # Course appointment dates.
        if dates is not None:
            # First collect series ids so we can ignore appointmentDtos that belong to a series.
            appointment_series_ids = {
                int_at(series, "id")
                for series in dates.findall(".//appointmentSeriesDtos")
                if int_at(series, "id") is not None
            }

            # Store one row per appointment series.
            for series in dates.findall(".//appointmentSeriesDtos"):
                series_id = int_at(series, "id")
                if series_id is None:
                    continue

                # Use negative ids only if your table id can safely be synthetic.
                # Better: add a separate source_type column, but this is the minimal version.
                appointment_id = -series_id

                course_appointments[appointment_id] = (
                    appointment_id,
                    course_id,
                    text_at(series, "weekday/key"),
                    time_at(series, "seriesBeginTime"),
                    time_at(series, "seriesEndTime"),
                    text_at(series, "resourceName"),
                    True,
                )

            # Store only standalone appointments, i.e. appointments not covered by a series.
            for appointment in dates.findall(".//appointmentDtos"):
                appointment_id = int_at(appointment, "id")
                if appointment_id is None:
                    continue

                series_id = int_at(appointment, "appointmentSeriesId")
                if series_id in appointment_series_ids:
                    continue

                appointment_course_id = int_at(appointment, "courseGroupDto/courseId") or course_id

                course_appointments[appointment_id] = (
                    appointment_id,
                    appointment_course_id,
                    text_at(appointment, "weekday/key"),
                    time_at(appointment, "timestampFrom/value"),
                    time_at(appointment, "timestampTo/value"),
                    text_at(appointment, "resourceName"),
                    False,
                )

        courses[course_id] = (
            course_id,
            semester_id,
            course_type_id,
            organization_id,
            lang_text(detailed_course, "courseTitle", "de") or lang_text(simple_course_info, "courseTitle", "de"),
            lang_text(detailed_course, "courseTitle", "en") or lang_text(simple_course_info, "courseTitle", "en"),
            int_at(detailed_course, "identityCodeId") or int_at(simple_course_info, "identityCodeId"),
            int_at(detailed_course, "courseNormConfigs[key='SST']/value")
            or int_at(simple_course_info, "courseNormConfigs[key='SST']/value"),
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
                or lang_text(detailed_course, "registrationInfo", "en")  # registration open/closed, not really useful
                or lang_text(detailed_course, "registrationInfo", "de")  # registration open/closed, not really useful
                or lang_text(
                    simple_course_info, "registrationInfo", "en"
                )  # registration open/closed, not really useful
                or lang_text(
                    simple_course_info, "registrationInfo", "de"
                )  # registration open/closed, not really useful
            ),
            xml_string(simple_course_info),
            xml_string(detailed_course_info_resource),
        )

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

            persons[person_id] = (
                person_id,
                int_at(person, "personId"),
                text_at(person, "firstName"),
                text_at(person, "lastName"),
                business_card_url,
            )

            teaching_function = text_at(lectureship, "teachingFunction/name") or text_at(
                lectureship, "teachingFunction/key"
            )

            # Deduplicate by your logical unique constraint.
            lectureships[(course_id, person_id, teaching_function)] = (
                lectureship_id,
                course_id,
                person_id,
                teaching_function,
            )

        curriculum_connections += parse_curriculum_positions(curriculum_positions, course_id)

    return {
        "semesters": list(semesters.values()),
        "course_types": list(course_types.values()),
        "parent_org_ids": [(org_id,) for org_id in parent_org_ids],
        "organizations": list(organizations.values()),
        "persons": list(persons.values()),
        "courses": list(courses.values()),
        "lectureships": list(lectureships.values()),
        "course_appointments": list(course_appointments.values()),
        "curriculum_connections": [
            (
                c["course_id"],
                c["curriculum_version_id"],
                c["study_name_ger"],
                c["study_name_en"],
                c["study_id"],
                c["designation"],
                c["subject_type"],
                json.dumps(c["path"]),
                c["source_xml"],
            )
            for c in curriculum_connections
        ],
    }


async def bulk_update_database(conn: asyncpg.Connection, batch: dict) -> None:
    await conn.executemany(
        """
        INSERT INTO semesters (id,
                               semester_key,
                               academic_year_id,
                               semester_type,
                               designation_default,
                               start_date,
                               end_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET academic_year_id    = EXCLUDED.academic_year_id,
                                       semester_type       = EXCLUDED.semester_type,
                                       designation_default = EXCLUDED.designation_default,
                                       start_date          = EXCLUDED.start_date,
                                       end_date            = EXCLUDED.end_date
        WHERE semesters.id = EXCLUDED.id
        """,
        batch["semesters"],
    )

    await conn.executemany(
        """
        INSERT INTO course_types (id, key, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name
        WHERE course_types.id = EXCLUDED.id
        """,
        batch["course_types"],
    )

    await conn.executemany(
        """
        INSERT INTO organizations (id)
        VALUES ($1)
        ON CONFLICT (id) DO NOTHING
        """,
        batch["parent_org_ids"],  # todo add more information about parent orgs, e.g. name
    )

    await conn.executemany(
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
        batch["organizations"],
    )

    await conn.executemany(
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
        batch["persons"],
    )

    await conn.executemany(
        """
        INSERT INTO courses (id,
                             semester_id,
                             course_type_id,
                             organization_id,
                             title_ger,
                             title_en,
                             identity_code_id,
                             sws,
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
                $18, $19, $20::xml, $21::xml,
                now())
        ON CONFLICT (id) DO UPDATE SET semester_id                = EXCLUDED.semester_id,
                                       course_type_id             = EXCLUDED.course_type_id,
                                       organization_id            = EXCLUDED.organization_id,
                                       title_ger                  = EXCLUDED.title_ger,
                                       title_en                   = EXCLUDED.title_en,
                                       identity_code_id           = EXCLUDED.identity_code_id,
                                       sws                        = EXCLUDED.sws,
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
        batch["courses"],
    )

    await conn.executemany(
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
        batch["lectureships"],
    )

    await conn.executemany(
        """
        INSERT INTO course_appointments (
            id,
            course_id,
            weekday_key,
            time_from,
            time_to,
            place,
            is_series,
            updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, now())
        ON CONFLICT (id) DO UPDATE SET
                                       course_id = EXCLUDED.course_id,
                                       weekday_key = EXCLUDED.weekday_key,
                                       time_from = EXCLUDED.time_from,
                                       time_to = EXCLUDED.time_to,
                                       place = EXCLUDED.place,
                                       is_series = EXCLUDED.is_series,
                                       updated_at = now()
        """,
        batch["course_appointments"],
    )

    await conn.executemany(
        """
        INSERT INTO curriculum_connections (
            course_id,
            curriculum_version_id,
            study_name_ger,
            study_name_en,
            study_id,
            designation,
            subject_type,
            path,
            source_xml,
            updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::xml, now())
        ON CONFLICT (course_id, study_id) DO UPDATE SET
                                       course_id = EXCLUDED.course_id,
                                       curriculum_version_id = EXCLUDED.curriculum_version_id,
                                       study_name_ger = EXCLUDED.study_name_ger,
                                       study_name_en = EXCLUDED.study_name_en,
                                       study_id = EXCLUDED.study_id,
                                       designation = EXCLUDED.designation,
                                       subject_type = EXCLUDED.subject_type,
                                       path = EXCLUDED.path,
                                       source_xml = EXCLUDED.source_xml,
                                       updated_at = now()
        """,
        batch["curriculum_connections"],
    )
