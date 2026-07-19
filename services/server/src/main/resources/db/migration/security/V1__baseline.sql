CREATE TABLE IF NOT EXISTS credentials (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_authorities (
    username TEXT NOT NULL REFERENCES credentials(username) ON DELETE CASCADE,
    authority TEXT NOT NULL,
    PRIMARY KEY (username, authority)
);

CREATE TABLE IF NOT EXISTS student_completed_courses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT NOT NULL REFERENCES credentials(username) ON DELETE CASCADE,
    course_id BIGINT,
    grade NUMERIC(2,1) CHECK (grade >= 0),
    credits INT NOT NULL DEFAULT 0 CHECK (credits >= 0),
    semester_key TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    module_id TEXT,
    module_title TEXT
);

-- Repair schemas created before transcript-import persistence was introduced.
ALTER TABLE student_completed_courses ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE student_completed_courses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed';
ALTER TABLE student_completed_courses ADD COLUMN IF NOT EXISTS module_id TEXT;
ALTER TABLE student_completed_courses ADD COLUMN IF NOT EXISTS module_title TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_completed_course
    ON student_completed_courses (username, course_id)
    WHERE course_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_unmatched_module
    ON student_completed_courses (username, module_id)
    WHERE module_id IS NOT NULL AND course_id IS NULL;

CREATE TABLE IF NOT EXISTS student_enrolled_courses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT NOT NULL REFERENCES credentials(username) ON DELETE CASCADE,
    course_id BIGINT NOT NULL,
    semester_key TEXT,
    UNIQUE (username, course_id)
);

CREATE TABLE IF NOT EXISTS advisor_conversations (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL REFERENCES credentials(username) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS advisor_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES advisor_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    referenced_courses TEXT DEFAULT '[]',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_roadmaps (
    username TEXT PRIMARY KEY REFERENCES credentials(username) ON DELETE CASCADE,
    roadmap_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'EMPTY',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
