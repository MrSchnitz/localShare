<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :modal="true"
    :closable="false"
    :draggable="false"
    class="media-player-dialog"
    :class="{ 'mobile-optimized': isMobile }"
    :style="dialogStyle"
  >
    <template #header>
      <div class="media-player-header" :class="{ 'mobile-header': isMobile }">
        <span class="media-title">{{ currentMedia?.label }}</span>
        <div class="header-controls" v-if="!isMobile">
          <div class="playback-controls">
            <Button
              :icon="isPlaying ? 'pi pi-pause' : 'pi pi-play'"
              class="p-button-text p-button-secondary"
              @click="togglePlayback"
              v-tooltip.top="isPlaying ? 'Pause (Space)' : 'Play (Space)'"
            />
            <Button
              icon="pi pi-volume-up"
              class="p-button-text p-button-secondary"
              @click="toggleMute"
              v-tooltip.top="isMuted ? 'Unmute (M)' : 'Mute (M)'"
            />
            <span class="volume-control">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                v-model="volume"
                @input="updateVolume"
                class="volume-slider"
              />
            </span>
            <span class="playback-speed">
              <select v-model="playbackRate" @change="updatePlaybackRate" class="speed-select">
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </span>
          </div>
          
          <div class="action-controls">
                         <Button
               icon="pi pi-download"
               class="p-button-text p-button-secondary"
               @click="downloadMedia"
               v-tooltip.top="'Download media'"
             />
             <Button
               icon="pi pi-trash"
               class="p-button-text p-button-danger"
               @click="deleteMedia"
               v-tooltip.top="'Delete media'"
             />
            <Button
              icon="pi pi-times"
              class="p-button-text p-button-secondary"
              @click="closeViewer"
              v-tooltip.top="'Close (Esc)'"
            />
          </div>
        </div>
        
        <!-- Mobile-only close button -->
        <Button
          v-if="isMobile"
          icon="pi pi-times"
          class="p-button-text p-button-secondary mobile-close-btn"
          @click="closeViewer"
        />
      </div>
    </template>

    <div class="media-player-content" :class="{ 'mobile-content': isMobile }">
      <!-- Navigation arrows - hidden on mobile -->
      <Button
        v-if="canNavigatePrevious && !isMobile"
        icon="pi pi-chevron-left"
        class="p-button-text nav-arrow nav-arrow-left"
        @click="navigatePrevious"
      />
      
      <div class="media-container" ref="mediaContainer">
        <video
          v-if="currentMediaUrl"
          ref="mediaElement"
          :src="currentMediaUrl"
          :class="{ 'viewer-video': !isCurrentMediaAudio, 'viewer-audio': isCurrentMediaAudio }"
          :controls="!isCurrentMediaAudio"
          preload="metadata"
          @loadedmetadata="onMediaLoaded"
          @timeupdate="onTimeUpdate"
          @play="isPlaying = true"
          @pause="isPlaying = false"
          @ended="onMediaEnded"
          @error="onMediaError"
          @loadstart="isLoading = true"
          @canplaythrough="isLoading = false"
        >
          Your browser does not support the media format.
        </video>
        
        <!-- Audio visualization overlay for audio files -->
        <div v-if="currentMediaUrl && isCurrentMediaAudio" class="audio-overlay" :class="{ 'mobile-audio-overlay': isMobile }">
          <div class="audio-icon">
            <i class="pi pi-volume-up" :style="{ fontSize: isMobile ? '3rem' : '4rem' }"></i>
          </div>
          <div class="audio-info">
            <h3 :class="{ 'mobile-title': isMobile }">{{ currentMedia?.label }}</h3>
            <p>Audio file</p>
          </div>
        </div>
        
        <div v-else-if="isLoading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
          <p>Loading {{ isCurrentMediaAudio ? 'audio' : 'video' }}...</p>
        </div>
        <div v-else-if="hasError" class="error-state">
          <i class="pi pi-exclamation-triangle" style="font-size: 2rem;"></i>
          <p>Failed to load {{ isCurrentMediaAudio ? 'audio' : 'video' }}</p>
          <p class="error-details">{{ errorMessage }}</p>
        </div>
      </div>

      <Button
        v-if="canNavigateNext && !isMobile"
        icon="pi pi-chevron-right"
        class="p-button-text nav-arrow nav-arrow-right"
        @click="navigateNext"
      />
    </div>

    <!-- Mobile Touch Controls -->
    <div v-if="isMobile" class="mobile-controls">
      <!-- Mobile Media Controls -->
      <div class="mobile-media-controls">
        <Button
          :icon="isPlaying ? 'pi pi-pause' : 'pi pi-play'"
          class="p-button-text mobile-control-btn play-btn"
          @click="togglePlayback"
        />
        <Button
          :icon="isMuted ? 'pi pi-volume-off' : 'pi pi-volume-up'"
          class="p-button-text mobile-control-btn"
          @click="toggleMute"
        />
        <div class="mobile-volume-control">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            v-model="volume"
            @input="updateVolume"
            class="mobile-volume-slider"
          />
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div class="mobile-navigation">
        <Button
          v-if="canNavigatePrevious"
          icon="pi pi-chevron-left"
          class="p-button-text mobile-nav-btn"
          @click="navigatePrevious"
        />
        <span class="mobile-nav-info">{{ currentMediaIndex + 1 }} / {{ props.mediaFiles.length }}</span>
        <Button
          v-if="canNavigateNext"
          icon="pi pi-chevron-right"
          class="p-button-text mobile-nav-btn"
          @click="navigateNext"
        />
      </div>

      <!-- Mobile Action Controls -->
      <div class="mobile-actions">
        <Button
          icon="pi pi-download"
          class="p-button-text mobile-action-btn"
          @click="downloadMedia"
        />
        <Button
          icon="pi pi-trash"
          class="p-button-text p-button-danger mobile-action-btn"
          @click="deleteMedia"
        />
      </div>
    </div>

    <div v-if="currentMediaUrl && !isLoading" class="media-info lg:hidden" :class="{ 'mobile-media-info': isMobile }">
      <div class="progress-info">
        <span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        <div class="progress-bar">
          <input
            type="range"
            min="0"
            :max="duration"
            v-model="currentTime"
            @input="seekTo"
            class="seek-slider"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted, onMounted } from 'vue'
import type { FileNode } from '~/types/file'
import { getVideoMimeType } from '~/helpers/videoUtils'
import { getAudioMimeType, isAudioFile } from '~/helpers/audioUtils'

const props = defineProps<{
  visible: boolean
  currentMedia: FileNode | null
  mediaFiles: FileNode[]
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'media-changed': [media: FileNode]
  'download': [media: FileNode]
  'delete': [media: FileNode]
}>()

// Mobile detection
const isMobile = ref(false)

// State
const currentMediaUrl = ref<string | null>(null)
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const mediaContainer = ref<HTMLElement>()
const mediaElement = ref<HTMLVideoElement>()
const isCurrentMediaAudio = ref(false)

// Playback state
const isPlaying = ref(false)
const isMuted = ref(false)
const volume = ref(1)
const playbackRate = ref(1)
const currentTime = ref(0)
const duration = ref(0)

// Computed properties
const currentMediaIndex = computed(() => {
  if (!props.currentMedia) return -1
  return props.mediaFiles.findIndex(media => media.data === props.currentMedia?.data)
})

const canNavigatePrevious = computed(() => {
  return props.mediaFiles.length > 1 && currentMediaIndex.value > 0
})

const canNavigateNext = computed(() => {
  return props.mediaFiles.length > 1 && currentMediaIndex.value < props.mediaFiles.length - 1
})

// Dialog styling
const dialogStyle = computed(() => {
  if (isMobile.value) {
    return { 
      width: '100vw', 
      height: '100dvh',
      maxWidth: '100vw',
      maxHeight: '100dvh',
      margin: '0',
      borderRadius: '0'
    }
  } else {
    return { width: '90vw' }
  }
})

// Mobile setup
onMounted(() => {
  // Simple mobile detection
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
  
  // Listen for resize events
  const handleResize = () => {
    isMobile.value = window.innerWidth <= 768
  }
  window.addEventListener('resize', handleResize)
})

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.visible) return
  
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      if (canNavigatePrevious.value) {
        navigatePrevious()
      } else {
        // Seek backward 10 seconds
        seekBy(-10)
      }
      break
    case 'ArrowRight':
      event.preventDefault()
      if (canNavigateNext.value) {
        navigateNext()
      } else {
        // Seek forward 10 seconds
        seekBy(10)
      }
      break
    case ' ':
    case 'k':
    case 'K':
      event.preventDefault()
      togglePlayback()
      break
    case 'Escape':
      event.preventDefault()
      closeViewer()
      break
    case 'm':
    case 'M':
      event.preventDefault()
      toggleMute()
      break
    case 'f':
    case 'F':
      event.preventDefault()
      toggleFullscreen()
      break
    case 'd':
    case 'D':
      event.preventDefault()
      downloadMedia()
      break
    case 'Delete':
    case 'Backspace':
      event.preventDefault()
      deleteMedia()
      break
    case 'ArrowUp':
      event.preventDefault()
      changeVolume(0.1)
      break
    case 'ArrowDown':
      event.preventDefault()
      changeVolume(-0.1)
      break
  }
}

// Watch for media changes
watch(() => props.currentMedia, async (newMedia) => {
  if (newMedia) {
    isCurrentMediaAudio.value = isAudioFile(newMedia)
    await loadMedia(newMedia)
  }
}, { immediate: true })

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // Add keyboard event listener when dialog opens
    document.addEventListener('keydown', handleKeydown)
    // Prevent scrolling on mobile
    if (isMobile.value) {
      document.body.style.overflow = 'hidden'
    }
  } else {
    // Remove keyboard event listener when dialog closes
    document.removeEventListener('keydown', handleKeydown)
    // Pause media when closing
    if (mediaElement.value) {
      mediaElement.value.pause()
    }
    // Restore scrolling
    if (isMobile.value) {
      document.body.style.overflow = 'auto'
    }
  }
})

// Methods
const loadMedia = async (media: FileNode) => {
  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''
  currentMediaUrl.value = null

  try {
    const response = await fetch(`/api/files?filename=${encodeURIComponent(media.data)}`, {
      method: 'PUT'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to load media: ${response.statusText}`)
    }

    const blob = await response.blob()
    currentMediaUrl.value = URL.createObjectURL(blob)
    
    // Reset playback state
    currentTime.value = 0
    isPlaying.value = false
    
  } catch (error) {
    console.error('Failed to load media:', error)
    hasError.value = true
    errorMessage.value = error instanceof Error ? error.message : 'Unknown error'
    isLoading.value = false
  }
}

const onMediaLoaded = () => {
  if (mediaElement.value) {
    duration.value = mediaElement.value.duration || 0
    mediaElement.value.volume = volume.value
    mediaElement.value.playbackRate = playbackRate.value
    
    // Auto-play the media after it's loaded
    mediaElement.value.play().catch(error => {
      console.warn('Auto-play was prevented:', error)
      // If auto-play fails (browser policy), that's okay - user can manually play
    })
  }
  isLoading.value = false
  hasError.value = false
}

const onTimeUpdate = () => {
  if (mediaElement.value) {
    currentTime.value = mediaElement.value.currentTime
  }
}

const onMediaEnded = () => {
  isPlaying.value = false
  // Auto-advance to next media if available
  if (canNavigateNext.value) {
    navigateNext()
  }
}

const onMediaError = () => {
  hasError.value = true
  errorMessage.value = 'Failed to play media'
  isLoading.value = false
}

const togglePlayback = () => {
  if (!mediaElement.value) return
  
  if (isPlaying.value) {
    mediaElement.value.pause()
  } else {
    mediaElement.value.play()
  }
}

const toggleMute = () => {
  if (!mediaElement.value) return
  
  isMuted.value = !isMuted.value
  mediaElement.value.muted = isMuted.value
}

const updateVolume = () => {
  if (mediaElement.value) {
    mediaElement.value.volume = volume.value
    if (volume.value === 0) {
      isMuted.value = true
      mediaElement.value.muted = true
    } else {
      isMuted.value = false
      mediaElement.value.muted = false
    }
  }
}

const changeVolume = (delta: number) => {
  volume.value = Math.max(0, Math.min(1, volume.value + delta))
  updateVolume()
}

const updatePlaybackRate = () => {
  if (mediaElement.value) {
    mediaElement.value.playbackRate = playbackRate.value
  }
}

const seekTo = () => {
  if (mediaElement.value) {
    mediaElement.value.currentTime = currentTime.value
  }
}

const seekBy = (seconds: number) => {
  if (mediaElement.value) {
    mediaElement.value.currentTime += seconds
  }
}

const toggleFullscreen = () => {
  if (!mediaElement.value) return
  
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    mediaElement.value.requestFullscreen()
  }
}

const formatTime = (time: number): string => {
  if (isNaN(time)) return '0:00'
  
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = Math.floor(time % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

const navigatePrevious = () => {
  if (canNavigatePrevious.value) {
    const prevMedia = props.mediaFiles[currentMediaIndex.value - 1]
    emit('media-changed', prevMedia)
  }
}

const navigateNext = () => {
  if (canNavigateNext.value) {
    const nextMedia = props.mediaFiles[currentMediaIndex.value + 1]
    emit('media-changed', nextMedia)
  }
}

const closeViewer = () => {
  emit('update:visible', false)
  
  // Clean up the object URL to prevent memory leaks
  if (currentMediaUrl.value) {
    URL.revokeObjectURL(currentMediaUrl.value)
    currentMediaUrl.value = null
  }
}

const downloadMedia = () => {
  if (props.currentMedia) {
    emit('download', props.currentMedia)
  }
}

const deleteMedia = () => {
  if (props.currentMedia) {
    if (confirm(`Are you sure you want to delete "${props.currentMedia.label}"?`)) {
      emit('delete', props.currentMedia)
    }
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (currentMediaUrl.value) {
    URL.revokeObjectURL(currentMediaUrl.value)
  }
  // Remove keyboard event listener
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.media-player-dialog :deep(.p-dialog) {
  background: #1a1a1a;
}

.media-player-dialog :deep(.p-dialog-content) {
  padding: 0;
  background: #1a1a1a;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.media-player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 1rem;
}

.media-title {
  font-weight: 600;
  color: #ffffff;
  font-size: 1.1rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.playback-controls,
.action-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-controls {
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  padding-left: 1rem;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.volume-slider,
.seek-slider {
  width: 100px;
  height: 4px;
  background: #333;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb,
.seek-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #007aff;
  border-radius: 50%;
  cursor: pointer;
}

.speed-select {
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 0.9rem;
}

.media-player-content {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000000;
  overflow: hidden;
}

.media-container {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  min-height: 400px; /* Ensure minimum height for audio overlay */
}

.viewer-video {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}

.viewer-audio {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 60px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.8);
}

.audio-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 60px; /* Leave space for audio controls */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  gap: 2rem;
  pointer-events: none;
  z-index: 1;
}

.audio-icon {
  color: #007aff;
  opacity: 0.7;
  animation: pulse 2s ease-in-out infinite;
}

.audio-info {
  text-align: center;
  color: #ffffff;
}

.audio-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.audio-info p {
  margin: 0;
  color: #cccccc;
  font-size: 1rem;
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 50px;
  height: 50px;
}

.nav-arrow:hover {
  background: rgba(0, 0, 0, 0.7);
}

.nav-arrow-left {
  left: 20px;
}

.nav-arrow-right {
  right: 20px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #cccccc;
  height: 200px;
}

.loading-state .pi-spinner {
  color: #007aff;
}

.error-state .pi-exclamation-triangle {
  color: #ff6b6b;
}

.error-details {
  font-size: 0.9rem;
  color: #999;
}

.media-info {
  background: #2a2a2a;
  padding: 1rem;
  border-top: 1px solid #3a3a3a;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-display {
  color: #cccccc;
  font-size: 0.9rem;
  min-width: 100px;
  text-align: center;
}

.progress-bar {
  flex: 1;
}

.seek-slider {
  width: 100%;
}

/* Keyboard shortcuts hint */
.media-player-content::after {
  content: "← → navigate/seek • Space play/pause • M mute • F fullscreen • D download • Del delete • ↑↓ volume • Esc close";
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #cccccc;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  white-space: nowrap;
}

.media-player-content:hover::after {
  opacity: 1;
}

/* Mobile Optimizations */
.media-player-dialog.mobile-optimized :deep(.p-dialog) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  margin: 0 !important;
  border-radius: 0 !important;
}

.mobile-header {
  padding: 0.5rem 1rem !important;
  background: rgba(0, 0, 0, 0.9);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.mobile-close-btn {
  min-width: 44px;
  min-height: 44px;
  flex-shrink: 0;
}

.mobile-content {
  touch-action: none;
  -webkit-overflow-scrolling: touch;
}

.mobile-audio-overlay {
  bottom: 120px !important;
  gap: 1rem !important;
}

.mobile-title {
  font-size: 1.2rem !important;
}

.mobile-controls {
  background: rgba(0, 0, 0, 0.9);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: sticky;
  bottom: 0;
  z-index: 1000;
}

.mobile-media-controls,
.mobile-navigation,
.mobile-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.mobile-control-btn,
.mobile-nav-btn,
.mobile-action-btn {
  min-width: 48px;
  min-height: 48px;
  border-radius: 50%;
}

.play-btn {
  min-width: 60px !important;
  min-height: 60px !important;
  background: #007aff;
}

.mobile-nav-info {
  color: #cccccc;
  font-size: 0.9rem;
  min-width: 80px;
  text-align: center;
}

.mobile-volume-control {
  flex: 1;
  max-width: 200px;
}

.mobile-volume-slider {
  width: 100%;
  height: 6px;
  background: #333;
  border-radius: 3px;
  outline: none;
}

.mobile-volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #007aff;
  border-radius: 50%;
  cursor: pointer;
}

.mobile-media-info {
  padding: 0.5rem 1rem !important;
  position: sticky;
  bottom: 0;
  z-index: 999;
}

/* Hide scrollbars on mobile */
@media (max-width: 768px) {
  .media-player-content::-webkit-scrollbar {
    display: none;
  }
  
  .media-player-content {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  /* Mobile shortcuts hint */
  .media-player-content::after {
    content: "Tap for controls • Swipe to navigate" !important;
    font-size: 0.7rem !important;
    padding: 6px 12px !important;
    border-radius: 15px !important;
    white-space: nowrap;
  }
}
</style> 