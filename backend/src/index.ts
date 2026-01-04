import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { initDb } from './db';
import modelRoutes from './routes/models';
import configRoutes from './routes/config';
import navigationRoutes from './routes/navigation';

const app = express();
const PORT = process.env.PORT || 31888;

app.use(cors());
app.use(bodyParser.json());

// 静态文件服务 (用于前端) - 开发环境可能不需要，但生产环境需要
// app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// 路由
app.use('/api/models', modelRoutes);
app.use('/api/config', configRoutes);
app.use('/api/navigation', navigationRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'mindmodel-backend', version: '1.0.0' });
});

// 初始化数据库并启动服务器
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器正在运行，端口: ${PORT}`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
});
