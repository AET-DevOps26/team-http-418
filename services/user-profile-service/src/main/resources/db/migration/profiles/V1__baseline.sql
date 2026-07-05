CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    student TEXT NOT NULL,
    completed_courses TEXT NOT NULL,
    enrolled_courses TEXT NOT NULL,
    available_courses TEXT NOT NULL,
    "limit" INT NOT NULL,
    category TEXT,
    semester TEXT
);
