# celebrity-chat

名人聊天窗口项目（连续迭代中）。

## 当前版本
- v1.2.0：名人搜索与分类筛选

## 已完成版本
- v0.1.0：本地名人聊天原型（纯静态页面）
- v0.2.0：异步 API 抽象层 + 模型选择器
- v0.3.0：轻量 RAG 检索 + 可追溯引用
- v0.4.0：安全策略（block/warn）
- v0.5.0：Next.js 架构化改造
- v0.6.0：评测可视化（安全等级 + 延迟）
- v0.7.0：会话持久化（localStorage）+ 清空会话按钮
- v0.8.0：API Route 接入模型调用层，支持 RayinCode 与 Mock 兜底
- v0.9.0：增加服务端限流与前端429错误提示
- v1.0.0：支持导出聊天记录为 Markdown 文件
- v1.1.0：新增回答质量评分（分数+高/中/低）
- v1.2.0：新增名人搜索与分类筛选

## 运行
```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 目录
- `app/page.tsx`：聊天主界面
- `app/api/chat/route.ts`：聊天 API
- `lib/personas.ts`：名人资料
- `lib/rag.ts`：检索逻辑
- `lib/safety.ts`：安全审核
- `legacy/`：v0.1-v0.4 原型代码存档
