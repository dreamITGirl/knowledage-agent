<script setup lang="ts">
import { ref, onBeforeMount, onDeactivated, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElInput, ElMessage, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessageBox } from 'element-plus'
import { askAgent, deleteAgent, getAgentList, directQuery } from '@/api/index'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true
})

// 自定义渲染器以支持代码高亮
const renderer = {
  code({ text, lang }: { text: string; lang?: string }) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(text, { language: lang }).value
        return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`
      } catch (err) {
        console.error(err)
      }
    }
    const highlighted = hljs.highlightAuto(text).value
    return `<pre><code class="hljs">${highlighted}</code></pre>`
  }
}

marked.use({ renderer })

const router = useRouter()

interface Agent {
  id: number
  name: string
  description: string
  filelist?: string[]
}

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const getAgentData = async () => {
  try {
    
    const response = await getAgentList()
    agent_list.value = response.data
  } catch (error) {
    console.error('获取智能体列表失败:', error)
  }
} 
let agent_list= ref<Agent[]>([])
const inputMessage = ref<string>('')
const loading = ref<boolean>(false)
const selectedAgent = ref<Agent | null>(null)
const chatMessages = ref<ChatMessage[]>([])
const chatContainer = ref<HTMLElement | null>(null)
let messageIdCounter = 0



// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

// 新建按钮点击事件，跳转到创建页面
const handleCreate = () => {
  router.push('/create')
}

const handleSend = () => {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入提示词')
    return
  }
  
  // 添加用户消息
  const userMessage: ChatMessage = {
    id: messageIdCounter++,
    role: 'user',
    content: inputMessage.value,
    timestamp: new Date()
  }
  chatMessages.value.push(userMessage)
  
  const question = inputMessage.value
  inputMessage.value = ''
  scrollToBottom()
  
  loading.value = true
  
  // 判断是否使用千问模型（selectedAgent 为 null 或没有 id）
  if (!selectedAgent.value || !selectedAgent.value.id) {
    // 使用千问直接提问接口
    directQuery({
      question: question
    }).then(response => {
      const assistantMessage: ChatMessage = {
        id: messageIdCounter++,
        role: 'assistant',
        content: response.data ?? '抱歉，我无法回答这个问题。',
        timestamp: new Date()
      }
      chatMessages.value.push(assistantMessage)
      scrollToBottom()
    }).catch(error => {
      console.error('提问失败:', error)
      ElMessage.error('提问失败')
      const errorMessage: ChatMessage = {
        id: messageIdCounter++,
        role: 'assistant',
        content: '抱歉，发生了错误，请稍后重试。',
        timestamp: new Date()
      }
      chatMessages.value.push(errorMessage)
      scrollToBottom()
    }).finally(() => {
      loading.value = false
    })
  } else {
    // 使用智能体提问接口
    askAgent({
      question: question,
      agentId: selectedAgent.value.id,
      file_path: selectedAgent.value.filelist || []
    }).then(response => {
      const assistantMessage: ChatMessage = {
        id: messageIdCounter++,
        role: 'assistant',
        content: response.data ?? '抱歉，我无法回答这个问题。',
        timestamp: new Date()
      }
      chatMessages.value.push(assistantMessage)
      scrollToBottom()
    }).catch(error => {
      console.error('提问失败:', error)
      ElMessage.error('提问失败')
      const errorMessage: ChatMessage = {
        id: messageIdCounter++,
        role: 'assistant',
        content: '抱歉，发生了错误，请稍后重试。',
        timestamp: new Date()
      }
      chatMessages.value.push(errorMessage)
      scrollToBottom()
    }).finally(() => {
      loading.value = false
    })
  }
}
const handleDelete = (agent: Agent) => {
  ElMessageBox.confirm(
    `确定要删除智能体 "${agent.name}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then( () => {
       deleteAgent(agent.id).then(() => {
        ElMessage.success('删除成功')
        getAgentData()
      }).catch(() => {
        ElMessage.error('删除失败')
      })
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}
const handleEdit = (agent: Agent) => {
  router.push({
    path: '/create',
    query: { id: agent.id.toString() }
  })
}
const questionAgent = (agent: Agent) => {
  selectedAgent.value = agent
  inputMessage.value = ''
  chatMessages.value = []
}

const selectQianwen = () => {
  selectedAgent.value = null
  inputMessage.value = ''
  chatMessages.value = []
}

// 渲染 Markdown 内容
const renderMarkdown = (content: string): string => {
  try {
    return marked.parse(content) as string
  } catch (error) {
    console.error('Markdown 渲染错误:', error)
    return content
  }
}

onBeforeMount(() => {
  getAgentData()
})
onDeactivated(() => {
  selectedAgent.value = null
  inputMessage.value = ''
  chatMessages.value = []
})
</script>

<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="logo-text">知识智能体</span>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="section-label">默认模型</div>
        <div 
          class="agent-item"
          :class="{ active: selectedAgent === null }"
          @click="selectQianwen"
        >
          <div class="agent-avatar qianwen-avatar">Q</div>
          <div class="agent-info">
            <span class="agent-name">千问</span>
            <span class="agent-desc">通用对话模型</span>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="section-label-row">
          <span class="section-label">文件专属模版对话体</span>
          <button class="new-btn" @click="handleCreate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            新建
          </button>
        </div>

        <div v-if="agent_list.length > 0" class="agent-list">
          <div 
            v-for="agent in agent_list" 
            :key="agent.id" 
            class="agent-item"
            :class="{ active: selectedAgent?.id === agent.id }"
            @click="questionAgent(agent)"
          >
            <div class="agent-avatar">{{ agent.name.charAt(0).toUpperCase() }}</div>
            <div class="agent-info">
              <span class="agent-name">{{ agent.name }}</span>
              <span class="agent-desc">{{ agent.description || '自定义知识库' }}</span>
            </div>
            <el-dropdown placement="bottom-end" trigger="click" @click.stop>
              <button class="more-btn" @click.stop>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleEdit(agent)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleDelete(agent)" style="color: #ef4444">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <div v-else class="empty-agents">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <span>暂无智能体</span>
        </div>
      </div>
    </aside>

    <!-- 主聊天区域 -->
    <main class="chat-main">
      <!-- 顶部栏 -->
      <header class="chat-header">
        <div class="chat-header-info">
          <div class="chat-avatar" :class="{ 'qianwen': !selectedAgent }">
            {{ selectedAgent ? selectedAgent.name.charAt(0).toUpperCase() : 'Q' }}
          </div>
          <div>
            <h2 class="chat-title">{{ selectedAgent?.name || '千问' }}</h2>
            <p class="chat-subtitle">{{ selectedAgent?.description || '通用对话模型' }}</p>
          </div>
        </div>
        <div class="chat-header-actions">
          <div v-if="selectedAgent?.filelist && selectedAgent.filelist.length > 0" class="knowledge-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            {{ selectedAgent.filelist.length }} 个知识文件
          </div>
          <button v-if="chatMessages.length > 0" class="clear-btn" @click="chatMessages = []">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            清空对话
          </button>
        </div>
      </header>

      <!-- 消息区域 -->
      <div ref="chatContainer" class="messages-area">
        <div v-if="chatMessages.length === 0" class="welcome-screen">
          <div class="welcome-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>开始对话</h3>
          <p>向 <strong>{{ selectedAgent?.name || '千问' }}</strong> 提问，获取智能回答</p>
          <div class="suggestion-chips">
            <button class="chip" @click="inputMessage = '你好，请介绍一下你自己'">你好，请介绍一下你自己</button>
            <button class="chip" @click="inputMessage = '你能帮我做什么？'">你能帮我做什么？</button>
          </div>
        </div>

        <template v-else>
          <div v-for="message in chatMessages" :key="message.id" :class="['message-row', message.role]">
            <div v-if="message.role === 'assistant'" class="msg-avatar assistant-avatar">
              {{ selectedAgent ? selectedAgent.name.charAt(0).toUpperCase() : 'Q' }}
            </div>
            <div class="message-bubble">
              <div class="message-content" v-html="renderMarkdown(message.content)"></div>
              <div class="message-meta">
                {{ message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
              </div>
            </div>
            <div v-if="message.role === 'user'" class="msg-avatar user-avatar">我</div>
          </div>

          <div v-if="loading" class="message-row assistant">
            <div class="msg-avatar assistant-avatar">
              {{ selectedAgent ? selectedAgent.name.charAt(0).toUpperCase() : 'Q' }}
            </div>
            <div class="message-bubble loading-bubble">
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 输入区域 -->
      <div class="input-panel">
        <div v-if="selectedAgent?.filelist && selectedAgent.filelist.length > 0" class="files-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span class="files-label">知识库：</span>
          <span v-for="(file, i) in selectedAgent.filelist" :key="i" class="file-chip">
            {{ file.split('/').pop() }}
          </span>
        </div>
        <div class="input-box">
          <el-input
            v-model="inputMessage"
            type="textarea"
            placeholder="输入你的问题，Enter 发送，Shift+Enter 换行..."
            :autosize="{ minRows: 1, maxRows: 5 }"
            :disabled="loading"
            @keydown.enter.exact.prevent="handleSend"
          />
          <button 
            class="send-btn" 
            :class="{ active: inputMessage.trim() && !loading }"
            :disabled="!inputMessage.trim() || loading"
            @click="handleSend"
          >
            <svg v-if="!loading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <div v-else class="send-loading"></div>
          </button>
        </div>
        <p class="input-hint">Enter 发送 · Shift+Enter 换行</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.container {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #1f2937;
  padding: 1.5rem;
  width: 100%;
  margin: 0 auto;
  background-color: #f9fafb;
  min-height: 100vh;
}

.header-card {
  margin-bottom: 1.5rem;
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.header-card h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0.5rem 0;
  color: white;
  letter-spacing: -0.025em;
}

.header-card h2 {
  font-size: 1.25rem;
  margin: 0.5rem 0;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
}

.main-content {
  margin-top: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #111827;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

.demo-card {
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border-radius: 0.5rem;
}

.tech-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0;
  justify-content: flex-start;
}

.tech-stack > div {
  width: 100%;
}

.agent-tag {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  transition: all 0.15s ease-in-out;
  color: #374151;
  font-weight: 500;
}

.agent-tag:hover {
  background-color: #f3f4f6;
  transform: translateX(2px);
}

.agent-tag .el-icon {
  outline: none;
  color: #6b7280;
}

.agent-tag .el-icon:focus {
  outline: none;
}

:deep(.el-card__body) {
  padding: 0.75rem;
}

/* 聊天界面样式 */
.chat-card {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border-radius: 0.5rem;
}

.chat-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.empty-chat p {
  font-size: 1rem;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.message-wrapper {
  display: flex;
  margin-bottom: 0.5rem;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-wrapper.user {
  justify-content: flex-end;
}

.message-wrapper.assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  word-wrap: break-word;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.user .message-bubble {
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  color: white;
  border-bottom-right-radius: 0.25rem;
}

.assistant .message-bubble {
  background: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 0.25rem;
  border: 1px solid #e5e7eb;
}

.message-content {
  line-height: 1.625;
  white-space: pre-wrap;
  font-size: 0.9375rem;
  text-align: left;
}

/* Markdown 样式 */
.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3),
.message-content :deep(h4),
.message-content :deep(h5),
.message-content :deep(h6) {
  margin: 0.75rem 0 0.5rem 0;
  font-weight: 600;
  line-height: 1.25;
}

.message-content :deep(h1) { font-size: 1.5rem; }
.message-content :deep(h2) { font-size: 1.25rem; }
.message-content :deep(h3) { font-size: 1.125rem; }

.message-content :deep(p) {
  margin: 0.5rem 0;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.message-content :deep(li) {
  margin: 0.25rem 0;
}

.message-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
}

.user .message-content :deep(code) {
  background-color: rgba(255, 255, 255, 0.2);
}

.message-content :deep(pre) {
  background-color: #1e1e1e;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}

.message-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: #d4d4d4;
  font-size: 0.875rem;
  line-height: 1.5;
}

.message-content :deep(blockquote) {
  border-left: 4px solid #d1d5db;
  padding-left: 1rem;
  margin: 0.75rem 0;
  color: #6b7280;
  font-style: italic;
}

.user .message-content :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.9);
}

.message-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.75rem 0;
}

.message-content :deep(table th),
.message-content :deep(table td) {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  text-align: left;
}

.message-content :deep(table th) {
  background-color: #f3f4f6;
  font-weight: 600;
}

.message-content :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.user .message-content :deep(a) {
  color: rgba(255, 255, 255, 0.95);
}

.message-content :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1rem 0;
}

.message-content :deep(img) {
  max-width: 100%;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}

/* 代码高亮样式调整 */
.message-content :deep(.hljs) {
  background-color: #1e1e1e;
  color: #d4d4d4;
}

.message-time {
  font-size: 0.75rem;
  margin-top: 0.375rem;
  opacity: 0.75;
  font-weight: 500;
}

.user .message-time {
  text-align: right;
}

.assistant .message-time {
  text-align: left;
  color: #6b7280;
}

/* 加载动画 */
.loading-bubble {
  padding: 1rem 1.25rem;
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.typing-indicator span {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background-color: #9ca3af;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-0.625rem);
    opacity: 1;
  }
}

/* 输入区域 */
.chat-input-area {
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  position: relative;
}

.chat-input-area :deep(.el-textarea__inner) {
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  transition: all 0.15s ease-in-out;
}

.chat-input-area :deep(.el-textarea__inner):focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.knowledge-files-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  position: absolute;
  left: 1rem;
}

.files-label {
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 600;
}

.file-tag {
  margin: 0;
  background-color: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* 滚动条样式 - Tailwind 风格 */
.chat-messages::-webkit-scrollbar {
  width: 0.375rem;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 0.25rem;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Element Plus 按钮覆盖 - Tailwind 风格 */
:deep(.el-button) {
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.15s ease-in-out;
}

:deep(.el-button--primary) {
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  border: none;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

:deep(.el-card) {
  border-radius: 0.5rem;
}
</style>

<style scoped>
/* ===== 整体布局 ===== */
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--surface-2);
}

/* ===== 侧边栏 ===== */
.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--border-light);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.sidebar-section {
  padding: 16px 12px 8px;
  flex: 1;
  overflow-y: auto;
}

.sidebar-section::-webkit-scrollbar { width: 4px; }
.sidebar-section::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 0 4px;
  margin-bottom: 6px;
  display: block;
}

.section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  padding: 0 4px;
}

.new-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--primary);
  background: var(--primary-bg);
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.new-btn:hover {
  background: var(--primary);
  color: white;
}

.agent-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.agent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.agent-item:hover {
  background: var(--surface-3);
}

.agent-item.active {
  background: var(--primary-bg);
}

.agent-item.active .agent-name {
  color: var(--primary);
}

.agent-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qianwen-avatar {
  background: linear-gradient(135deg, #10b981, #059669);
}

.agent-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.agent-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-desc {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  opacity: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.agent-item:hover .more-btn {
  opacity: 1;
}

.more-btn:hover {
  background: var(--border);
  color: var(--text-secondary);
}

.empty-agents {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  color: var(--text-muted);
  font-size: 12px;
}

/* ===== 主聊天区域 ===== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface);
}

/* 顶部栏 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  color: white;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-avatar.qianwen {
  background: linear-gradient(135deg, #10b981, #059669);
}

.chat-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.chat-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.knowledge-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--primary);
  background: var(--primary-bg);
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--surface-3);
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: 500;
}

.clear-btn:hover {
  background: #fee2e2;
  color: var(--danger);
}

/* 消息区域 */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: var(--surface-2);
}

.messages-area::-webkit-scrollbar { width: 5px; }
.messages-area::-webkit-scrollbar-track { background: transparent; }
.messages-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

/* 欢迎屏 */
.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
  padding: 40px 0;
}

.welcome-icon {
  width: 72px;
  height: 72px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  margin-bottom: 4px;
}

.welcome-screen h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.welcome-screen p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.welcome-screen strong {
  color: var(--primary);
}

.suggestion-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}

.chip {
  font-size: 13px;
  color: var(--primary);
  background: var(--primary-bg);
  border: 1px solid #c7d2fe;
  border-radius: 20px;
  padding: 6px 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: 500;
}

.chip:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* 消息行 */
.message-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  animation: msgIn 0.25s ease-out;
}

@keyframes msgIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-row.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.assistant-avatar {
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  color: white;
}

.user-avatar {
  background: var(--surface-3);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.message-bubble {
  max-width: 68%;
  padding: 12px 16px;
  border-radius: 14px;
  word-break: break-word;
}

.user .message-bubble {
  background: var(--primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.assistant .message-bubble {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
  box-shadow: var(--shadow-sm);
}

.message-content {
  font-size: 14px;
  line-height: 1.65;
  text-align: left;
}

/* Markdown 内容样式 */
.message-content :deep(p) { margin: 0.4em 0; }
.message-content :deep(p:first-child) { margin-top: 0; }
.message-content :deep(p:last-child) { margin-bottom: 0; }

.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3) {
  font-weight: 600;
  margin: 0.8em 0 0.4em;
  line-height: 1.3;
}
.message-content :deep(h1) { font-size: 1.2em; }
.message-content :deep(h2) { font-size: 1.1em; }
.message-content :deep(h3) { font-size: 1em; }

.message-content :deep(ul),
.message-content :deep(ol) { padding-left: 1.4em; margin: 0.4em 0; }
.message-content :deep(li) { margin: 0.2em 0; }

.message-content :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.85em;
  background: rgba(0,0,0,0.06);
  padding: 1px 5px;
  border-radius: 4px;
}

.user .message-content :deep(code) {
  background: rgba(255,255,255,0.2);
}

.message-content :deep(pre) {
  background: #0f172a;
  border-radius: 8px;
  padding: 14px;
  overflow-x: auto;
  margin: 0.6em 0;
}

.message-content :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 0.85em;
  line-height: 1.6;
}

.message-content :deep(blockquote) {
  border-left: 3px solid var(--border);
  padding-left: 12px;
  margin: 0.6em 0;
  color: var(--text-secondary);
  font-style: italic;
}

.message-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.6em 0;
  font-size: 0.9em;
}

.message-content :deep(th),
.message-content :deep(td) {
  border: 1px solid var(--border);
  padding: 6px 10px;
  text-align: left;
}

.message-content :deep(th) {
  background: var(--surface-3);
  font-weight: 600;
}

.message-content :deep(a) {
  color: var(--primary);
  text-decoration: underline;
}

.user .message-content :deep(a) { color: rgba(255,255,255,0.9); }

.message-meta {
  font-size: 11px;
  margin-top: 6px;
  opacity: 0.55;
  font-weight: 500;
}

.user .message-meta { text-align: right; }

/* 加载气泡 */
.loading-bubble {
  padding: 14px 18px;
}

.typing-dots {
  display: flex;
  gap: 5px;
  align-items: center;
}

.typing-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 1.3s infinite;
}

.typing-dots span:nth-child(2) { animation-delay: 0.15s; }
.typing-dots span:nth-child(3) { animation-delay: 0.3s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* ===== 输入面板 ===== */
.input-panel {
  padding: 16px 24px 20px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.files-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  color: var(--text-muted);
}

.files-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.file-chip {
  font-size: 11px;
  background: var(--primary-bg);
  color: var(--primary);
  border-radius: 4px;
  padding: 2px 7px;
  font-weight: 500;
}

.input-box {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 10px 10px 10px 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-box:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.input-box :deep(.el-textarea__inner) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  font-size: 14px !important;
  line-height: 1.6 !important;
  color: var(--text-primary) !important;
  resize: none !important;
}

.input-box :deep(.el-textarea__inner)::placeholder {
  color: var(--text-muted);
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: var(--surface-3);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-btn.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

.send-btn.active:hover {
  background: var(--primary-dark);
  transform: scale(1.05);
}

.send-btn:disabled {
  cursor: not-allowed;
}

.send-loading {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.input-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 8px;
  text-align: right;
}
</style>
