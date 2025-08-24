<template>
  <div
    class="file-item"
    :class="{
      selected: selectedNode === node,
      'is-folder': node.type === 'folder',
      'drag-over': dragOverNode === node && canDropOnNode(draggedNode, node),
    }"
    draggable="true"
    @dragstart="handleDragStart($event, node)"
    @dragover.prevent="handleDragOverNode($event, node)"
    @dragleave.prevent="handleDragLeaveNode(node)"
    @drop.prevent="handleDropOnNode($event, node)"
    @dragend="handleDragEnd"
    @click="handleItemClick"
  >
    <div class="file-checkbox">
      <input
        type="checkbox" 
        :checked="selectedNode === node"
        @change="handleCheckboxChange"
        @click.stop
        class="checkbox-input"
      />
    </div>

    <div class="file-icon">
      <i :class="getIconClass(node)" />
    </div>

    <div class="file-details">
      <span class="file-name text-white">{{ node.label }}</span>
      <span v-if="viewMode === 'list'" class="file-meta">
        {{ node.modifiedDate ? formatDate(node.modifiedDate) : "" }}
      </span>
    </div>

    <div
      class="file-actions"
      :class="[node.type === 'folder' ? 'justify-center' : 'justify-between']"
    >
      <Button
        v-if="node.type === 'file'"
        icon="pi pi-download"
        class="p-button-text"
        @click.stop="emit('onDownload', node)"
      />
      <Button
        icon="pi pi-trash"
        class="p-button-text p-button-danger"
        @click.stop="confirmDelete(node.data, $event, node.type === 'folder')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FileNode } from "~/types/file";
import { ref } from "vue";

const props = defineProps<{
  node: FileNode;
  selectedNode: FileNode | null;
  draggedNode: FileNode | null;
  dragOverNode: FileNode | null;
  isDraggingOver: boolean;
  viewMode: "grid" | "list";
}>();

const emit = defineEmits<{
  onClick: [node: FileNode];
  onDoubleClick: [node: FileNode];
  onDrop: [event: DragEvent, targetNode: FileNode];
  onDownload: [node: FileNode];
  onDelete: [path: string, isFolder: boolean];
  setDraggedNode: [draggedNode: FileNode | null];
  setDragOverNode: [dragOverNode: FileNode | null];
  setIsDraggingOver: [isDraggingOver: boolean];
}>();

// Check if a node can accept drops
const canDropOnNode = (source: FileNode | null, target: FileNode) => {
  if (!source) return true; // Allow external file drops
  if (target.type !== "folder") return false; // Only allow drops on folders
  if (source === target) return false; // Can't drop on itself
  // if (target.data.startsWith(source.data + "/")) return false; // Can't drop into child folder
  return true;
};

// Handle drag & drop for file/folder moving
const handleDragStart = (event: DragEvent, node: FileNode) => {
  emit("setDraggedNode", node);
};

const handleDragOverNode = (event: DragEvent, node: FileNode) => {
  if (canDropOnNode(props.draggedNode, node)) {
    emit("setDragOverNode", node);
  }
};

const handleDragLeaveNode = (node: FileNode) => {
  if (props.dragOverNode === node) {
    emit("setDragOverNode", null);
  }
};

const handleDropOnNode = (event: DragEvent, targetNode: FileNode) => {
  event.preventDefault();
  emit("setDragOverNode", null);
  emit("onDrop", event, targetNode);
};

const handleDragEnd = () => {
  emit("setDraggedNode", null);
  emit("setDragOverNode", null);
};

// Handle item click to open files/folders (was double-click behavior)
const handleItemClick = () => {
  emit("onDoubleClick", props.node);
};

// Handle checkbox change for selection
const handleCheckboxChange = () => {
  emit("onClick", props.node);
};

const getIconClass = (node: FileNode) => {
  if (node.type === "folder") return "pi pi-folder text-yellow-500";

  const ext = node.label.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "pi pi-file-pdf text-red-500";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
    case "svg":
    case "bmp":
    case "tiff":
    case "tif":
    case "ico":
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

const confirmDelete = (path: string, event: Event, isFolder = false) => {
  event.stopPropagation();
  event.preventDefault();

  const message = isFolder
    ? `Are you sure you want to delete the folder "${path}" and all its contents?`
    : `Are you sure you want to delete ${path}?`;

  if (confirm(message)) {
    emit("onDelete", path, isFolder);
  }
};

</script>

<style>
/* Grid View specific styles */
.grid .file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px;
  height: fit-content;
  position: relative;
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
  gap: 8px;
}

.grid .file-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
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

.list .file-checkbox {
  margin-right: 12px;
  flex-shrink: 0;
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
  gap: 8px;
  align-items: center;
}

/* Common styles */
.file-item {
  background: #2a2a2a;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.file-item:hover {
  background: #3a3a3a;
}

.file-item.selected {
  background: rgba(0, 122, 255, 0.2);
  border-color: #007aff;
}

.file-actions {
  visibility: hidden;
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
}

.file-item:hover .file-actions,
.file-item.selected .file-actions {
  visibility: visible;
}

.drag-over {
  background: rgba(0, 122, 255, 0.1);
  border-color: #007aff;
  border-style: dashed;
}

/* Drag feedback styles */
.file-item.is-folder.drag-over {
  background: rgba(0, 122, 255, 0.1);
  border-color: #007aff;
  border-style: dashed;
}

/* Checkbox styles */
.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #007aff;
}

.file-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Mobile-friendly button styling */
.file-actions .p-button {
  min-width: 44px;
  min-height: 44px;
}

@media (max-width: 768px) {
  .file-actions .p-button {
    padding: 12px;
  }
  
  /* Make selected items more prominent on mobile */
  .file-item.selected {
    background: rgba(0, 122, 255, 0.25);
    border-color: #007aff;
  }
  
  /* Ensure adequate spacing for touch targets in grid view */
  .grid .file-item.selected {
    padding: 16px 12px;
  }
}
</style>
