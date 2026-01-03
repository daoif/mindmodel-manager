"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const db_1 = require("./db");
const models_1 = __importDefault(require("./routes/models"));
const config_1 = __importDefault(require("./routes/config"));
const navigation_1 = __importDefault(require("./routes/navigation"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// 静态文件服务 (用于前端) - 开发环境可能不需要，但生产环境需要
// app.use(express.static(path.join(__dirname, '../../frontend/dist')));
// 路由
app.use('/api/models', models_1.default);
app.use('/api/config', config_1.default);
app.use('/api/navigation', navigation_1.default);
// 初始化数据库并启动服务器
(0, db_1.initDb)().then(() => {
    app.listen(PORT, () => {
        console.log(`服务器正在运行，端口: ${PORT}`);
    });
}).catch(err => {
    console.error('数据库初始化失败:', err);
});
