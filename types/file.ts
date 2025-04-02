export interface FileNode {
  key: string
  label: string
  data: string
  icon?: string
  children?: FileNode[]
  leaf?: boolean
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