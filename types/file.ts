export interface FileNode {
  key: string
  label: string
  data: string
  icon?: string
  children?: FileNode[]
  leaf?: boolean
  modifiedDate: string | Date
  size?: number
  type?: 'file' | 'folder'
}

export interface UploadResponse {
  success: boolean
  message: string
  path?: string
}

export interface DeleteResponse {
  success: boolean
  message: string
} 