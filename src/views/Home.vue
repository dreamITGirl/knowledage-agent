<script setup lang="ts">
import { ref, onBeforeMount, onDeactivated, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElCard, ElInput, ElMessage, ElTag, ElRow, ElCol, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessageBox } from 'element-plus'
import { MoreFilled } from '@element-plus/icons-vue'
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
  <div class="container">
    <el-card class="header-card">
      <h1>知识问答智能体</h1>
      <el-tag type="primary" size="large">设置自己的专属知识库</el-tag>
    </el-card>
    <el-row :gutter="20" class="main-content">
      <el-col :span="4">
        <el-card class="demo-card">
          <template #header>
            <div class="card-header">
              <span>智能体</span>
              <div class="header-buttons">
                <el-button 
                  size="small" 
                  :type="selectedAgent === null ? 'primary' : ''"
                  @click="selectQianwen"
                >
                  千问
                </el-button>
                <el-button size="small" type="primary" @click="handleCreate">
                  新建
                </el-button>
              </div>
            </div>
          </template>
            <div class="tech-stack">
              <div v-if="agent_list.length > 0">
                    <div v-for="agent in agent_list" :key="agent.id" class="agent-tag" @click="()=>{
                      questionAgent(agent)
                    }">
                        <span>{{ agent.name }}</span>
                        <el-dropdown placement="bottom" trigger="hover">
                            <el-icon style="color:rgba(0,0,0,0.5); cursor: pointer;"><MoreFilled /></el-icon>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item @click="handleEdit(agent)">编辑</el-dropdown-item>
                                    <el-dropdown-item @click="handleDelete(agent)">删除</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
              </div>
              <div v-else>
                <el-Empty :image-size="100" description="暂无智能体" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="20">
        <el-card class="chat-card">
          <template #header>
            <div class="card-header">
              <span>{{ selectedAgent?.name || '千问' }}</span>
            </div>
          </template>
          <div class="chat-content">
            <!-- 聊天消息区域 -->
            <div ref="chatContainer" class="chat-messages">
              <div v-if="chatMessages.length === 0" class="empty-chat">
                <p>开始与智能体对话吧！</p>
              </div>
              <div v-for="message in chatMessages" :key="message.id" 
                   :class="['message-wrapper', message.role]">
                <div class="message-bubble">
                  <div class="message-content" v-html="renderMarkdown(message.content)"></div>
                  <div class="message-time">
                    {{ message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
                  </div>
                </div>
              </div>
              <div v-if="loading" class="message-wrapper assistant">
                <div class="message-bubble loading-bubble">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 输入区域 -->
            <div class="chat-input-area">
              <el-input
                v-model="inputMessage"
                type="textarea"
                placeholder="输入你的问题..."
                :autosize="{ minRows: 1, maxRows: 4 }"
                :disabled="loading"
                @keyup.enter.exact="handleSend"
              />
              <div class="input-actions">
                <div v-if="selectedAgent?.filelist && selectedAgent.filelist.length > 0" class="knowledge-files-inline">
                  <span class="files-label">知识库:</span>
                  <el-tag 
                    v-for="(file, index) in selectedAgent.filelist" 
                    :key="index"
                    size="small"
                    type="info"
                    class="file-tag"
                  >
                    {{ file.split('/').pop() }}
                  </el-tag>
                </div>
                <div class="action-buttons">
                  <el-button size="small" @click="() => {
                    chatMessages = []
                  }">
                    清空对话
                  </el-button>
                  <el-button type="primary" size="small" :loading="loading" @click="handleSend">
                    发送
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
    </el-row>
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