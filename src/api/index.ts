import request from '@/utils/request'
import type { ApiResponse } from '@/utils/request'

// 获取智能体列表
export const getAgentList = (): Promise<ApiResponse<any>> => {
  return request.get('/list')
}

// 获取智能体详情（用于编辑时回填）
export const getAgentDetail = (agentId: number): Promise<ApiResponse<{ id: number; name: string; description: string; filelist?: string[] }>> => {
  return request.get(`/${agentId}`)
}

// 创建智能体
export const createAgent = (data: { name: string; description?: string; fileList?: string[] }) => {
  return request.post('/add', data)
}

// 更新智能体
export const updateAgent = (data: { id: number; name: string; description?: string; fileList?: string[] }) => {
  return request.put('/update', data)
}

// 上传文件
export const uploadFileFunc = (file: File): Promise<ApiResponse<any>> => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}


// 提问接口
export const askAgent = (data: { question: string; agentId: number,file_path: string[] }): Promise<ApiResponse<any>> => {
  return request.post('/content', data)
} 

// 千问直接提问接口（无agent ID时使用）
export const directQuery = (data: { question: string }): Promise<ApiResponse<any>> => {
  return request.post('/direct-query', data)
}

// 智能体删除
export const deleteAgent = (agentId:number): Promise<ApiResponse<any>> => {
  return request.delete(`/${agentId}`)
}