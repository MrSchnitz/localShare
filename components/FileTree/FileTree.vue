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
      <div
        v-if="currentPath"
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
      <div
        v-for="node in sortedNodes"
        :key="node.data"
        class="file-item"
        :class="{
          selected: selectedNode === node,
          'is-folder': node.type === 'folder',
          'drag-over':
            dragOverNode === node && canDropOnNode(draggedNode, node),
        }"
        draggable="true"
        @dragstart="handleDragStart($event, node)"
        @dragover.prevent="handleDragOverNode($event, node)"
        @dragleave.prevent="handleDragLeaveNode(node)"
        @drop.prevent="handleDropOnNode($event, node)"
        @dragend="handleDragEnd"
        @click="handleSelect(node)"
        @dblclick="handleOpen(node)"
      >
        <div class="file-icon">
          <i :class="getIconClass(node)" />
        </div>

        <div class="file-details">
          <span class="file-name">{{ node.label }}</span>
          <span v-if="viewMode === 'list'" class="file-meta">
            {{ node.modifiedDate ? formatDate(node.modifiedDate) : "" }}
          </span>
        </div>

        <div
          class="file-actions"
          :class="[
            node.type === 'folder' ? 'justify-center' : 'justify-between',
          ]"
        >
          <Button
            v-if="node.type === 'file'"
            icon="pi pi-download"
            class="p-button-text"
            @click.stop="$emit('download', node)"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-text p-button-danger"
            @click.stop="
              confirmDelete(node.data, $event, node.type === 'folder')
            "
          />
        </div>
      </div>

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
const isBackButtonDragOver = ref(false);

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

const confirmDelete = (path: string, event: Event, isFolder = false) => {
  event.stopPropagation();
  event.preventDefault();

  const message = isFolder
    ? `Are you sure you want to delete the folder "${path}" and all its contents?`
    : `Are you sure you want to delete ${path}?`;

  if (confirm(message)) {
    emit("delete", path, isFolder);
  }
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

// Handle drag & drop for file/folder moving
const handleDragStart = (event: DragEvent, node: FileNode) => {
  draggedNode.value = node;
};

const handleDragOverNode = (event: DragEvent, node: FileNode) => {
  if (canDropOnNode(draggedNode.value, node)) {
    dragOverNode.value = node;
  }
};

const handleDragLeaveNode = (node: FileNode) => {
  if (dragOverNode.value === node) {
    dragOverNode.value = null;
  }
};

const handleDropOnNode = (event: DragEvent, targetNode: FileNode) => {
  event.preventDefault();
  dragOverNode.value = null;

  // Handle files from computer
  if (event.dataTransfer?.files.length && targetNode.children) {
    emit("upload-files", event.dataTransfer.files, targetNode.data);
    return;
  }

  // Handle internal file/folder moving
  if (draggedNode.value && canDropOnNode(draggedNode.value, targetNode)) {
    emit("move-file", draggedNode.value, targetNode);
  }
};

const handleDragEnd = () => {
  draggedNode.value = null;
  dragOverNode.value = null;
};

const getIconClass = (node: FileNode) => {
  if (node.type === "folder") return "pi pi-folder text-yellow-500";

  const ext = node.label.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "pi pi-file-pdf text-red-500";
    case "jpg":
    case "png":
    case "gif":
      return "pi pi-image text-blue-500";
    default:
      return "pi pi-file text-gray-500";
  }
};

const formatDate = (date: string | Date | undefined) => {
  if (!date) return "";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const handleSelect = (node: FileNode) => {
  selectedNode.value = node;
  emit("select", node);
};

const handleOpen = (node: FileNode) => {
  emit("open", node);
};

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
  if (canDropOnBack.value) {
    isBackButtonDragOver.value = true;
  }
};

const handleBackDragLeave = () => {
  isBackButtonDragOver.value = false;
};

const handleBackDrop = async (event: DragEvent) => {
  event.preventDefault();
  isBackButtonDragOver.value = false;

  if (!canDropOnBack.value || !draggedNode.value) return;

  // Create a virtual target node for the parent folder with all required properties
  const parentNode: FileNode = {
    label: "",
    data: parentPath.value,
    type: "folder",
    children: [],
    key: parentPath.value,
    modifiedDate: new Date().toISOString(),
  };

  emit("move-file", draggedNode.value, parentNode);
  draggedNode.value = null;
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

// Add sorting state
const sortBy = ref<SortBy>("name");
const sortDirection = ref<SortDirection>("asc");

// Add computed property for sorted nodes
const sortedNodes = computed(() =>
  getSortedNodes(props.nodes, sortBy.value, sortDirection.value)
);

const handleSort = (
  newSortBy: typeof sortBy.value,
  newSortDirection: typeof sortDirection.value
) => {
  sortBy.value = newSortBy;
  sortDirection.value = newSortDirection;
};
</script>

<style scoped>
/* Base container styles */
.file-container {
  position: relative;
  height: 100%;
  width: 100%;
}

/* Grid View specific styles */
.grid .file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px;
  height: fit-content;
}

.grid .file-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.grid .file-details {
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.grid .file-name {
  font-size: 13px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 4px;
  display: block;
}

.grid .file-actions {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

/* List View specific styles */
.list .file-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.list .file-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
}

.list .file-icon {
  font-size: 20px;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}

.list .file-details {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.list .file-name {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.list .file-meta {
  color: #666;
  font-size: 12px;
  flex-shrink: 0;
}

.list .file-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

/* Common styles */
.file-item {
  background: #2a2a2a;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.file-item:hover {
  background: #3a3a3a;
}

.file-item.selected {
  background: rgba(0, 122, 255, 0.2);
  outline: 2px solid #007aff;
}

.file-actions {
  visibility: hidden;
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
}

.file-item:hover .file-actions {
  visibility: visible;
}

.drag-over {
  background: rgba(0, 122, 255, 0.1);
  border: 2px dashed #007aff;
}

/* Drag feedback styles */
.file-item.is-folder.drag-over {
  background: rgba(0, 122, 255, 0.1);
  border: 2px dashed #007aff;
}

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
