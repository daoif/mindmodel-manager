import { Router } from 'express';
import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';

const router = Router();
import { DATA_DIR } from '../config';

const DOCS_DIR = path.join(DATA_DIR, 'docs');

// 简单的路径验证，防止目录遍历
const isValidFilename = (filename: string) => {
  return /^[a-zA-Z0-9_\-\u4e00-\u9fa5]+$/.test(filename) && !filename.includes('..') && !filename.includes('/');
};

// 获取模型列表（支持筛选）
router.get('/', async (req, res) => {
  try {
    const db = await getDb();

    // 基础查询
    let query = 'SELECT * FROM models';
    const params: any[] = [];

    // TODO: 实现标签筛选逻辑
    // 如果有 query params (e.g. ?dimension=value)
    // 需要联表查询 model_tags

    const models = await db.all(query, params);

    // 获取每个模型的标签
    for (const model of models) {
      const tags = await db.all('SELECT dimension, value FROM model_tags WHERE model_id = ?', [model.id]);
      model.tags = {};
      tags.forEach((tag: any) => {
        if (!model.tags[tag.dimension]) {
          model.tags[tag.dimension] = [];
        }
        model.tags[tag.dimension].push(tag.value);
      });
    }

    res.json(models);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 获取单个模型详情
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const model = await db.get('SELECT * FROM models WHERE id = ?', [req.params.id]);

    if (!model) {
      return res.status(404).json({ error: '模型未找到' });
    }

    const tags = await db.all('SELECT dimension, value FROM model_tags WHERE model_id = ?', [model.id]);
    model.tags = {};
    tags.forEach((tag: any) => {
      if (!model.tags[tag.dimension]) {
        model.tags[tag.dimension] = [];
      }
      model.tags[tag.dimension].push(tag.value);
    });

    res.json(model);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 创建模型
router.post('/', async (req, res) => {
  try {
    const { name, description, tags } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    const db = await getDb();

    await db.run(
      'INSERT INTO models (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, name, description, now, now]
    );

    if (tags) {
      for (const [dimension, values] of Object.entries(tags)) {
        if (Array.isArray(values)) {
          for (const value of values) {
            await db.run(
              'INSERT INTO model_tags (model_id, dimension, value) VALUES (?, ?, ?)',
              [id, dimension, value]
            );
          }
        }
      }
    }

    // 创建对应的文档目录
    await fs.ensureDir(path.join(DOCS_DIR, id));

    res.status(201).json({ id, name, description, tags, created_at: now, updated_at: now });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 更新模型
router.put('/:id', async (req, res) => {
  try {
    const { name, description, tags } = req.body;
    const { id } = req.params;
    const now = new Date().toISOString();

    const db = await getDb();

    const existing = await db.get('SELECT * FROM models WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: '模型未找到' });
    }

    await db.run(
      'UPDATE models SET name = ?, description = ?, updated_at = ? WHERE id = ?',
      [name, description, now, id]
    );

    // 更新标签：先删除旧的，再插入新的
    // 注意：如果只是更新部分标签，前端必须传递完整的 tags 对象。
    // 为了支持部分更新（例如只更新一个维度的标签），我们需要在此处做合并逻辑，或者创建一个专门的 API。
    // 当前实现假设 PUT /:id 是全量更新。
    await db.run('DELETE FROM model_tags WHERE model_id = ?', [id]);

    if (tags) {
      for (const [dimension, values] of Object.entries(tags)) {
        if (Array.isArray(values)) {
          for (const value of values) {
            await db.run(
              'INSERT INTO model_tags (model_id, dimension, value) VALUES (?, ?, ?)',
              [id, dimension, value]
            );
          }
        }
      }
    }

    res.json({ id, name, description, tags, created_at: existing.created_at, updated_at: now });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update model tags (partial update)
router.put('/:id/tags', async (req, res) => {
  try {
    const { tags } = req.body;
    const { id } = req.params;
    const now = new Date().toISOString();
    const db = await getDb();

    const existing = await db.get('SELECT * FROM models WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: '模型未找到' });
    }

    // We need to merge with existing tags, OR specific dimensions replace specific dimensions?
    // Requirement for Inline Edit: "Real-time save... Dropdown...".
    // If I edit "Scene" tags, I send `{ Scene: [...] }`.
    // If I want to keep "Phase" tags, I should not delete them.
    // So this endpoint should be a PATCH or handle merging.
    // Let's implement MERGE strategy:
    // For each dimension in `tags`, replace the tags for that dimension.
    // Leave other dimensions alone.

    if (tags) {
      for (const [dimension, values] of Object.entries(tags)) {
        // Delete existing tags for THIS dimension only
        await db.run('DELETE FROM model_tags WHERE model_id = ? AND dimension = ?', [id, dimension]);

        if (Array.isArray(values)) {
          for (const value of values) {
            await db.run(
              'INSERT INTO model_tags (model_id, dimension, value) VALUES (?, ?, ?)',
              [id, dimension, value]
            );
          }
        }
      }
    }

    await db.run('UPDATE models SET updated_at = ? WHERE id = ?', [now, id]);

    // Return full model to update frontend?
    // Let's refetch tags to be sure.
    const allTags = await db.all('SELECT dimension, value FROM model_tags WHERE model_id = ?', [id]);
    const newTags: Record<string, string[]> = {};
    allTags.forEach((tag: any) => {
      if (!newTags[tag.dimension]) {
        newTags[tag.dimension] = [];
      }
      newTags[tag.dimension].push(tag.value);
    });

    res.json({ ...existing, tags: newTags, updated_at: now });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 批量删除模型
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids 必须是非空数组' });
    }

    const db = await getDb();

    // 使用事务确保原子性
    await db.run('BEGIN TRANSACTION');
    try {
      // 生成占位符
      const placeholders = ids.map(() => '?').join(',');

      // 删除模型 (model_tags 会自动级联删除)
      await db.run(`DELETE FROM models WHERE id IN (${placeholders})`, ids);

      await db.run('COMMIT');

      // 删除文档目录 (非事务操作，失败不回滚 DB，但记录错误)
      for (const id of ids) {
        await fs.remove(path.join(DOCS_DIR, id));
      }

      res.status(204).send();
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 批量修改模型标签
router.put('/batch-tags', async (req, res) => {
  try {
    const { ids, tagsToAdd, tagsToRemove } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids 必须是非空数组' });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    await db.run('BEGIN TRANSACTION');
    try {
      // 1. 移除标签
      if (tagsToRemove) {
        for (const [dimension, values] of Object.entries(tagsToRemove as Record<string, string[]>)) {
          if (Array.isArray(values) && values.length > 0) {
            const placeholders = values.map(() => '?').join(',');
            // DELETE FROM model_tags WHERE model_id IN (ids...) AND dimension = ? AND value IN (values...)
            const idPlaceholders = ids.map(() => '?').join(',');

            await db.run(
              `DELETE FROM model_tags 
                WHERE model_id IN (${idPlaceholders}) 
                AND dimension = ? 
                AND value IN (${placeholders})`,
              [...ids, dimension, ...values]
            );
          }
        }
      }

      // 2. 添加标签 (需要避免重复)
      if (tagsToAdd) {
        for (const [dimension, values] of Object.entries(tagsToAdd as Record<string, string[]>)) {
          if (Array.isArray(values) && values.length > 0) {
            for (const value of values) {
              for (const id of ids) {
                // 使用 INSERT OR IGNORE 避免主键冲突
                await db.run(
                  'INSERT OR IGNORE INTO model_tags (model_id, dimension, value) VALUES (?, ?, ?)',
                  [id, dimension, value]
                );
              }
            }
          }
        }
      }

      // 3. 更新模型的 updated_at
      const idPlaceholders = ids.map(() => '?').join(',');
      await db.run(
        `UPDATE models SET updated_at = ? WHERE id IN (${idPlaceholders})`,
        [now, ...ids]
      );

      await db.run('COMMIT');
      res.json({ success: true, updated_count: ids.length });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 删除模型
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const existing = await db.get('SELECT * FROM models WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: '模型未找到' });
    }

    await db.run('DELETE FROM models WHERE id = ?', [id]);
    // model_tags 会因为 ON DELETE CASCADE 自动删除

    // 删除文档目录
    await fs.remove(path.join(DOCS_DIR, id));

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- 子文档相关 ---

// 获取模型的子文档列表
router.get('/:id/docs', async (req, res) => {
  try {
    const { id } = req.params;
    const modelDir = path.join(DOCS_DIR, id);

    if (!fs.existsSync(modelDir)) {
      return res.json([]);
    }

    const files = await fs.readdir(modelDir);
    // 只返回 .md 文件，并去掉扩展名作为 type
    const docs = files
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        type: f.replace('.md', ''),
        // 这里简单地把最后修改时间作为 updated_at
        updatedAt: fs.statSync(path.join(modelDir, f)).mtime.toISOString()
      }));

    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 获取特定类型子文档内容
router.get('/:id/docs/:type', async (req, res) => {
  try {
    const { id, type } = req.params;

    if (!isValidFilename(type)) {
      return res.status(400).json({ error: '无效的文件名' });
    }

    const filePath = path.join(DOCS_DIR, id, `${type}.md`);

    if (!fs.existsSync(filePath)) {
      // 如果文件不存在，返回空内容而不是 404，方便前端直接创建
      return res.json({ content: '' });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 保存子文档内容
router.put('/:id/docs/:type', async (req, res) => {
  try {
    const { id, type } = req.params;
    const { content } = req.body;

    if (!isValidFilename(type)) {
      return res.status(400).json({ error: '无效的文件名' });
    }

    const modelDir = path.join(DOCS_DIR, id);
    const filePath = path.join(modelDir, `${type}.md`);

    await fs.ensureDir(modelDir);
    await fs.writeFile(filePath, content, 'utf-8');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 删除子文档
router.delete('/:id/docs/:type', async (req, res) => {
  try {
    const { id, type } = req.params;

    if (!isValidFilename(type)) {
      return res.status(400).json({ error: '无效的文件名' });
    }

    const filePath = path.join(DOCS_DIR, id, `${type}.md`);

    if (fs.existsSync(filePath)) {
      await fs.remove(filePath);
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
