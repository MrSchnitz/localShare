<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :modal="true"
    :closable="false"
    :draggable="false"
    class="image-viewer-dialog"
    :class="{ 'mobile-optimized': isMobile }"
    :style="dialogStyle"
  >
    <template #header>
      <div class="image-viewer-header" :class="{ 'mobile-header': isMobile }">
        <span class="image-title">{{ currentImage?.label }}</span>
        <div class="header-controls" v-if="!isMobile">
          <div class="zoom-controls">
            <Button
              icon="pi pi-search-minus"
              class="p-button-text p-button-secondary"
              @click="zoomOut"
              :disabled="zoomLevel <= 0.2"
            />
            <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
            <Button
              icon="pi pi-search-plus"
              class="p-button-text p-button-secondary"
              @click="zoomIn"
              :disabled="zoomLevel >= 5"
            />
            <Button
              icon="pi pi-refresh"
              class="p-button-text p-button-secondary"
              @click="resetZoom"
            />
          </div>
          
          <div class="action-controls">
            <Button
              icon="pi pi-download"
              class="p-button-text p-button-secondary"
              @click="downloadImage"
              v-tooltip.top="'Download image'"
            />
            <Button
              icon="pi pi-trash"
              class="p-button-text p-button-danger"
              @click="deleteImage"
              v-tooltip.top="'Delete image'"
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

    <div 
      class="image-viewer-content" 
      :class="{ 'mobile-content': isMobile }"
      @wheel.prevent="handleWheel"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Navigation arrows - hidden on mobile -->
      <Button
        v-if="canNavigatePrevious && !isMobile"
        icon="pi pi-chevron-left"
        class="p-button-text nav-arrow nav-arrow-left"
        @click="navigatePrevious"
      />
      
      <div class="image-container" ref="imageContainer">
        <img
          v-if="currentImageUrl"
          :src="currentImageUrl"
          :alt="currentImage?.label"
          class="viewer-image"
          :class="{ 'mobile-image': isMobile }"
          :style="imageStyle"
          @mousedown="startDrag"
          @mousemove="drag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
          @dragstart.prevent
          @load="onImageLoad"
          @error="onImageError"
        />
        <div v-else-if="isLoading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
          <p>Loading image...</p>
        </div>
        <div v-else-if="hasError" class="error-state">
          <i class="pi pi-exclamation-triangle" style="font-size: 2rem;"></i>
          <p>Failed to load image</p>
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
      <!-- Mobile Zoom Controls -->
      <div class="mobile-zoom-controls">
        <Button
          icon="pi pi-search-minus"
          class="p-button-text mobile-control-btn"
          @click="zoomOut"
          :disabled="zoomLevel <= 0.2"
        />
        <span class="mobile-zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <Button
          icon="pi pi-search-plus"
          class="p-button-text mobile-control-btn"
          @click="zoomIn"
          :disabled="zoomLevel >= 5"
        />
        <Button
          icon="pi pi-refresh"
          class="p-button-text mobile-control-btn"
          @click="resetZoom"
        />
      </div>

      <!-- Mobile Navigation -->
      <div class="mobile-navigation">
        <Button
          v-if="canNavigatePrevious"
          icon="pi pi-chevron-left"
          class="p-button-text mobile-nav-btn"
          @click="navigatePrevious"
        />
        <span class="mobile-nav-info">{{ currentImageIndex + 1 }} / {{ props.images.length }}</span>
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
          @click="downloadImage"
        />
        <Button
          icon="pi pi-trash"
          class="p-button-text p-button-danger mobile-action-btn"
          @click="deleteImage"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { FileNode } from '~/types/file'

const props = defineProps<{
  visible: boolean
  currentImage: FileNode | null
  images: FileNode[]
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'image-changed': [image: FileNode]
  'download': [image: FileNode]
  'delete': [image: FileNode]
}>()

// Mobile detection
const isMobile = ref(false)

// State
const zoomLevel = ref(1)
const currentImageUrl = ref<string | null>(null)
const isLoading = ref(false)
const hasError = ref(false)
const imageContainer = ref<HTMLElement>()

// Drag state
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const imagePosition = ref({ x: 0, y: 0 })

// Touch handling for mobile
const touchStartDistance = ref(0)
const touchStartZoom = ref(1)
const touchStartPos = ref({ x: 0, y: 0 })
const isTouching = ref(false)

// Computed properties
const currentImageIndex = computed(() => {
  if (!props.currentImage) return -1
  return props.images.findIndex(img => img.data === props.currentImage?.data)
})

const canNavigatePrevious = computed(() => {
  return props.images.length > 1 && currentImageIndex.value > 0
})

const canNavigateNext = computed(() => {
  return props.images.length > 1 && currentImageIndex.value < props.images.length - 1
})

// Dialog and image styling
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

const imageStyle = computed(() => {
  const transform = `scale(${zoomLevel.value}) translate(${imagePosition.value.x}px, ${imagePosition.value.y}px)`
  const cursor = isDragging.value ? 'grabbing' : (isMobile.value ? 'default' : 'grab')
  
  return { transform, cursor }
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
      }
      break
    case 'ArrowRight':
      event.preventDefault()
      if (canNavigateNext.value) {
        navigateNext()
      }
      break
    case 'Escape':
      event.preventDefault()
      closeViewer()
      break
    case '+':
    case '=':
      event.preventDefault()
      zoomIn()
      break
    case '-':
      event.preventDefault()
      zoomOut()
      break
    case '0':
      event.preventDefault()
      resetZoom()
      break
    case 'd':
    case 'D':
      event.preventDefault()
      downloadImage()
      break
    case 'Delete':
    case 'Backspace':
      event.preventDefault()
      deleteImage()
      break
  }
}

// Watch for image changes
watch(() => props.currentImage, async (newImage) => {
  if (newImage) {
    resetZoom()
    resetPosition()
    await loadImage(newImage)
  }
}, { immediate: true })

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    resetZoom()
    resetPosition()
    // Add keyboard event listener when dialog opens
    document.addEventListener('keydown', handleKeydown)
    // Prevent scrolling on mobile
    if (isMobile.value) {
      document.body.style.overflow = 'hidden'
    }
  } else {
    // Remove keyboard event listener when dialog closes
    document.removeEventListener('keydown', handleKeydown)
    // Restore scrolling
    if (isMobile.value) {
      document.body.style.overflow = 'auto'
    }
  }
})

// Methods
const loadImage = async (image: FileNode) => {
  isLoading.value = true
  hasError.value = false
  currentImageUrl.value = null

  try {
    const response = await fetch(`/api/files?filename=${encodeURIComponent(image.data)}`, {
      method: 'PUT'
    })
    
    if (!response.ok) {
      throw new Error('Failed to load image')
    }

    const blob = await response.blob()
    currentImageUrl.value = URL.createObjectURL(blob)
    isLoading.value = false
  } catch (error) {
    console.error('Failed to load image:', error)
    hasError.value = true
    isLoading.value = false
  }
}

const onImageLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const onImageError = () => {
  hasError.value = true
  isLoading.value = false
}

const zoomAtPoint = (oldZoom: number, newZoom: number, cursorX?: number, cursorY?: number) => {
  if (!imageContainer.value || cursorX === undefined || cursorY === undefined) {
    // If no cursor position provided, zoom from center
    zoomLevel.value = newZoom
    return
  }

  const containerRect = imageContainer.value.getBoundingClientRect()
  
  // Get cursor position relative to container center
  const containerCenterX = containerRect.width / 2
  const containerCenterY = containerRect.height / 2
  const offsetX = cursorX - containerRect.left - containerCenterX
  const offsetY = cursorY - containerRect.top - containerCenterY

  // Calculate the zoom factor
  const zoomFactor = newZoom / oldZoom

  // Adjust image position to zoom toward cursor
  imagePosition.value.x = offsetX - (offsetX - imagePosition.value.x) * zoomFactor
  imagePosition.value.y = offsetY - (offsetY - imagePosition.value.y) * zoomFactor

  zoomLevel.value = newZoom
}

const zoomIn = () => {
  if (zoomLevel.value < 5) {
    const oldZoom = zoomLevel.value
    const newZoom = Math.min(5, zoomLevel.value * 1.2)
    zoomAtPoint(oldZoom, newZoom)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.2) {
    const oldZoom = zoomLevel.value
    const newZoom = Math.max(0.2, zoomLevel.value / 1.2)
    zoomAtPoint(oldZoom, newZoom)
  }
}

const zoomInAtCursor = (cursorX: number, cursorY: number) => {
  if (zoomLevel.value < 5) {
    const oldZoom = zoomLevel.value
    const newZoom = Math.min(5, zoomLevel.value * 1.2)
    zoomAtPoint(oldZoom, newZoom, cursorX, cursorY)
  }
}

const zoomOutAtCursor = (cursorX: number, cursorY: number) => {
  if (zoomLevel.value > 0.2) {
    const oldZoom = zoomLevel.value
    const newZoom = Math.max(0.2, zoomLevel.value / 1.2)
    zoomAtPoint(oldZoom, newZoom, cursorX, cursorY)
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
  resetPosition()
}

const resetPosition = () => {
  imagePosition.value = { x: 0, y: 0 }
}

const handleWheel = (event: WheelEvent) => {
  if (event.ctrlKey || event.metaKey) {
    // Zoom with ctrl/cmd + wheel toward cursor position
    if (event.deltaY < 0) {
      zoomInAtCursor(event.clientX, event.clientY)
    } else {
      zoomOutAtCursor(event.clientX, event.clientY)
    }
  }
}

const startDrag = (event: MouseEvent) => {
  event.preventDefault()
  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
}

const drag = (event: MouseEvent) => {
  if (!isDragging.value) return
  
  event.preventDefault()
  
  const deltaX = event.clientX - dragStart.value.x
  const deltaY = event.clientY - dragStart.value.y
  
  imagePosition.value.x += deltaX
  imagePosition.value.y += deltaY
  
  dragStart.value = { x: event.clientX, y: event.clientY }
}

const endDrag = () => {
  isDragging.value = false
}

const navigatePrevious = () => {
  if (canNavigatePrevious.value) {
    const prevImage = props.images[currentImageIndex.value - 1]
    emit('image-changed', prevImage)
  }
}

const navigateNext = () => {
  if (canNavigateNext.value) {
    const nextImage = props.images[currentImageIndex.value + 1]
    emit('image-changed', nextImage)
  }
}

const closeViewer = () => {
  emit('update:visible', false)
  
  // Clean up the object URL to prevent memory leaks
  if (currentImageUrl.value) {
    URL.revokeObjectURL(currentImageUrl.value)
    currentImageUrl.value = null
  }
}

const downloadImage = () => {
  if (props.currentImage) {
    emit('download', props.currentImage)
  }
}

const deleteImage = () => {
  if (props.currentImage) {
    if (confirm(`Are you sure you want to delete "${props.currentImage.label}"?`)) {
      emit('delete', props.currentImage)
    }
  }
}

// Touch gesture handlers
const handleTouchStart = (event: TouchEvent) => {
  isTouching.value = true
  
  if (event.touches.length === 1) {
    // Single touch - prepare for drag
    const touch = event.touches[0]
    touchStartPos.value = { x: touch.clientX, y: touch.clientY }
  } else if (event.touches.length === 2) {
    // Two finger pinch - prepare for zoom
    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
    touchStartDistance.value = distance
    touchStartZoom.value = zoomLevel.value
  }
}

const handleTouchMove = (event: TouchEvent) => {
  if (!isTouching.value) return
  
  event.preventDefault()
  
  if (event.touches.length === 1) {
    // Single touch drag
    const touch = event.touches[0]
    const deltaX = touch.clientX - touchStartPos.value.x
    const deltaY = touch.clientY - touchStartPos.value.y
    
    imagePosition.value.x += deltaX
    imagePosition.value.y += deltaY
    
    touchStartPos.value = { x: touch.clientX, y: touch.clientY }
  } else if (event.touches.length === 2) {
    // Two finger pinch zoom
    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
    
    const scale = distance / touchStartDistance.value
    const newZoom = Math.max(0.2, Math.min(5, touchStartZoom.value * scale))
    zoomLevel.value = newZoom
  }
}

const handleTouchEnd = () => {
  isTouching.value = false
  
  // Check for swipe navigation on mobile
  if (Math.abs(imagePosition.value.x) > 100) {
    if (imagePosition.value.x > 100 && canNavigatePrevious.value) {
      navigatePrevious()
    } else if (imagePosition.value.x < -100 && canNavigateNext.value) {
      navigateNext()
    }
    resetPosition()
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (currentImageUrl.value) {
    URL.revokeObjectURL(currentImageUrl.value)
  }
  // Remove keyboard event listener
  document.removeEventListener('keydown', handleKeydown)
  // Restore scrolling
  if (isMobile.value) {
    document.body.style.overflow = 'auto'
  }
  // Remove resize listener
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
.image-viewer-dialog :global(.p-dialog) {
  background: #1a1a1a;
}

.image-viewer-dialog :global(.p-dialog-content) {
  padding: 0;
  background: #1a1a1a;
  overflow: hidden;
  height: 100%;
}

.image-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 1rem;
}

.image-title {
  font-weight: 600;
  color: #ffffff;
  font-size: 1.1rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.zoom-controls,
.action-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-controls {
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  padding-left: 1rem;
}

.zoom-level {
  color: #cccccc;
  font-size: 0.9rem;
  min-width: 50px;
  text-align: center;
}

.image-viewer-content {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000000;
  overflow: hidden;
}

.image-container {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.viewer-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
  user-select: none;
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

/* Keyboard shortcuts hint */
.image-viewer-content::after {
  content: "← → navigate • D download • Del delete • Ctrl/Cmd+scroll zoom • drag pan • Esc close";
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
}

.image-viewer-content:hover::after {
  opacity: 1;
}

/* Mobile Optimizations */
.image-viewer-dialog.mobile-optimized :deep(.p-dialog) {
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

.mobile-image {
  width: 100%;
  height: auto;
  max-height: calc(100dvh - 200px);
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

.mobile-zoom-controls,
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

.mobile-zoom-level,
.mobile-nav-info {
  color: #cccccc;
  font-size: 0.9rem;
  min-width: 80px;
  text-align: center;
}

/* Hide scrollbars on mobile */
@media (max-width: 768px) {
  .image-viewer-content::-webkit-scrollbar {
    display: none;
  }
  
  .image-viewer-content {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  /* Mobile shortcuts hint */
  .image-viewer-content::after {
    content: "Pinch to zoom • Swipe to navigate • Double tap for controls" !important;
    font-size: 0.7rem !important;
    padding: 6px 12px !important;
    border-radius: 15px !important;
    white-space: nowrap;
  }
}
</style> 