<template>
  <div class="error-container">
    <div class="error-content">
      <i class="pi pi-exclamation-triangle error-icon"></i>
      <h3 class="error-title">Failed to Load Files</h3>
      <p class="error-text">
        There was an error loading the file directory. Please check your path
        settings and try again.
      </p>
      <Button
        label="Retry"
        icon="pi pi-refresh"
        @click="$emit('retry')"
        class="mt-4"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  width: 100%;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  max-width: 400px;
  padding: 24px;
}

.error-icon {
  font-size: 48px;
  color: #ef4444;
}

.error-title {
  color: #fff;
  font-size: 20px;
  margin: 0;
}

.error-text {
  color: #999;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}
</style> 