import request from '@/utils/request'

const api_name = '/file'
export default {

  getPageList(page, limit, searchObj) {
    return request({
      url: `${api_name}/${page}/${limit}`,
      method: 'get',
      params: searchObj // url查询字符串或表单键值对
    })
  },
  getProjectList() {
    return request({
      url: `${api_name}/projects`,
      method: 'get'
    })
  },
  getFileSize(Name, Project) {
    return request({
      url: `${api_name}/info/${Name}/${Project}`,
      method: 'get'
    })
  }
}
