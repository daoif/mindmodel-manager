import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs-extra';

import { DATA_DIR } from '../config';

const DB_PATH = path.join(DATA_DIR, 'mindmodel.db');

let db: Database | null = null;

// 初始化数据库
export const initDb = async () => {
  // 确保数据目录存在
  await fs.ensureDir(path.dirname(DB_PATH));

  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  // 启用外键约束（SQLite默认关闭）
  await db.exec('PRAGMA foreign_keys = ON;');

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
      display_order INTEGER,
      color TEXT,
      show_in_nav BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS doc_types (
      name TEXT PRIMARY KEY,
      display_order INTEGER,
      show_in_copy BOOLEAN DEFAULT 1,
      short_name TEXT
    );

    CREATE TABLE IF NOT EXISTS model_docs (
      model_id TEXT,
      doc_type TEXT,
      PRIMARY KEY (model_id, doc_type),
      FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
    );
  `);

  await seedData();

  console.log('数据库初始化完成');
  return db;
};

// 获取数据库连接
export const getDb = async () => {
  if (!db) {
    await initDb();
  }
  return db!;
};

// 填充初始数据
const seedData = async () => {
  if (!db) return;

  // 检查是否需要填充 tag_dimensions
  const tagCount = await db.get('SELECT count(*) as count FROM tag_dimensions');
  if (tagCount.count === 0) {
    const dimensions = [
      { name: '场景', color: 'bg-blue-100 text-blue-800' },
      { name: '阶段', color: 'bg-green-100 text-green-800' },
      { name: '类型', color: 'bg-purple-100 text-purple-800' },
      { name: '分类', color: 'bg-orange-100 text-orange-800' }
    ];
    for (let i = 0; i < dimensions.length; i++) {
      await db.run(
        'INSERT INTO tag_dimensions (name, display_order, color) VALUES (?, ?, ?)',
        [dimensions[i].name, i + 1, dimensions[i].color]
      );
    }
    console.log('已填充 tag_dimensions 数据');
  } else {
    // Attempt to add color column if it doesn't exist (for existing DBs)
    try {
      await db.run('ALTER TABLE tag_dimensions ADD COLUMN color TEXT');
      // Update default colors
      const colors: Record<string, string> = {
        '场景': 'bg-blue-100 text-blue-800',
        '阶段': 'bg-green-100 text-green-800',
        '类型': 'bg-purple-100 text-purple-800',
        '分类': 'bg-orange-100 text-orange-800'
      };
      for (const [name, color] of Object.entries(colors)) {
        await db.run('UPDATE tag_dimensions SET color = ? WHERE name = ?', [color, name]);
      }
      console.log('Added color column to tag_dimensions');
    } catch (e) {
      // Column likely exists
    }

    try {
      await db.run('ALTER TABLE tag_dimensions ADD COLUMN show_in_nav BOOLEAN DEFAULT 1');
      // Exclude '类型' by default to match legacy logic
      await db.run('UPDATE tag_dimensions SET show_in_nav = 0 WHERE name = "类型"');
      console.log('Added show_in_nav column to tag_dimensions');
    } catch (e) {
      // Column likely exists
    }
  }

  // 检查是否需要填充 doc_types
  const docTypeCount = await db.get('SELECT count(*) as count FROM doc_types');
  if (docTypeCount.count === 0) {
    const types = ['介绍', '使用场景', '陪练提示词', '内化提示词', '产出提示词'];
    for (let i = 0; i < types.length; i++) {
      // Default show_in_copy = 1
      await db.run('INSERT INTO doc_types (name, display_order, show_in_copy) VALUES (?, ?, 1)', [types[i], i + 1]);
    }
    console.log('已填充 doc_types 数据');
  } else {
    try {
      await db.run('ALTER TABLE doc_types ADD COLUMN show_in_copy BOOLEAN DEFAULT 1');
      console.log('Added show_in_copy column to doc_types');
    } catch (e) {
      // Column likely exists
    }

    try {
      await db.run('ALTER TABLE doc_types ADD COLUMN short_name TEXT');
      console.log('Added short_name column to doc_types');
    } catch (e) {
      // Column likely exists
    }
  }
  // 检查是否需要填充 model_docs (首次运行或迁移)
  // 我们做一个简单的检查：如果 model_docs 表为空，但 models 表不为空（且确实有文档目录），则执行扫描
  const modelDocsCount = await db.get('SELECT count(*) as count FROM model_docs');
  const modelsCount = await db.get('SELECT count(*) as count FROM models');

  if (modelDocsCount.count === 0 && modelsCount.count > 0) {
    console.log('正在初始化 model_docs 缓存...');
    const DOCS_DIR = path.join(DATA_DIR, 'docs');

    // 获取所有模型 ID
    const models = await db.all('SELECT id FROM models');

    const stmt = await db.prepare('INSERT OR IGNORE INTO model_docs (model_id, doc_type) VALUES (?, ?)');

    let addedCount = 0;
    for (const model of models) {
      const modelDir = path.join(DOCS_DIR, model.id);
      if (await fs.pathExists(modelDir)) {
        const files = await fs.readdir(modelDir);
        for (const file of files) {
          if (file.endsWith('.md')) {
            const filePath = path.join(modelDir, file);
            const stats = await fs.stat(filePath);
            if (stats.size > 0) {
              // 再次确认内容非空 (可选，但为了严谨)
              const content = await fs.readFile(filePath, 'utf-8');
              if (content.trim().length > 0) {
                await stmt.run(model.id, file.replace('.md', ''));
                addedCount++;
              }
            }
          }
        }
      }
    }
    await stmt.finalize();
    console.log(`model_docs 初始化完成，添加了 ${addedCount} 条记录`);
  }
};
