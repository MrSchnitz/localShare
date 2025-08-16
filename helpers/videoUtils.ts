import type { FileNode } from "~/types/file"

// Supported video extensions
export const VIDEO_EXTENSIONS = [
  'mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v', '3gp', 'mpg', 'mpeg'
]

/**
 * Check if a file is a video based on its extension
 * @param filename - The filename or file node to check
 * @returns true if the file is a video
 */
export const isVideoFile = (filename: string | FileNode): boolean => {
  const name = typeof filename === 'string' ? filename : filename.label
  const ext = name.split('.').pop()?.toLowerCase()
  return ext ? VIDEO_EXTENSIONS.includes(ext) : false
}

/**
 * Get all video files from a list of FileNodes
 * @param nodes - Array of FileNodes to filter
 * @returns Array of FileNodes that are videos
 */
export const getVideoFiles = (nodes: FileNode[]): FileNode[] => {
  return nodes.filter(node => node.type === 'file' && isVideoFile(node))
}

/**
 * Get supported video MIME type for HTML5 video element
 * @param filename - The filename to get MIME type for
 * @returns The MIME type string or undefined if not supported
 */
export const getVideoMimeType = (filename: string): string | undefined => {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'mp4':
    case 'm4v':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'ogg':
      return 'video/ogg'
    case 'avi':
      return 'video/x-msvideo'
    case 'mov':
      return 'video/quicktime'
    case 'wmv':
      return 'video/x-ms-wmv'
    case 'flv':
      return 'video/x-flv'
    case 'mkv':
      return 'video/x-matroska'
    case '3gp':
      return 'video/3gpp'
    case 'mpg':
    case 'mpeg':
      return 'video/mpeg'
    default:
      return undefined
  }
} 