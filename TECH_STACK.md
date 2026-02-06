# TECH_STACK.md - Budget Tracker Technology Stack Decision

## 1. Overview

| Aspect | Decision |
|--------|----------|
| Architecture | Monolithic MVC |
| Cost | $0 (no external APIs, no cloud services) |
| External APIs | None |
| Image Generation | Not required |
| Audio Generation | Phase 5 only (Gemini TTS / GCP TTS for explanation.mp3) |

---

## 2. Frontend

| Component | Technology | Version | Reason |
|-----------|-----------|---------|--------|
| JavaScript | Vanilla JS | ES2020+ | No build step, zero framework overhead, direct DOM control |
| CSS | Custom CSS | CSS3 | Full control, CSS custom properties for theming, minimal payload |
| Templating | EJS | 3.x | Server-side rendered initial HTML, simple syntax |
| Routing | Hash-based client router | Custom | Lightweight, no library dependency, supports browser back |
| HTTP Client | Fetch API | Native | Built-in, promise-based, no extra dependency |

### Frontend Libraries: NONE
- No React, Vue, Angular, or other frameworks
- No jQuery
- No CSS framework (Bootstrap, Tailwind)
- No build tools (Webpack, Vite, Parcel)

### Frontend Patterns
- Module pattern with ES2020+ features (optional chaining, nullish coalescing)
- Component-based file organization (each UI component in its own .js file)
- Event delegation for dynamic content
- Optimistic UI updates with error rollback
- Debounced auto-save (300ms)

---

## 3. Backend

| Component | Technology | Version | Reason |
|-----------|-----------|---------|--------|
| Runtime | Node.js | 18+ LTS | Stable, widely supported, proven for web servers |
| Framework | Express | 4.x | Industry standard, minimal overhead, extensive middleware ecosystem |
| Security Headers | Helmet | 7.x | Automatic HTTP security headers (CSP, HSTS, X-Frame-Options) |
| CORS | cors | 2.8.x | Configurable cross-origin for LAN access |
| Compression | compression | 1.7.x | Gzip responses for faster LAN transfers |
| Logging | morgan | 1.10.x | HTTP request logging for debugging |

### Backend Patterns
- MVC architecture (Model-View-Controller)
- Service layer between controllers and models
- Middleware chain for validation, sanitization, error handling
- Synchronous database operations (better-sqlite3)
- JSON API responses with consistent format

---

## 4. Database

| Component | Technology | Version | Reason |
|-----------|-----------|---------|--------|
| Engine | SQLite | 3.x | Zero setup, file-based, portable, no external server |
| Driver | better-sqlite3 | 9.x | Synchronous API (simpler code), faster than node-sqlite3, prebuilt binaries |
| Mode | WAL (Write-Ahead Logging) | - | Better concurrent read performance, reliable writes |

### Database Design Decisions
- Single `tasks` table with self-referencing parent_id (not separate tables per level)
- Soft delete pattern (is_deleted flag) for data safety
- UNIQUE constraint on (task_id, work_date) for actuals upsert
- Proper indexing on parent_id, level, status, is_deleted
- Schema versioning table for future migrations

### Why SQLite (not PostgreSQL/MySQL):
1. $0 cost, no database server to manage
2. Single-file database, easy backup (copy data.db)
3. Sufficient for target scale (1000 tasks, 5-10 concurrent readers)
4. WAL mode handles concurrent reads well
5. Express server acts as single-writer, avoiding concurrent write conflicts

---

## 5. Testing

| Component | Technology | Version | Reason |
|-----------|-----------|---------|--------|
| Test Runner | Jest | 29.x | Standard Node.js test framework, built-in assertions |
| HTTP Testing | Supertest | 6.x | Express integration testing without starting server |
| Database | In-memory SQLite | via better-sqlite3 | Fast, isolated test databases per test suite |
| Coverage | Jest built-in (Istanbul) | - | Coverage reporting integrated |

### Test Strategy
- Unit tests: Service layer logic (progress calculation, business rules)
- Integration tests: API endpoints (routes + controllers + services + models)
- Test isolation: Each test suite gets a fresh in-memory database
- Coverage target: 80%+ overall, 90%+ for business logic (progressService)
- Critical path tests: 100% coverage on progress calculation and delay detection

---

## 6. Development Tools

| Tool | Purpose |
|------|---------|
| nodemon | 3.x | Auto-restart server on file changes during development |
| npm scripts | - | `start`, `dev`, `test`, `test:coverage` commands |

### npm Scripts
```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "jest --verbose",
  "test:coverage": "jest --coverage --verbose",
  "test:watch": "jest --watch"
}
```

---

## 7. Production Dependencies (Total: 7)

```
express          ^4.18.0    Web framework
better-sqlite3   ^9.0.0     SQLite driver
ejs              ^3.1.0     Template engine
helmet           ^7.0.0     Security headers
cors             ^2.8.0     CORS middleware
compression      ^1.7.0     Response compression
morgan           ^1.10.0    Request logging
```

**Total production dependencies: 7** (under the 10-package limit per NFR-11)

---

## 8. Development Dependencies (Total: 3)

```
jest             ^29.0.0    Test framework
supertest        ^6.0.0     HTTP testing
nodemon          ^3.0.0     Development auto-restart
```

---

## 9. Security Implementation

| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| XSS | HTML escaping | EJS auto-escaping (`<%= %>`), manual sanitization for dynamic content |
| SQL Injection | Parameterized queries | better-sqlite3 prepared statements (`.prepare().run()`) |
| CSRF | Same-origin policy | API is same-origin; CORS restricted to LAN |
| Clickjacking | X-Frame-Options | Helmet default headers |
| Content sniffing | X-Content-Type-Options | Helmet nosniff |
| Information leakage | Error handling | Generic error messages to client, detailed logs server-side |

---

## 10. Deployment / Runtime

| Aspect | Decision |
|--------|----------|
| Hosting | Local machine (Node.js process) |
| Startup | `launch_app.command` (double-click) or `npm start` |
| Port | 3000 (configurable via PORT env variable) |
| Binding | 0.0.0.0 (LAN accessible) |
| Database location | ./data/budget-tracker.db |
| Process management | Single process (no PM2, no clustering needed) |

### LAN Access
- Server binds to 0.0.0.0 for LAN access
- On startup, displays local IP address and port
- Other devices on the same network can access via http://{ip}:3000

---

## 11. Browser Support

| Browser | Minimum Version | Features Required |
|---------|----------------|-------------------|
| Chrome | 80+ | ES2020, Fetch API, CSS Grid |
| Safari | 14+ | ES2020, Fetch API, CSS Grid |
| Firefox | 78+ | ES2020, Fetch API, CSS Grid |
| Edge | 80+ | ES2020, Fetch API, CSS Grid |

### Not Supported
- Internet Explorer (any version)
- Browsers without ES2020 support

---

## 12. Alternatives Considered and Rejected

| Alternative | Rejected Because |
|-------------|-----------------|
| React / Vue | Adds build step, framework dependency, overkill for this scope |
| PostgreSQL / MySQL | Requires external database server, violates $0 + simplicity goal |
| TypeScript | Adds compilation step, slower iteration for this scope |
| Tailwind CSS | Additional dependency, build step for purging, custom CSS is sufficient |
| Sequelize / Prisma | ORM overhead unnecessary with simple schema, better-sqlite3 is direct |
| Socket.io | Real-time sync not required (simple refresh suffices for LAN viewers) |
| Docker | Adds complexity, Node.js + SQLite is already portable |
