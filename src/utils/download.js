import axios from 'axios'
import store from '@/store'
// 通用下载方法
export function download(url, params, filename) {
    let downProgress = {}
    let uniSign = new Date().getTime() + '' // 可能会连续点击下载多个文件，这里用时间戳来区分每一次下载的文件
    return axios.post(url, params, {
      transformRequest: [(params) => {
        return tansParams(params)
      }],
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      responseType: 'blob',
      onDownloadProgress(progress) {
        // console.log(progress)
        // progress对象中的loaded表示已经下载的数量，total表示总数量，这里计算出百分比
        downProgress = Math.round(100 * progress.loaded / progress.total)
        // 将此次下载的文件名和下载进度组成对象再用vuex状态管理
        store.commit('downLoadProgress/SET_PROGRESS', { path: uniSign, 'progress': downProgress })
      }
    }).then((data) => {// 文件流传输完成后，开启文件下载
      const content = data
      const blob = new Blob([content])
      if ('download' in document.createElement('a')) {
        const elink = document.createElement('a')
        elink.download = filename || url.split('/')[url.split('/').length - 1]
        elink.style.display = 'none'
        elink.href = URL.createObjectURL(blob)
        document.body.appendChild(elink)
        elink.click()
        URL.revokeObjectURL(elink.href)
        document.body.removeChild(elink)
      } else {
        navigator.msSaveBlob(blob, filename)
      }
    }).catch((r) => {
      console.error(r)
      this.$message.error('该文件无法下载')
    })
  }
  
  /**
   * 参数处理
   * @param {*} params  参数
   */
  export function tansParams(params) {
    let result = ''
    for (const propName of Object.keys(params)) {
      const value = params[propName];
      var part = encodeURIComponent(propName) + "=";
      if (value !== null && typeof (value) !== "undefined") {
        if (typeof value === 'object') {
          for (const key of Object.keys(value)) {
            if (value[key] !== null && typeof (value[key]) !== 'undefined') {
              let params = propName + '[' + key + ']';
              var subPart = encodeURIComponent(params) + "=";
              result += subPart + encodeURIComponent(value[key]) + "&";
            }
          }
        } else {
          result += part + encodeURIComponent(value) + "&";
        }
      }
    }
    return result
  }
 