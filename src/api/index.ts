import request from '@/utils/request'
import type { ApiResponse } from '@/utils/request'

// 获取智能体列表
export const getAgentList = (): Promise<ApiResponse<any>> => {
  return request.get('/list')
}
