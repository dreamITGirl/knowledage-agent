<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElButton, ElCard, ElInput, ElMessage, ElUpload, UploadProps, UploadFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

interface AgentForm {
  name: string
  description: string
}

interface Agent {
  id: number
  name: string
  description: string
}

const router = useRouter()
const route = useRoute()
const agentForm = reactive<AgentForm>({
  name: '',
  description: ''
})
const loading = ref(false)
const fileList = ref<UploadFile[]>([])

// 判断是否为编辑模式
const isEditMode = computed(() => {
  return route.query.id !== undefined
})

// 页面标题
const pageTitle = computed(() => {
  return isEditMode.value ? '编辑智能体' : '创建智能体'
})

// 按钮文本
const buttonText = computed(() => {
  return isEditMode.value ? '保存' : '创建'
})

// 获取智能体数据（模拟从存储中获取）
const getAgentById = (id: number): Agent | undefined => {
  const agents = localStorage.getItem('agents')
  if (agents) {
    const agentList: Agent[] = JSON.parse(agents)
    return agentList.find(agent => agent.id === id)
  }
  return undefined
}

// 组件挂载时，如果是编辑模式，填充数据
onMounted(() => {
  if (isEditMode.value && route.query.id) {
    const agentId = parseInt(route.query.id as string)
    const agent = getAgentById(agentId)
    if (agent) {
      agentForm.name = agent.name
      agentForm.description = agent.description
    }
  }
})

// 文件上传前的验证
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  // 允许的文件类型
  const allowedTypes = [
    // 文本文件
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'application/xml',
    // 图片文件
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp'
  ]
  
  // 验证文件类型
  const isAllowedType = allowedTypes.includes(rawFile.type)
  if (!isAllowedType) {
    ElMessage.error('只支持文本文件和图片文件！')
    return false
  }
  
  // 验证文件大小（10M = 10 * 1024 * 1024 bytes）
  const isLt10M = rawFile.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB！')
    return false
  }
  
  return true
}

// 文件数量超出限制
const handleExceed: UploadProps['onExceed'] = (files) => {
  ElMessage.warning(`当前限制选择 10 个文件，本次选择了 ${files.length} 个文件`)
}

// 文件移除
const handleRemove: UploadProps['onRemove'] = (file) => {
  ElMessage.info(`已移除文件: ${file.name}`)
}

const handleSave = () => {
  if (!agentForm.name || !agentForm.description) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  loading.value = true
  // 模拟保存操作
  setTimeout(() => {
    if (isEditMode.value) {
      ElMessage.success('修改成功！')
    } else {
      ElMessage.success('创建成功！')
    }
    loading.value = false
    // 跳转回首页
    router.push('/')
  }, 1000)
}

const handleCancel = () => {
  router.push('/')
}
</script>

<template>
  <div class="create-container">
          <div class="card-header">
            <span>{{ pageTitle }}</span>
          </div>
          <el-form :model="agentForm" label-width="150px" style="width: 80%; ">
            <el-form-item label="智能体名称">
            <el-input
                v-model="agentForm.name"
                placeholder="请输入智能体名称"
                size="large"
                clearable
            />
            </el-form-item>
            
            <el-form-item label="描述信息">
            <el-input
                v-model="agentForm.description"
                type="textarea"
                :rows="4"
                placeholder="请输入智能体描述信息"
                size="large"
                maxlength="500"
                show-word-limit
                resize="none"
            />
            </el-form-item>

            <el-form-item label="上传文件（非必填）">
            <el-upload
                v-model:file-list="fileList"
                class="upload-demo"
                drag
                action="#"
                :auto-upload="false"
                :before-upload="beforeUpload"
                :limit="10"
                :on-exceed="handleExceed"
                :on-remove="handleRemove"
                multiple
            >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                <div class="el-upload__tip">
                    支持文本文件和图片文件，单个文件大小不超过 10MB
                </div>
                </template>
            </el-upload>
            </el-form-item>

            <div class="button-group">
            <el-button @click="handleCancel" size="large" class="cancel-btn">
                取消
            </el-button>
            <el-button type="primary" @click="handleSave" :loading="loading" size="large" class="submit-btn">
                {{ buttonText }}
            </el-button>
            </div>
          </el-form>
       
  </div>
</template>

<style scoped>
.create-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  padding: 40px 20px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.create-card {
  width: 100%;
  /* max-width: 800px; */
  border-radius: 16px;
  margin-top: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.create-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
}


.card-header {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c3e50;
  letter-spacing: -0.5px;
}

.el-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.el-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.el-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #495057;
  font-size: 0.95rem;
}




.upload-demo {
  width: 100%;
}

.upload-demo :deep(.el-upload-dragger) {
  border-radius: 12px;
  border: 2px dashed #d0d7de;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  transition: all 0.3s ease;
  padding: 40px 20px;
}

.upload-demo :deep(.el-upload-dragger:hover) {
  border-color: #667eea;
  background: linear-gradient(180deg, #f0f3ff 0%, #ffffff 100%);
  transform: scale(1.02);
}

.upload-demo :deep(.el-icon--upload) {
  font-size: 64px;
  color: #667eea;
  margin-bottom: 16px;
}

.upload-demo :deep(.el-upload__text) {
  font-size: 1rem;
  color: #495057;
  line-height: 1.6;
}

.upload-demo :deep(.el-upload__text em) {
  color: #667eea;
  font-style: normal;
  font-weight: 500;
}

.upload-demo :deep(.el-upload__tip) {
  margin-top: 16px;
  font-size: 0.875rem;
  color: #6c757d;
  line-height: 1.5;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}

.button-group .el-button {
  min-width: 120px;
  border-radius: 8px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.cancel-btn {
  border-color: #ced4da;
  color: #6c757d;
}

.cancel-btn:hover {
  border-color: #adb5bd;
  color: #495057;
  background-color: #f8f9fa;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .create-container {
    padding: 20px 16px;
  }

  .create-card {
    margin-top: 0;
  }

  .create-card :deep(.el-card__body) {
    padding: 24px 16px;
  }

  .card-header {
    font-size: 1.5rem;
  }

  .el-form {
    gap: 20px;
  }

  .button-group {
    flex-direction: column;
    gap: 10px;
  }

  .button-group .el-button {
    width: 100%;
    min-width: auto;
  }

  .upload-demo :deep(.el-upload-dragger) {
    padding: 30px 16px;
  }
}

@media (max-width: 480px) {
  .create-container {
    padding: 16px 12px;
  }

  .card-header {
    font-size: 1.25rem;
  }

  .el-form :deep(.el-form-item__label) {
    font-size: 0.875rem;
  }

  .create-card :deep(.el-card__body) {
    padding: 20px 12px;
  }
}
</style>