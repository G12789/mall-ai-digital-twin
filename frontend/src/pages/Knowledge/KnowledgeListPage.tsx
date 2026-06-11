import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message, Result } from 'antd'
import { UploadOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons'
import { knowledgeApi, type KnowledgeDocument } from '../../features/knowledge/services/knowledgeApi'
import { useKnowledgeStore } from '../../features/knowledge/store/knowledgeStore'
import DocumentUploadModal from '../../features/knowledge/components/DocumentUploadModal'
import { useCurrentMall } from '../../shared/hooks/useCurrentMall'

const CATEGORY_LABELS: Record<string, string> = {
  policy: '管理制度',
  procedure: '操作规程',
  contract: '合同模板',
  report: '报告分析',
  other: '其他',
}

export default function KnowledgeListPage() {
  const mallId = useCurrentMall((s) => s.mallId)
  const { documents, loading, setDocuments, setLoading, removeDocument } = useKnowledgeStore()
  const [uploadOpen, setUploadOpen] = useState(false)

  useEffect(() => {
    if (!mallId) return
    setLoading(true)
    knowledgeApi.list(mallId)
      .then(setDocuments)
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false))
  }, [mallId, setDocuments, setLoading])

  async function handleDelete(id: string) {
    try {
      await knowledgeApi.remove(id)
      removeDocument(id)
      message.success('已删除')
    } catch {
      message.error('删除失败')
    }
  }

  if (!mallId) {
    return <Result status="error" title="缺少商场ID" />
  }

  const columns = [
    {
      title: '文档名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <Space>
          <FileTextOutlined className="text-blue-400" />
          <span className="font-medium">{text}</span>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (c: string) => <Tag>{CATEGORY_LABELS[c] || c}</Tag>,
    },
    {
      title: '权限',
      dataIndex: 'access_level',
      key: 'access_level',
      width: 100,
      render: (level: string) => (
        <Tag color={level === 'tenant' ? 'blue' : 'green'}>{level === 'tenant' ? '租户内' : '公开'}</Tag>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (d: string) => new Date(d).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: KnowledgeDocument) => (
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">知识库管理</h2>
        <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>
          上传文档
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <Table
          columns={columns}
          dataSource={documents}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, size: 'small' }}
          locale={{ emptyText: '暂无文档，点击"上传文档"添加知识库内容' }}
        />
      </div>

      <DocumentUploadModal
        open={uploadOpen}
        mallId={mallId}
        onClose={() => setUploadOpen(false)}
      />

      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-bold text-gray-600 mb-2">AI知识库工作流程</h4>
        <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
          <li>在此页面上传PDF/DOCX/TXT/Markdown文档到Supabase Storage</li>
          <li>在本地运行 <code className="bg-gray-200 px-1 rounded">python ai-pipeline/embed_documents.py</code> 进行分块+BGE-M3向量化</li>
          <li>向量化后的文档分块存入Supabase doc_chunks表 (pgvector)</li>
          <li>AI Copilot在回答时会检索相关文档片段作为上下文</li>
        </ol>
      </div>
    </div>
  )
}
