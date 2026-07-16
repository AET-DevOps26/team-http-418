# team-http-418

## AI-Driven Academic Navigator (AIDAN)

### Problem Statement

TUM students need clear, personalized guidance to navigate complex course catalogs and align their academic choices with their long-term career goals. Existing traditional advising and course selection methods are overwhelming, lack continuous support, and often focus purely on fulfilling credit quotas rather than building the specific skill sets required for a student's desired industry or future projects.

There is a critical need for an intelligent application that analyzes a student’s academic history and future aspirations to recommend the most efficient course selection. While TUM provides comprehensive course descriptions, these are currently buried within a student's specific study degree, causing students to miss out on valuable interdisciplinary options. Furthermore, existing university systems are highly fragmented, often, a central system lacks essential course information entirely, forcing students to hunt down details across individual chair websites. The app will overcome these limitations by seamlessly integrating the entire university catalog into a single, centralized platform, enabling users to search for relevant courses on any topic while intelligently mapping out prerequisite dependencies and credit requirements.

The app should provide smart mapping and personalized recommendations based on career interests and individual user preferences. Acting as a bridge between academia and the professional world, this centralized system allows students to make faster, more informed decisions, preventing wasted tuition, delayed graduation, and registration errors. By offering a clear, interactive roadmap, the system optimizes credit fulfillment, bridges the skills gap, and empowers students to confidently take control of their academic journey.

### User Stories

**1. Academic Tracking:** As a student, I want to upload or sync my completed course transcript, so that the system can automatically track my fulfilled credits and identify my remaining degree requirements.

**2. Profile & Recommendations:** As a student, I want to receive personalized course recommendations based on my completed modules, career goals, and interests, so that I can choose electives that strategically align with my future plans.

**3. Centralized Search:** As a student, I want to search and filter the entire TUM catalog in one centralized platform that merges main university data with individual chair websites, so that I can easily find interdisciplinary options without navigating fragmented systems.

**4. Prerequisite Mapping:** As a student, I want to clearly see course prerequisite dependencies and receive proactive alerts for unmet requirements, so that I understand what I need to complete beforehand and avoid registration errors.

**5. Pathway Visualization:** As a student, I want to view my recommended course pathway as a clear, interactive semester-by-semester roadmap, so that I can confidently track my progress toward graduation.


### Product Backlog

| ID | Name | Priority | Rationale |
| :--- | :--- | :--- | :--- |
| **AIDAN 1** | Academic Tracking | `Critical` | Foundational feature. The system cannot make accurate recommendations or map prerequisites without first knowing the user's completed credits. |
| **AIDAN 2** | Centralized Search | `Critical` | Core functionality. Without integrating the university catalog and chair data, the app has no database to pull courses from. |
| **AIDAN 3** | Profile | `Major` | Captures the student's long-term career goals and academic interests. This data input is required to tailor the app to the individual rather than providing generic suggestions. |
| **AIDAN 4** | Recommendations | `Major` | The core value proposition of the app. It synthesizes data from Academic Tracking (AIDAN 1), Centralized Search (AIDAN 2), and the Profile (AIDAN 3) to generate intelligent, personalized course suggestions. |
| **AIDAN 5** | Pathway Visualization | `Major` | The primary UI/UX output for the user to consume the app's core value (the interactive semester-by-semester roadmap). |
| **AIDAN 6** | Prerequisite Mapping | `Minor` | Essential for ensuring the recommendations are actually usable and prevent registration errors. |

---

### Initial System Structure

The application follows a modern, decoupled client-server architecture with a dedicated microservice for AI processing. This separation of concerns ensures scalability, maintainability, and optimal performance across different technological domains. The system is divided into the following core components:

#### Client: React (Vite + TanStack Router) Frontend
The user interface is built as a Single Page Application (SPA) using React, providing a highly responsive and dynamic experience for students navigating complex course maps.
*   **Vite** is utilized as the build tool to guarantee lightning-fast server starts and Hot Module Replacement (HMR) during development, as well as highly optimized static assets for production.
*   **TanStack Router** is implemented for robust, type-safe routing. This is critical for managing the application's complex nested views (e.g., navigating between interactive semester roadmaps, centralized search, and user profile settings) while maintaining a reliable UI state.

#### Server: Spring Boot REST API
The core business logic, user management, and data orchestration are handled by a Spring Boot backend.
*   This server acts as the primary API gateway for the React client, exposing secure, well-documented RESTful endpoints.
*   It handles traditional backend responsibilities such as authentication, data validation, and CRUD operations. Furthermore, it acts as an orchestrator, securely routing complex analytical requests to the GenAI microservice and aggregating the results before sending them back to the client.

#### GenAI Service: Python & LangChain Microservice
To isolate heavy computational tasks and leverage the best ecosystem for artificial intelligence, all AI-driven features (such as smart course recommendations and prerequisite mapping) are offloaded to a dedicated Python microservice.
*   **LangChain** is used to orchestrate interactions with the underlying Large Language Models (LLMs), allowing the system to intelligently parse unstructured course data from chair websites and match it against student career goals.
*   By decoupling this from the Spring Boot server, the main backend remains highly performant and avoids being bottlenecked by AI processing latency. Communication between the Spring Boot server and this microservice is handled via internal REST calls.

#### User-Profile-Service: Spring Boot Microservice
A dedicated Spring Boot microservice manages user profile data in a PostgreSQL-backed profile store, keeping the main server focused on business logic and API orchestration.

#### PDF-Parser: Spring Boot Microservice
A dedicated Spring Boot microservice handles PDF parsing tasks such as extracting course data from uploaded transcripts.

#### Database: PostgreSQL
Data persistence is managed using PostgreSQL, a highly reliable and scalable relational database system.
*   A relational database is the ideal choice for this application due to the highly structured and interconnected nature of university data. PostgreSQL ensures ACID compliance and referential integrity, which is essential when mapping complex prerequisite chains, user credentials, and ECTS credit balances. Course embeddings for semantic search are stored using the pgvector extension within the same PostgreSQL instance.
*   It provides the shared persistence layer for credentials, profiles, course data, academic progress, and semantic-search embeddings.

## 📚 Project Diagrams

### 🏗️ Subsystem Decomposition Diagramm
![Subsystem Decomposition Diagramm](./docs/diagrams/SubsystemDecomposition.png)

### ⚙️ Use Case Diagram
![Use Case Diagram](./docs/diagrams/UseCaseDiagramm.png)

### 🧩 Analysis Object Model (Domain Model)
![Analysis Object Model (Domain Model)](./docs/diagrams/DomainModel.png)

### Database Schemas
![courses-data](./docs/diagrams/courses-data-schema.png)

![profiles](./docs/diagrams/profiles-schema.png)

![security](./docs/diagrams/security-schema.png)


### deployment urls

    https://aidan.stud.k8s.aet.cit.tum.de/dashboard
    https://aidan-monitoring.stud.k8s.aet.cit.tum.de

### Test User

    username: admin

    password: test

### Grafana Login

    username: admin
    password: admin

### Build Instructions

**Prerequisites:** Git LFS required to fetch seed data (course catalog + embeddings).
```bash
git lfs install
git lfs pull
```

**1. Set up environment variables:**
```bash
cp .env.example .env
# edit .env — set LOGOS_API_KEY (get from tutor), adjust LLM_PROVIDER if needed
```

**2. Start the database** (Terminal 1 — stays in foreground):
```bash
./scripts/db-start.sh
# First run imports ~100MB course data + ~160MB embeddings — wait for "ready to accept connections"
# Press Ctrl+C to stop the database
```

Course embeddings are pre-seeded in the database — no separate generation step or eduVPN needed for development.

**3. Start application services** (Terminal 2):
```bash
./scripts/dev-start.sh --all      # start server + client + genai + pdf-parser
# or pick individual services:
./scripts/dev-start.sh --server   # Spring Boot + user-profile-service
./scripts/dev-start.sh --client   # React frontend only
./scripts/dev-start.sh --genai    # GenAI FastAPI only
```

Services started with `--all`:
| Service | Port | Description |
|---|---|---|
| `client` | `localhost:3000` | React frontend |
| `server` | `localhost:8080` | Spring Boot REST API |
| `user-profile-service` | `localhost:8060` | User profiles |
| `pdf-parser` | `localhost:8070` | PDF parser |
| `genai` | `localhost:8000` | Python FastAPI AI service |
| `db` | `localhost:5432` | PostgreSQL (started via db-start) |

**4. Reset user data** (keep course catalog, clear accounts/profiles):
```bash
./scripts/dev-reset.sh
# Drops 'security' and 'profiles' databases, preserves 'courses-data'
# Restart services to recreate empty databases
```

**5. Full database reset** (re-seed everything from scratch):
```bash
./scripts/db-reset.sh
# Stops all containers and removes all volumes — next db-start re-imports seed data
```

**6. Re-generate embeddings** (only needed if course data or embedding model changes):
```bash
# Requires genai service running + eduVPN for LOGOS API
./scripts/generate-embeddings.sh    # populate course_embeddings table
./scripts/dump-embeddings.sh        # export to seed file for other developers
# Commit the updated infra/db/init/embeddings-data.sql.gz.data
```

**7. Run scraper** (on-demand, after database is running):
```bash
./scripts/dev-start.sh --scraper
```

**8. Run with Docker Compose** (alternative, all-in-one):
```bash
docker compose up --build
```

**9. Run with local LLM** (Ollama instead of Logos cloud):
```bash
# set LLM_PROVIDER=local in .env first
docker compose --profile local up --build
# then pull the model (first run only):
docker compose exec ollama ollama pull llama3.2
```
### Code Quality

Formatting and linting is enforced across all sub-projects.

#### Client (`services/client/`) — Biome

```bash
cd services/client
pnpm check          # check formatting + lint
pnpm check --write  # auto-fix
```

#### Spring services (`services/server/`, `services/pdf-parser/`, `services/user-profile-service/`) — Spotless + Google Java Format

```bash
cd services/server
./gradlew spotlessCheck  # check
./gradlew spotlessApply  # auto-fix
```

#### Scraper & GenAI (`services/scraper/`, `services/genai/`) — Ruff

```bash
cd services/scraper  # or services/genai
ruff format --check .  # check formatting
ruff check .           # check lint
ruff format .          # auto-fix formatting
ruff check --fix .     # auto-fix lint
```
