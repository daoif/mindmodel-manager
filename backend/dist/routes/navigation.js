"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// 获取导航树（自动生成）
router.get('/', async (req, res) => {
    try {
        const db = await (0, db_1.getDb)();
        // 获取所有维度
        const dimensions = await db.all('SELECT name FROM tag_dimensions ORDER BY display_order');
        // 获取所有模型及其标签
        const models = await db.all('SELECT id, name FROM models');
        const modelTags = await db.all('SELECT * FROM model_tags');
        // 构建模型标签映射
        const modelTagsMap = {};
        modelTags.forEach((mt) => {
            if (!modelTagsMap[mt.model_id]) {
                modelTagsMap[mt.model_id] = {};
            }
            if (!modelTagsMap[mt.model_id][mt.dimension]) {
                modelTagsMap[mt.model_id][mt.dimension] = [];
            }
            modelTagsMap[mt.model_id][mt.dimension].push(mt.value);
        });
        // 构建导航树
        // 根节点
        const root = [
            {
                id: 'all',
                name: '全部',
                type: 'auto',
                children: []
            }
        ];
        // 为每个维度创建一个顶级分类
        for (const dim of dimensions) {
            const dimNode = {
                id: `dim-${dim.name}`,
                name: dim.name,
                type: 'auto',
                children: []
            };
            // 找出该维度下的所有唯一值
            const values = new Set();
            modelTags.filter((mt) => mt.dimension === dim.name).forEach((mt) => values.add(mt.value));
            // 为每个值创建一个子节点
            for (const val of values) {
                dimNode.children.push({
                    id: `tag-${dim.name}-${val}`,
                    name: val,
                    type: 'auto',
                    rule: { dimension: dim.name, value: val },
                    children: [] // 在这个 MVP 版本，我们只做两级（维度 -> 值）
                });
            }
            root.push(dimNode);
        }
        res.json(root);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
