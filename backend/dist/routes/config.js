"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// 获取标签维度列表
router.get('/tag-dimensions', async (req, res) => {
    try {
        const db = await (0, db_1.getDb)();
        const dimensions = await db.all('SELECT * FROM tag_dimensions ORDER BY display_order');
        res.json(dimensions);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 获取文档类型列表
router.get('/doc-types', async (req, res) => {
    try {
        const db = await (0, db_1.getDb)();
        const types = await db.all('SELECT * FROM doc_types ORDER BY display_order');
        res.json(types);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 添加标签维度
router.post('/tag-dimensions', async (req, res) => {
    try {
        const { name } = req.body;
        const db = await (0, db_1.getDb)();
        // 获取当前最大 order
        const maxOrder = await db.get('SELECT MAX(display_order) as max FROM tag_dimensions');
        const nextOrder = (maxOrder.max || 0) + 1;
        await db.run('INSERT INTO tag_dimensions (name, display_order) VALUES (?, ?)', [name, nextOrder]);
        res.status(201).json({ name, display_order: nextOrder });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 添加文档类型
router.post('/doc-types', async (req, res) => {
    try {
        const { name } = req.body;
        const db = await (0, db_1.getDb)();
        // 获取当前最大 order
        const maxOrder = await db.get('SELECT MAX(display_order) as max FROM doc_types');
        const nextOrder = (maxOrder.max || 0) + 1;
        await db.run('INSERT INTO doc_types (name, display_order) VALUES (?, ?)', [name, nextOrder]);
        res.status(201).json({ name, display_order: nextOrder });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
