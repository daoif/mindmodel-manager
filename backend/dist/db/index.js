"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = exports.initDb = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const DB_PATH = path_1.default.join(__dirname, '../../../data/mindmodel.db');
let db = null;
// 初始化数据库
const initDb = async () => {
    // 确保数据目录存在
    await fs_extra_1.default.ensureDir(path_1.default.dirname(DB_PATH));
    db = await (0, sqlite_1.open)({
        filename: DB_PATH,
        driver: sqlite3_1.default.Database
    });
    await db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS model_tags (
      model_id TEXT,
      dimension TEXT,
      value TEXT,
      PRIMARY KEY (model_id, dimension, value),
      FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tag_dimensions (
      name TEXT PRIMARY KEY,
      display_order INTEGER
    );

    CREATE TABLE IF NOT EXISTS doc_types (
      name TEXT PRIMARY KEY,
      display_order INTEGER
    );
  `);
    await seedData();
    console.log('数据库初始化完成');
    return db;
};
exports.initDb = initDb;
// 获取数据库连接
const getDb = async () => {
    if (!db) {
        await (0, exports.initDb)();
    }
    return db;
};
exports.getDb = getDb;
// 填充初始数据
const seedData = async () => {
    if (!db)
        return;
    // 检查是否需要填充 tag_dimensions
    const tagCount = await db.get('SELECT count(*) as count FROM tag_dimensions');
    if (tagCount.count === 0) {
        const dimensions = ['场景', '阶段', '类型', '分类'];
        for (let i = 0; i < dimensions.length; i++) {
            await db.run('INSERT INTO tag_dimensions (name, display_order) VALUES (?, ?)', [dimensions[i], i + 1]);
        }
        console.log('已填充 tag_dimensions 数据');
    }
    // 检查是否需要填充 doc_types
    const docTypeCount = await db.get('SELECT count(*) as count FROM doc_types');
    if (docTypeCount.count === 0) {
        const types = ['介绍', '使用场景', '陪练提示词', '内化提示词', '产出提示词'];
        for (let i = 0; i < types.length; i++) {
            await db.run('INSERT INTO doc_types (name, display_order) VALUES (?, ?)', [types[i], i + 1]);
        }
        console.log('已填充 doc_types 数据');
    }
};
