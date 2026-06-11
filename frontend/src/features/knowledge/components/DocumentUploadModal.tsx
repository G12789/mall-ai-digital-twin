import { useState } from 'react'
import { Modal, Upload, Select, message, Progress } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { knowledgeApi } from '../services/knowledgeApi'
import { useKnowledgeStore } from '../store/knowledgeStore'

interface DocumentUploadModalProps {
  open: boolean
  mallId: string
  onClose: () => void
}

const CATEGORIES = [
  { value: 'policy', label: '管理制度' },
  { value: 'procedure', label: '操作规程' },
  { value: 'contract', label: '合同模板' },
  { value: 'report', label: '报告分析' },
  { value: 'other', label: '其他' },
]

export default function DocumentUploadModal({ open, mallId, onClose }: DocumentUploadModalProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [category, setCategory] = useState('policy')
  const [uploading, setUploading] = useState(false)
  const { uploadProgress, setUploadProgress, addDocument } = useKnowledgeStore()

  async function handleUpload() {
    const file = fileList[0]?.originFileObj
    if (!file) { message.error('请选择文件'); return }

    setUploading(true)
    setUploadProgress(0)

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress((prev: number) => Math.min(prev + 10, 90))
      }, 200)

      const doc = await knowledgeApi.upload(mallId, file, category)

      clearInterval(progressTimer)
      setUploadProgress(100)
      addDocument(doc)
      message.success(`「${file.name}」上传成功。请运行 embed_documents.py 完成向量化。`)

      setTimeout(() => {
        setFileList([])
        setUploadProgress(0)
        onClose()
      }, 800)
    } catch (err) {
      message.error('上传失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal
      title="上传知识库文档"
      open={open}
      onCancel={onClose}
      onOk={handleUpload}
      confirmLoading={uploading}
      okText="上传"
      cancelText="取消"
    >
      <div className="mb-4">
        <label className="text-sm text-gray-500 mb-1 block">文档分类</label>
        <Select
          value={category}
          onChange={setCategory}
          options={CATEGORIES}
          className="w-full"
        />
      </div>

      <Upload.Dragger
        fileList={fileList}
        onChange={({ fileList: fl }) => setFileList(fl)}
        beforeUpload={() => false}
        maxCount={1}
        accept=".pdf,.docx,.txt,.md"
      >
        <p className="text-4xl text-gray-300 mb-2"><InboxOutlined /></p>
        <p className="text-sm text-gray-500">点击或拖拽上传</p>
        <p className="text-xs text-gray-400">支持 PDF / DOCX / TXT / Markdown</p>
      </Upload.Dragger>

      {uploading && (
        <div className="mt-4">
          <Progress percent={uploadProgress} status="active" size="small" />
          <p className="text-xs text-gray-400 mt-1">上传完成后，请在本地运行向量化脚本完成知识库索引</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
        <strong>提示：</strong>文档上传后需运行{" "}
        <code className="bg-blue-100 px-1 rounded">python embed_documents.py</code>{" "}
        将文档分块并向量化，之后AI才能检索到文档内容。
      </div>
    </Modal>
  )
}
