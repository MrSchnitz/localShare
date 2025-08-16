<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :modal="true"
    :closable="false"
    :draggable="false"
    class="image-viewer-dialog"
    :style="{ width: '90vw'}"
  >
    <template #header>
      <div class="image-viewer-header">
        <span class="image-title">{{ currentImage?.label }}</span>
        <div class="header-controls">
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
      </div>
    </template>

    <div class="image-viewer-content" @wheel.prevent="handleWheel">
      <!-- Navigation arrows -->
      <Button
        v-if="canNavigatePrevious"
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
          :style="{ 
            transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }"
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
        v-if="canNavigateNext"
        icon="pi pi-chevron-right"
        class="p-button-text nav-arrow nav-arrow-right"
        @click="navigateNext"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
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
  } else {
    // Remove keyboard event listener when dialog closes
    document.removeEventListener('keydown', handleKeydown)
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

// Cleanup on unmount
onUnmounted(() => {
  if (currentImageUrl.value) {
    URL.revokeObjectURL(currentImageUrl.value)
  }
  // Remove keyboard event listener
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.image-viewer-dialog :deep(.p-dialog) {
  background: #1a1a1a;
}

.image-viewer-dialog :deep(.p-dialog-content) {
  padding: 0;
  background: #1a1a1a;
  overflow: hidden;
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
</style> 