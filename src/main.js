/**
 * ajax
 * @param  {Func} loadingFn 加载时回调
 * @param  {Func} loadedFn  结束时回调
 * @param  {Func} setCb     结束时且200状态回调，可以设置配置信息，如果返回true，则终止
 * @param  {Func} otherCb   结束时且200状态回调，status其他以外的值回调
 * @param  {Object} opts   	参数
 * @return {type}
 */
const HotPromise = Promise;
export const ajaxFn = (loadingFn, loadedFn, setCb, otherCb, opts = {}) => _opts => {
	let xhr;
	HotPromise.prototype.cancel = () => {
		xhr instanceof XMLHttpRequest && (
			xhr.abort(), 
			xhr = null, 
			console.log(`XMLHttpRequest Abort`)
		);
	};
	return new HotPromise((resolve, reject) => {
		/**
		 * @param  {String} url 服务地址
		 * @param  {Object} param 参数
		 * @param  {Object} type 请求类型
		 * @param  {Func} uploadProgress 上传回调
		 * @param  {Bool} noLoading 不执行loadFn
		 * @param  {Str} requestType 请求类型 'json' | 'form-data'
		 */
		let {
			url,
			param,
			type = 'GET',
			localData,
			uploadProgress,
			noLoading = false,
			requestType
		} = _opts;
		let method = type.toUpperCase(); // 默认转化为大写
		if (!url && !localData) {
			console.error('请求地址不存在');
			reject({
				msg: `开发时提示~参数错误`
			});
			return;
		}
		!noLoading && loadingFn && loadingFn();
		let cgiSt = Date.now();
		let onDataReturn = response => {
			if (setCb) {
				let isExit = setCb(response);
				if (isExit) return;
			}
			// 正常流程
			switch (response.status) {
				case 1:
				case true:
					resolve(response);
					return;
				case 0:
				case false:
					reject(response);
					return;
				default:
					otherCb && otherCb(response, resolve, reject);
			}
		};

		/**
		 * 如果本地已经从别的地方获取到数据，就不用请求了
		 */
		if (localData) {
			!noLoading && loadedFn && loadedFn();
			onDataReturn(localData);
			return;
		}
		/**
		 * 创建服务
		 */
		xhr = new XMLHttpRequest();
		try {
			xhr.onreadystatechange = () => {
				if (xhr.readyState == 4) {

					!noLoading && loadedFn && loadedFn(noLoading);
					if (xhr.status >= 200 && xhr.status < 300) {
						// 可以加上try-catch
						try {
							let data = JSON.parse(xhr.responseText);
							onDataReturn(data);
						} catch (e) {
							let msg = "网络不稳定，请稍后重试.";
							reject({
								retcode: xhr.status,
								msg: msg
							});
						}
					} else {
						if (xhr.status === 0 ){
							// 主动取消
							return;
						}
						reject({
							retcode: xhr.status,
							msg: '网络不稳定，请稍后重试..'
						});
					}
					xhr = null;
				}
			};

			let paramArray = [],
				paramString = '';
			for (let key in param) {
				/**
						 * 过滤掉值为null,undefined,''情况
						 */
				if (param[key] || param[key] === false || param[key] === 0) {
					paramArray.push(key + '=' + encodeURIComponent(param[key]));
				}
			}

			if (method === 'FORM') {
				let formData = new FormData();　　　　
				formData.append('file', param['file']);　　　　
				formData.append('bkn', bkn);
				xhr.upload.onprogress = function(e) {
					if (e.lengthComputable) {
						uploadProgress(e.loaded, e.total);
					}
				};
				xhr.open('POST', url);
				xhr.withCredentials = true;　　　　
				xhr.send(formData);
			} else if (method === 'JSONP') {
				method = 'GET';

				if (!param['callback']) {
					reject({
						status: 0
					});
				}

				window[param['callback']] = function(data) {
					onDataReturn(data);
				};
				if (paramArray.length > 0) {
					url += (url.indexOf('?') > -1 ? '&' : '?') + paramArray.join('&');
				}
				let script = document.createElement("script");
				let head = document.getElementsByTagName("head")[0];
				script.src = url;
				head.appendChild(script);
			} else {
				let req = '';
				switch (method){
					case 'PUT':
					case 'POST':
						req = JSON.stringify(param);
						break;
					case 'DELETE':
					case 'GET':
						if (paramArray.length > 0) {
							url += (url.indexOf('?') > -1 ? '&' : '?') + paramArray.join('&');
						}
						break;
					default:
						break;
				}
				xhr.open(method, url, true);
				xhr.withCredentials = true; // 允许发送cookie
				// 跨域资源请求会发生两次 一次是204 可以参考cors // 无视就好
				xhr.setRequestHeader(
					'Content-Type', requestType == 'json' ? `application/json;charset=utf-8` : `application/x-www-form-urlencoded`
				);
				xhr.setRequestHeader(
					'X-Requested-With', 'XMLHttpRequest'
				);
				xhr.send(method === 'POST' ? paramArray.join('&') : '');
			}

		} catch (e) {
			console.error(e);
		}
	});
};
export const ajax = ajaxFn();