<template>
  <Toast />

  <main class="w-full pt-8 px-4">
    <div class="flex flex-col gap-8 justify-center items-center">
      <FileTree
        :nodes="nodes"
        @download="handleDownload"
        @delete="handleDelete"
        @select="onNodeSelect"
        @unselect="onNodeUnselect"
        @createFolder="handleCreateFolder"
      />
      <UploadFile :selectedFolder="selectedFolder" :refresh="refresh" />
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { FileNode } from "~/types/file";
import { useAutoRefresh } from "~/composables/useAutoRefresh";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const selectedFolder = ref<FileNode | null>(null);
const nodes = ref<FileNode[]>([]);

const { data, refresh } = await useFetch<{ children: FileNode[] }>(
  "/api/files"
);
useAutoRefresh(refresh);

onMounted(() => {
  nodes.value = data.value?.children ?? [];
});
watch(
  data,
  () => {
    nodes.value = data.value?.children ?? [];
  },
  { deep: true }
);

const onNodeSelect = (node: FileNode) => {
  if (node.data) {
    selectedFolder.value = node;
  }
};

const onNodeUnselect = (node: FileNode) => {
  if (node.data) {
    selectedFolder.value = null;
  }
};

const handleDownload = async (node: FileNode) => {
  const response = await fetch(`/api/files?filename=${node.data}`, {
    method: "PUT",
  });
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = node.label;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const handleDelete = async (path: string, isFolder: boolean) => {
  const response = await $fetch("/api/files", {
    method: "DELETE",
    body: {
      fileName: path,
      isFolder,
    },
  });

  // Clear selected folder if it was deleted or was inside the deleted folder
  if (isFolder && selectedFolder.value) {
    const selectedPath = selectedFolder.value.data;
    if (selectedPath === path || selectedPath.startsWith(path + "/")) {
      selectedFolder.value = null;
    }
  }

  await refresh();

  toast.add({
    severity: "info",
    summary: isFolder ? "Folder Deleted" : "File Deleted",
    detail: path,
    life: 3000,
    group: "br",
  });
};

const handleCreateFolder = async (parentPath: string, folderName: string) => {
  const folderPath = `${parentPath}/${folderName}`;

  const response = await $fetch("/api/files", {
    method: "POST",
    body: {
      folderPath,
      isFolder: true,
    },
  });

  await refresh();

  toast.add({
    severity: "success",
    summary: "Folder Created",
    detail: folderName,
    life: 3000,
    group: "br",
  });
};
</script>
