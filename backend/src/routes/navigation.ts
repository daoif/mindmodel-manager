import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

// Recursive function to build tree
const buildTree = (
    currentDimIndex: number,
    dimensions: any[],
    currentFilters: Array<{ dimension: string; value: string }>,
    modelTagsMap: Record<string, Record<string, string[]>>
) => {
    // Determine which dimension we are expanding
    if (currentDimIndex >= dimensions.length) return [];

    const dim = dimensions[currentDimIndex];
    const dimName = dim.name;

    // Find all potential values for this dimension, given currentFilters
    const validValues = new Set<string>();

    // Iterate all models to find values that match current filters
    for (const [modelId, tags] of Object.entries(modelTagsMap)) {
        // Check if model matches current filters
        let match = true;
        for (const filter of currentFilters) {
            if (!tags[filter.dimension] || !tags[filter.dimension].includes(filter.value)) {
                match = false;
                break;
            }
        }

        if (match && tags[dimName]) {
            tags[dimName].forEach(v => validValues.add(v));
        }
    }

    const nodes: any[] = [];
    for (const val of Array.from(validValues).sort()) { // Sort for consistency
        const newFilters = [...currentFilters, { dimension: dimName, value: val }];

        // Recursively build children for the NEXT dimension
        const children = buildTree(currentDimIndex + 1, dimensions, newFilters, modelTagsMap);

        nodes.push({
            id: `node-${newFilters.map(f => f.value).join('-')}`, // Unique ID based on path? Or simple UUID? Path is safer.
            name: val,
            type: 'auto',
            rule: newFilters, // The accumulation of filters
            children: children
        });
    }

    return nodes;
};

// 获取导航树（自动生成）
router.get('/', async (req, res) => {
  try {
    const db = await getDb();

    // 获取所有维度 (Only show_in_nav)
    // Note: We might need to select * to check show_in_nav column, or assume it exists.
    // Since we just added it, better safe check.
    // If show_in_nav column doesn't exist (old DB without migration run in memory?), it might fail.
    // But we ran initDb so it should be there.
    let dimensions;
    try {
        dimensions = await db.all('SELECT * FROM tag_dimensions WHERE show_in_nav = 1 ORDER BY display_order');
    } catch (e) {
        // Fallback if column missing (should not happen with our initDb)
        dimensions = await db.all('SELECT * FROM tag_dimensions ORDER BY display_order');
        dimensions = dimensions.filter((d: any) => d.name !== '类型'); // Legacy hardcoded fallback
    }

    // 获取所有模型及其标签
    // const models = await db.all('SELECT id, name FROM models'); // Not strictly needed for tags map
    const modelTags = await db.all('SELECT * FROM model_tags');

    // 构建模型标签映射
    const modelTagsMap: Record<string, Record<string, string[]>> = {};
    modelTags.forEach((mt: any) => {
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
    const root: any[] = [
      {
        id: 'all',
        name: '全部',
        type: 'auto',
        rule: [], // Empty array = no filter
        children: []
      }
    ];

    // Strategy:
    // We want to allow top-level entry by ANY dimension that is marked show_in_nav.
    // If we only start with the first dimension, we lock the user into one path (Scene -> Phase -> Type).
    // But usually users want to start with any.
    // "Multi-condition Combination Filter ... Left nav selection becomes 'Base Filter'".
    // If I select "Phase: Insight", that is a valid base filter.
    // And THEN, under "Phase: Insight", do we show "Scene" values? Or "Category" values?
    // Based on `display_order`:
    // If I enter at "Phase" (Level 2), should I drill down to "Category" (Level 3)? Yes.
    // Should I drill down to "Scene" (Level 1)?
    // Usually drill-down goes "Forward" in hierarchy.
    // So:
    // Root -> D1 -> D2 -> D3
    // Root -> D2 -> D3
    // Root -> D3

    // So we iterate through dimensions to create top-level roots.
    for (let i = 0; i < dimensions.length; i++) {
        const dim = dimensions[i];

        // Determine children by starting recursion from the NEXT dimension
        // Pass empty filters initially, but we are essentially grouping by `dim`.
        // Actually, the top level nodes are "Dimensions".
        // Under "Dimension X", we list values of X.
        // Under "Value V of X", we list values of Dimension X+1.

        const children = buildTree(i, dimensions, [], modelTagsMap); // This builds values of Dim[i], then recurses to Dim[i+1]

        // However, `buildTree` above starts by finding valid values of `dimensions[currentDimIndex]`.
        // That matches exactly:
        // i=0: Scene Values -> Children are Phase Values...
        // i=1: Phase Values -> Children are Category Values...

        // Wait, `buildTree` returns a list of Nodes (Values).
        // So we need to wrap them in a Dimension Node?
        // The original code wrapped them: `dimNode` -> `values`.

        const dimNode: any = {
            id: `dim-${dim.name}`,
            name: dim.name,
            type: 'auto',
            rule: [{ dimension: dim.name, value: '*' }],
            children: children
        };

        root.push(dimNode);
    }

    res.json(root);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
