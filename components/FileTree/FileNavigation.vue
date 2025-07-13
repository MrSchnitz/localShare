<template>
  <div
    class="file-item navigation-header"
    :class="{ 'drag-over': isBackButtonDragOver && canDropOnBack }"
    @dragover.prevent="handleBackDragOver"
    @dragleave.prevent="handleBackDragLeave"
    @drop.prevent="handleBackDrop"
    @click="handleBack"
  >
    <i class="pi pi-arrow-left" />
    <span class="current-path"
      >Back to <strong>{{ parentPath || "Home" }}</strong></span
    >
  </div>
</template>

<script lang="ts" setup>
import type { FileNode } from "~/types/file";

const props = defineProps<{
  currentPath: string;
  canDropOnBack: boolean;
  parentPath: string;
}>();

const emit = defineEmits<{
  navigate: [path: string];
  backButtonDrop: [parentNode: FileNode];
}>();

const isBackButtonDragOver = ref(false);

// Add back handler function
const handleBack = () => {
  if (props.currentPath) {
    const parts = props.currentPath.split("/");
    parts.pop();
    const parentPath = parts.join("/");
    emit("navigate", parentPath);
  }
};

// Add handlers for back button drag and drop
const handleBackDragOver = (event: DragEvent) => {
  if (props.canDropOnBack) {
    isBackButtonDragOver.value = true;
  }
};

const handleBackDragLeave = () => {
  isBackButtonDragOver.value = false;
};

const handleBackDrop = async (event: DragEvent) => {
  event.preventDefault();
  isBackButtonDragOver.value = false;

  if (!props.canDropOnBack) return;

  // Create a virtual target node for the parent folder with all required properties
  const parentNode: FileNode = {
    label: "",
    data: props.parentPath,
    type: "folder",
    children: [],
    key: props.parentPath,
    modifiedDate: new Date().toISOString(),
  };

  emit("backButtonDrop", parentNode);
};
</script>

<style>
/* Add these new styles */
.navigation-header {
  position: relative;
  min-height: 150px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #2a2a2a;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.navigation-header.drag-over {
  background: rgba(0, 122, 255, 0.1);
  border: 2px dashed #007aff;
}

.list .navigation-header {
  min-height: auto;
  justify-content: flex-start;
  margin-bottom: 0;
}

.back-button {
  padding: 0.5rem !important;
  width: 2.5rem !important;
  height: 2.5rem !important;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.current-path {
  color: #666;
  font-size: 14px;
  overflow-wrap: anywhere;
}

</style>
