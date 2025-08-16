import type { FileNode } from "~/types/file"

// Supported image extensions
export const IMAGE_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'ico'
]

/**
 * Check if a file is an image based on its extension
 * @param filename - The filename or file node to check
 * @returns true if the file is an image
 */
export const isImageFile = (filename: string | FileNode): boolean => {
  const name = typeof filename === 'string' ? filename : filename.label
  const ext = name.split('.').pop()?.toLowerCase()
  return ext ? IMAGE_EXTENSIONS.includes(ext) : false
}

/**
 * Get all image files from a list of FileNodes
 * @param nodes - Array of FileNodes to filter
 * @returns Array of FileNodes that are images
 */
export const getImageFiles = (nodes: FileNode[]): FileNode[] => {
  return nodes.filter(node => node.type === 'file' && isImageFile(node))
}

/**
 * Get the file extension from a filename
 * @param filename - The filename to extract extension from
 * @returns The file extension in lowercase
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
} 