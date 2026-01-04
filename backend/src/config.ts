import path from 'path';
import fs from 'fs';

// 检测是否在 pkg 打包环境中运行
const isPkg = (process as any).pkg;

// 智能数据路径解析
let dataDir = '';

// 1. 优先使用命令行参数
if (process.argv.includes('--data-dir')) {
    const idx = process.argv.indexOf('--data-dir');
    if (idx !== -1 && process.argv[idx + 1]) {
        dataDir = process.argv[idx + 1];
    }
}

// 2. 自动探测
if (!dataDir) {
    if (isPkg) {
        const exeDir = path.dirname(process.execPath);
        const candidates = [
            path.join(exeDir, 'data'),          // 同级
            path.join(exeDir, '../data'),       // 上一级 (resources/data)
            path.join(exeDir, '../../data')     // 上上级 (root/data)
        ];
        // 找到第一个存在的目录，或默认为同级
        dataDir = candidates.find(p => fs.existsSync(p)) || path.join(exeDir, 'data');
    } else {
        dataDir = path.join(__dirname, '../../data'); // 开发环境
    }
}

export const DATA_DIR = dataDir;

console.log(`[Config] Running in ${isPkg ? 'pkg (binary)' : 'node (source)'} mode`);
console.log(`[Config] DATA_DIR: ${DATA_DIR}`);
