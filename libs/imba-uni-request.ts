import type {
  UniOptions_DTYPE,
  RequestConfig_DTYPE,
  Response_DTYPE,
  // head / option
  METHOD_DTYPE,
  CacheEnv,
  CacheUnit,
  Header_DTYPE,
  Record_DTYPE,
  Options_DTYPE,
  DataMore_DTYPE
} from './types/imba-uni-request'
import type { InterceptorsImpl_DTYPE, InterceptorPro_DTYPE, ChaiList_DTYPE } from './types/imba-uni-interceptor'

import { Interceptors } from './imba-uni-interceptor'
import { getCache, delCache, setCache } from 'imba-cache'
import stringify from 'qs-stringify'
import md5 from './md5'

const consoleLog = (key: string, val: any, color: string = '#41b883') => {
  console.log(`%c ${key}`, `font-size:14px; background:${color}; color:#ffffff;`, val)
}

export class UniRequest {
  /**
   * `baseURL` 将自动加在 `url` 前面，除非 `url` 是一个绝对 URL。
   *  它可以通过设置一个 `baseURL` 便于为实例的方法传递相对 URL
   */
  private baseURL: string = ''
  /**
   * 超时时间，单位毫秒
   * 默认 30s = 1000 * 30
   */
  private timeOut: number = 1000 * 30
  /**
   * 设置请求的 header，header 中不能设置 Referer。
   * 平台差异说明：App、H5端会自动带上cookie，且H5端不可手动修改
   */
  private headers: Header_DTYPE = {}
  /**
   * 记录请求过的地址
   * { [url]: Promise }
   */
  private recordUrl: Record_DTYPE = {}
  /**
   * 请求拦截和响应拦截执行器
   */
  public interceptors: InterceptorsImpl_DTYPE = new Interceptors()
  /**
   * 缓存&SWR环境 dev 或 prod
   * 默认 dev
   */
  private cacheEnv: CacheEnv = 'dev'
  /**
   * 缓存&SWR 是否开启
   * 默认 true
   */
  private cacheBool: boolean = true
  /**
   * 缓存&SWR 缓存时间 默认分单位 mm
   * 默认 -1
   */
  private cacheTime: number = -1
  /**
   * 缓存&SWR 缓存单位 mm | ss
   * 默认 mm
   */
  private cacheUnit: CacheUnit = 'mm'
  /**
   * 是否请求错误后重试
   * 默认 true
   */
  private retryBool: boolean = true
  /**
   * 请求重试错误次数
   * 默认 2
   */
  private retryCount: number = 2
  /**
   * 重试内时间定位 单位秒 在此时间内做错误重试请求
   * 默认 5
   */
  private retryInterval: number = 5
  /**
   * 请求地址追加次数统计 [{ '地址': [重试的次数,初次重试的时间] }]
   */
  private retryUrlCount: { [key: string]: [number, number] } = {}
  /**
   * loading请求中
   */
  public loading: boolean = false
  /**
   * 分页key
   */
  private pageKey: string = 'page'
  /**
   * 页数key
   */
  private sizeKey: string = 'size'
  /**
   * 是否开启打印请求数据
   */
  private printConsole: boolean = true

  constructor(option: Options_DTYPE) {
    this.setObjectVal(option)
    this.defaultInterceptor()
  }

  /**
   * 格式化功能性配置项
   * @param config
   * @returns
   */
  private dataFactory(config: RequestConfig_DTYPE) {
    let data = config.data as DataMore_DTYPE
    if (typeof data === 'string') return config
    const { _noToken, _formData, _header } = data

    this.loading = true
    if (data['_method']) {
      config.method = data['_method']
      delete data['_method']
    }

    if (data['_page']) {
      const pageSize = this.setPageSize(data['_page'])
      data = Object.assign(data, pageSize)
      delete data['_page']
    }

    if (data['_cache'] || data['_cache'] === 0) {
      this.cacheTime = this.comCache(data['_cache'])
      delete data['_cache']
    }

    if (data['_cacheUnit']) {
      this.cacheUnit = data['_cacheUnit']
      delete data['_cacheUnit']
    }

    if (config.url.indexOf(':id') !== -1) {
      if (data['_id'] === undefined) {
        this.loading = false
        return Promise.reject(`${config.url} 没有传参数ID 格式 -> { _id: 10086 }`)
      }
      config.url = config.url.replace(':id', data['_id'])
      delete data['_id']
    }

    if (_noToken) {
      delete data['_noToken']
      delete config.header['x-access-token']
      delete config.header['Authorization']
    }

    if (_formData) {
      config.header['content-Type'] = 'application/x-www-form-urlencoded'
      delete data['_formData']
    }

    if (_header) {
      config.header = { ...config.header, ..._header }
      delete data['_header']
    }

    if (config.headers) {
      config.header = Object.assign(config.header || {}, config.headers)
      delete config.headers
    }

    config.data = Object.assign(config.data as DataMore_DTYPE, data)
    return config
  }

  /**
   * 默认拦截处理
   */
  private defaultInterceptor() {
    /**
     * 默认拦截请求处理
     */
    this.interceptors.request.use((config) => {
      return this.dataFactory(config) as RequestConfig_DTYPE
    })

    /**
     * 默认响应请求处理
     */
    this.interceptors.response.use((res) => {
      this.loading = false
      return res
    })
  }

  /**
   *
   * @returns 计算缓存时间
   */
  private comCache(time?: number) {
    if (time) this.cacheTime = time
    return this.cacheUnit === 'mm' ? this.cacheTime * 60 : this.cacheTime
  }

  /**
   * 设置当前页，页面数
   * @param cur [当前页，页面数]
   * @returns
   */
  private setPageSize(cur: [number, number] = [1, 10]): Object {
    const [page, size] = cur
    return {
      [this.pageKey]: page <= 0 ? 1 : page,
      [this.sizeKey]: size <= 0 ? 1 : size
    }
  }

  request<T = any>(apiUrl: string, data: any, method: METHOD_DTYPE, options?: UniOptions_DTYPE): Promise<T> {
    const { baseURL, headers, timeOut } = this
    let newConfig: UniOptions_DTYPE = this.dataFactory(
      Object.assign(
        {
          baseURL: options?.url || baseURL,
          url: baseURL + apiUrl,
          data,
          header: Object.assign({ 'content-type': 'application/json;charset=UTF-8' }, headers),
          method,
          timeout: timeOut
        },
        options || {}
      )
    ) as UniOptions_DTYPE

    const isGet = newConfig.method === 'GET' && !newConfig.appendQuery
    const dataStrify = data && typeof data === 'object' && Object.keys(data).length > 0 ? `?${stringify(data)}` : ''
    let keyApi = `${newConfig.url}${isGet ? `${dataStrify}` : ''}`
    let cacheName = 'cache_' + `${keyApi}`

    if (this.cacheBool) {
      if (this.cacheEnv === 'prod' || this.cacheEnv === 'production') {
        cacheName += `bodymd5=${md5(dataStrify)}`
        cacheName = md5(cacheName)
      } else {
        cacheName += dataStrify
      }
      // if (isGet && keyApi.length === keyApi.lastIndexOf('?') + 1) keyApi = keyApi.substring(0, keyApi.length - 1)
      if (this.cacheTime === 0) delCache(cacheName)
    }

    const appPro = {
      id: 'appPro',
      resolved: async (config: RequestConfig_DTYPE) => {
        const recordKey = `${apiUrl} ${method}`
        const pro = this.recordUrl[recordKey]
        if (pro) {
          consoleLog(`[ ${recordKey} ]-重复请求,列入集中请求:`, pro, '#f5bd30')
          return await pro
        }

        if (this.cacheTime > 0) {
          const cache = getCache(cacheName)
          if (cache) {
            if (this.printConsole) consoleLog(`[ ${recordKey} ]-接口缓存:`, cache)
            return await cache
          }
        }

        const p = new Promise((resolve) => {
          config.success = (res) => {
            if (this.cacheBool && this.cacheTime > 0) {
              setCache(cacheName, res, this.comCache())
            }
            consoleLog(`[ ${recordKey} ]-请求成功:`, res)
            resolve(res)
          }
          config.complete = () => {
            this.recordUrl[recordKey] = null
          }
          if (this.retryBool) {
            config.fail = (err) => {
              const retryDefaultValue = [0, new Date().getTime() + this.retryInterval * 1000]
              const [countNum, firstTime] = this.retryUrlCount[recordKey] || retryDefaultValue
              const comTime = firstTime - new Date().getTime()
              if (countNum >= this.retryCount) {
                resolve(err)
                return
              }
              if (comTime <= 0) {
                resolve(err)
                return
              }
              this.recordUrl[recordKey] = null
              this.retryUrlCount[recordKey] = [countNum + 1, firstTime]
              consoleLog(`[ ${recordKey} ]-请求失败,重试请求${countNum + 1}:`, err, '#eb3941')
              appPro.resolved(config).then((res) => resolve(res))
            }
          }
          uni.request(config)
        })

        this.recordUrl[recordKey] = p
        return await p
      },
      rejected: () => Promise.reject(`错误异常...`)
    }

    /**
     * 请求拦截2 -> 请求拦截1 -> 发送请求 -> 响应拦截1 -> 响应拦截2 -> ...
     */
    const chain: Array<ChaiList_DTYPE> = [
      // 主体请求体
      appPro
    ]

    // 把请求拦截器往数组头部推
    this.interceptors.request.call((interceptor) => {
      chain.unshift(interceptor)
    })

    // 把响应拦截器往数组尾部推
    this.interceptors.response.call((interceptor) => {
      chain.push(interceptor)
    })

    // 把config也包装成一个promise
    let promise = Promise.resolve(newConfig)

    // 暴力while循环解忧愁
    // 利用promise.then的能力递归执行所有的拦截器
    while (chain.length) {
      const { resolved, rejected } = chain.shift() as InterceptorPro_DTYPE<any>
      promise = promise.then(resolved, rejected)
    }

    // 最后暴露给用户的就是响应拦截器处理过后的promise
    return (promise as unknown) as Promise<T>
  }

  get<T = any>(apiUrl: string, data: any, options?: UniOptions_DTYPE): Promise<T> {
    return this.request(apiUrl, data, 'GET', options)
  }

  post<T = any>(apiUrl: string, data: any, options?: UniOptions_DTYPE): Promise<T> {
    return this.request(apiUrl, data, 'POST', options)
  }

  put<T = any>(apiUrl: string, data: any, options?: UniOptions_DTYPE): Promise<T> {
    return this.request(apiUrl, data, 'PUT', options)
  }

  delete<T = any>(apiUrl: string, data: any, options?: UniOptions_DTYPE): Promise<T> {
    return this.request(apiUrl, data, 'DELETE', options)
  }

  setObjectVal(obj: Object) {
    if (!obj) return this
    Object.entries(obj).forEach(([key, val]) => (this[key as keyof UniRequest] = val))
    return this
  }
}
