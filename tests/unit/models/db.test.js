/**
 * Unit Tests: Database Module
 *
 * Tests getDb, setDb, closeDb, and initializeSchema functions.
 * Covers singleton pattern, directory creation, and cleanup paths.
 */

'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// We need to test db.js module. Since it has module-level state (_db singleton),
// we must be careful with require caching.

describe('Database Module', () => {
  let dbModule;
  const testDbDir = path.join(__dirname, '..', '..', '..', 'tmp_test_db_' + Date.now());

  beforeEach(() => {
    // Clear the require cache to get a fresh module with _db = null
    const dbModulePath = require.resolve('../../../src/models/db');
    delete require.cache[dbModulePath];
    dbModule = require('../../../src/models/db');
  });

  afterEach(() => {
    // Clean up any open db connections
    try {
      dbModule.closeDb();
    } catch (e) {
      // ignore
    }

    // Clean up test directory
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  // ===================================================================
  // initializeSchema
  // ===================================================================

  describe('initializeSchema', () => {
    test('should create tables on a fresh database', () => {
      const db = new Database(':memory:');
      dbModule.initializeSchema(db);

      // Verify tasks table exists
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('tasks');
      expect(tableNames).toContain('actuals');
      expect(tableNames).toContain('schema_version');

      db.close();
    });
  });

  // ===================================================================
  // getDb
  // ===================================================================

  describe('getDb', () => {
    test('should create database at specified path', () => {
      const dbPath = path.join(testDbDir, 'test.db');
      const db = dbModule.getDb(dbPath);

      expect(db).toBeDefined();
      expect(db.open).toBe(true);

      // Verify the directory was created
      expect(fs.existsSync(testDbDir)).toBe(true);

      // Verify the database file was created
      expect(fs.existsSync(dbPath)).toBe(true);

      dbModule.closeDb();
    });

    test('should return the same instance on subsequent calls (singleton)', () => {
      const dbPath = path.join(testDbDir, 'singleton.db');
      const db1 = dbModule.getDb(dbPath);
      const db2 = dbModule.getDb(dbPath);

      expect(db1).toBe(db2);

      dbModule.closeDb();
    });

    test('should create directory recursively if it does not exist', () => {
      const deepDir = path.join(testDbDir, 'a', 'b', 'c');
      const dbPath = path.join(deepDir, 'deep.db');

      expect(fs.existsSync(deepDir)).toBe(false);

      const db = dbModule.getDb(dbPath);
      expect(db.open).toBe(true);
      expect(fs.existsSync(deepDir)).toBe(true);

      dbModule.closeDb();
    });

    test('should initialize schema on the database', () => {
      const dbPath = path.join(testDbDir, 'schema.db');
      const db = dbModule.getDb(dbPath);

      // Verify schema was applied
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('tasks');
      expect(tableNames).toContain('actuals');

      dbModule.closeDb();
    });
  });

  // ===================================================================
  // setDb
  // ===================================================================

  describe('setDb', () => {
    test('should set the database instance for dependency injection', () => {
      const memDb = new Database(':memory:');
      dbModule.initializeSchema(memDb);
      dbModule.setDb(memDb);

      // getDb should return the injected instance
      const result = dbModule.getDb();
      expect(result).toBe(memDb);

      memDb.close();
    });
  });

  // ===================================================================
  // closeDb
  // ===================================================================

  describe('closeDb', () => {
    test('should close an open database', () => {
      const dbPath = path.join(testDbDir, 'close_test.db');
      const db = dbModule.getDb(dbPath);
      expect(db.open).toBe(true);

      dbModule.closeDb();
      // After close, the db reference in the module is null.
      // Getting again should create a new one.
    });

    test('should handle double close gracefully (no error)', () => {
      const dbPath = path.join(testDbDir, 'double_close.db');
      dbModule.getDb(dbPath);

      // Close first time
      dbModule.closeDb();

      // Close second time - should not throw
      expect(() => dbModule.closeDb()).not.toThrow();
    });

    test('should handle close when no database was opened', () => {
      // Fresh module, no db opened
      expect(() => dbModule.closeDb()).not.toThrow();
    });
  });
});
