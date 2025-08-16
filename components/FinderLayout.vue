<template>
  <div class="finder-window">
    <!-- Finder Toolbar -->
    <div class="finder-toolbar">
      <div class="toolbar-actions">
        <div class="navigation-group">
          <button
            class="toolbar-btn nav-btn"
            :class="{ disabled: !canGoBack }"
            @click="$emit('navigate-back')"
            :disabled="!canGoBack"
          >
            <i class="pi pi-chevron-left"></i>
          </button>
          <button
            class="toolbar-btn nav-btn"
            :class="{ disabled: !canGoForward }"
            @click="$emit('navigate-forward')"
            :disabled="!canGoForward"
          >
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>

        <div class="view-controls">
          <button
            class="toolbar-btn"
            :class="{ active: viewMode === 'list' }"
            @click="$emit('toggle-view', 'list')"
          >
            <i class="pi pi-list"></i>
          </button>
          <button
            class="toolbar-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="$emit('toggle-view', 'grid')"
          >
            <i class="pi pi-th-large"></i>
          </button>
        </div>

        <div class="toolbar-title">
          <span>{{ currentTitle }}</span>
        </div>

        <div class="toolbar-spacer"></div>

        <div class="action-buttons">
          <button class="toolbar-btn" @click="$emit('new-folder')">
            <i class="pi pi-folder-open"></i>
            <span class="btn-text">New Folder</span>
          </button>
          <button
            class="toolbar-btn"
            @click="triggerFileUpload"
            :disabled="isUploading"
          >
            <i
              :class="isUploading ? 'pi pi-spinner pi-spin' : 'pi pi-upload'"
            ></i>
            <span class="btn-text">{{
              isUploading ? "Uploading..." : "Upload"
            }}</span>
          </button>
          <button ref="menuButton" class="toolbar-btn" @click="toggleMenu">
            <i class="pi pi-ellipsis-h"></i>
          </button>
          <Menu
            ref="menu"
            :model="menuItems"
            :popup="true"
            class="toolbar-menu"
          />
        </div>
      </div>
    </div>

    <!-- Path Bar -->
    <div class="path-bar">
      <template v-for="(segment, index) in pathSegments" :key="index">
        <span class="path-segment" @click="$emit('navigate-to', index)">
          {{ segment }}
        </span>
        <i
          v-if="index < pathSegments.length - 1"
          class="pi pi-chevron-right separator"
        />
      </template>
    </div>

    <!-- Main Content -->
    <div class="finder-content">
      <!-- Sidebar - Only show on larger screens -->
      <div class="finder-sidebar">
        <div class="sidebar-section">
          <h3>Favorites</h3>
          <ul>
            <li @click="$emit('navigate-to', 0)">
              <i class="pi pi-home"></i>
              <span>Home</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Files Area -->
      <div class="finder-files">
        <slot></slot>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      class="hidden"
      @change="handleFileInputChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Menu from "primevue/menu";

const props = defineProps<{
  pathSegments: string[];
  canGoBack: boolean;
  canGoForward: boolean;
  currentTitle: string;
  viewMode: "grid" | "list";
  isUploading?: boolean;
  canSetPath?: boolean;
}>();

const emit = defineEmits<{
  "navigate-back": [];
  "navigate-forward": [];
  "navigate-to": [index: number];
  "upload-files": [files: FileList, targetPath: string];
  "new-folder": [];
  "toggle-view": ["grid" | "list"];
  "adjust-path": [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const menuButton = ref<HTMLButtonElement | null>(null);
const menu = ref<any>(null);

const menuItems = ref([
  {
    ...(props.canSetPath && {
      label: "Set shared folder path",
      icon: "pi pi-folder",
      command: () => emit("adjust-path"),
    }),
  },
]);

const toggleMenu = (event: Event) => {
  if (menu.value) {
    menu.value.toggle(event);
  }
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    emit("upload-files", input.files, "");
  }
};
</script>

<style scoped>
.finder-window {
  background: #2a2a2a;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 100vw;
}

.finder-toolbar {
  background: rgba(48, 48, 48, 0.95);
  backdrop-filter: blur(10px);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: 50px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.navigation-group {
  display: flex;
  align-items: center;
  gap: 1px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 1px;
}

.nav-btn {
  width: 28px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #fff;
  border-radius: 3px;
  cursor: pointer;
  padding: 0;
}

.nav-btn:not(.disabled):hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-btn.disabled {
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
}

.nav-btn i {
  font-size: 12px;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 1px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 1px;
  margin-left: 8px;
}

.toolbar-btn {
  height: 24px;
  padding: 0 8px;
  background: transparent;
  border: none;
  color: #fff;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.toolbar-title {
  font-size: 13px;
  color: #fff;
  margin-left: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-spacer {
  flex: 1;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-buttons .toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  height: 28px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
}

.action-buttons .toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.action-buttons .toolbar-btn:active {
  background: rgba(255, 255, 255, 0.2);
}

.btn-text {
  font-size: 13px;
  font-weight: 500;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .finder-toolbar {
    height: auto;
    padding: 8px;
  }

  .toolbar-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .navigation-group,
  .view-controls {
    transform: scale(1.1);
  }

  .toolbar-btn {
    padding: 0 12px;
    height: 32px;
  }
}

/* Optional: Add subtle transition effects */
.toolbar-btn,
.nav-btn {
  transition: all 0.1s ease;
}

.toolbar-btn:active,
.nav-btn:active {
  transform: scale(0.95);
}

.path-bar {
  background: #2a2a2a;
  padding: 8px 16px;
  overflow-x: auto;
  white-space: nowrap;
  border-bottom: 1px solid #3a3a3a;
}

.path-segment {
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.finder-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.finder-sidebar {
  display: none;
  width: 200px;
  background: #2a2a2a;
  padding: 16px;
  border-right: 1px solid #3a3a3a;
}

@media (min-width: 768px) {
  .finder-sidebar {
    display: block;
  }
}

.finder-files {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.sidebar-section h3 {
  color: #999;
  font-size: 14px;
  margin-bottom: 12px;
}

.sidebar-section ul {
  list-style: none;
  padding: 0;
}

.sidebar-section li {
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.sidebar-section li:hover {
  background: rgba(255, 255, 255, 0.1);
}

.hidden {
  display: none;
}

.toolbar-btn.active {
  background: rgba(255, 255, 255, 0.2);
}

.view-controls .toolbar-btn {
  padding: 0 6px;
  height: 24px;
}

.view-controls .toolbar-btn i {
  font-size: 14px;
}

/* Hide button text on smaller screens */
@media (max-width: 768px) {
  .btn-text {
    display: none;
  }

  .action-buttons .toolbar-btn {
    padding: 0 8px;
    width: 32px;
    height: 32px;
    justify-content: center;
  }
}

/* Optional: Add transition for hover effects */
.toolbar-btn {
  transition: all 0.2s ease;
}

.toolbar-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
