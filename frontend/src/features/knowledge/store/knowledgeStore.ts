import { create } from 'zustand'

interface Document {
  id: string
  tenant_id: string
  mall_id: string
  title: string
  file_url: string | null
  category: string
  access_level: string
  created_at: string
  updated_at: string
}

interface KnowledgeState {
  documents: Document[]
  loading: boolean
  error: string | null
  uploadProgress: number

  setDocuments: (docs: Document[]) => void
  addDocument: (doc: Document) => void
  removeDocument: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setUploadProgress: (progress: number | ((prev: number) => number)) => void
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  documents: [],
  loading: false,
  error: null,
  uploadProgress: 0,

  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((s) => ({ documents: [...s.documents, doc] })),
  removeDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setUploadProgress: (uploadProgress) => set((s) => ({
    uploadProgress: typeof uploadProgress === 'function' ? uploadProgress(s.uploadProgress) : uploadProgress,
  })),
}))
