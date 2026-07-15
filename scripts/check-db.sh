#!/bin/bash
docker exec dashboard-data-widgets-db-1 psql -U postgres -d security -c "SELECT id, course_id, status, module_id FROM student_completed_courses ORDER BY id"
