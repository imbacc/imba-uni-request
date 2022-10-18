import type {
  InterceptorPro_DTYPE,
  InterceptorFun_DTYPE,
  ResolvedFun_DTYPE,
  RejectedFun_DTYPE,
  InterceptorTaskImpl_DTYPE,
  InterceptorsImpl_DTYPE,
  ChaiList_DTYPE
} from '../libs/types/imba-uni-interceptor'
import type {
  RequestConfig_DTYPE,
  UniOptions_DTYPE,
  Response_DTYPE,
  // head / option
  CacheEnv,
  CacheUnit,
  Header_DTYPE,
  Record_DTYPE,
  Options_DTYPE
} from '../libs/types/imba-uni-request'

import { expect } from 'chai'
import { describe, it } from 'mocha'
import { Interceptors } from '../libs/imba-uni-interceptor'

describe('测试组', () => {
  const interceptors = new Interceptors()

  interceptors.request.use((config) => {
    return config
  })

  interceptors.request.use((config) => {
    config.data = Object.assign(config.data, { ddd: 111, eee: false })
    console.log('config 1111111111', config)
    return config
  })

  interceptors.request.use((config) => {
    config.data = Object.assign(config.data, { ccc: 'i am ccc' })
    console.log('config 22222222', config)
    // return config
    return Promise.resolve(config)
  })

  interceptors.request.use(async (config) => {
    config.data = Object.assign(config.data, { bbb: 'i am bbb' })
    console.log('config 33333333', config)
    return await config
  })

  interceptors.request.use((config) => {
    config.data = Object.assign(config.data, { aaa: 'i am aaa' })
    console.log('config 4444444', config)
    return config
    // return Promise.resolve(config)
  })

  interceptors.response.use((res) => {
    return {
      statusCode: 200,
      errMsg: '',
      config: res,
      data: {
        code: 200,
        msg: '',
        data: res
      }
    }
  })

  let newConfig: UniOptions_DTYPE = {
    url: 'test',
    data: {},
    header: Object.assign({ 'content-type': 'application/json;charset=UTF-8' }, {}),
    method: 'GET',
    timeout: 3000
  }

  const chain: Array<ChaiList_DTYPE> = [
    // 主体请求体
    {
      id: 'appPro',
      type: 'appPro',
      resolved: (res) => Promise.resolve(res),
      rejected: () => Promise.reject({ result: '错误异常!' })
    }
  ]

  // 把请求拦截器往数组头部推
  interceptors.request.call((interceptor) => {
    chain.unshift(interceptor)
  })

  // 把响应拦截器往数组尾部推
  interceptors.response.call((interceptor) => {
    chain.push(interceptor)
  })

  let promise = Promise.resolve(newConfig)
  console.log('%c [ chain ]-57', 'font-size:14px; background:#41b883; color:#ffffff;', chain)
  console.log('%c [ interceptors ]-9', 'font-size:14px; background:#41b883; color:#ffffff;', interceptors)

  it('测试testA', () => {
    while (chain.length) {
      const { id, resolved, rejected } = chain.shift() as InterceptorPro_DTYPE<any>
      console.log('%c [ id ]-86', 'font-size:14px; background:#41b883; color:#ffffff;', id)
      promise = promise.then(resolved, rejected)
    }

    promise.then((res) => {
      console.log(`last res=`, res)
    })

    const result = true
    expect(result).to.be.eq(true)
  })
})
