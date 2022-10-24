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

export type Record_DTYPE = { [key: string]: any }
export type Header_DTYPE = { [key: string]: string }
export type Data_DTYPE = Record_DTYPE

export type Inject_DTYPE = {
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
  /**
   * querystring参数
   */
  _param?: Data_DTYPE
  /**
   * 请求体参数
   */
  _body?: Data_DTYPE
}

export type RequestConfig_DTYPE = {
  /**
   *  `baseURL` 将自动加在 `url` 前面，除非 `url` 是一个绝对 URL。
   *  它可以通过设置一个 `baseURL` 便于为实例的方法传递相对 URL
   */
  baseURL: string
  /**
   * 资源url
   */
  url?: string
  /**
   * 默认为 GET
   * 可以是：OPTIONS，GET，HEAD，POST，PUT，DELETE，TRACE，CONNECT
   */
  method?: METHOD_DTYPE
  /**
   * 超时时间，单位毫秒
   * 默认 30s = 1000 * 30
   */
  timeOut?: number
  /**
   * 设置请求的 header，header 中不能设置 Referer。
   * 平台差异说明：App、H5端会自动带上cookie，且H5端不可手动修改
   */
  header?: Header_DTYPE
  headers?: Header_DTYPE
  /**
   * querystring参数
   */
  param?: Data_DTYPE
  /**
   * 请求体参数
   */
  body?: Data_DTYPE
  /**
   * 自定义内容 格式函数
   */
  inject?: Inject_DTYPE
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
   * 重试内时间定位 单位秒 在此时间内做错误重试请求
   * 默认 5
   */
  retryInterval?: number
  /**
   * uni.request原始配置
   */
  uniOption?: Partial<UniNamespace.RequestOptions>
  /**
   * 分页字段设置
   */
  pageKey?: string
  sizeKey?: string
  /**
   * 打印API接口地址是否MD5化
   */
  printMD5?: boolean
  /**
   * 是否开启打印请求数据
   */
  printConsole?: boolean
}
