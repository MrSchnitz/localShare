<template>
  <Toast position="bottom-right" group="br" />

  <!-- Loading Screen for Initial Setup -->
  <LoadingScreen v-if="isInitialLoading" text="Loading files..." />

  <!-- Path Setup Screen -->
  <PathSet
    v-else-if="!isPathSet.isSet || isPathSet.isBeingAdjusted"
    :is-local="isPathSet.isLocal"
    :is-being-adjusted="isPathSet.isBeingAdjusted"
    @cancel="isPathSet.isBeingAdjusted = false"
    @refresh-path="refresh"
  />

  <!-- Main App with Data Loading State -->
  <FinderLayout
    v-else
    :path-segments="['Home', ...currentPath]"
    :can-go-back="navigationPast.length > 0"
    :can-go-forward="navigationFuture.length > 0"
    :current-title="currentTitle"
    :view-mode="viewMode"
    :is-uploading="isUploading"
    :can-set-path="isPathSet.isLocal"
    @navigate-back="navigateBack"
    @navigate-forward="navigateForward"
    @navigate-to="navigateToPath"
    @upload-files="handleFileUpload"
    @new-folder="showNewFolderDialog"
    @toggle-view="toggleView"
    @adjust-path="isPathSet.isBeingAdjusted = true"
  >
    <!-- Error State -->
    <ErrorState v-if="status === 'error'" @retry="refresh" />

    <!-- File Tree (only show when data is loaded and not navigating) -->
    <FileTree
      v-else
      :nodes="currentFolderContent"
      :view-mode="viewMode"
      :current-path="currentPath.join('/')"
      @select="onNodeSelect"
      @open="handleOpen"
      @download="handleDownload"
      @delete="handleDelete"
      @move-file="handleMoveFile"
      @upload-files="handleFileUpload"
      @navigate="navigateToPath"
    />

    <Dialog v-model:visible="newFolderDialog" header="Create New Folder">
      <InputText
        ref="folderNameInput"
        v-model="newFolderName"
        placeholder="Folder name"
        autofocus="true"
      />
      <template #footer>
        <Button label="Cancel" @click="newFolderDialog = false" />
        <Button label="Create" @click="createFolder" />
      </template>
    </Dialog>
  </FinderLayout>
</template>

<script setup lang="ts">
import { ref, watch, computed, reactive, onMounted } from "vue";
import type { FileNode } from "~/types/file";
import { useAutoRefresh } from "~/composables/useAutoRefresh";
import { useToast } from "primevue/usetoast";
import axios from "axios";
import PathSet from "./components/PathSet.vue";
import ErrorState from "./components/ErrorState.vue";
import LoadingScreen from "./components/LoadingScreen.vue";
import { ERROR_TYPES } from "./config/types";

const toast = useToast();
const selectedFolder = ref<FileNode | null>(null);
const nodes = ref<FileNode[]>([]);
const currentPath = ref<string[]>([]);
const viewMode = ref<"grid" | "list">("grid");
const newFolderDialog = ref(false);
const newFolderName = ref("");
const isUploading = ref(false);
const isPathSet = ref({
  isSet: false,
  isLocal: false,
  isBeingAdjusted: false,
});
const isInitialLoading = ref(true);

const navigationPast = ref<string[][]>([]);
const navigationFuture = ref<string[][]>([]);

const { data, refresh, status, error } = await useFetch<{
  nodes: FileNode;
  isLocal: boolean;
}>("/api/files");
useAutoRefresh(refresh);

onMounted(() => {
  isInitialLoading.value = false;

  if (error.value?.data.message === ERROR_TYPES.UploadDirectoryNotSet) {
    isPathSet.value.isSet = false;
    isPathSet.value.isLocal = true;
    return;
  }

  if (error.value?.data.message === ERROR_TYPES.SetupError) {
    isPathSet.value.isSet = false;
    isPathSet.value.isLocal = false;
    return;
  }

  if (data.value?.nodes) {
    isPathSet.value.isSet = true;
    nodes.value = data.value.nodes.children ?? [];
    isPathSet.value.isLocal = data.value.isLocal;
  }
});

watch(
  () => data.value,
  (newData) => {
    if (newData) {
      if (!isPathSet.value.isSet) {
        isPathSet.value.isSet = true;
      }

      nodes.value = newData.nodes.children ?? [];
      isPathSet.value.isLocal = newData.isLocal;
    }
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
  const folderPath = `/${parentPath}/${folderName}`;

  try {
    const response = await $fetch("/api/files/create-folder", {
      method: "POST",
      body: {
        folderPath,
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

    navigateToPath(folderPath);
  } catch (error) {
    console.error("Create folder error:", error);
    toast.add({
      severity: "error",
      summary: "Create Folder Failed",
      detail: "Failed to create folder. Please try again.",
    });
  }
};

const currentPathSegments = computed(() => ["Home", ...currentPath.value]);

// Updated currentFolderContent to properly show files in folders
const currentFolderContent = computed(() => {
  if (currentPath.value.length === 0) {
    return nodes.value;
  }

  const currentPathString = `/${currentPath.value.join("/")}`;

  // Find the current folder node
  const currentFolder = findNodeByPath(nodes.value, currentPathString);

  // Return the children of the current folder if it exists
  return currentFolder?.children || [];
});

// Helper function to find a node by its path
const findNodeByPath = (
  nodes: FileNode[],
  path: string
): FileNode | undefined => {
  for (const node of nodes) {
    if (node.data === path) {
      return node;
    }
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return undefined;
};

// Updated navigateToPath to handle paths correctly
const navigateToPath = async (pathOrIndex: number | string) => {
  try {
    navigationPast.value.push([...currentPath.value]);
    navigationFuture.value = [];

    if (typeof pathOrIndex === "number") {
      // When clicking breadcrumb
      currentPath.value = currentPathSegments.value
        .slice(1, pathOrIndex + 1)
        .filter(Boolean);
    } else {
      // When opening a folder
      currentPath.value = pathOrIndex.toString().split("/").filter(Boolean);
    }

    await refresh();
  } catch (error) {
    console.error("Navigate to path error:", error);
  }
};

const navigateBack = async () => {
  if (navigationPast.value.length) {
    try {
      navigationFuture.value.push([...currentPath.value]);
      currentPath.value = navigationPast.value.pop()!;
      await refresh();
    } catch (error) {
      console.error("Navigate back error:", error);
    }
  }
};

const navigateForward = async () => {
  if (navigationFuture.value.length) {
    try {
      navigationPast.value.push([...currentPath.value]);
      currentPath.value = navigationFuture.value.pop()!;
      await refresh();
    } catch (error) {
      console.error("Navigate forward error:", error);
    }
  }
};

// Updated handleOpen to properly handle folder navigation
const handleOpen = (node: FileNode) => {
  if (node.type === "folder") {
    // If it's a folder, navigate to its path
    navigateToPath(node.data);
  } else {
    // If it's a file, download it
    handleDownload(node);
  }
};

const toggleView = (mode: "grid" | "list") => {
  viewMode.value = mode;
  localStorage.setItem("preferredViewMode", mode);
};

const showNewFolderDialog = () => {
  newFolderName.value = "";
  newFolderDialog.value = true;
};

const createFolder = async () => {
  if (newFolderName.value) {
    await handleCreateFolder(currentPath.value.join("/"), newFolderName.value);
    newFolderDialog.value = false;
  }
};

const handleFileUpload = async (files: FileList, targetPath: string = "") => {
  if (!files.length) return;

  isUploading.value = true;
  const formData = new FormData();

  // Add target path to formData
  const uploadPath = targetPath || currentPath.value.join("/");
  formData.append("path", uploadPath);

  // Add all files to formData
  Array.from(files).forEach((file) => {
    formData.append("files", file);
  });

  try {
    await axios.post("/api/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
        );
        // uploadProgress.value = percentCompleted;
      },
    });

    await refresh();

    toast.add({
      severity: "success",
      summary: "Upload Complete",
      detail: `Successfully uploaded ${files.length} file(s)`,
      life: 3000,
      group: "br",
    });
  } catch (error) {
    console.error("Upload error:", error);
    toast.add({
      severity: "error",
      summary: "Upload Failed",
      detail: "Failed to upload files. Please try again.",
      life: 3000,
      group: "br",
    });
  } finally {
    isUploading.value = false;
  }
};

const handleMoveFile = async (sourceNode: FileNode, targetNode: FileNode) => {
  console.log("MOVE", sourceNode, targetNode);
  try {
    await $fetch("/api/files/move", {
      method: "POST",
      body: {
        sourcePath: sourceNode.data,
        targetPath: `${targetNode.data}/${sourceNode.label}`,
        isFolder: sourceNode.type === "folder",
      },
    });

    await refresh();

    toast.add({
      severity: "success",
      summary: "File Moved",
      detail: `Moved ${sourceNode.label} to ${targetNode.label}`,
      life: 3000,
      group: "br",
    });
  } catch (error) {
    console.error("Move error:", error);
    toast.add({
      severity: "error",
      summary: "Move Failed",
      detail: "Failed to move file. Please try again.",
      life: 3000,
      group: "br",
    });
  }
};

// Compute current title from path
const currentTitle = computed(() => {
  if (currentPath.value.length === 0) return "Home";
  return currentPath.value[currentPath.value.length - 1];
});
</script>

<style>
.file-explorer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.path-bar {
  background: #2a2a2a;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.path-segment {
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.separator {
  color: #666;
  font-size: 12px;
}

/* Global dark theme overrides */
:root {
  --surface-ground: #1e1e1e;
  --surface-section: #2a2a2a;
  --surface-card: #2a2a2a;
  --surface-overlay: #2a2a2a;
  --surface-border: #3a3a3a;
  --text-color: #fff;
  --text-color-secondary: #999;
}
</style>
