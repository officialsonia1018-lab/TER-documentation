import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { TER_MODULES } from '../src/data/terModules.js';

// Shared storage for the portal (MariaDB / MySQL, e.g. the MySQL bundled with XAMPP).
//
// Database layout (created automatically on first start):
//   modules          one row per documentation card
//   module_sections  content sections, linked to a card by module_id
//   admin_sessions   login tokens for the administrator
//   portal_meta      internal flags (seed / import marker)
//   module_images    uploaded section images (stored as BLOBs, served on
//                    /api/images/<id>, so no writable disk is required)
//
// On the first start the existing SQLite data (data/ter-portal.db) is copied
// into MySQL; the SQLite file is left untouched as a backup.

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isServerless = Boolean(process.env.VERCEL);
// Serverless hosts only allow writes under /tmp (and it is wiped between
// invocations), so images live in the database and this folder is fallback.
const dataDir = path.resolve(
  process.env.DATA_DIR || (isServerless ? '/tmp/ter-portal-data' : path.join(rootDir, 'data'))
);
export const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(dataDir, 'uploads'));
const sqlitePath = path.join(dataDir, 'ter-portal.db');

try {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch {
  // Read-only filesystem (serverless deployment): image storage is in MySQL.
}

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT || 3306);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const databaseName = process.env.DB_NAME || 'ter_portal';
const dbSsl = /^(1|true|yes)$/i.test(process.env.DB_SSL || '');

if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
  throw new Error(`Invalid DB_NAME "${databaseName}": use letters, digits and underscores only.`);
}

const connectionOptions = {
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  charset: 'utf8mb4_unicode_ci',
  ...(dbSsl ? { ssl: { rejectUnauthorized: false } } : {}),
};

export const dbInfo = { host: dbHost, port: dbPort, user: dbUser, database: databaseName };

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_MODULES = 500;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_ID = /^[a-f0-9-]{10,64}$/i;
const UPLOAD_NAME = /^[a-f0-9-]+\.(jpg|png|webp)$/i;
const IMAGE_DATA_URL = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/;
const MAX_QUERY_ROWS = 500;

const TABLE_DEFS = {
  modules: {
    name: 'modules',
    pk: 'id',
    editable: [
      'position',
      'slug',
      'title',
      'short_description',
      'category',
      'audience',
      'icon',
      'status',
      'live_url',
      'summary',
      'purpose',
      'steps',
      'rules',
      'example',
      'workflow',
      'related_module_ids',
    ],
    jsonColumns: ['audience', 'steps', 'rules', 'workflow', 'related_module_ids'],
  },
  module_sections: {
    name: 'module_sections',
    pk: 'id',
    editable: ['position', 'title', 'paragraphs', 'bullets', 'image', 'image_placeholder'],
    jsonColumns: ['paragraphs', 'bullets'],
  },
  admin_sessions: {
    name: 'admin_sessions',
    pk: 'token',
    editable: [],
    jsonColumns: [],
  },
  portal_meta: {
    name: 'portal_meta',
    pk: 'meta_key',
    editable: [],
    jsonColumns: [],
  },
};

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function seedModules() {
  return JSON.parse(JSON.stringify(TER_MODULES));
}

function toStoredModule(input) {
  const source = input && typeof input === 'object' ? input : {};
  const id = asString(source.id).trim();
  return {
    id,
    title: asString(source.title).trim(),
    slug: asString(source.slug) || id,
    shortDescription: asString(source.shortDescription),
    category: asString(source.category, 'Overview'),
    audience: asStringArray(source.audience),
    icon: asString(source.icon, 'home'),
    status: asString(source.status, 'Available'),
    liveUrl: typeof source.liveUrl === 'string' && source.liveUrl.trim() ? source.liveUrl.trim() : null,
    summary: asString(source.summary),
    purpose: asString(source.purpose),
    steps: asStringArray(source.steps),
    rules: asStringArray(source.rules),
    example: asString(source.example),
    workflow: asStringArray(source.workflow),
    sections: (Array.isArray(source.sections) ? source.sections : []).map((section) => {
      const item = section && typeof section === 'object' ? section : {};
      return {
        title: asString(item.title).trim(),
        paragraphs: asStringArray(item.paragraphs).map((value) => value.trim()).filter(Boolean),
        bullets: asStringArray(item.bullets).map((value) => value.trim()).filter(Boolean),
        image: typeof item.image === 'string' ? item.image : null,
        imagePlaceholder: typeof item.imagePlaceholder === 'string' ? item.imagePlaceholder : null,
      };
    }),
    relatedModuleIds: asStringArray(source.relatedModuleIds),
  };
}

// ------------------------------------------------------------ initialization

async function createTables(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS modules (
      id                  VARCHAR(191) NOT NULL PRIMARY KEY,
      position            INT NOT NULL,
      slug                VARCHAR(191) NOT NULL,
      title               VARCHAR(255) NOT NULL,
      short_description   TEXT NOT NULL,
      category            VARCHAR(100) NOT NULL,
      audience            MEDIUMTEXT NOT NULL,
      icon                VARCHAR(64) NOT NULL,
      status              VARCHAR(100) NOT NULL,
      live_url            TEXT NULL,
      summary             MEDIUMTEXT NOT NULL,
      purpose             MEDIUMTEXT NOT NULL,
      steps               MEDIUMTEXT NOT NULL,
      rules               MEDIUMTEXT NOT NULL,
      example             MEDIUMTEXT NOT NULL,
      workflow            MEDIUMTEXT NOT NULL,
      related_module_ids  MEDIUMTEXT NOT NULL,
      created_at          VARCHAR(40) NOT NULL,
      updated_at          VARCHAR(40) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS module_sections (
      id                 INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      module_id          VARCHAR(191) NOT NULL,
      position           INT NOT NULL,
      title              VARCHAR(255) NOT NULL,
      paragraphs         MEDIUMTEXT NOT NULL,
      bullets            MEDIUMTEXT NOT NULL,
      image              VARCHAR(255) NULL,
      image_placeholder  TEXT NULL,
      KEY idx_module_sections_module (module_id, position),
      CONSTRAINT fk_module_sections_module
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS module_images (
      id          VARCHAR(64) NOT NULL PRIMARY KEY,
      mime        VARCHAR(40) NOT NULL,
      bytes       INT NOT NULL,
      data        MEDIUMBLOB NOT NULL,
      created_at  VARCHAR(40) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token       CHAR(64) NOT NULL PRIMARY KEY,
      expires_at  BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS portal_meta (
      meta_key  VARCHAR(190) NOT NULL PRIMARY KEY,
      value     TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getMetaWith(conn, key) {
  const [rows] = await conn.execute('SELECT value FROM portal_meta WHERE meta_key = ?', [key]);
  return rows.length ? rows[0].value : null;
}

async function setMetaWith(conn, key, value) {
  await conn.execute(
    'INSERT INTO portal_meta (meta_key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
    [key, value]
  );
}

// Reads the previous data from SQLite (legacy portal_state JSON row or the
// normalized tables). Returns null when there is nothing to import.
async function readSqliteSource() {
  if (!fs.existsSync(sqlitePath)) {
    return null;
  }

  let DatabaseSync;
  try {
    ({ DatabaseSync } = await import('node:sqlite'));
  } catch {
    return null;
  }

  let legacyDb;
  try {
    legacyDb = new DatabaseSync(sqlitePath, { readOnly: true });
  } catch {
    try {
      legacyDb = new DatabaseSync(sqlitePath);
    } catch {
      return null;
    }
  }

  try {
    const tableRows = legacyDb
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all();
    const tables = new Set(tableRows.map((row) => row.name));

    if (tables.has('portal_state')) {
      const row = legacyDb.prepare('SELECT modules, updated_at FROM portal_state WHERE id = 1').get();
      if (!row) {
        return null;
      }
      let list = [];
      try {
        const parsed = JSON.parse(row.modules);
        list = Array.isArray(parsed) ? parsed : [];
      } catch {
        list = [];
      }
      if (list.length === 0) {
        return null;
      }
      return {
        modules: list.map((item) => toStoredModule(item)),
        createdAtById: new Map(),
        updatedAt: row.updated_at || undefined,
      };
    }

    if (!tables.has('modules')) {
      return null;
    }

    const moduleRows = legacyDb.prepare('SELECT * FROM modules ORDER BY position, id').all();
    if (moduleRows.length === 0) {
      return null;
    }
    const sectionRows = tables.has('module_sections')
      ? legacyDb.prepare('SELECT * FROM module_sections ORDER BY module_id, position, id').all()
      : [];

    const sectionsByModule = new Map();
    for (const row of sectionRows) {
      if (!sectionsByModule.has(row.module_id)) {
        sectionsByModule.set(row.module_id, []);
      }
      sectionsByModule.get(row.module_id).push({
        title: row.title,
        paragraphs: parseJsonArray(row.paragraphs),
        bullets: parseJsonArray(row.bullets),
        image: row.image || null,
        imagePlaceholder: row.image_placeholder || null,
      });
    }

    return {
      modules: moduleRows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        shortDescription: row.short_description,
        category: row.category,
        audience: parseJsonArray(row.audience),
        icon: row.icon,
        status: row.status,
        liveUrl: row.live_url,
        summary: row.summary,
        purpose: row.purpose,
        steps: parseJsonArray(row.steps),
        rules: parseJsonArray(row.rules),
        example: row.example,
        workflow: parseJsonArray(row.workflow),
        sections: sectionsByModule.get(row.id) || [],
        relatedModuleIds: parseJsonArray(row.related_module_ids),
      })),
      createdAtById: new Map(moduleRows.map((row) => [row.id, row.created_at])),
    };
  } catch {
    return null;
  } finally {
    legacyDb.close();
  }
}

async function importSqliteData(conn) {
  const seeded = await getMetaWith(conn, 'seeded');
  const [countRows] = await conn.query('SELECT COUNT(*) AS n FROM modules');
  if (seeded === '1' || Number(countRows[0].n) > 0) {
    if (!seeded) {
      await setMetaWith(conn, 'seeded', '1');
    }
    return;
  }

  const source = await readSqliteSource();
  const modules = source ? source.modules : seedModules().map((item) => toStoredModule(item));
  const createdAtById = source ? source.createdAtById : new Map();

  await insertModules(conn, modules, createdAtById, source?.updatedAt);
  await setMetaWith(conn, 'seeded', '1');
  await setMetaWith(conn, 'imported_from', source ? 'sqlite (data/ter-portal.db)' : 'built-in seed');
  await setMetaWith(conn, 'imported_at', new Date().toISOString());
}

async function initStore() {
  let bootstrap;
  try {
    bootstrap = await mysql.createConnection({ ...connectionOptions, database: databaseName });
  } catch (error) {
    if (error.code === 'ER_BAD_DB_ERROR') {
      let admin;
      try {
        admin = await mysql.createConnection(connectionOptions);
        await admin.query(
          `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        await admin.end();
        bootstrap = await mysql.createConnection({ ...connectionOptions, database: databaseName });
      } catch (createError) {
        if (admin) {
          try {
            await admin.end();
          } catch {
            // Ignore errors while closing the bootstrap connection.
          }
        }
        createError.message =
          `Database "${databaseName}" is missing and could not be created ` +
          `(${createError.message}). Create it in your database provider and grant the DB user access.`;
        throw createError;
      }
    } else {
      const hint =
        `Cannot reach MySQL/MariaDB at ${dbHost}:${dbPort}. ` +
        'Start MySQL (XAMPP Control Panel -> MySQL -> Start) or set DB_HOST / DB_PORT / DB_USER / DB_PASSWORD.';
      error.message = `${hint} (${error.message})`;
      throw error;
    }
  }

  const created = mysql.createPool({
    ...connectionOptions,
    database: databaseName,
    waitForConnections: true,
    connectionLimit: process.env.VERCEL ? 3 : 5,
  });

  try {
    await created.query('SELECT 1');
    await createTables(created);
    await importSqliteData(created);
  } finally {
    try {
      await bootstrap.end();
    } catch {
      // Ignore errors while closing the bootstrap connection.
    }
  }
  return created;
}

// Connection is created lazily on first use (serverless functions must be able
// to load the module before any request arrives; local startup awaits it).
let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = initStore().catch((error) => {
      poolPromise = null;
      console.error(error.message);
      console.error('The portal server cannot start without the database.');
      if (!process.env.VERCEL) {
        process.exit(1);
      }
      throw error;
    });
  }
  return poolPromise;
}

export function ensureStore() {
  return getPool();
}

const pool = {
  query: async (...args) => (await getPool()).query(...args),
  execute: async (...args) => (await getPool()).execute(...args),
  getConnection: async () => (await getPool()).getConnection(),
};

// ------------------------------------------------------------ module storage

async function insertModules(conn, modules, createdAtById, updatedAtOverride) {
  const now = new Date().toISOString();

  for (const [index, module] of modules.entries()) {
    const createdAt = createdAtById.get(module.id) || now;
    await conn.execute(
      `INSERT INTO modules (
        id, position, slug, title, short_description, category, audience, icon, status,
        live_url, summary, purpose, steps, rules, example, workflow, related_module_ids,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        module.id,
        index,
        module.slug,
        module.title,
        module.shortDescription,
        module.category,
        JSON.stringify(module.audience),
        module.icon,
        module.status,
        module.liveUrl,
        module.summary,
        module.purpose,
        JSON.stringify(module.steps),
        JSON.stringify(module.rules),
        module.example,
        JSON.stringify(module.workflow),
        JSON.stringify(module.relatedModuleIds),
        createdAt,
        updatedAtOverride || now,
      ]
    );

    for (const [sectionIndex, section] of module.sections.entries()) {
      await conn.execute(
        `INSERT INTO module_sections (
          module_id, position, title, paragraphs, bullets, image, image_placeholder
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          module.id,
          sectionIndex,
          section.title,
          JSON.stringify(section.paragraphs),
          JSON.stringify(section.bullets),
          section.image,
          section.imagePlaceholder,
        ]
      );
    }
  }
}

export async function listModules() {
  const [moduleRows] = await pool.query('SELECT * FROM modules ORDER BY position, id');
  const [sectionRows] = await pool.query(
    'SELECT * FROM module_sections ORDER BY module_id, position, id'
  );

  const sectionsByModule = new Map();
  for (const row of sectionRows) {
    if (!sectionsByModule.has(row.module_id)) {
      sectionsByModule.set(row.module_id, []);
    }
    sectionsByModule.get(row.module_id).push({
      title: row.title,
      paragraphs: parseJsonArray(row.paragraphs),
      bullets: parseJsonArray(row.bullets),
      image: row.image || null,
      imagePlaceholder: row.image_placeholder || null,
    });
  }

  return moduleRows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription: row.short_description,
    category: row.category,
    audience: parseJsonArray(row.audience),
    icon: row.icon,
    status: row.status,
    liveUrl: row.live_url,
    summary: row.summary,
    purpose: row.purpose,
    steps: parseJsonArray(row.steps),
    rules: parseJsonArray(row.rules),
    example: row.example,
    workflow: parseJsonArray(row.workflow),
    sections: sectionsByModule.get(row.id) || [],
    relatedModuleIds: parseJsonArray(row.related_module_ids),
  }));
}

// Uploaded section images are stored inside the database (module_images), so
// the portal works on hosts without a writable disk (for example Vercel).

async function imageExists(id) {
  const [rows] = await pool.execute('SELECT id FROM module_images WHERE id = ?', [id]);
  return rows.length > 0;
}

export async function getImage(id) {
  if (!IMAGE_ID.test(id)) {
    return null;
  }
  const [rows] = await pool.execute('SELECT mime, bytes, data FROM module_images WHERE id = ?', [
    id,
  ]);
  if (rows.length === 0) {
    return null;
  }
  return { mime: rows[0].mime, bytes: Number(rows[0].bytes), data: rows[0].data };
}

async function persistSectionImages(sections) {
  const imageIds = new Set();

  for (const section of sections) {
    const image = section.image;
    if (!image || typeof image !== 'string') {
      section.image = null;
      continue;
    }

    const stored = image.match(/^\/api\/images\/([a-f0-9-]{10,64})$/i);
    if (stored) {
      if (await imageExists(stored[1])) {
        imageIds.add(stored[1]);
      } else {
        section.image = null;
      }
      continue;
    }

    if (image.startsWith('/uploads/')) {
      // Legacy filesystem image: keep the reference only while the file exists
      // (local development); on a diskless host it is dropped.
      const name = image.slice('/uploads/'.length);
      if (!UPLOAD_NAME.test(name) || !fs.existsSync(path.join(uploadsDir, name))) {
        section.image = null;
      }
      continue;
    }

    const match = image.match(IMAGE_DATA_URL);
    if (!match) {
      section.image = null;
      continue;
    }
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
      section.image = null;
      continue;
    }
    const mime = match[1] === 'jpg' ? 'jpeg' : match[1];
    const id = crypto.randomUUID();
    await pool.execute(
      'INSERT INTO module_images (id, mime, bytes, data, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, `image/${mime}`, buffer.length, buffer, new Date().toISOString()]
    );
    imageIds.add(id);
    section.image = `/api/images/${id}`;
  }

  return imageIds;
}

async function collectReferencedImages() {
  const imageIds = new Set();
  const files = new Set();
  const [rows] = await pool.query('SELECT image FROM module_sections WHERE image IS NOT NULL');
  for (const row of rows) {
    if (typeof row.image !== 'string') {
      continue;
    }
    const stored = row.image.match(/^\/api\/images\/([a-f0-9-]{10,64})$/i);
    if (stored) {
      imageIds.add(stored[1]);
      continue;
    }
    if (row.image.startsWith('/uploads/')) {
      const name = row.image.slice('/uploads/'.length);
      if (UPLOAD_NAME.test(name)) {
        files.add(name);
      }
    }
  }
  return { imageIds, files };
}

async function removeOrphanedImages(referencedIds) {
  const [rows] = await pool.query('SELECT id FROM module_images');
  for (const row of rows) {
    if (!referencedIds.has(row.id)) {
      await pool.execute('DELETE FROM module_images WHERE id = ?', [row.id]);
    }
  }
}

function removeOrphanedUploads(referenced) {
  if (!fs.existsSync(uploadsDir)) {
    return;
  }
  for (const fileName of fs.readdirSync(uploadsDir)) {
    if (!referenced.has(fileName)) {
      try {
        fs.unlinkSync(path.join(uploadsDir, fileName));
      } catch {
        // Ignore files that cannot be removed (locked or already gone).
      }
    }
  }
}

async function sanitizeModule(input) {
  if (!input || typeof input !== 'object') {
    throw httpError('Every module must be an object.', 400);
  }
  const module = toStoredModule(input);
  if (!module.id || !module.title) {
    throw httpError('Every module needs an id and a title.', 400);
  }
  await persistSectionImages(module.sections);
  return module;
}

export async function replaceModules(rawModules) {
  if (!Array.isArray(rawModules)) {
    throw httpError('"modules" must be an array.', 400);
  }
  if (rawModules.length > MAX_MODULES) {
    throw httpError(`Too many modules (limit ${MAX_MODULES}).`, 400);
  }

  const modules = [];
  for (const rawModule of rawModules) {
    modules.push(await sanitizeModule(rawModule));
  }
  const ids = new Set();
  for (const module of modules) {
    if (ids.has(module.id)) {
      throw httpError(`Duplicate module id: ${module.id}`, 400);
    }
    ids.add(module.id);
  }

  const [existingRows] = await pool.query('SELECT id, created_at FROM modules');
  const createdAtById = new Map(existingRows.map((row) => [row.id, row.created_at]));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM module_sections');
    await conn.query('DELETE FROM modules');
    await insertModules(conn, modules, createdAtById);
    await conn.commit();
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      // The transaction may already be rolled back.
    }
    const referenced = await collectReferencedImages();
    await removeOrphanedImages(referenced.imageIds);
    removeOrphanedUploads(referenced.files);
    throw error;
  } finally {
    conn.release();
  }

  const referenced = await collectReferencedImages();
  await removeOrphanedImages(referenced.imageIds);
  removeOrphanedUploads(referenced.files);

  return modules;
}

// ---------------------------------------------------------------- sessions

export async function createAdminSession() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await pool.execute('DELETE FROM admin_sessions WHERE expires_at < ?', [Date.now()]);
  await pool.execute('INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)', [
    token,
    expiresAt,
  ]);
  return token;
}

export async function deleteAdminSession(token) {
  if (token) {
    await pool.execute('DELETE FROM admin_sessions WHERE token = ?', [token]);
  }
}

export async function isAdminSessionValid(token) {
  if (!token) {
    return false;
  }
  const [rows] = await pool.execute('SELECT expires_at FROM admin_sessions WHERE token = ?', [
    token,
  ]);
  if (rows.length === 0) {
    return false;
  }
  if (Number(rows[0].expires_at) < Date.now()) {
    await deleteAdminSession(token);
    return false;
  }
  return true;
}

// ------------------------------------------------------- database admin API

function requireTable(table) {
  const def = TABLE_DEFS[table];
  if (!def) {
    throw httpError(`Unknown table: ${table}`, 404);
  }
  return def;
}

async function columnInfo(def) {
  const [rows] = await pool.query(`SHOW COLUMNS FROM \`${def.name}\``);
  return rows.map((column) => ({
    name: column.Field,
    type: column.Type,
    notnull: column.Null === 'NO',
    pk: column.Key === 'PRI',
    editable: def.editable.includes(column.Field),
    json: def.jsonColumns.includes(column.Field),
  }));
}

export async function getDatabaseOverview() {
  const tables = [];
  for (const def of Object.values(TABLE_DEFS)) {
    const [countRows] = await pool.query(`SELECT COUNT(*) AS n FROM \`${def.name}\``);
    tables.push({
      name: def.name,
      pk: def.pk,
      rows: Number(countRows[0].n),
      columns: await columnInfo(def),
    });
  }

  const [sizeRows] = await pool.query(
    `SELECT COALESCE(SUM(data_length + index_length), 0) AS bytes
       FROM information_schema.TABLES
      WHERE table_schema = ?`,
    [databaseName]
  );

  const [imageRows] = await pool.query('SELECT COUNT(*) AS n FROM module_images');
  const uploads = fs.existsSync(uploadsDir)
    ? fs.readdirSync(uploadsDir).filter((file) => UPLOAD_NAME.test(file))
    : [];

  return {
    tables,
    database: {
      engine: 'MariaDB / MySQL',
      name: databaseName,
      host: dbHost,
      port: dbPort,
      bytes: Number(sizeRows[0].bytes),
    },
    uploads: {
      folder: uploadsDir,
      count: Number(imageRows[0].n) + uploads.length,
      database: Number(imageRows[0].n),
    },
  };
}

export async function getTableRows(table, limit = 25, offset = 0) {
  const def = requireTable(table);
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 200);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const [countRows] = await pool.query(`SELECT COUNT(*) AS n FROM \`${def.name}\``);
  const [rows] = await pool.query(
    `SELECT * FROM \`${def.name}\` ORDER BY \`${def.pk}\` LIMIT ${safeLimit} OFFSET ${safeOffset}`
  );

  return {
    table: def.name,
    pk: def.pk,
    columns: await columnInfo(def),
    rows: rows.map((row) => ({ ...row })),
    total: Number(countRows[0].n),
    limit: safeLimit,
    offset: safeOffset,
  };
}

async function normalizeEditableValue(def, column, value) {
  if (def.jsonColumns.includes(column)) {
    let parsed = value;
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch {
        throw httpError(`${column} must be a JSON array of strings.`, 400);
      }
    }
    if (!Array.isArray(parsed)) {
      throw httpError(`${column} must be a JSON array of strings.`, 400);
    }
    const items = parsed.map((item) => String(item).trim()).filter(Boolean);
    return JSON.stringify(items);
  }

  if (column === 'position') {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0) {
      throw httpError('position must be a whole number.', 400);
    }
    return number;
  }

  if (value === null || value === undefined) {
    if (def.name === 'admin_sessions' || column === 'title') {
      throw httpError(`${column} cannot be empty.`, 400);
    }
    return null;
  }

  const text = String(value);
  if (column === 'image') {
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }
    const stored = trimmed.match(/^\/api\/images\/([a-f0-9-]{10,64})$/i);
    if (stored) {
      if (!(await imageExists(stored[1]))) {
        throw httpError(`Image ${stored[1]} does not exist.`, 400);
      }
      return trimmed;
    }
    const fileName = trimmed.startsWith('/uploads/') ? trimmed.slice('/uploads/'.length) : '';
    if (!UPLOAD_NAME.test(fileName) || !fs.existsSync(path.join(uploadsDir, fileName))) {
      throw httpError('image must be an /api/images/ path or an existing /uploads/ file.', 400);
    }
    return trimmed;
  }
  if (column === 'image_placeholder' || column === 'live_url') {
    return text.trim() ? text.trim() : null;
  }
  if (column === 'title') {
    const trimmed = text.trim();
    if (!trimmed) {
      throw httpError('title cannot be empty.', 400);
    }
    return trimmed;
  }
  return text;
}

export async function updateTableRow(table, rowId, changes) {
  const def = requireTable(table);
  if (def.editable.length === 0) {
    throw httpError('This table is read-only.', 400);
  }
  if (!changes || typeof changes !== 'object') {
    throw httpError('"changes" must be an object.', 400);
  }

  const [existingRows] = await pool.execute(
    `SELECT * FROM \`${def.name}\` WHERE \`${def.pk}\` = ?`,
    [rowId]
  );
  if (existingRows.length === 0) {
    throw httpError('Row not found.', 404);
  }

  const entries = Object.entries(changes).filter(([column]) => def.editable.includes(column));
  if (entries.length === 0) {
    throw httpError('No editable columns were provided.', 400);
  }

  const values = [];
  for (const [column, value] of entries) {
    values.push(await normalizeEditableValue(def, column, value));
  }
  const now = new Date().toISOString();
  const setClauses = entries.map(([column]) => `\`${column}\` = ?`);

  if (def.name === 'modules') {
    setClauses.push('`updated_at` = ?');
    values.push(now);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE \`${def.name}\` SET ${setClauses.join(', ')} WHERE \`${def.pk}\` = ?`,
      [...values, rowId]
    );

    if (def.name === 'module_sections') {
      const [parentRows] = await conn.execute(
        'SELECT module_id FROM module_sections WHERE id = ?',
        [rowId]
      );
      if (parentRows.length > 0) {
        await conn.execute('UPDATE modules SET updated_at = ? WHERE id = ?', [
          now,
          parentRows[0].module_id,
        ]);
      }
    }
    await conn.commit();
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      // The transaction may already be rolled back.
    }
    throw error;
  } finally {
    conn.release();
  }

  const [rowRows] = await pool.execute(
    `SELECT * FROM \`${def.name}\` WHERE \`${def.pk}\` = ?`,
    [rowId]
  );
  return { table: def.name, pk: def.pk, row: { ...rowRows[0] } };
}

export async function runReadOnlyQuery(sql) {
  const trimmed = typeof sql === 'string' ? sql.trim() : '';
  if (!trimmed) {
    throw httpError('Enter a SQL query.', 400);
  }
  const statement = trimmed.replace(/;\s*$/, '');
  if (statement.includes(';')) {
    throw httpError('Run one statement at a time.', 400);
  }
  if (!/^(select|with)\b/i.test(statement)) {
    throw httpError('Only SELECT / WITH queries are allowed here (the console is read-only).', 400);
  }
  if (/(\binto\s+(outfile|dumpfile)\b|\bfor\s+update\b|\block\s+in\s+share\s+mode\b)/i.test(statement)) {
    throw httpError('Only plain SELECT queries are allowed (file writes and row locks are blocked).', 400);
  }

  const conn = await pool.getConnection();
  try {
    await conn.query('START TRANSACTION READ ONLY');
    const [rows, fields] = await conn.query(statement);
    const columns = Array.isArray(fields) ? fields.map((field) => field.name) : [];
    const allRows = Array.isArray(rows) ? rows : [];
    return {
      columns,
      rows: allRows.slice(0, MAX_QUERY_ROWS).map((row) => ({ ...row })),
      total: allRows.length,
      truncated: allRows.length > MAX_QUERY_ROWS,
    };
  } catch (error) {
    if (error instanceof Error && !error.statusCode) {
      throw httpError(`SQL error: ${error.message}`, 400);
    }
    throw error;
  } finally {
    try {
      await conn.query('ROLLBACK');
    } catch {
      // Ignore rollback failures on failed connections.
    }
    conn.release();
  }
}
