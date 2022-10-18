import type { RequestConfig_DTYPE, Response_DTYPE } from './imba-uni-request'

export type ResolvedFun_DTYPE<T> = (fun: T) => T | Promise<T>
export type RejectedFun_DTYPE = ResolvedFun_DTYPE<any>

export type InterceptorProType = 'request' | 'response' | 'appPro'
export interface InterceptorPro_DTYPE<T> {
  id: string
  type: InterceptorProType
  resolved: ResolvedFun_DTYPE<T>
  rejected?: RejectedFun_DTYPE
}

export type InterceptorTaskProList<T> = Array<InterceptorPro_DTYPE<T>>

export type InterceptorFun_DTYPE<T> = (interceptor: InterceptorPro_DTYPE<T>) => void
export interface InterceptorTaskImpl_DTYPE<T> {
  use(resolved: ResolvedFun_DTYPE<T>, rejected?: RejectedFun_DTYPE): string
  call(fun: InterceptorFun_DTYPE<T>): void
  abort(id: string): boolean
  eject(id: string): boolean
}

export interface InterceptorsImpl_DTYPE {
  request: InterceptorTaskImpl_DTYPE<RequestConfig_DTYPE>
  response: InterceptorTaskImpl_DTYPE<Response_DTYPE>
}

export type ChaiList_DTYPE = InterceptorPro_DTYPE<RequestConfig_DTYPE | Response_DTYPE> | any
