# celebrity-chat

名人聊天窗口项目（连续迭代中）。

## 当前版本
- v0.6.0：增加运行指标面板（安全等级 + 响应延迟）

## 已完成版本
- v0.1.0：本地名人聊天原型（纯静态页面）
- v0.2.0：异步 API 抽象层 + 模型选择器
- v0.3.0：轻量 RAG 检索 + 可追溯引用
- v0.4.0：安全策略（block/warn）
- v0.5.0：Next.js 架构化改造
- v0.6.0：评测可视化（安全等级 + 延迟）

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
