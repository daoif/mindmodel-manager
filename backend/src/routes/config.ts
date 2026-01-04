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

export default router;
