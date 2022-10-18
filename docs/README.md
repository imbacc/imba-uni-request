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

# 请求拦截和响应拦截设定

```
// 拦截流程 请求拦截2 -> 请求拦截1 -> 发送请求 -> 响应拦截1 -> 响应拦截2 -> ...

// 请求拦截
http.interceptors.request.use((config) => {
	config.header = {
		www: 'www'
	}
	return config
})

// 请求拦截
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
	})
```

# 测试多个重复请求 并列为一个请求并返回

```
for (let i = 0; i < 3; i++) {
	http.request('/stage-api/captchaImage', {}, 'GET').then((res) => {
		console.log('%c [ res ]-35', 'font-size:14px; background:#41b883; color:#ffffff;', res)
	})
}
```
