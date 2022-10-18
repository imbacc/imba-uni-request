import type { InterceptorsImpl_DTYPE } from './imba-uni-interceptor'

export type METHOD_DTYPE = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'CONNECT' | 'HEAD' | 'TRACE'

export type Response_DTYPE<T = any> = {
  data: T
  statusCode: number
  header?: Object
  errMsg?: string
  cookies?: Array<string>
}

export type CacheEnv = 'development' | 'production' | 'dev' | 'prod'
export type CacheUnit = 'mm' | 'ss'
export type RequestConfig_DTYPE = Options_DTYPE & UniOptions_DTYPE

export type Record_DTYPE = { [key in string]: any }
export type Header_DTYPE = { [key in string]: string }

export type DataMore_DTYPE = {
  /**
   * 去除token
   */
  _noToken?: Boolean
  /**
   * 表单形式提交 FormData
   */
  _formData?: Boolean
  /**
   * 头部内容
   */
  _header?: Header_DTYPE
  /**
   * 请求类型 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'CONNECT' | 'HEAD' | 'TRACE'
   */
  _method?: METHOD_DTYPE
  /**
   * 分页[page, size]
   */
  _page?: [number, number]
  /**
   * 缓存时间 秒单位
   */
  _cache?: number
  /**
   * 分钟单位mm 秒单位ss
   */
  _cacheUnit?: CacheUnit
  /**
   * 地址/page/:id
   */
  _id?: string
}

export type Options_DTYPE = {
  /**
   *  `baseURL` 将自动加在 `url` 前面，除非 `url` 是一个绝对 URL。
   *  它可以通过设置一个 `baseURL` 便于为实例的方法传递相对 URL
   */
  baseURL: string
  /**
   * 超时时间，单位毫秒
   * 默认 30s = 1000 * 30
   */
  timeOut?: number
  /**
   * 设置请求的 header，header 中不能设置 Referer。
   * 平台差异说明：App、H5端会自动带上cookie，且H5端不可手动修改
   */
  headers?: Header_DTYPE
  /**
   * 自定义内容 格式函数
   */
  data?: DataMore_DTYPE
  /**
   * 缓存&SWR环境 'development' | 'production' | 'dev' | 'prod'
   * 默认 dev
   */
  cacheEnv?: CacheEnv
  /**
   * 缓存&SWR 是否开启
   * 默认 true
   */
  cacheBool?: boolean
  /**
   * 缓存&SWR 缓存时间 默认分单位 mm
   * 默认 -1
   */
  cacheTime?: number
  /**
   * 缓存&SWR 缓存单位 mm | ss
   * 默认 mm
   */
  cacheUnit?: CacheUnit
  /**
   * 是否请求错误后重试
   * 默认 true
   */
  retryBool?: boolean
  /**
   * 请求重试错误次数
   * 默认 2
   */
  retryCount?: number
  /**
   * 重试内时间定位 单位秒
   * 默认 5
   */
  retryInterval?: number
  /**
   * 分页字段设置
   */
  pageKey?: string
  sizeKey?: string
  /**
   * 是否开启打印请求数据
   */
  printConsole?: boolean
}

export interface UniOptions_DTYPE {
  /**
   * 资源url
   */
  url: string
  /**
   * 请求的参数
   */
  data?: string | AnyObject | ArrayBuffer
  /**
   * 设置请求的 header，header 中不能设置 Referer。
   */
  header?: any
  /**
   * 默认为 GET
   * 可以是：OPTIONS，GET，HEAD，POST，PUT，DELETE，TRACE，CONNECT
   */
  method?: METHOD_DTYPE
  /**
   * 超时时间
   */
  timeout?: number
  /**
   * 如果设为json，会尝试对返回的数据做一次 JSON.parse
   */
  dataType?: string
  /**
   * 验证 ssl 证书
   */
  sslVerify?: boolean
  /**
   * 跨域请求时是否携带凭证
   */
  withCredentials?: boolean
  /**
   * DNS解析时优先使用 ipv4
   */
  firstIpv4?: boolean
  /**
   * 成功返回的回调函数
   */
  success?: (result: RequestSuccessCallbackResult) => void
  /**
   * 失败的回调函数
   */
  fail?: (result: GeneralCallbackResult) => void
  /**
   * 结束的回调函数（调用成功、失败都会执行）
   */
  complete?: (result: GeneralCallbackResult) => void
}

interface RequestSuccessCallbackResult {
  /**
   * 开发者服务器返回的数据
   */
  data: string | AnyObject | ArrayBuffer
  /**
   * 开发者服务器返回的 HTTP 状态码
   */
  statusCode: number
  /**
   * 开发者服务器返回的 HTTP Response Header
   */
  header: any
  /**
   * 开发者服务器返回的 cookies，格式为字符串数组
   */
  cookies: string[]
}

interface GeneralCallbackResult {
  /**
   * 错误信息
   */
  errMsg: string
}
