uni-app 框架封装的请求包

## 安装

```
# pnpm
pnpm i imba-uni-request
```

## 使用

### 初始化和初始配置

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
	header: { 'content-type': 'application/json;charset=UTF-8' },
	headers: {},
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
	* 打印API接口地址是否MD5化
	*/
	printMD5: false,
	/**
	 * 是否开启打印请求数据
	 */
	printConsole: true
})
console.log('%c [ http ]-86', 'font-size:14px; background:#41b883; color:#ffffff;', http)
```

### 请求拦截和响应拦截设定

### tips：注意拦截器追加的位置 如下洋葱执行走向。

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
	config.header = Object.assign(config.header || {}, {
		xxx: 'xxx'
	})
	return config
})

// async await 请求拦截2 - 执行位置3
http.interceptors.request.use(async (config) => {
	const result = await testAsync({ yyy: 'test async await' })
	config.header = Object.assign(config.header || {}, result)
	return config
})

// promise 请求拦截3 - 执行位置2
http.interceptors.request.use((config) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			config.header = Object.assign(config.header || {}, { zzz: 'test Promise' })
			resolve(config)
		}, 300)
	})
})

// function 请求拦截4 - 执行位置1
http.interceptors.request.use((config) => {
	config.body = Object.assign(config.body || {}, { qqq: '来自拦截器注入' })
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

### GET 请求 api/xxx/:id 形式 => api/xxx/1?id=1

```
http.request(['/api/test/:id', 'GET'],
{
	_param: { id: 1 },
	_id: `${1}`
})
```

### POST 请求 api/xxx/:id 形式 => api/xxx/2?id=2 请求体 row json => { body: 'i am body man' }

```
http.request(['/api/test/:id', 'POST'],
{
	_param: { id: 2 },
	_body: { title: 'i am body man' },
	_id: `${2}`
})
```

### POST 请求修改为 PUT 请求

```
http.request(['/api/test/put', 'POST'],
{
	_body: { id: 3 },
	_method: 'PUT'
})
```

### POST 请求分页

```
http.request(['/api/test/post', 'POST'],
{
	_body: { id: 4 },
	_page: [1, 10]
})
```

### GET 请求分页

```
 http.request(['/api/test/get', 'GET'],
{
	_param: { id: 5 },
	_page: [1, 10]
})
```

### POST 请求分页

```
http.request(['/api/test/post', 'POST'],
{
	_body: { id: 6 },
	_page: [1, 10]
})
```

### GET 请求分页 缓存&SWR

```
http.request(['/api/test/get', 'GET'],
{
	_param: { id: 7 },
	_cache: 10,
	_cacheUnit: 'ss'
})
```

### 多个重复请求 并列为一个请求返回

```
http.request(['/api/test/get', 'GET'], { _param: { id: 8 } })
http.request(['/api/test/get', 'GET'], { _param: { id: 8 } })
http.request(['/api/test/get', 'GET'], { _param: { id: 8 } })
http.request(['/api/test/get', 'GET'], { _param: { id: 8 } })
```

### 尝试错误请求 自动重试请求

```
http.request('/api/test', {}, { baseURL: '//error.com' })
```

### 设定 uni.request 原参数

```
http.request('/api/ddd',{}, {
		uniOption: {
			withCredentials: true,
			sslVerify: true,
			responseType: 'text'
		}
	}
)
```

### 初始化时注入了默认拦截器 - 当前是源代码

```
this.interceptors.request.use((config) => {
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
    }

    if (_body) {
      config.body = Object.assign(config.body || {}, _body)
    }

    return config
})

this.interceptors.response.use((res) => {
	this.loading = false
	return res
})

// 以上代码是初始化默认注入的拦截器
```

### 单个请求额外配置参数

```
http.request('/api/test',
	// 下面为inject
	{},
	// 这里为options单个请求额外配置参数
	{
		/**
		//  *  `baseURL` 将自动加在 `url` 前面，除非 `url` 是一个绝对 URL。
		//  *  它可以通过设置一个 `baseURL` 便于为实例的方法传递相对 URL
		//  */
		// baseURL: string
		// /**
		//  * 资源url
		//  */
		// url?: string
		// /**
		//  * 默认为 GET
		//  * 可以是：OPTIONS，GET，HEAD，POST，PUT，DELETE，TRACE，CONNECT
		//  */
		// method?: METHOD_DTYPE
		// /**
		//  * 超时时间，单位毫秒
		//  * 默认 30s = 1000 * 30
		//  */
		// timeOut?: number
		// /**
		//  * 设置请求的 header，header 中不能设置 Referer。
		//  * 平台差异说明：App、H5端会自动带上cookie，且H5端不可手动修改
		//  */
		// header?: Header_DTYPE
		// headers?: Header_DTYPE
		// /**
		//  * querystring参数
		//  */
		// param?: Data_DTYPE
		// /**
		//  * 请求体参数
		//  */
		// body?: Data_DTYPE
		// /**
		//  * 自定义内容 格式函数
		//  */
		// inject?: Inject_DTYPE
		// /**
		//  * 缓存&SWR环境 'development' | 'production' | 'dev' | 'prod'
		//  * 默认 dev
		//  */
		// cacheEnv?: CacheEnv
		// /**
		//  * 缓存&SWR 是否开启
		//  * 默认 true
		//  */
		// cacheBool?: boolean
		// /**
		//  * 缓存&SWR 缓存时间 默认分单位 mm
		//  * 默认 -1
		//  */
		// cacheTime?: number
		// /**
		//  * 缓存&SWR 缓存单位 mm | ss
		//  * 默认 mm
		//  */
		// cacheUnit?: CacheUnit
		// /**
		//  * 是否请求错误后重试
		//  * 默认 true
		//  */
		// retryBool?: boolean
		// /**
		//  * 请求重试错误次数
		//  * 默认 2
		//  */
		// retryCount?: number
		// /**
		//  * 重试内时间定位 单位秒 在此时间内做错误重试请求
		//  * 默认 5
		//  */
		// retryInterval?: number
		// /**
		//  * uni.request原始配置
		//  */
		// uniOption?: UniNamespace.RequestOptions
		// /**
		//  * 分页字段设置
		//  */
		// pageKey?: string
		// sizeKey?: string
		// /**
		//  * 打印API接口地址是否MD5化
		//  */
		// printMD5?: boolean
		// /**
		//  * 是否开启打印请求数据
		//  */
		// printConsole?: boolean
	}
)
.then((res) => {
	console.log('%c [ res ]-35', 'font-size:14px; background:#41b883; color:#ffffff;', res)
})
```
