<template>
  <div
    class="file-container"
    :class="[viewMode, { 'drag-over': isDraggingOver }]"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- Wrap the content in a scrollable container -->
    <FileScrollContainer
      :show-sort-header="nodes.length > 0"
      :sort-by="sortBy"
      :sort-direction="sortDirection"
      @sort="handleSort"
    >
      <FileNavigation
        v-if="currentPath"
        :current-path="currentPath"
        :can-drop-on-back="canDropOnBack"
        :parent-path="parentPath"
        @back-button-drop="handleBackButtonDrop"
        @navigate="emit('navigate', $event)"
      />
      <FileNodeComponent
        v-for="node in sortedNodes"
        :key="node.data"
        :node="node"
        :selected-node="selectedNode"
        :dragged-node="draggedNode"
        :drag-over-node="dragOverNode"
        :is-dragging-over="isDraggingOver"
        :view-mode="viewMode"
        @on-click="handleSelect"
        @on-double-click="handleOpen"
        @on-drop="handleDropOnNode"
        @on-download="(node: FileNode) => emit('download', node)"
        @on-delete="(path: string, isFolder: boolean) => emit('delete', path, isFolder)"
        @set-dragged-node="handleSetDraggedNode"
        @set-drag-over-node="handleSetDragOverNode"
        @set-is-dragging-over="handleSetIsDraggingOver"
      />
      <EmptyState
        v-if="nodes.length === 0"
        :is-dragging-over="isDraggingOver"
        @drop="handleDrop"
        @click="handleEmptyStateClick"
      />
    </FileScrollContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { FileNode } from "~/types/file";
import type { SortBy, SortDirection } from "@/config/types";
import FileScrollContainer from "./FileScrollContainer.vue";
import { getSortedNodes } from "~/helpers/getSortedNodes";
import FileNavigation from "./FileNavigation.vue";
import FileNodeComponent from "./FileNode.vue";
import EmptyState from "./EmptyState.vue";

const props = defineProps<{
  nodes: FileNode[];
  viewMode: "grid" | "list";
  currentPath?: string;
}>();

const emit = defineEmits<{
  select: [node: FileNode];
  open: [node: FileNode];
  download: [node: FileNode];
  delete: [path: string, isFolder: boolean];
  "move-file": [sourceNode: FileNode, targetNode: FileNode];
  "upload-files": [files: FileList, targetPath: string];
  navigate: [path: string];
}>();

const selectedNode = ref<FileNode | null>(null);
const isDraggingOver = ref(false);
const draggedNode = ref<FileNode | null>(null);
const dragOverNode = ref<FileNode | null>(null);
// Add sorting state
const sortBy = ref<SortBy>("name");
const sortDirection = ref<SortDirection>("asc");

// Add computed property for sorted nodes
const sortedNodes = computed(() =>
  getSortedNodes(props.nodes, sortBy.value, sortDirection.value)
);

// Add computed property for parent path
const parentPath = computed(() => {
  if (!props.currentPath) return "";
  const parts = props.currentPath.split("/");
  parts.pop();
  return parts.join("/");
});

// Add computed property to check if we can drop on back button
const canDropOnBack = computed(() => {
  if (!draggedNode.value) return false;
  return true;
});

// Check if a node can accept drops
const canDropOnNode = (source: FileNode | null, target: FileNode) => {
  if (!source) return true; // Allow external file drops
  if (target.type !== "folder") return false; // Only allow drops on folders
  if (source === target) return false; // Can't drop on itself
  // if (target.data.startsWith(source.data + "/")) return false; // Can't drop into child folder
  return true;
};

const handleSetDraggedNode = (node: FileNode | null) => {
  draggedNode.value = node;
};

const handleSetDragOverNode = (node: FileNode | null) => {
  dragOverNode.value = node;
};

const handleSetIsDraggingOver = (newIsDraggingOver: boolean) => {
  isDraggingOver.value = newIsDraggingOver;
};

const handleSelect = (node: FileNode) => {
  selectedNode.value = node;
  emit("select", node);
};

const handleOpen = (node: FileNode) => {
  emit("open", node);
};

// Handle drag & drop for files from computer
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (!draggedNode.value) {
    // Only show drag effect for external files
    isDraggingOver.value = true;
  }
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  isDraggingOver.value = false;
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault();
  isDraggingOver.value = false;

  if (!event.dataTransfer?.files.length) return;

  emit("upload-files", event.dataTransfer.files, "");
};

const handleDropOnNode = (event: DragEvent, targetNode: FileNode) => {
  // Handle files from computer
  if (event.dataTransfer?.files.length && targetNode.children) {
    emit("upload-files", event.dataTransfer.files, targetNode.data);
    return;
  }

  // Handle internal file/folder moving
  if (draggedNode.value && canDropOnNode(draggedNode.value, targetNode)) {
    if (confirm(`Move ${draggedNode.value.label} to ${targetNode.label}?`)) {
      emit("move-file", draggedNode.value, targetNode);
    }
  }
};

const handleBackButtonDrop = (parentNode: FileNode) => {
  if (!draggedNode.value || !parentNode) return;

  if (confirm(`Move ${draggedNode.value.label} to ${parentNode.label}?`)) {
    emit("move-file", draggedNode.value, parentNode);
    draggedNode.value = null;
  }
};

const handleEmptyStateClick = () => {
  // Create a hidden file input element
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.multiple = true;

  // Handle file selection
  fileInput.onchange = (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files?.length) {
      emit("upload-files", files, props.currentPath || "");
    }
  };

  // Trigger file selection dialog
  fileInput.click();
};

const handleSort = (
  newSortBy: typeof sortBy.value,
  newSortDirection: typeof sortDirection.value
) => {
  sortBy.value = newSortBy;
  sortDirection.value = newSortDirection;
};
</script>

<style scoped>
.file-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.drag-over {
  background: rgba(0, 122, 255, 0.1);
  border: 2px dashed #007aff;
}
</style>
