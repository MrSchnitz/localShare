<template>
  <div class="grid place-content-center w-full h-screen">
    <div v-if="!isLocal">
      <h2 class="text-xl font-semibold text-white mb-4 text-center">
        Shared folder is not set
      </h2>
      <p class="text-white mb-4 text-center">
        Please ask the admin to set the shared folder.
      </p>
    </div>
    <div
      v-else
      class="flex flex-col justify-center w-[350px] rounded-md bg-gray-800 p-6"
    >
      <h2 class="text-xl font-semibold text-white mb-4 text-center">
        Set Directory Path
      </h2>

      <label for="path" class="text-white mb-2">Directory Path</label>

      <div class="flex gap-2 mb-4">
        <InputText
          id="path"
          type="text"
          v-model="path"
          placeholder="Enter the full path to your shared directory"
          :disabled="isLoading"
          class="flex-1"
          @keyup.enter="setPath"
        />
      </div>

      <div class="text-xs text-gray-400 mb-4">
        💡 Obtain the full path to your shared directory using
        <code class="text-gray-300">pwd</code> in Mac/Linux or
        <code class="text-gray-300">cd</code> in Windows<br />
        Example: <br />
        <code class="text-gray-300">/Users/john/Documents/SharedFolder</code> or
        <code class="text-gray-300">C:\Users\john\Documents\SharedFolder</code>
      </div>

      <Button
        class="w-full"
        :label="isLoading ? 'Setting Path...' : 'Set Path'"
        @click="setPath"
        :disabled="!path.trim() || isLoading"
        :loading="isLoading"
      />

      <!-- Cancel button for when path was previously set -->
      <div v-if="isBeingAdjusted" class="flex items-center mt-4">
        <Button
          @click="emit('cancel')"
          class="w-full p-button-sm"
          label="Cancel"
          severity="secondary"
        />
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const props = defineProps<{
  isLocal: boolean;
  isBeingAdjusted: boolean;
}>();

const emit = defineEmits<{ refreshPath: []; cancel: [] }>();

const path = ref("");
const isLoading = ref(false);

const setPath = async () => {
  const newPath = path.value.trim();
  if (newPath) {
    isLoading.value = true;

    try {
      await $fetch("/api/files/set-path", {
        method: "PUT",
        body: {
          path: newPath,
        },
      });
      // Add a small delay to show the loading state
      await new Promise((resolve) => setTimeout(resolve, 500));

      emit("refreshPath");
      emit("cancel");
    } catch (error) {
      console.error("Error setting path:", error);
      // You could add toast notification here if needed
    } finally {
      isLoading.value = false;
    }
  }
};
</script>

<style scoped>
/* Add some custom styling for better appearance */
.p-inputtext:disabled {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.6) !important;
}

.p-button:disabled {
  opacity: 0.6 !important;
}
</style>
