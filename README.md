# Knowledge Agent

<div align="center">

**智能知识问答系统 - 构建您的专属知识库助手**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.5+-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.13+-409EFF.svg)](https://element-plus.org/)

</div>

## 📖 项目简介

Knowledge Agent 是一个基于 RAG（检索增强生成）技术的智能问答系统前端应用。用户可以创建多个智能体，为每个智能体上传专属知识库文件，实现基于特定领域知识的精准问答。系统同时支持通用千问模型直接对话，满足不同场景的使用需求。

### ✨ 核心特性

- **🤖 多智能体管理** - 创建、编辑、删除多个智能体，每个智能体拥有独立的知识库
- **📚 知识库上传** - 支持上传文本文件构建专属知识库（支持 TXT、HTML、CSS、JS、JSON、XML 等格式）
- **💬 智能对话** - 基于知识库的上下文感知问答，支持 Markdown 格式渲染和代码高亮
- **🎯 双模式切换** - 可选择特定智能体问答或使用千问通用模型
- **📝 对话历史** - 实时保存对话记录，支持清空对话重新开始
- **🎨 现代化 UI** - 基于 Element Plus 的精美界面设计，响应式布局适配多端

## 🛠️ 技术栈

### 核心框架
- **Vue 3.5** - 渐进式 JavaScript 框架，采用 Composition API
- **TypeScript 5.9** - 类型安全的 JavaScript 超集
- **Vite 6.0** - 下一代前端构建工具

### UI 组件库
- **Element Plus 2.13** - 基于 Vue 3 的组件库
- **@element-plus/icons-vue** - Element Plus 图标库

### 功能库
- **Vue Router 4.6** - 官方路由管理器
- **Axios 1.13** - HTTP 客户端
- **Marked 17.0** - Markdown 解析器
- **Highlight.js 11.11** - 代码语法高亮

## 📦 项目结构

```
knowledage-agent/
├── src/
│   ├── api/              # API 接口定义
│   │   └── index.ts      # 智能体相关接口
│   ├── router/           # 路由配置
│   │   └── index.ts      # 路由定义
│   ├── utils/            # 工具函数
│   │   └── request.ts    # Axios 封装
│   ├── views/            # 页面组件
│   │   ├── Home.vue      # 主页 - 对话界面
│   │   └── CreateAgent.vue  # 智能体创建/编辑页
│   ├── App.vue           # 根组件
│   ├── main.ts           # 应用入口
│   └── style.css         # 全局样式
├── .env                  # 环境变量配置
├── index.html            # HTML 模板
├── package.json          # 项目依赖
├── tsconfig.json         # TypeScript 配置
└── vite.config.ts        # Vite 配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 pnpm >= 7.0.0

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

### 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# 后端 API 地址
VITE_API_BASE_URL=http://127.0.0.1:8000/agents
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用。

### 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## 📡 API 接口说明

### 智能体管理

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取智能体列表 | GET | `/list` | 获取所有智能体 |
| 获取智能体详情 | GET | `/{agentId}` | 获取单个智能体信息 |
| 创建智能体 | POST | `/add` | 创建新智能体 |
| 更新智能体 | PUT | `/update` | 更新智能体信息 |
| 删除智能体 | DELETE | `/{agentId}` | 删除指定智能体 |

### 文件与问答

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 上传文件 | POST | `/upload` | 上传知识库文件 |
| 智能体问答 | POST | `/content` | 基于知识库问答 |
| 通用问答 | POST | `/direct-query` | 千问模型直接问答 |

## 💡 功能详解

### 1. 智能体管理

- **创建智能体**：点击"新建"按钮，填写名称、描述，上传知识库文件
- **编辑智能体**：点击智能体卡片的"编辑"选项，修改信息或更新文件
- **删除智能体**：点击"删除"选项，确认后删除智能体及其知识库

### 2. 对话功能

- **选择智能体**：点击左侧智能体列表选择对话对象
- **千问模式**：点击"千问"按钮切换到通用模型
- **发送消息**：输入问题后点击"发送"或按 Enter 键
- **清空对话**：点击"清空对话"按钮重置对话历史

### 3. 知识库文件

- 支持格式：TXT、HTML、CSS、JavaScript、JSON、XML
- 文件大小限制：单个文件不超过 10MB
- 文件数量：每个智能体最多上传 10 个文件

### 4. Markdown 渲染

对话内容支持完整的 Markdown 语法：
- 标题、列表、引用
- 代码块（带语法高亮）
- 表格、链接、图片
- 粗体、斜体等文本格式

## 🎨 界面预览

### 主对话界面
- 左侧：智能体列表，支持快速切换
- 右侧：对话区域，显示问答历史
- 底部：输入框和操作按钮

### 创建/编辑界面
- 智能体名称和描述输入
- 文件上传组件
- 保存和取消操作

## 🔧 开发指南

### 添加新的 API 接口

在 `src/api/index.ts` 中添加：

```typescript
export const yourNewApi = (data: YourDataType): Promise<ApiResponse<any>> => {
  return request.post('/your-endpoint', data)
}
```

### 自定义主题

修改 `src/style.css` 或在组件中使用 scoped 样式。

### 路由配置

在 `src/router/index.ts` 中添加新路由：

```typescript
{
  path: '/your-path',
  name: 'YourComponent',
  component: () => import('../views/YourComponent.vue')
}
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。

## 👥 作者

**AliceLi** - [GitHub](https://github.com/AliceLi)

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Marked](https://marked.js.org/) - Markdown 解析器
- [Highlight.js](https://highlightjs.org/) - 代码高亮库

---

<div align="center">

**如果这个项目对您有帮助，请给一个 ⭐️ Star 支持一下！**

</div>
