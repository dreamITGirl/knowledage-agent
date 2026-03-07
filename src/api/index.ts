import request from '@/utils/request'
import type { ApiResponse } from '@/utils/request'

// 获取智能体列表
export const getAgentList = (): Promise<ApiResponse<any>> => {
  return request.get('/list')
}

// 创建智能体
export const createAgent = (data: { name: string; description?: string ,fileList?:Array<string>}) => {
  return request.post('/add', data)
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