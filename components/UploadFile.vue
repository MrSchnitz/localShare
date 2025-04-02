<template>
  <div
    class="w-full max-w-md px-4 py-8 border-2 border-dashed rounded-2xl flex flex-col justify-center items-center transition-colors"
    :class="{ 'bg-gray-900': isDragging }"
    @drop.prevent="handleDrop"
    @dragover.prevent="isDragging = true"
    @dragenter.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @dragend.prevent="isDragging = false"
  >
    <h1 v-if="selectedFolder" class="text-lg mb-2">
      Selected folder: <strong>{{ selectedFolder.label }}</strong>
    </h1>
    <h2 class="text-3xl">
      {{ isDragging ? "Release to upload" : "Drop files here" }}
    </h2>
    <p class="my-4">or</p>
    <div>
      <input
        type="file"
        className="file-input file-input-bordered w-full"
        @input="(event) => handleFileInput(event)"
        ref="fileInput"
      />
    </div>
    <div
      v-if="uploadProgress > 0"
      class="w-full flex justify-center items-center gap-x-2 mt-4"
    >
      <ProgressBar :value="uploadProgress" class="w-full flex-1" />
      <Button
        severity="danger"
        size="small"
        rounded
        class="!w-6 !h-6"
        icon="pi pi-times"
        @click="cancelUpload"
      />
    </div>
  </div>
  <Button class="btn w-full max-w-md" @click="submit" :disabled="isUploading">
    {{ isUploading ? "Uploading..." : "Submit" }}
  </Button>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import axios from "axios";
import type { FileNode } from "~/types/file";

const toast = useToast();
const uploadProgress = ref(0);
const isUploading = ref(false);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const cancelTokenSource = ref<any>(null);

const { selectedFolder, refresh } = defineProps<{
  selectedFolder: FileNode | null;
  refresh: () => Promise<void>;
}>();

const { handleFileInput: handleFile, files } = useFileStorage({
  clearOldFiles: true,
});

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false;
  const droppedFiles = event.dataTransfer?.files ?? [];

  if (droppedFiles.length > 0) {
    if (fileInput.value) {
      const dataTransfer = new DataTransfer();
      for (const file of droppedFiles) {
        dataTransfer.items.add(file);
      }
      fileInput.value.files = dataTransfer.files;
      handleFileInput({ target: fileInput.value } as never);
    }
  }
};

const cancelUpload = () => {
  if (cancelTokenSource.value) {
    cancelTokenSource.value.cancel("Upload cancelled by user");
    cancelTokenSource.value = null;
    isUploading.value = false;
    uploadProgress.value = 0;

    toast.add({
      severity: "info",
      summary: "Upload Cancelled",
      detail: "File upload was cancelled",
      life: 3000,
      group: "br",
    });
  }
};

const handleFileInput = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50GB in bytes

  if (input.files) {
    for (const file of input.files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.add({
          severity: "error",
          summary: "File Too Large",
          detail: `File "${file.name}" exceeds the maximum size limit of 50GB`,
          life: 3000,
          group: "br",
        });
        input.value = ''; // Clear the input
        return;
      }
    }
    // Proceed with existing file handling
    handleFile(event);
  }
};

const submit = async () => {
  isUploading.value = true;
  uploadProgress.value = 0;

  try {
    if (!files.value || !Array.isArray(files.value) || files.value.length === 0) {
      throw new Error("No files selected");
    }

    const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50GB in bytes
    for (const file of files.value) {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File "${file.name}" exceeds the maximum size limit of 50GB`);
      }
    }

    const folderPath = selectedFolder?.data || "";
    cancelTokenSource.value = axios.CancelToken.source();

    await axios.post(
      "/api/files",
      {
        files: files.value,
        folderPath: folderPath,
      },
      {
        cancelToken: cancelTokenSource.value.token,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
          );
          uploadProgress.value = percentCompleted;
        },
      }
    );

    await refresh();

    if (fileInput.value) {
      fileInput.value.value = "";
    }

    toast.add({
      severity: "success",
      summary: "Files Uploaded",
      detail: "Your files have been uploaded successfully",
      life: 3000,
    });
  } catch (error: any) {
    if (axios.isCancel(error)) {
      return; // Cancelled upload is handled in cancelUpload()
    }
    toast.add({
      severity: "error",
      summary: "Upload Failed",
      detail: error.message || "There was an error uploading your files",
      life: 3000,
      group: "br",
    });
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
    cancelTokenSource.value = null;
  }
};
</script>
