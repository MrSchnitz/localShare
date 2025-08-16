import type { FileNode } from "~/types/file"

// Supported audio extensions
export const AUDIO_EXTENSIONS = [
  'mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'opus', 'webm', 'mp2', 'mp1'
]

/**
 * Check if a file is an audio file based on its extension
 * @param filename - The filename or file node to check
 * @returns true if the file is an audio file
 */
export const isAudioFile = (filename: string | FileNode): boolean => {
  const name = typeof filename === 'string' ? filename : filename.label
  const ext = name.split('.').pop()?.toLowerCase()
  return ext ? AUDIO_EXTENSIONS.includes(ext) : false
}

/**
 * Get all audio files from a list of FileNodes
 * @param nodes - Array of FileNodes to filter
 * @returns Array of FileNodes that are audio files
 */
export const getAudioFiles = (nodes: FileNode[]): FileNode[] => {
  return nodes.filter(node => node.type === 'file' && isAudioFile(node))
}

/**
 * Get supported audio MIME type for HTML5 audio/video element
 * @param filename - The filename to get MIME type for
 * @returns The MIME type string or undefined if not supported
 */
export const getAudioMimeType = (filename: string): string | undefined => {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'mp3':
      return 'audio/mpeg'
    case 'wav':
      return 'audio/wav'
    case 'ogg':
      return 'audio/ogg'
    case 'aac':
      return 'audio/aac'
    case 'flac':
      return 'audio/flac'
    case 'm4a':
      return 'audio/mp4'
    case 'wma':
      return 'audio/x-ms-wma'
    case 'opus':
      return 'audio/opus'
    case 'webm':
      return 'audio/webm'
    case 'mp2':
      return 'audio/mpeg'
    case 'mp1':
      return 'audio/mpeg'
    default:
      return undefined
  }
}

/**
 * Check if a file is a media file (video or audio)
 * @param filename - The filename or file node to check
 * @returns true if the file is a media file
 */
export const isMediaFile = (filename: string | FileNode): boolean => {
  // Import video utils to check for video files
  const { isVideoFile } = require('./videoUtils')
  return isVideoFile(filename) || isAudioFile(filename)
} 