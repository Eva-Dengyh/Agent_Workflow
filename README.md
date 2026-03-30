# 🤖 Multi-Agent 开发平台

基于 Next.js 16 + OpenClaw 的多 Agent 协作开发监控系统。

## 📋 功能特性

- **任务管理** - 可视化任务看板，支持任务的创建、分配、进度跟踪
- **Agent 协作** - Planner（规划）、Coder（开发）、Reviewer（审查）三角色协同
- **实时通信** - SSE 实时推送 Agent 状态更新
- **交互式对话** - 可直接与任意 Agent 对话，跟踪任务进展
- **代码审查** - Reviewer 自动检查代码质量问题
- **进度可视化** - 任务阶段一目了然（规划 → 开发 → 审查 → 完成）

## 🏗️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.2.1 | 框架 |
| React | 19.2.4 | UI |
| TypeScript | 5.4.5 | 类型安全 |
| Zustand | 4.5.2 | 状态管理 |
| TailwindCSS | 3.4.4 | 样式 |
| Vitest | 4.1.2 | 测试 |
| Monaco Editor | 4.6.0 | 代码编辑器 |

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
OPENCLAW_GATEWAY_URL=http://localhost:18789
PLANNER_AGENT_ID=***_bot
CODER_AGENT_ID=***_bot
REVIEWER_AGENT_ID=***_bot
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 或 http://localhost:3001（如果 3000 被占用）

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
Agent_Workflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── agents/        # Agent 通信接口
│   │   │   │   ├── history/   # 消息历史
│   │   │   │   └── send/      # 发送消息
│   │   │   ├── events/        # SSE 事件流
│   │   │   └── tasks/         # 任务管理
│   │   │       ├── create/    # 创建任务
│   │   │       ├── dispatch/  # 分发任务
│   │   │       └── review/    # 代码审查
│   │   ├── dashboard/         # 主控制台页面
│   │   └── page.tsx          # 首页
│   ├── components/           # React 组件
│   │   ├── AgentChat/        # Agent 对话组件
│   │   ├── CodeEditor/        # 代码编辑器
│   │   ├── DevLog/            # 开发日志
│   │   ├── FileTree/          # 文件树
│   │   ├── NotificationCenter/# 通知中心
│   │   ├── ProgressBoard/     # 进度看板
│   │   ├── ReviewFeedback/    # 审查反馈
│   │   └── TaskCard/          # 任务卡片
│   ├── store/                # Zustand 状态管理
│   │   ├── agentStore.ts     # Agent 状态
│   │   ├── chatStore.ts      # 对话状态
│   │   ├── sseStore.ts       # SSE 连接状态
│   │   └── taskStore.ts      # 任务状态
│   └── types/                # TypeScript 类型定义
│       └── index.ts
├── tests/                    # 测试文件
│   ├── api/                  # API 测试
│   ├── components/           # 组件测试
│   └── store/                # Store 测试
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
└── next.config.js
```

## 🔌 API 接口

### SSE 事件流
```
GET /api/events
```
实时推送 Agent 状态更新。

### Agent 通信
```
POST /api/agents/send     # 发送消息给 Agent
GET  /api/agents/history  # 获取消息历史
```

### 任务管理
```
POST /api/tasks/create    # 创建任务
PUT  /api/tasks/dispatch  # 分发任务
POST /api/tasks/review    # 提交代码审查
```

## 🎯 工作流程

```
用户创建任务
     ↓
  Planner 分析需求 + 拆解任务
     ↓
  Coder 接收任务 + 开发代码
     ↓
  Reviewer 代码审查 + 测试验证
     ↓
  发现问题 → 反馈给 Coder 修复 → 复审（循环）
     ↓
  通过 → 通知用户验收
     ↓
  完成
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

测试覆盖：69 个用例，覆盖 Store、组件、API、类型。

## 🔒 安全检查

```bash
npm audit
```

当前状态：**0 个漏洞**

## 📝 开发规范

### Agent 职责

| Agent | 职责 |
|-------|------|
| **Planner** | 需求分析、任务拆解、与用户沟通确认方案 |
| **Coder** | 代码实现、修复 Reviewer 发现的问题 |
| **Reviewer** | 代码审查、测试验证、反馈问题 |

### 审查标准

- ✅ TypeScript 编译无错误
- ✅ 所有测试通过
- ✅ 无安全漏洞
- ✅ 代码规范符合 ESLint
- ✅ 测试覆盖率 >= 80%

## ⚠️ 注意事项

1. **环境变量配置**：确保 `.env.local` 中的 Agent ID 与 OpenClaw 中配置的名称一致
2. **OpenClaw 连接**：确保 OpenClaw Gateway 正在运行且可访问
3. **端口占用**：开发服务器会自动选择可用端口（3000/3001）

## 📄 License

MIT