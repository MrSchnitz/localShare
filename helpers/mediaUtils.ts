import type { FileNode } from "~/types/file"
import { isImageFile, getImageFiles } from "./imageUtils"
import { isVideoFile, getVideoFiles } from "./videoUtils" 
import { isAudioFile, getAudioFiles } from "./audioUtils"

/**
 * Check if a file is any type of media file (image, video, or audio)
 * @param filename - The filename or file node to check
 * @returns true if the file is a media file
 */
export const isMediaFile = (filename: string | FileNode): boolean => {
  return isImageFile(filename) || isVideoFile(filename) || isAudioFile(filename)
}

/**
 * Get the media type of a file
 * @param filename - The filename or file node to check
 * @returns 'image', 'video', 'audio', or 'unknown'
 */
export const getMediaType = (filename: string | FileNode): 'image' | 'video' | 'audio' | 'unknown' => {
  if (isImageFile(filename)) return 'image'
  if (isVideoFile(filename)) return 'video'
  if (isAudioFile(filename)) return 'audio'
  return 'unknown'
}

/**
 * Get all media files from a list of FileNodes, sorted by type
 * @param nodes - Array of FileNodes to filter
 * @returns Array of FileNodes that are media files
 */
export const getAllMediaFiles = (nodes: FileNode[]): FileNode[] => {
  const images = getImageFiles(nodes)
  const videos = getVideoFiles(nodes)
  const audio = getAudioFiles(nodes)
  
  // Combine and sort: images first, then videos, then audio
  return [...images, ...videos, ...audio]
}

/**
 * Get media files grouped by type
 * @param nodes - Array of FileNodes to filter
 * @returns Object with arrays of each media type
 */
export const getMediaFilesByType = (nodes: FileNode[]) => {
  return {
    images: getImageFiles(nodes),
    videos: getVideoFiles(nodes),
    audio: getAudioFiles(nodes),
    all: getAllMediaFiles(nodes)
  }
}

// Re-export individual utility functions for backward compatibility
export { isImageFile, getImageFiles } from "./imageUtils"
export { isVideoFile, getVideoFiles } from "./videoUtils"
export { isAudioFile, getAudioFiles } from "./audioUtils" 