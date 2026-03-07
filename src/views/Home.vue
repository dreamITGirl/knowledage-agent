<script setup lang="ts">
import { ref, onBeforeMount, onDeactivated } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElCard, ElInput, ElMessage, ElTag, ElRow, ElCol, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessageBox } from 'element-plus'
import { MoreFilled } from '@element-plus/icons-vue'
import { askAgent, getAgentList } from '@/api/index'
const router = useRouter()

interface Agent {
  id: number
  name: string
  description: string
  filelist?: string[]
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
const answerContent = ref<string>('')



// 新建按钮点击事件，跳转到创建页面
const handleCreate = () => {
  router.push('/create')
}

const handleSend = () => {
  if (!inputMessage.value) {
    ElMessage.warning('请输入提示词')
    return
  }
  loading.value = true
  askAgent({
    question: inputMessage.value,
    agentId: selectedAgent.value?.id || 0,
    file_path: selectedAgent.value?.filelist || []
  }).then(response => {
    ElMessage.success(`回答: ${response.data}`)
    answerContent.value = response.data ?? ''
  }).catch(error => {
    console.error('提问失败:', error)
    ElMessage.error('提问失败')
  }).finally(() => {
    loading.value = false
  })  
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
    .then(() => {
      const index = agent_list.value.findIndex(item => item.id === agent.id)
      if (index > -1) {
        agent_list.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
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
  answerContent.value = ''
}

onBeforeMount(() => {
  getAgentData()
})
onDeactivated(() => {
  selectedAgent.value = null
  inputMessage.value = ''
  answerContent.value = ''
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
              <el-button size="small" type="primary" @click="handleCreate">
                  新建
              </el-button>
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
        <el-card class="demo-card">
          <template #header>
            <div class="card-header">
              <span>{{ selectedAgent?.name || '千问' }}</span>
            </div>
          </template>
          <div class="demo-content">
            <div class="lt">
              <el-input
                v-model="inputMessage"
                type="textarea"
                placeholder="请输入问题..."
                :autosize="{ minRows: 3, maxRows: 5 }"
                :disabled="loading"
                @keyup.enter="handleSend"
              />
            </div>
            <div>
              <el-input
                v-model="answerContent"
                type="textarea"
                placeholder="智能体回答将显示在这里..."
                :autosize="{ minRows: 3, maxRows: 5 }"
                readonly
                />
            </div>

           <div v-if="selectedAgent?.filelist" class="description">
              <p><strong>知识库文件:</strong></p>
              <ul>
                <li v-for="(file, index) in selectedAgent.filelist" :key="index">
                 {{ file.split('/').pop() }}
                </li>
              </ul>
           </div>
            <div class="button-group">
              <el-button type="default"  @click="() => {
                inputMessage = ''
                answerContent = ''
              }">
                清空
              </el-button>
              <el-button type="primary" :loading="loading" @click="handleSend">
                提问
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      
    </el-row>
  </div>
</template>

<style scoped>
.container {
  font-family:  Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-card h1 {
  font-size: 2.5rem;
  margin: 10px 0;
  color: white;
}

.header-card h2 {
  font-size: 1.5rem;
  margin: 10px 0;
  color: rgba(255, 255, 255, 0.9);
}

.main-content {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.demo-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
/* .demo-content .lt{
  
} */

.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.tech-stack {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  justify-content: flex-start;
}
.tech-stack > div{
    width: 100%;
}

.description {
  text-align: left;
  line-height: 1.8;
  color: #666;
}

.description p {
  margin: 0;
}
.agent-tag{
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    font-size: 14px;
}
.agent-tag:hover{
    background-color: #f5f5f5;
}

.agent-tag .el-icon {
    outline: none;
}
.agent-tag .el-icon:focus {
    outline: none;
}
:deep(.el-card__body) {
  padding: 10px;
}
</style>