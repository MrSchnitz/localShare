<template>
  <div class="card mb-8 w-full flex justify-center">
    <Tree
      :value="nodes"
      selection-mode="single"
      v-model:selectionKeys="selectedKey"
      :filter="true"
      filterMode="strict"
      class="w-full md:w-[30rem] rounded-2xl"
      @nodeSelect="onNodeSelect"
      @nodeUnselect="onNodeUnselect"
    >
      <template #header>
        <div class="flex justify-end p-2">
          <Button
            severity="success"
            size="small"
            class="!px-2 !py-1 !text-sm w-full"
            icon="pi pi-folder-plus"
            label="Create Root Folder"
            @click="handleCreateFolder($event, '')"
          />
        </div>
      </template>
      <template #default="slotProps">
        <div class="w-full relative">
          <p class="truncate">{{ slotProps.node.label }}</p>
          <div class="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2">
            <Button
              class="!w-6 !h-6"
              severity="success"
              rounded
              icon="pi pi-folder-plus"
              @click="(event) => handleCreateFolder(event, slotProps.node.data)"
            />
            <Button
              class="!w-6 !h-6"
              severity="danger"
              rounded
              icon="pi pi-trash"
              @click="
                (event) => confirmDelete(slotProps.node.data, event, true)
              "
            />
          </div>
        </div>
      </template>
      <template #file="slotProps">
        <div
          class="w-full relative"
          @click="(event) => handleItemClick(event, slotProps.node)"
        >
          <p class="truncate">{{ slotProps.node.label }}</p>
          <Button
            class="absolute right-0 top-1/2 -translate-y-1/2 !w-6 !h-6"
            severity="danger"
            rounded
            icon="pi pi-trash"
            @click="(event) => confirmDelete(slotProps.node.data, event)"
          />
        </div>
      </template>
    </Tree>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FileNode } from "~/types/file";
import type { TreeSelectionKeys } from "primevue/tree";
const selectedKey = ref<TreeSelectionKeys | undefined>(undefined);

defineProps<{
  nodes: FileNode[];
}>();

const emit = defineEmits<{
  (e: "select", node: FileNode): void;
  (e: "download", node: FileNode): void;
  (e: "unselect", node: FileNode): void;
  (e: "delete", path: string, isFolder: boolean): void;
  (e: "createFolder", path: string, folderName: string): void;
}>();

const handleItemClick = (event: Event, node: FileNode) => {
  event.stopPropagation();
  emit("download", node);
};

const onNodeSelect = (node: FileNode) => {
  if (node.data) {
    emit("select", node);
  }
};

const onNodeUnselect = (node: FileNode) => {
  if (node.data) {
    emit("unselect", node);
  }
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

const handleCreateFolder = (event: Event, parentPath: string) => {
  event.stopPropagation();
  event.preventDefault();

  const folderName = prompt("Enter folder name:");
  if (folderName) {
    emit("createFolder", parentPath, folderName);
  }
};
</script>

<style>
.p-tree-node-label {
  width: 100% !important;
}
</style>
