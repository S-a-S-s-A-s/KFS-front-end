<template>
  <div class="app-container">
    <!--查询表单-->
    <div class="search-div">
      <el-form label-width="70px" size="small">
        <el-row>
          <el-col :span="24">
            <el-form-item label="文件名称">
              <el-input style="width: 25%" v-model="searchObj.name" placeholder="文件名称"></el-input>
              <el-select v-model="searchObj.project" placeholder="项目名称">
            <el-option
                v-for="item in projectListSearch"
                :key="item.Id"
                :label="item.Name"
                :value="item.Name">
            </el-option>
         </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row style="display:flex">
          <el-button type="primary" icon="el-icon-search" size="mini" :loading="loading" @click="fetchData()">搜索</el-button>
          <el-button icon="el-icon-refresh" size="mini" @click="resetData">重置</el-button>
          <!-- <el-button type="primary" icon="el-icon-upload" size="mini" :loading="loading" @click="uploadFilesdasd()">上传</el-button> -->
          <el-button type="success" icon="el-icon-upload" size="mini" @click="uploadFile">上传</el-button>
        </el-row>
      </el-form>
    </div>
    <!-- 表格 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      stripe
      border
      style="width: 100%;margin-top: 10px;"
      @selection-change="handleSelectionChange">

      <el-table-column type="selection"/>

      <el-table-column
        label="序号"
        width="70"
        align="center">
        <template slot-scope="scope">
          {{ (page - 1) * limit + scope.$index + 1 }}
        </template>
      </el-table-column>

      <el-table-column prop="Name" label="文件名称" />
      <el-table-column prop="Size" label="文件大小" />
      <el-table-column prop="Project" label="项目" width="160"/>
      <el-table-column prop="CreatTime" label="创建时间" width="200"/>
      <el-table-column label="操作" width="200" align="center">
        <template slot-scope="scope">
          <el-button type="primary" icon="el-icon-download" size="mini" @click="download(scope.row.Name,scope.row.Project)" title="下载"/>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页组件 -->
    <el-pagination
      :current-page="page"
      :total="total"
      :page-size="limit"
      style="padding: 30px 0; text-align: center;"
      layout="total, prev, pager, next, jumper"
      @current-change="fetchData"
    />
    <el-dialog title="文件上传" :visible.sync="dialogVisible" width="40%">
      <el-row style="display:flex">
          <el-select v-model="project.name" placeholder="项目名称">
            <el-option
                v-for="item in projectList"
                :key="item.Id"
                :label="item.Name"
                :value="item.Name">
            </el-option>
         </el-select>
          <el-upload
          :http-request="Import"
          :multiple="true"
          :file-list="fileList"
      >
      <el-button class="btn"><i class="el-icon-paperclip"></i>上传附件</el-button>
      </el-upload>
        </el-row>
      <el-progress :text-inside=true v-if="showProgress" :type="circle" :stroke-width="16" :percentage="progressPercent"></el-progress>
    </el-dialog>
  </div>
</template>
<script>
import api from '@/api/file'
import store from '@/store'
import { downloadProgress } from '@/mixins/downloadProgress.js'
export default {
  name: 'mcu',
  mixins: [downloadProgress],
  // 定义数据模型
  data() {
    return {
      list: [], // 列表
      total: 0, // 总记录数
      page: 1, // 页码
      limit: 10, // 每页记录数
      searchObj: {}, // 查询条件
      multipleSelection: [], // 批量删除选中的记录列表
      fileList: [],
      dialogVisible: false,
      projectList: [],
      project: {},
      projectListSearch: [],
      projectSearch: {},
      progressPercent: 0,
      showProgress: false
    }
  },
  // 页面渲染成功后获取数据
  created() {
    this.fetchData()
    this.getProject()
  },
  // 定义方法
  methods: {
    resetData() {
      console.log('重置查询表单')
      this.searchObj = {}
      this.fetchData()
    },
    fetchData(current=1) {
      this.page = current
      // 调用api
      api.getPageList(this.page, this.limit, this.searchObj).then(response => {
        this.list = response.data.records
        this.total = response.data.total
      })
    },
    getProject() {
      api.getProjectList().then(res => {
        console.log(res)
        this.projectList = res.data
        this.projectListSearch = res.data
        this.projectSearch = {}
      })
    },
    uploadFile() {
      this.dialogVisible = true
    },
    download(Name, Project) {
      let downProgress = {}
      const uniSign = new Date().getTime() + ''
      const formData = new FormData()
      // 附带token
      formData.append('token', store.getters.token)
      // 附带blob请求头
      // 也可以附带自己的参数
      formData.append('responseType', 'blob')
      this.axios(
        {
          method: 'post',
          url: `dev-api/file/download/${Name}/${Project}`,
          data: formData,
          onDownloadProgress(progress) {
            // console.log(progress)
            // progress对象中的loaded表示已经下载的数量，total表示总数量，这里计算出百分比
            downProgress = Math.round(100 * progress.loaded / progress.total)
            // 将此次下载的文件名和下载进度组成对象再用vuex状态管理
            store.commit('downLoadProgress/SET_PROGRESS', { path: uniSign, 'progress': downProgress })
          }
        })
        .then(res => {
          const blob = new Blob([res.data])
          const a = document.createElement('a')
          // 兼容IE
          if (!!window.ActiveXObject || 'ActiveXObject' in window) {
            // IE
            window.navigator.msSaveBlob(blob, Name)
          } else {
          // 非IE
            a.setAttribute('download', Name)
          }
          // 这边就是模拟个a标签，让他来点击，因为原版的a标签虽然可以实现，但是是为get方法，且不能携带token等信息
          a.href = window.URL.createObjectURL(blob)
          document.body.appendChild(a)
          a.click()
          URL.revokeObjectURL(a.href)
          document.body.removeChild(a)
          this.$message.success('下载成功')
        })
    },

    // 上传
    Import(data) {
      this.showProgress = true
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('token', store.getters.token)
      formData.append('projectName', this.project.name)
      formData.append('userName', store.getters.name)
      this.axios(
        {
          method: 'post',
          url: 'dev-api/file/upload',
          data: formData,
          onUploadProgress: progressEvent => {
            this.progressPercent = Number((progressEvent.loaded / progressEvent.total * 100).toFixed(1))
          }
        })
        .then((res) => {
          this.$message.success(res.$msg || '上传成功')
          this.fileList = []
          this.showProgress = false
          this.progressPercent = 0
          this.fetchData()
        })
    }
  }
}
</script>