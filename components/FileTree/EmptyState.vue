<template>
  <div
    class="empty-state"
    :class="{ 'drag-over': isDraggingOver }"
    @drop.prevent="emit('drop', $event)"
    @click="emit('click')"
  >
    <i class="pi pi-folder-open"></i>
    <p>Drop files here or click to browse</p>
  </div>
</template>

<script lang="ts" setup>
import type { FileNode } from "~/types/file";

const props = defineProps<{
  isDraggingOver: boolean;
}>();

const emit = defineEmits<{
  (e: "drop", event: DragEvent): void;
  (e: "click"): void;
}>();
</script>

<style>
.empty-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border-radius: 8px;
  border: 2px dashed #444;
  transition: all 0.2s ease;
}

.empty-state.drag-over {
  background: rgba(0, 122, 255, 0.1);
  border-color: #007aff;
}

.empty-state i {
  font-size: 48px;
  color: #666;
  margin-bottom: 16px;
}

.empty-state p {
  color: #666;
  font-size: 14px;
}
</style>
