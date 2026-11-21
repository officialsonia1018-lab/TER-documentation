# TER Documentation Portal

A complete, responsive **documentation, onboarding and training portal** for the **TER (Travel & Expense Reimbursement System)** application.

Built with **React.js + Vite (JavaScript)**, **React Router**, **Tailwind CSS** and **Lucide React** icons, with a small **Node + MariaDB/MySQL** server that stores the documentation cards and uploaded images so every visitor shares one dataset. The database can be administered with **phpMyAdmin** (bundled with XAMPP) as well as from the portal's own **Database** page.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [What TER means](#2-what-ter-means)
3. [Features](#3-features)
4. [User roles](#4-user-roles)
5. [Route list](#5-route-list)
6. [Folder structure](#6-folder-structure)
7. [Installation and run](#7-installation-and-run)
8. [Tailwind CSS setup](#8-tailwind-css-setup)
9. [Admin login instructions](#9-admin-login-instructions)
10. [Shared data: server and database](#10-shared-data-server-and-database)
11. [What persists across refreshes](#11-what-persists-across-refreshes)
12. [Replace the demo TER URLs](#12-replace-the-demo-ter-urls)
13. [Add new documentation modules](#13-add-new-documentation-modules)
14. [Deploying the portal](#14-deploying-the-portal)
15. [Copy the project to the D: drive](#15-copy-the-project-to-the-d-drive)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Project overview

The TER Documentation Portal is the **documentation, onboarding and training companion** for the TER application. Anyone can open the portal and browse documentation cards for every TER module without logging in (only the administrator signs in, to manage cards), open detailed step-by-step documentation with rules, examples, workflow diagrams and screenshot placeholders, and open the (configurable) link to the real TER application.

**The portal is not the TER reimbursement application.** It does not create, approve, process or pay claims.

Portal journey:

```
Login -> Documentation Dashboard -> TER module cards -> View details -> Step-by-step documentation
      -> Images, diagrams and explanations -> Open TER Application button (demo link)
```

## 2. What TER means

**TER = Travel & Expense Reimbursement System.**

TER manages the complete lifecycle of an employee expense claim:

```
Employee -> Create or maintain expenses -> Submit claim -> Supervisor L1 -> Approve / reject / forward
        -> Supervisor L2 (if required) -> Final approval -> UNID generation -> TER / Accounts processing
        -> Payment -> Paid
```

Business rules documented in the portal include:

- **Company claim periods:** D2F = 1st to last day of the calendar month (1 June to 30 June); INDOFIL = 21st to 20th of the next month (21 June to 20 July).
- **Claim window:** current period plus the previous 3 periods (4 period rolling window).
- **Claim rules:** period-end day selectable, claim dates cannot exceed the last working date, pending claims lock the period, returned claims can be edited and resubmitted.
- **Claim statuses:** 1 Active/Draft/Returned, 5 Pending L1, 6 Pending L2, 2 Processing, 14 Received/UNID handover, 4 Paid.
- **Daily Allowance:** DA Out of HQ 175 per day, DA Local Market 150 per day, maximum 26 DA days per period, one DA bill per category per period, no attachment, amount = rate x days, one date cannot be claimed in two DA categories.
- **Approval routing:** every claim goes to L1 first; employees cannot submit directly to L2; L1 can approve, reject or forward; special categories and supervisor claims may require L2; L2 gives final approval.
- **Rejection:** partial or full, mandatory reason, editable returned claim, resubmission back to L1, history preserved.
- **UNID:** generated after final approval and used as the unique claim reference (server side in the real application; the portal shows a demo example only).
- **Travel Plan:** day-by-day plan with from city, to city, travel mode, optional kilometres and tentative hotel dates, submitted for supervisor approval.
- **DG Advance:** request, supervisor review, release, use, settlement, processor disbursement with UTR.
- **Admin console:** dashboard, TER processing, payments, expense categories, limit masters, approval settings, enforcement settings, SMS settings, reports, review MIS, DG Advance, user access, company settings.
- **Reports:** claim count, claim amounts, pending, processed and paid claims, approval information, rejection reasons, UNIDs and CSV export (demo button).

## 3. Features

- Public read-only access: the dashboard and every documentation page open without a login, so anyone with the URL can read the documentation.
- No sidebar, no logout and no account UI for public visitors - they only see the content.
- Admin login at `/login`; signing in adds the admin sidebar plus add / edit / delete authority.
- One shared dataset: cards and images are stored by the portal server in a MariaDB / MySQL database (`ter_portal`, e.g. the MySQL inside XAMPP), so every visitor sees the same documentation and admin changes appear for everyone. Section images live in the `module_images` table, so they survive redeploys and work on hosts with a temporary disk (e.g. Render).
- phpMyAdmin-ready: the same database opens at `http://localhost/phpmyadmin/` with tables `modules`, `module_sections`, `module_images`, `admin_sessions` and `portal_meta`.
- phpMyAdmin-style **Database** page at `/database` (admin only): table list with row counts, paginated row browsing, row editing, storage info and a read-only SQL console (`SELECT` / `WITH`).
- If the server cannot be reached, the app keeps working as a static demo with its built-in data and `localStorage`.
- Responsive sidebar (drawer on mobile) and sticky top header with search.
- Dashboard with title, subtitle, six statistics cards computed from the data, quick workflow panel, important modules and 30 module cards.
- Search by title, description, summary or category.
- Filter by category and by audience/role, with a reset action.
- Module cards with title, short description, category, audience, icon, status badge, View Details button, Open TER App demo link and optional demo URL.
- Content sections in the admin add / edit form: each section has a heading, content (blank line separates paragraphs), optional bullet points and an optional image placed after the content. Sections and images can be removed; images are resized and compressed in the browser and shown on the module detail page.
- Detailed documentation page with breadcrumb, summary, purpose, who uses it, sections, step-by-step process, business rules, example, status flow, screenshot placeholders, related modules and previous/next navigation.
- Professional documentation layout: table of contents on the left, content in the middle, "Important rules" card on the right (stacked on mobile).
- Admin actions: Add card, Edit card and Delete card (with a confirmation dialog), available from the dashboard, the sidebar (cards) and each module page. Content sections and their images are managed inside the add / edit form.
- Toast success messages, empty states, skeleton free loading, accessible buttons and visible focus states.
- No external services or API keys - the backend is the bundled Node server plus the local MariaDB/MySQL server (XAMPP).

## 4. User roles

| Role | Id | Can do |
| --- | --- | --- |
| Employee | `employee` | View documentation, employee related modules. Cannot create, edit or delete cards. |
| Supervisor L1 | `supervisor-l1` | View Supervisor L1 documentation and approval workflow modules. |
| Supervisor L2 | `supervisor-l2` | View L2 and final approval documentation. |
| Admin / TER / Accounts | `admin` | View everything, plus demo Add card, Edit card and Delete card actions. |
| Processor | `processor` | View DG Advance, TER processing, payment and settlement modules. |

These roles describe who uses each TER module in the real application, and drive the audience filters and badges. Portal access itself is simpler: everyone can read, and only the `admin` account can manage cards. Access rules are applied to the interface only - in a real system they would be enforced on the server.

## 5. Route list

| Route | Page | Access |
| --- | --- | --- |
| `/login` | Admin login | Public - the only page with a login form (redirects to the dashboard when already signed in) |
| `/` | Redirect to `/dashboard` | Public |
| `/dashboard` | Dashboard with stats, filters and module cards | Public |
| `/module/:id` | Module detail documentation page | Public |
| `/add-module` | Add a documentation card | Admin only (redirects to `/login`) |
| `/edit-module/:id` | Edit a documentation card | Admin only (redirects to `/login`) |
| `/profile` | Admin profile and role summary | Admin only |
| `/database` | Database browser (tables, rows, SQL console) | Admin only |
| `/help` | Help, roles and FAQ | Public |
| `*` | Not found page | Public |

## 6. Folder structure

```
ter-documentation-portal/
  public/
    vite.svg
  server/
    api.js            (API routes: auth, modules, images, database tools)
    index.js          (Node HTTP server: api.js + legacy uploads + dist/, CORS, npm start)
    store.js          (MariaDB storage, sessions, images in module_images)
  vercel.json         (Vite preset + SPA rewrites for frontend-only Vercel hosting)
  .env.example        (template for VITE_API_BASE_URL and backend variables)
  data/               (local only, gitignored)
    uploads/          (legacy image files from earlier versions)
    ter-portal.db     (old SQLite file - only read once to import into MySQL)
  src/
    components/
      layout/
        AppLayout.jsx
        Sidebar.jsx
        Header.jsx
      common/
        Button.jsx
        Modal.jsx
        Badge.jsx
        SearchBar.jsx
        EmptyState.jsx
        ToastMessage.jsx
        ConfirmDialog.jsx
        RoleBadge.jsx
        StatCard.jsx
        FilterBar.jsx
        StatusBadge.jsx
        IconResolver.jsx
      documentation/
        ModuleCard.jsx
        ModuleGrid.jsx
        DocumentationLayout.jsx
        DocumentationSection.jsx
        StepList.jsx
        WorkflowDiagram.jsx
        ImportantRules.jsx
        RelatedModules.jsx
        ScreenshotPlaceholder.jsx
      modules/
        ModuleForm.jsx
    context/
      AuthContext.jsx
      ModuleContext.jsx
    services/
      api.js
    utils/
      imageFile.js
    data/
      terModules.js
      roles.js
      statuses.js
      workflows.js
      appLinks.js
    pages/
      Login.jsx
      Dashboard.jsx
      ModuleDetails.jsx
      AddModule.jsx
      EditModule.jsx
      Profile.jsx
      Database.jsx
      Help.jsx
    routes/
      ProtectedRoute.jsx
      AdminRoute.jsx
    App.jsx
    main.jsx
    index.css
  COPY-TO-D-DRIVE.bat
  index.html
  package.json
  vite.config.js
  README.md
```

Module data shape (`src/data/terModules.js`):

```js
{
  id, title, slug, shortDescription, category, audience, icon, status, liveUrl,
  summary, purpose, steps: [], rules: [], example, workflow: [],
  sections: [{ title, paragraphs: [], bullets: [], imagePlaceholder }],
  relatedModuleIds: []
}
```

## 7. Installation and run

Requirements:

- Node.js **22.5 or newer** and npm.
- **MariaDB / MySQL** running locally. With XAMPP: open the XAMPP Control Panel and start **MySQL** (Apache is only needed if you want phpMyAdmin in the browser). Defaults used by the server: `localhost:3306`, user `root`, empty password, database `ter_portal` (created automatically on first start).

Local development uses two terminals:

```bash
# terminal 1 - portal server (API + built app on port 3001)
npm install
npm run server

# terminal 2 - Vite dev server (proxies /api and /uploads to port 3001)
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

Single process for production:

```bash
npm run build     # output in dist/
npm start         # serves dist/ and the API on PORT (default 3001)
```

Open `http://localhost:3001`. On the first start the server creates the `ter_portal` database, imports the existing cards from `data/ter-portal.db` (if present) and otherwise seeds the built-in demo documentation.

View the same data in phpMyAdmin: open `http://localhost/phpmyadmin/`, sign in (XAMPP default: user `root`, no password) and choose the **ter_portal** database.

## 8. Tailwind CSS setup

This project uses **Tailwind CSS v4** with the official Vite plugin.

`vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

`src/index.css` starts with the Tailwind import, followed by optional theme tokens:

```css
@import "tailwindcss";

@theme {
  --font-sans: "Segoe UI", ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
  --color-navy-900: #16233c;
  /* ...additional navy shades... */
}
```

There is no `tailwind.config.js` and no PostCSS file - Tailwind v4 with the Vite plugin does not need them.

## 9. Admin login instructions

1. Start `npm run server` and `npm run dev` (or run the built app with `npm start`).
2. Reading the portal needs no login - the dashboard opens straight away for every visitor.
3. Only the administrator signs in, at `/login`.

| Field | Default value |
| --- | --- |
| Email | `admin@ternityforworder` |
| Password | `admin123` |

4. Click **Login as admin**. The dark sidebar appears with **Dashboard, Add module, Database, Profile, Help**, and every card gains **Edit** and **Delete** buttons. In the add / edit form, use **Content sections** to add a heading with its content and an optional image after the content.
5. Use **Logout** (top right) to return to the public read-only view.

The credentials come from the server environment variables `ADMIN_EMAIL` and `ADMIN_PASSWORD` (defaults above). The server validates them and issues an admin session token that expires after 12 hours. Change the defaults before sharing the portal.

## 10. Shared data: server and database

### 10.1 Architecture layers

```
Browser (React + Vite)
  pages/ components/            UI: dashboard, module pages, admin form, /database
  context/ModuleContext.jsx     in-memory state, loads once, debounced autosave
  services/api.js               fetch() client: Bearer token, JSON, errors
        |  /api/*
        v
API layer                       server/api.js (routing, auth, validation)
  server/index.js               Node HTTP server: API + static dist/ (npm start)
        |
        v
server/store.js                 data access layer (mysql2/promise)
        |
        v
MariaDB / MySQL                 database "ter_portal" (XAMPP locally, managed
  modules, module_sections,     MySQL in production)
  module_images, admin_sessions, portal_meta
        ^
        |  same tables
phpMyAdmin  http://localhost/phpmyadmin/
```

Section images are rows in `module_images` (MEDIUMBLOB) and are served by
`GET /api/images/<id>`, so the API works on hosts without a writable disk.

### 10.2 API endpoints

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /api/modules` | Public | Documentation cards joined from `modules` + `module_sections` |
| `PUT /api/modules` | Admin | Validate and replace the full card list (used by the add / edit forms) |
| `POST /api/login`, `POST /api/logout` | Public | Admin session token (12 hour TTL) |
| `GET /api/health` | Public | Server status check |
| `GET /api/images/:id` | Public | Section image stored in `module_images` (long-lived cache headers) |
| `GET /api/db/overview` | Admin | Table list with row counts, database size, image count |
| `GET /api/db/tables/:table?limit&offset` | Admin | Paginated rows and column metadata |
| `PATCH /api/db/tables/:table/:rowId` | Admin | Update one row (read-only tables rejected) |
| `POST /api/db/query` | Admin | Read-only SQL console (`SELECT` / `WITH` only) |
| `GET /uploads/<file>` | Public | Legacy image files on disk (local server only) |
| Anything else | Public | The built `dist/` app with SPA fallback (local server) |

### 10.3 Database schema

The database is **MariaDB / MySQL** (database `ter_portal`, InnoDB, utf8mb4). The server creates it on first start and imports the existing SQLite data once (`data/ter-portal.db` is then only kept as a backup):

| Table | Columns |
| --- | --- |
| `modules` | `id` (PK, varchar), `position`, `slug`, `title`, `short_description`, `category`, `audience` (JSON array), `steps` (JSON array), `rules` (JSON array), `workflow` (JSON array), `related_module_ids` (JSON array), `icon`, `status`, `live_url`, `summary`, `purpose`, `example`, `created_at`, `updated_at` |
| `module_sections` | `id` (PK, autoincrement), `module_id` (FK -> `modules.id`, `ON DELETE CASCADE`), `position`, `title`, `paragraphs` (JSON array), `bullets` (JSON array), `image` (`/api/images/<id>` reference or legacy `/uploads/<file>`), `image_placeholder` |
| `module_images` | `id` (PK, UUID), `mime`, `bytes`, `data` (MEDIUMBLOB), `created_at` - uploaded section images |
| `admin_sessions` | `token` (PK), `expires_at` - read-only in the Database page |
| `portal_meta` | `meta_key` (PK), `value` - internal flags such as the seed / import marker |

List-like fields are stored as JSON **text** in MEDIUMTEXT columns, so `audience`, `steps`, `rules`, `workflow`, `related_module_ids`, `paragraphs` and `bullets` show as formatted JSON arrays. The Database page labels these columns with `· JSON` and the edit form expects valid JSON arrays, for example `["First point", "Second point"]`.

Images are resized and compressed in the browser to a maximum of **4 MB** before upload, which keeps the save request small and the database light. Images that are no longer referenced by any section are deleted from `module_images` after each save.

### 10.4 Using the Database page (phpMyAdmin-style)

1. Sign in at `/login`, then open **Database** in the sidebar (or go to `/database`).
2. **Tables** on the left shows the content tables with their row counts; click one to browse it. (`module_images` is intentionally hidden here because it holds binary data - view it in phpMyAdmin.)
3. **Browse** shows 25 rows per page with column names, types and a PRIMARY KEY badge. Click **Edit** on a row, change values and press **Save row** - the change is written straight to MySQL and the portal refreshes immediately.
4. **SQL console** runs read-only queries (`SELECT` / `WITH`); Ctrl + Enter executes. Writes are blocked there - edit rows in Browse instead.
5. The **Storage** card shows the database name, server, size and number of section images stored in the database.

### 10.5 Open the same data in phpMyAdmin

The portal uses the normal MySQL protocol, so phpMyAdmin accesses exactly the same tables:

1. Start **MySQL** (and **Apache** for phpMyAdmin) in the XAMPP Control Panel.
2. Open `http://localhost/phpmyadmin/` and sign in (XAMPP default: user `root`, empty password).
3. Choose the **ter_portal** database, then:
   - **Browse** `modules` to see every documentation card.
   - **Browse** `module_sections` to see every section with its image reference, ranked by `position`.
   - **Browse** `module_images` to see the uploaded images (`data` is binary; the portal serves them at `/api/images/<id>`).
   - **SQL** tab to run any query (phpMyAdmin allows writes; the portal's own SQL console does not).
4. Changes made in phpMyAdmin appear on the portal after a reload (the portal reads the database on load).

### 10.6 Where images live

Uploaded section images (JPEG/PNG/WebP) are stored **inside the database**, in the `module_images` table. The browser resizes and compresses them, sends a data URL with the card save, and the server inserts the bytes and returns an `/api/images/<uuid>` path that is saved in `module_sections.image`. `GET /api/images/<id>` streams the image back with long cache headers.

This means images travel with the database: a backup/export includes them, they survive redeploys, and the app works on hosts with a temporary disk (e.g. Render free). Images no longer referenced by any card are deleted automatically after a save. Older `/uploads/<file>` references still render when the local `data/uploads/` folder exists; after deploying elsewhere, upload those images again so they move into the database.

The client (`src/services/api.js`) loads cards from the server on startup and saves changes automatically about 400 ms after an edit. Because the database is shared, everyone who opens the deployed URL sees the same up-to-date content.

### 10.7 Sharing only the ter_portal database

Root in phpMyAdmin sees every database on the server (`gtms`, other projects, ...). For sharing, use the dedicated MySQL account that is limited to `ter_portal`:

| Item | Value |
| --- | --- |
| Username | `ter_portal_app` |
| Password | the one chosen when the account was created |
| Host | `localhost` (phpMyAdmin running on this machine) |
| Allowed database | `ter_portal` only (`ALL PRIVILEGES ON ter_portal.*`) |

- phpMyAdmin: open `http://localhost/phpmyadmin/` and sign in with `ter_portal_app` instead of `root`. The sidebar shows only `ter_portal` (plus the read-only `information_schema`).
- Portal server: optionally run it with the same account - `$env:DB_USER = "ter_portal_app"` and `$env:DB_PASSWORD = "..."` before `npm run server`.
- Lost the password? As root: `ALTER USER 'ter_portal_app'@'localhost' IDENTIFIED BY 'new-password';`
- `gtms` and every other database are untouched; that account cannot open them (verified: `Access denied`).
- MariaDB also ships an empty `test` scratch database visible to all accounts. If you do not need it, remove it once as root: `DROP DATABASE test;` (it is empty).
- To share a copy instead of access: phpMyAdmin -> `ter_portal` -> **Export** -> SQL, or:
  ```powershell
  C:\xampp\mysql\bin\mysqldump.exe -uroot ter_portal > ter_portal.sql
  ```

Configuration (environment variables):

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Server port |
| `ADMIN_EMAIL` | `admin@ternityforworder` | Admin login email |
| `ADMIN_PASSWORD` | `admin123` | Admin login password |
| `DB_HOST` | `localhost` | MySQL / MariaDB host |
| `DB_PORT` | `3306` | MySQL / MariaDB port |
| `DB_USER` | `root` | Database user (XAMPP default) |
| `DB_PASSWORD` | *(empty)* | Database password (XAMPP default is empty) |
| `DB_NAME` | `ter_portal` | Database name (created automatically when the user may create it) |
| `DB_SSL` | *(off)* | Set to `1` for TLS. **Required** for most managed MySQL hosts (e.g. Aiven used with Render) |
| `DATA_DIR` | `./data` | Legacy image folder and the old SQLite backup (not needed on Render) |
| `UPLOADS_DIR` | `<DATA_DIR>/uploads` | Legacy image folder |
| `CORS_ORIGIN` | `*` | Allowed frontend origins for the API (comma-separated), e.g. your Vercel URL |
| `VITE_API_BASE_URL` | *(empty)* | Frontend build-time API URL. Empty = same origin (local proxy or combined Render). Set to the Render URL on Vercel |

On Windows PowerShell, set a variable for one session before `npm run server`, for example:

```powershell
$env:DB_PASSWORD = "your-mysql-password"
$env:DB_NAME = "ter_portal"
npm run server
```

## 11. What persists across refreshes

- the admin session is kept per browser tab (`sessionStorage`) until logout or token expiry
- cards added, edited or deleted by an admin are stored in the MySQL database `ter_portal`, so they remain after a refresh and are visible to every visitor
- section images are stored in the `module_images` table and served from `/api/images/<id>`
- filters and search are kept in the URL query string only (they reset when you open the app fresh)

When the portal server is not running, the app falls back to demo mode: built-in data plus `localStorage` (`ter-portal-modules-v2`), and demo credentials. Clearing that key or deleting extra cards restores the starting content.

## 12. The "Open TER App" link

Every module links to the official TER mobile app on Google Play:

```
https://play.google.com/store/apps/details?id=com.portal.ter&pcampaignid=web_share
```

The URL is defined once in `src/data/appLinks.js` (`TER_APP_URL`) and used by:

- the **Open TER App** button on every module card
- the **Open TER App** button in the sidebar of each module detail page
- the **Open TER App** button in the header of the public view

All of them open in a new tab with `target="_blank"` and `rel="noreferrer"`.

To change the link, edit `src/data/appLinks.js`. A single module can also override it through its own `liveUrl` field in `src/data/terModules.js`, or through the **TER app link** field in the admin add / edit form.

## 13. Add new documentation modules

Permanently (recommended for real documentation):

1. Open `src/data/terModules.js`.
2. Copy an existing module object and change the values - keep the same keys.
3. Use a unique `id` and `slug`, and add the new `id` to other modules' `relatedModuleIds` if it should appear in "Related modules".
4. Pick an `icon` from the list exported by `src/components/common/IconResolver.jsx` (`ICON_OPTIONS`).
5. Use a `category` from `MODULE_CATEGORIES` in the same data file.
6. Restart the dev server (or rely on Vite hot reload).

In the running portal: open `/login`, sign in as the admin and use **Add Card**. The card is stored on the portal server and shown to every visitor.

## 14. Deploying the portal

The backend stays a normal, long-running **Node.js process**: `server/index.js` builds the API, serves the built React site (`dist/`) and listens on the port given by the host. `npm start` is all Render needs; no serverless functions.

Two layouts are supported:

- **14.1:** one Render Web Service for the frontend **and** the API (simplest).
- **14.2:** Vercel (frontend) + Render (backend/API) + a managed MySQL database. The frontend calls the Render API through `VITE_API_BASE_URL`, and Render allows the Vercel origin through `CORS_ORIGIN`.

### 14.1 Render + a managed MySQL database (combined, smallest setup)

Render runs the Node app, but **not MySQL**. Create the database with a hosted provider, then connect Render to it:

- Aiven for MySQL (free plan), Railway (MySQL), Clever Cloud, TiDB Cloud (MySQL compatible), DigitalOcean Managed MySQL, or the company MySQL server.
- Note **host, port, database name, user, password**. Managed hosts require TLS → set `DB_SSL=1` (no CA file needed; the server accepts the provider certificate).

Steps:

1. **Copy your local data to the cloud database.** The dump includes the card tables *and* the `module_images` table, so images move too:
   ```powershell
   C:\xampp\mysql\bin\mysqldump.exe -uroot --single-transaction ter_portal > ter_portal.sql
   C:\xampp\mysql\bin\mysql.exe -h HOST -P PORT -u USER -p DBNAME < ter_portal.sql
   ```
   (Or import `ter_portal.sql` in the provider's SQL console. If the dump contains `CREATE DATABASE`/`USE`, remove those lines first.)
2. **Push the project to GitHub** (Render deploys from a Git repo):
   ```powershell
   cd D:\ter-documentation-portal\ter-documentation-portal
   git init
   git add .
   git commit -m "TER documentation portal"
   git branch -M main
   git remote add origin https://github.com/YOUR-USER/ter-documentation-portal.git
   git push -u origin main
   ```
   `node_modules`, `dist` and `data/` are already in `.gitignore`.
3. **Create the Render Web Service:** dashboard → **New +** → **Web Service** → connect the repo, then:

   | Setting | Value |
   | --- | --- |
   | Language / Runtime | Node |
   | Branch | `main` |
   | Build Command | `npm install && npm run build` |
   | Start Command | `npm start` |
   | Health Check Path | `/api/health` |
   | Instance Type | Free (sleeps after 15 min idle) |

4. **Add environment variables** (Render → Environment):

   | Name | Value |
   | --- | --- |
   | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | from your database provider |
   | `DB_SSL` | `1` for most managed MySQL hosts |
   | `ADMIN_EMAIL` | your admin email |
   | `ADMIN_PASSWORD` | a strong password (do not keep `admin123`) |
   | `CORS_ORIGIN` | only needed for a separate frontend (see 14.2); leave unset here |

   Do **not** set `PORT` - Render provides it automatically.
5. **Save and deploy.** Render installs dependencies, runs `npm run build`, then `npm start`; later pushes to `main` redeploy automatically. Environment changes also trigger a redeploy.
6. Open the Render URL, sign in at `/login`, edit a card, add an image, then check the page in a private window to confirm everyone sees it.
7. Errors are in Render → **Logs** (the startup lines show the database host and name).

Render notes:

- Section images live in `module_images` and are served by `/api/images/<id>`, so the free plan's temporary disk is not a problem. No `DATA_DIR` or persistent disk is needed.
- Admin sessions are rows in `admin_sessions` (MySQL), so a login survives redeploys and restarts.
- The free instance sleeps after 15 minutes without traffic; the next visit can take 30-60 seconds to wake up.
- On the first start an empty database is seeded with the built-in 30 modules, so import your dump first to keep your edits and images.
- For MySQL, the Render service must be able to reach the database host: allow Render's outbound connections (Aiven and most providers do by default) or use your company's server with the required firewall rule.

### 14.2 Vercel frontend + Render backend + managed MySQL (split setup)

Use this when the React site must be on Vercel and the API on Render. Vercel hosts only the static build; the database and API stay on Render.

1. **Deploy the backend on Render first**, exactly as in 14.1 (Web Service, `npm start`, MySQL variables, imported dump). Note the service URL, e.g. `https://ter-backend.onrender.com`.
2. **Allow the Vercel origin in Render.** In the Render service → Environment add:
   ```
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```
   Several origins are allowed separated by commas. `*` works but is less restrictive.
3. **Connect the repo to Vercel:** vercel.com → **Add New → Project** → import the same GitHub repo. Vercel reads `vercel.json` (Vite preset, `npm run build`, output `dist`, SPA rewrites), so deep links like `/module/...` and `/database` open correctly.
4. **Set the API URL on Vercel** (Project → Settings → Environment Variables):
   ```
   VITE_API_BASE_URL=https://ter-backend.onrender.com
   ```
   Vite bakes this value in at build time, so **redeploy after changing it** (Deployments → Redeploy).
5. **Redeploy Render** after adding `CORS_ORIGIN` (saving the variable triggers a deploy). Then open the Vercel URL, sign in, and save a card - requests go to the Render API and images load from `/api/images/<id>` on Render.
6. **Troubleshooting the split:** a browser error "blocked by CORS policy" means the Vercel URL is not in `CORS_ORIGIN` (or Render was not redeployed). If the site shows demo data, `VITE_API_BASE_URL` was empty at build time - set it and redeploy.

Note: Vercel only serves the frontend here. `/api/*` does not exist on Vercel, which is why the base URL must point to Render.

### 14.3 Your own server (VPS, Windows machine, company host)

1. Build the frontend with `npm run build`.
2. Provide a **MySQL / MariaDB** server and set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (add `DB_SSL=1` if the server uses TLS).
3. Run `npm start` on a host with **Node.js 22.5+**; one process serves `dist/` and the API.
4. Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` to your own credentials (and optionally `PORT`).
5. Put a TLS reverse proxy (nginx, Caddy, a cloud load balancer) in front of the server for HTTPS.

The same process serves the built app and the API, so no separate backend is needed. phpMyAdmin works locally with XAMPP; on a hosted MySQL, use the provider's web console or connect phpMyAdmin to the remote host. Only the `DB_*` variables differ between environments; the API and UI stay the same.

## 15. Create the project ZIP and copy it to the D: drive

### 15.1 Create ter-documentation-portal.zip

Double-click **`MAKE-ZIP.bat`** in the project folder. It creates
`ter-documentation-portal.zip` next to the script (about 90 KB, 51 entries) and skips
`node_modules`, `dist` and any existing ZIP.

You can also do it manually: select all project files in File Explorer, right-click,
choose **Send to -> Compressed (zipped) folder**, and rename the result to
`ter-documentation-portal.zip`.

### 15.2 Put the folder directly on the D: drive


If you want the project on `D:\ter-documentation-portal`:

**Option A - use the helper script**

1. Double-click `COPY-TO-D-DRIVE.bat` in the project folder.
2. If nothing is copied, right-click it and choose **Run as administrator**.
3. The script copies everything except `node_modules` to `D:\ter-documentation-portal`.
4. Then open a terminal in `D:\ter-documentation-portal` and run `npm install` followed by `npm run dev`.

**Option B - copy manually**

1. Open this project folder in File Explorer.
2. Press `Ctrl + A`, then `Ctrl + C` (skip `node_modules` if you prefer a smaller copy - it is regenerated by `npm install`).
3. Create `D:\ter-documentation-portal`, open it and press `Ctrl + V`.
4. Run `npm install` and `npm run dev` inside that folder.

## 16. Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| `npm install` fails | Check your Node.js version (`node -v`, Node 22.5+ required) and your internet connection. Delete `node_modules` and `package-lock.json`, then run `npm install` again. |
| `npm run dev` fails with a module error | Dependencies are missing - run `npm install` first. |
| Changes are not visible to other visitors | Start the portal server (`npm run server`) and make sure `/api` is reachable. Without it the app runs in local demo mode. |
| `Admin session expired` toast | The server token lasts 12 hours; open `/login` and sign in again. |
| Database page shows "Admin login is required" | The `/api/db/*` endpoints need a valid admin token - sign in at `/login` first. |
| `Cannot reach MySQL/MariaDB at localhost:3306` | Start **MySQL** in the XAMPP Control Panel, or set `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` to match your MySQL server. |
| `Access denied for user 'root'@'localhost'` | The MySQL root account has a password. Set it: `$env:DB_PASSWORD = "..."` before `npm run server` (or use another `DB_USER`). |
| phpMyAdmin is not reachable at `http://localhost/phpmyadmin/` | Start **Apache** (and MySQL) in the XAMPP Control Panel. The portal does not need Apache. |
| Tables are empty after switching to MySQL | The SQLite file was not found under `data/ter-portal.db`. Put the old file there and restart, or add cards again - after the first start the flag in `portal_meta` prevents re-importing. |
| Database still shows the old `portal_state` table | That is the old SQLite file; the portal now uses the MySQL database `ter_portal`. Open it in phpMyAdmin or the `/database` page. |
| Uploaded image is missing after deploy | The card still points to a legacy `/uploads/<file>` path and the file is gone. Re-upload the image in the edit form so it is stored in `module_images`. |
| Render build fails | Check the Build logs. Locally `npm install && npm run build` must succeed; Node 22+ is required. |
| Render API returns 500 / database errors | Check Render → Logs and the `DB_*` variables; managed MySQL usually needs `DB_SSL=1`. Confirm the database host allows connections from Render. |
| Render app sleeps / first visit is slow | Expected on the free plan: the instance sleeps after 15 minutes without traffic and takes 30-60 seconds to wake up. |
| `ER_ACCESS_DENIED` or `Cannot connect to MySQL` on Render | Fix the environment variables, then save - Render redeploys automatically and the new values are picked up. |
| Browser shows "blocked by CORS policy" with Vercel + Render | Add the Vercel URL to Render's `CORS_ORIGIN`, save (Render redeploys), then reload. |
| Vercel site shows demo data / images do not load | `VITE_API_BASE_URL` was empty when the frontend was built. Set it to the Render URL and redeploy on Vercel. |
| Port 5173 already in use | Vite picks the next free port automatically; check the terminal output for the actual URL. Or run `npm run dev -- --port 3000`. |
| Tailwind classes do not apply | Make sure `@tailwindcss/vite` is in `vite.config.js`, `tailwindcss` is installed, and `src/index.css` starts with `@import "tailwindcss";` and is imported in `src/main.jsx`. |
| Blank page after login | Open the browser console. A blank page usually means a JavaScript error - check the terminal running Vite for the stack trace. |
| Refreshing logs me out | The admin session is stored per browser tab in `sessionStorage`; a new tab needs a fresh sign-in. |
| My added card disappeared | If the server was not running, changes went to `localStorage` only. Run `npm run server` and check the `ter_portal` database (phpMyAdmin or `/database`). |
| The "Open TER App" link goes to example.com | Expected - it is a placeholder. Replace `liveUrl` values as described in section 12. |
| Styles look broken on mobile | Check the browser zoom and viewport; the layout is responsive with a drawer sidebar under 1024px. |
| Copy to D: fails | Run `COPY-TO-D-DRIVE.bat` as administrator, or copy the folder manually with File Explorer. |

---

**TER Documentation Portal** - documentation and training companion for the Travel & Expense Reimbursement application. React + Vite frontend with a Node server and a MariaDB / MySQL database (phpMyAdmin ready).
