# Mall AI Digital Twin · 商场 AI 孪生平台

一个面向购物中心 / 商业地产的**数字孪生 + AI 管理平台**前端：3D 商场可视化、楼层与铺位管理、租户/租约管理、数据看板，以及一个 AI Copilot 助手。

A **digital-twin + AI management platform** for shopping malls / commercial real estate: 3D mall visualization, floor & unit management, tenant/lease management, analytics dashboard, and an AI copilot.

## 技术栈 / Stack
- React + TypeScript + Vite
- Ant Design (UI)
- three.js / react-three-fiber（3D 孪生场景）
- Supabase（鉴权与数据，BaaS）
- DeepSeek（AI Copilot，可替换为其他 LLM）

## 功能 / Features
- 🏬 商场 / 楼层 / 铺位管理（Mall / Floor / Unit）
- 🧊 3D 孪生场景查看器（Twin Viewer，相机控制、场景画布）
- 📄 物业管理：租户、租约、单元（Property Management）
- 📊 数据看板与分析（Dashboard / Analytics）
- 🤖 AI Copilot 助手
- 📚 知识库（Knowledge）

## 本地运行 / Getting Started
```bash
cd frontend
npm install
cp .env.example .env   # 然后填入你自己的 Supabase / DeepSeek 配置
npm run dev
```

> 注意：`.env` 已被 `.gitignore` 排除，请使用 `.env.example` 作为模板填入**你自己的**密钥，切勿提交真实密钥。

## License
MIT
