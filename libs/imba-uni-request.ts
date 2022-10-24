import type {
  RequestConfig_DTYPE,
  // head / option
  METHOD_DTYPE,
  CacheEnv,
  CacheUnit,
  Header_DTYPE,
  Record_DTYPE,
  Inject_DTYPE,
  Data_DTYPE
} from './types/imba-uni-request'
import type { InterceptorsImpl_DTYPE, InterceptorPro_DTYPE, ChaiList_DTYPE } from './types/imba-uni-interceptor'

import { Interceptors } from './imba-uni-interceptor'
import { getCache, delCache, setCache, comCache } from 'imba-cache'
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
  private header: Header_DTYPE = { 'content-type': 'application/json;charset=UTF-8' }
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
   * 打印API接口地址是否MD5化
   */
  private printMD5: boolean = false
  /**
   * 是否开启打印请求数据
   */
  private printConsole: boolean = true

  constructor(option: RequestConfig_DTYPE) {
    this.setObjectVal(option)
    this.defaultInterceptor()
  }

  /**
   * 格式化功能性配置项
   * @param config
   * @returns
   */
  private dataFactory(config: RequestConfig_DTYPE) {
    let inject = config.inject as Inject_DTYPE
    this.loading = true

    if (config.headers) {
      config.header = Object.assign(config.header || {}, config.headers)
      delete config.headers
    }

    if (!inject) {
      return config
    }

    const { _noToken, _formData, _header, _method, _page, _cache, _cacheUnit, _id, _param, _body } = inject || {}

    if ((config.url as string).indexOf(':id') !== -1) {
      if (_id === undefined) {
        this.loading = false
        return Promise.reject(`${config.url} 没有传参数ID 格式 -> { _id: 10086 }`)
      }
      config.url = (config.url as string).replace(':id', _id)
      delete inject['_id']
    }

    if (_method) {
      config.method = _method
      delete inject['_method']
    }

    if (_page) {
      const pageSize = this.setPageSize(_page)
      const key = config.method === 'GET' ? 'param' : 'body'
      config[key] = Object.assign(config[key] || {}, pageSize)
      delete inject['_page']
    }

    if (_cache || _cache === 0) {
      this.cacheTime = _cache
      delete inject['_cache']
    }

    if (_cacheUnit) {
      this.cacheUnit = _cacheUnit
      delete inject['_cacheUnit']
    }

    if (_noToken) {
      delete inject['_noToken']
      delete (config.header as Header_DTYPE)['x-access-token']
      delete (config.header as Header_DTYPE)['Authorization']
    }

    if (_formData) {
      ;(config.header as Header_DTYPE)['content-Type'] = 'application/x-www-form-urlencoded'
      delete inject['_formData']
    }

    if (_header) {
      config.header = { ...config.header, ..._header }
      delete inject['_header']
    }

    if (_param) {
      config.param = Object.assign(config.param || {}, _param)
      delete inject['_param']
    }

    if (_body) {
      config.body = Object.assign(config.body || {}, _body)
      delete inject['_body']
    }

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
      return this.dataFactory(config)
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
   * 计算剩余缓存时间
   * @param key
   * @returns
   */
  private comCacheStrify(key: string) {
    const lastTime = comCache(key)
    return `剩余${lastTime}s过期!`
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

  request<T = any>(
    apiUrl: string | [string, METHOD_DTYPE] | [string, METHOD_DTYPE, number],
    inject?: Inject_DTYPE,
    options?: Partial<RequestConfig_DTYPE>
  ): Promise<T> {
    if (options) this.setObjectVal(options)

    let api: string = '',
      method: METHOD_DTYPE = 'GET'
    if (apiUrl.constructor === Array && apiUrl.length > 0) {
      const [name, type, time] = apiUrl
      if (name) api = name
      if (type) method = type
      this.cacheTime = time || -1
    }

    const { baseURL, header, headers, timeOut } = this
    const newConfig = this.dataFactory(
      Object.assign(
        {
          baseURL: baseURL,
          url: baseURL + (api || apiUrl),
          method,
          header: Object.assign(header, headers),
          timeout: timeOut
        },
        options || {},
        options?.uniOption || {}
      )
    ) as RequestConfig_DTYPE

    if (newConfig.constructor.name === 'Promise') {
      return (newConfig as unknown) as Promise<any>
    }

    if (inject) {
      newConfig.inject = Object.assign(newConfig.inject || {}, inject)
    }

    const appPro = {
      id: 'appPro',
      resolved: async (config: UniNamespace.RequestOptions & RequestConfig_DTYPE) => {
        const paramStrify = config.param && Object.keys(config.param).length > 0 ? `?${stringify(config.param)}` : ''
        const bodyStrify =
          config.body && Object.keys(config.body).length > 0
            ? `${paramStrify ? '&body=right&' : ''}${stringify(config.body)}`
            : ''
        const keyApi = `${config.url}${paramStrify}`
        const isGet = config.method === 'GET'
        // const isPord = this.cacheEnv === 'prod' || this.cacheEnv === 'production'

        let md5ParamBodyStrify = `${config.url}${paramStrify === '' ? '?' : paramStrify}${!isGet ? bodyStrify : ''}`
        if (this.printMD5) md5ParamBodyStrify = md5(md5ParamBodyStrify)
        if (!isGet) config.data = Object.assign(config.data || {}, config.body || {})

        config.url = keyApi
        const recordKey = `${md5ParamBodyStrify}_${config.method}`
        const needCache = this.cacheBool && this.cacheTime > 0
        const cacheName = `cache_${recordKey}`
        if (this.cacheBool && this.cacheTime === 0) {
          delCache(cacheName)
        }

        const pro = this.recordUrl[recordKey]
        if (pro) {
          consoleLog(`[ ${recordKey} ]-重复请求,列入集中请求↓`, pro, '#f5bd30')
          return await pro
        }

        if (needCache) {
          const cache = getCache(cacheName)
          if (cache) {
            if (this.printConsole) consoleLog(`[ ${recordKey} ]-接口缓存↓ ${this.comCacheStrify(cacheName)}`, cache)
            return await cache
          }
        }

        const p = new Promise((resolve) => {
          config.success = (res) => {
            if (needCache) {
              setCache(cacheName, res, this.cacheTime, this.cacheUnit)
            }
            consoleLog(`[ ${recordKey} ]-请求成功↓`, res)
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
              consoleLog(`[ ${recordKey} ]-请求失败,重试请求${countNum + 1}↓`, err, '#eb3941')
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

  get<T = any>(apiUrl: string, inject?: Inject_DTYPE, options?: RequestConfig_DTYPE): Promise<T> {
    return this.request([apiUrl, 'GET'], inject, options)
  }

  post<T = any>(apiUrl: string, inject?: Inject_DTYPE, options?: RequestConfig_DTYPE): Promise<T> {
    return this.request([apiUrl, 'POST'], inject, options)
  }

  put<T = any>(apiUrl: string, inject?: Inject_DTYPE, options?: RequestConfig_DTYPE): Promise<T> {
    return this.request([apiUrl, 'PUT'], inject, options)
  }

  delete<T = any>(apiUrl: string, inject?: Inject_DTYPE, options?: RequestConfig_DTYPE): Promise<T> {
    return this.request([apiUrl, 'DELETE'], inject, options)
  }

  setObjectVal(obj: Object) {
    if (!obj) return this
    Object.entries(obj).forEach(([key, val]) => (this[key as keyof UniRequest] = val))
    return this
  }
}
