import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// 定义接口响应数据类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 基础URL，可根据环境变量配置
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    
    // 如果有token，添加到请求头
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 可以在这里添加其他请求前的处理逻辑
    // console.log('Request:', config)
    
    return config
  },
  (error: any) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data as ApiResponse
    
    // 如果返回的状态码不是200，判断为错误
    if (res.code !== 200) {
      console.error('Response Error:', res.message)
      
      // 根据不同的错误码进行不同的处理
      switch (res.code) {
        // case 401:
        //   // 未授权，跳转到登录页
        //   console.error('未授权，请重新登录')
        //   localStorage.removeItem('token')
        //   window.location.href = '/login'
        //   break
        case 403:
          console.error('拒绝访问')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器错误')
          break
        default:
          console.error(res.message || '未知错误')
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    } else {
      return response.data as any
    }
  },
  (error: any) => {
    console.error('Response Error:', error)
    
    // 处理HTTP错误状态码
    if (error.response) {
      switch (error.response.status) {
        case 400:
          error.message = '请求错误'
          break
        case 401:
          error.message = '未授权，请登录'
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          error.message = '拒绝访问'
          break
        case 404:
          error.message = `请求地址出错: ${error.response.config.url}`
          break
        case 408:
          error.message = '请求超时'
          break
        case 500:
          error.message = '服务器内部错误'
          break
        case 501:
          error.message = '服务未实现'
          break
        case 502:
          error.message = '网关错误'
          break
        case 503:
          error.message = '服务不可用'
          break
        case 504:
          error.message = '网关超时'
          break
        case 505:
          error.message = 'HTTP版本不受支持'
          break
        default:
          error.message = `连接错误${error.response.status}`
      }
    } else if (error.code === 'ECONNABORTED') {
      error.message = '请求超时'
    } else {
      error.message = '网络连接失败'
    }
    
    return Promise.reject(error)
  }
)

// 封装请求方法
const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.get(url, config)
  },
  
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.post(url, data, config)
  },
  
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.put(url, data, config)
  },
  
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.delete(url, config)
  },
  
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.patch(url, data, config)
  },
}

export default request
export { service }