import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

// 获取标签维度列表
router.get('/tag-dimensions', async (req, res) => {
  try {
    const db = await getDb();
    const dimensions = await db.all('SELECT * FROM tag_dimensions ORDER BY display_order');
    res.json(dimensions);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 获取文档类型列表
router.get('/doc-types', async (req, res) => {
  try {
    const db = await getDb();
    const types = await db.all('SELECT * FROM doc_types ORDER BY display_order');
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 添加标签维度
router.post('/tag-dimensions', async (req, res) => {
  try {
    const { name } = req.body;
    const db = await getDb();

    // 获取当前最大 order
    const maxOrder = await db.get('SELECT MAX(display_order) as max FROM tag_dimensions');
    const nextOrder = (maxOrder.max || 0) + 1;

    await db.run('INSERT INTO tag_dimensions (name, display_order) VALUES (?, ?)', [name, nextOrder]);

    res.status(201).json({ name, display_order: nextOrder });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update tag dimension
router.put('/tag-dimensions/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { display_order, color, newName, show_in_nav } = req.body;
    const db = await getDb();

    // If renaming (newName is present and different from name)
    if (newName && newName !== name) {
      // Check if exists
      const exists = await db.get('SELECT 1 FROM tag_dimensions WHERE name = ?', [newName]);
      if (exists) {
        return res.status(400).json({ error: 'Name already exists' });
      }

      await db.run('UPDATE tag_dimensions SET name = ?, display_order = ?, color = ?, show_in_nav = ? WHERE name = ?',
        [newName, display_order, color, show_in_nav, name]);

      await db.run('UPDATE model_tags SET dimension = ? WHERE dimension = ?', [newName, name]);
    } else {
      await db.run('UPDATE tag_dimensions SET display_order = ?, color = ?, show_in_nav = ? WHERE name = ?',
        [display_order, color, show_in_nav, name]);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete tag dimension
router.delete('/tag-dimensions/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const db = await getDb();

    // Check if in use
    const usage = await db.get('SELECT count(*) as count FROM model_tags WHERE dimension = ?', [name]);
    if (usage.count > 0) {
      // Force delete? Or just return error? Requirement says "Delete (confirm, prompt if associated data exists)".
      // Frontend should handle prompt. If the user confirmed, we delete.
      // So we delete associated tags too.
      await db.run('DELETE FROM model_tags WHERE dimension = ?', [name]);
    }

    await db.run('DELETE FROM tag_dimensions WHERE name = ?', [name]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 添加文档类型
router.post('/doc-types', async (req, res) => {
  try {
    const { name, show_in_copy, short_name } = req.body;
    const db = await getDb();

    // 获取当前最大 order
    const maxOrder = await db.get('SELECT MAX(display_order) as max FROM doc_types');
    const nextOrder = (maxOrder.max || 0) + 1;

    const showInCopyVal = show_in_copy !== undefined ? show_in_copy : 1;

    await db.run('INSERT INTO doc_types (name, display_order, show_in_copy, short_name) VALUES (?, ?, ?, ?)', [name, nextOrder, showInCopyVal, short_name]);

    res.status(201).json({ name, display_order: nextOrder, show_in_copy: showInCopyVal, short_name });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update doc type
router.put('/doc-types/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { display_order, newName, show_in_copy, short_name } = req.body;
    const db = await getDb();

    if (newName && newName !== name) {
      const exists = await db.get('SELECT 1 FROM doc_types WHERE name = ?', [newName]);
      if (exists) {
        return res.status(400).json({ error: 'Name already exists' });
      }
      // For completeness, we should handle file Renames here if files exist.
      // But following existing logic.

      await db.run('UPDATE doc_types SET name = ?, display_order = ?, show_in_copy = ?, short_name = ? WHERE name = ?',
        [newName, display_order, show_in_copy, short_name, name]);
    } else {
      await db.run('UPDATE doc_types SET display_order = ?, show_in_copy = ?, short_name = ? WHERE name = ?',
        [display_order, show_in_copy, short_name, name]);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete doc type
router.delete('/doc-types/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const db = await getDb();

    await db.run('DELETE FROM doc_types WHERE name = ?', [name]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 获取所有标签值及其统计信息
router.get('/tag-values', async (req, res) => {
  try {
    const db = await getDb();

    // 获取所有标签值及其使用的模型数量（只统计模型实际存在的记录）
    const tagValues = await db.all(`
      SELECT 
        mt.dimension,
        mt.value,
        COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END) as model_count,
        COUNT(CASE WHEN m.id IS NULL THEN 1 END) as orphan_count
      FROM model_tags mt
      LEFT JOIN models m ON mt.model_id = m.id
      GROUP BY mt.dimension, mt.value
      ORDER BY mt.dimension, mt.value
    `);

    res.json(tagValues);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 获取使用特定标签的模型列表
router.get('/tag-values/:dimension/:value/models', async (req, res) => {
  try {
    const { dimension, value } = req.params;
    const db = await getDb();

    // 获取使用这个标签的模型ID和名称
    const models = await db.all(`
      SELECT m.id, m.name, m.description
      FROM model_tags mt
      LEFT JOIN models m ON mt.model_id = m.id
      WHERE mt.dimension = ? AND mt.value = ?
    `, [dimension, value]);

    res.json(models);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 批量清理所有孤立记录（标签指向的模型已不存在）
// 注意：此路由必须在 /tag-values/:dimension/:value 之前定义
router.delete('/tag-values/orphans', async (req, res) => {
  try {
    const db = await getDb();

    // 删除所有孤立的标签记录
    const result = await db.run(`
      DELETE FROM model_tags 
      WHERE model_id NOT IN (SELECT id FROM models)
    `);

    res.json({
      success: true,
      deleted_count: result.changes,
      message: `已清理 ${result.changes} 条孤立记录`
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 修改标签值（改名或合并）
router.put('/tag-values/:dimension/:value', async (req, res) => {
  try {
    const { dimension, value } = req.params;
    const { newValue, confirmMerge } = req.body;
    const db = await getDb();

    if (!newValue || newValue.trim() === '') {
      return res.status(400).json({ error: '新标签值不能为空' });
    }

    if (newValue === value) {
      return res.json({ success: true, message: '名称未变更' });
    }

    // 检查新名称是否已存在
    const existing = await db.get(
      'SELECT 1 FROM model_tags WHERE dimension = ? AND value = ? LIMIT 1',
      [dimension, newValue]
    );

    // 如果新名称已存在，且未确认合并
    if (existing && !confirmMerge) {
      return res.status(409).json({
        error: '标签名称已存在',
        requiresConfirmation: true,
        message: `标签 "${newValue}" 已存在。是否合并？合并后所有使用 "${value}" 的模型将改为使用 "${newValue}"，且会自动去重。`
      });
    }

    await db.run('BEGIN TRANSACTION');

    try {
      if (existing) {
        // 合并逻辑：
        // 1. 尝试将旧标签更新为新标签名称 (UPDATE OR IGNORE)
        //    IGNORE 会忽略那些导致主键冲突的更新（即模型同时拥有旧标签和新标签的情况）
        await db.run(
          'UPDATE OR IGNORE model_tags SET value = ? WHERE dimension = ? AND value = ?',
          [newValue, dimension, value]
        );

        // 2. 删除剩余的旧标签记录（即那些被 IGNORE 的记录，它们已经有了新标签，所以旧标签可以直接删掉）
        await db.run(
          'DELETE FROM model_tags WHERE dimension = ? AND value = ?',
          [dimension, value]
        );
      } else {
        // 直接改名
        await db.run(
          'UPDATE model_tags SET value = ? WHERE dimension = ? AND value = ?',
          [newValue, dimension, value]
        );
      }

      await db.run('COMMIT');
      res.json({ success: true, message: existing ? '合并成功' : '改名成功' });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 删除标签值（只有当没有实际存在的模型使用时才可删除）
router.delete('/tag-values/:dimension/:value', async (req, res) => {
  try {
    const { dimension, value } = req.params;
    const db = await getDb();

    // 检查是否有实际存在的模型在使用这个标签
    const usage = await db.get(`
      SELECT 
        COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END) as active_count,
        COUNT(CASE WHEN m.id IS NULL THEN 1 END) as orphan_count
      FROM model_tags mt
      LEFT JOIN models m ON mt.model_id = m.id
      WHERE mt.dimension = ? AND mt.value = ?
    `, [dimension, value]);

    if (usage.active_count > 0) {
      return res.status(400).json({
        error: `无法删除：仍有 ${usage.active_count} 个模型使用此标签`,
        model_count: usage.active_count
      });
    }

    // 删除标签值记录（包括孤立记录）
    const result = await db.run(
      'DELETE FROM model_tags WHERE dimension = ? AND value = ?',
      [dimension, value]
    );

    res.json({
      success: true,
      deleted_orphans: usage.orphan_count,
      message: usage.orphan_count > 0 ? `已删除 ${usage.orphan_count} 条孤立记录` : '删除成功'
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
