import type {
  InterceptorPro_DTYPE,
  InterceptorFun_DTYPE,
  ResolvedFun_DTYPE,
  RejectedFun_DTYPE,
  InterceptorProType,
  InterceptorTaskImpl_DTYPE,
  InterceptorsImpl_DTYPE
} from './types/imba-uni-interceptor'
import type { RequestConfig_DTYPE, Response_DTYPE } from './types/imba-uni-request'

class InterceptorsTask<T> implements InterceptorTaskImpl_DTYPE<T> {
  private taskProList: Array<InterceptorPro_DTYPE<T>> = []
  private taskType: InterceptorProType

  constructor(taskType: InterceptorProType) {
    this.taskType = taskType
  }

  use(resolved: ResolvedFun_DTYPE<T>, rejected?: RejectedFun_DTYPE): string {
    let id = Math.random().toString(36).slice(2)
    let type = this.taskType
    if (!rejected) rejected = (err: any) => Promise.reject(err)
    this.taskProList.push({
      id,
      type,
      resolved,
      rejected
    })
    return id
  }

  call(fun: InterceptorFun_DTYPE<T>): void {
    this.taskProList.forEach((taskProList) => taskProList && fun(taskProList))
  }

  abort(id: string): boolean {
    return this.eject(id)
  }

  eject(id: string): boolean {
    let idx = this.taskProList.findIndex((f) => f.id === id)
    let bool = idx !== -1
    if (bool) this.taskProList.splice(1, idx)
    return bool
  }
}

export class Interceptors implements InterceptorsImpl_DTYPE {
  public request = new InterceptorsTask<RequestConfig_DTYPE>('request')
  public response = new InterceptorsTask<Response_DTYPE>('response')
}
