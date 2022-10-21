uni-app 框架封装的请求包

### 安装

```
# pnpm
pnpm i imba-uni-request
```

### 使用

# 初始化和初始配置

```
import { UniRequest } from 'imba-request'

const http = new UniRequest({
	/**
	 *  `baseURL` 将自动加在 `url` 前面，除非 `url` 是一个绝对 URL。
	 *  它可以通过设置一个 `baseURL` 便于为实例的方法传递相对 URL
	 */
	baseURL: '/api',
	/**
	 * 超时时间，单位毫秒
	 * 默认 30s = 1000 * 30
	 */
	timeOut: 1000 * 30,
	/**
	 * 设置请求的 header，header 中不能设置 Referer。
	 * 平台差异说明：App、H5端会自动带上cookie，且H5端不可手动修改
	 */
	headers: {},
	/**
	 * 自定义内容 格式函数
	 */
	data: {},
	/**
	 * 缓存&SWR环境 'development' | 'production' | 'dev' | 'prod'
	 * 默认 dev
	 */
	cacheEnv: 'dev',
	/**
	 * 缓存&SWR 是否开启
	 * 默认 true
	 */
	cacheBool: true,
	/**
	 * 缓存&SWR 缓存时间 默认分单位 mm
	 * 默认 -1
	 */
	cacheTime: 1,
	/**
	 * 缓存&SWR 缓存单位 mm | ss
	 * 默认 mm
	 */
	cacheUnit: 'mm',
	/**
	 * 是否请求错误后重试
	 * 默认 true
	 */
	retryBool: true,
	/**
	 * 请求重试错误次数
	 * 默认 2
	 */
	retryCount: 2,
	/**
	 * 重试内时间定位 单位秒
	 * 默认 5
	 */
	retryInterval: 5,
	/**
	 * 分页字段设置
	 */
	pageKey: 'page',
	sizeKey: 'size',
	/**
	 * 是否开启打印请求数据
	 */
	printConsole: true
})
console.log('%c [ http ]-86', 'font-size:14px; background:#41b883; color:#ffffff;', http)
```

# 初始化时注入了默认拦截器

```
this.interceptors.request.use((config) => {
    let data = config.data
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

    config.data = Object.assign(config.data, data)
    return config
})

this.interceptors.response.use((res) => {
	this.loading = false
	return res
})

// 以上代码是初始化默认注入的拦截器
```

# 请求拦截和响应拦截设定

# tips：注意拦截器追加的位置 如下剥洋葱执行走向。

```
// 拦截流程 请求拦截2 -> 请求拦截1 -> 发送请求 -> 响应拦截1 -> 响应拦截2 -> ...

const testAsync = (config: any) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(config)
		}, 300)
	})
}

// function 请求拦截1 - 执行位置4
http.interceptors.request.use((config) => {
	config.header = Object.assign(config.header, {
		www: 'www'
	})
	return config
})

// async await 请求拦截2 - 执行位置3
http.interceptors.request.use(async (config) => {
	const result = await testAsync({ async: 'test async await' })
	config.header = Object.assign(config.header, result)
	return config
})

// promise 请求拦截3 - 执行位置2
http.interceptors.request.use((config) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			config.header = Object.assign(config.header, { Promise: 'test Promise' })
			resolve(config)
		}, 300)
	})
})

// function 请求拦截4 - 执行位置1
http.interceptors.request.use((config) => {
	config.data = { qqq: 'ddd' }
	return config
})

// 响应拦截
http.interceptors.response.use((res) => {
	if (res?.errMsg === 'request:fail') {
		return false
	}
	const { code, data } = res.data
	if (code === 200) return data
	return data
})
```

# 尝试错误请求 自动重试请求

```
// 尝试错误请求
http
	.request(
		'/api/test',
		{
			_cache: 1
		},
		'GET',
		{
			url: 'https://error.com'
		}
	)
	.then((res) => {
		console.log('%c [ res ]-31', 'font-size:14px; background:#41b883; color:#ffffff;', res)
	}).catch((err) => {
		console.log('%c [ err ]-129', 'font-size:14px; background:#41b883; color:#ffffff;', err)
	})
```

# 测试多个重复请求 并列为一个请求并返回

```
for (let i = 0; i < 3; i++) {
	http.request('/api/xxx', {}, 'GET').then((res) => {
		console.log('%c [ res ]-35', 'font-size:14px; background:#41b883; color:#ffffff;', res)
	})
}
```

http .request( '/api/xxx', { \_cache: 1 }, 'GET' ) .then((res) => { console.log('%c [ res ]-35', 'font-size:14px; background:#41b883; color:#ffffff;', res) })

for (let i = 0; i < 3; i++) { http.request('/api/xxx', {}, 'GET').then((res) => { console.log('%c [ res ]-35', 'font-size:14px; background:#41b883; color:#ffffff;', res) }) }

http.request('/api/xxx', {}, 'PUT').then((res) => { console.log('%c [ res ]-35', 'font-size:14px; background:#41b883; color:#ffffff;', res) })

# 单个请求额外配置参数

```
http
	.request(
		'/api/xxx',
		{},
		'POST'
		// 这里为options单个请求额外配置参数
		// {
		/**
		 * 资源url
		 */
		// url: string
		/**
		 * 请求的参数
		 */
		// data?: string | { [key: string]: any } | ArrayBuffer
		/**
		 * 不管GET请求还是POST PUT请求，请求地址都追加querystring形式参数
		 */
		// appendQuery?: boolean
		/**
		 * 设置请求的 header，header 中不能设置 Referer。
		 */
		// header?: any
		/**
		 * 默认为 GET
		 * 可以是：OPTIONS，GET，HEAD，POST，PUT，DELETE，TRACE，CONNECT
		 */
		// method?: METHOD_DTYPE
		/**
		 * 超时时间
		 */
		// timeout?: number
		/**
		 * 如果设为json，会尝试对返回的数据做一次 JSON.parse
		 */
		// dataType?: string
		/**
		 * 验证 ssl 证书
		 */
		// sslVerify?: boolean
		/**
		 * 跨域请求时是否携带凭证
		 */
		// withCredentials?: boolean
		/**
		 * DNS解析时优先使用 ipv4
		 */
		// firstIpv4?: boolean
		/**
		 * 成功返回的回调函数
		 */
		// success?: (result: RequestSuccessCallbackResult) => void
		/**
		 * 失败的回调函数
		 */
		// fail?: (result: GeneralCallbackResult) => void
		/**
		 * 结束的回调函数（调用成功、失败都会执行）
		 */
		// complete?: (result: GeneralCallbackResult) => void
		//   }
	)
	.then((res) => {
		console.log('%c [ res ]-35', 'font-size:14px; background:#41b883; color:#ffffff;', res)
	})
```
