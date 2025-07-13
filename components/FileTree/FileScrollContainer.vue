<template>
  <div class="file-scroll-container">
     <!-- Sticky header -->
    <div class="sort-header" v-if="showSortHeader">
      <div
        class="sort-column"
        @click="updateSort('name')"
        :class="{ active: sortBy === 'name' }"
      >
        Name
        <i :class="getSortIcon('name')" />
      </div>
      <div
        class="sort-column"
        @click="updateSort('type')"
        :class="{ active: sortBy === 'type' }"
      >
        Type
        <i :class="getSortIcon('type')" />
      </div>
      <div
        class="sort-column"
        @click="updateSort('modifiedDate')"
        :class="{ active: sortBy === 'modifiedDate' }"
      >
        Modified
        <i :class="getSortIcon('modifiedDate')" />
      </div>
    </div>
     <!-- Scrollable content -->
    <div class="file-content"><slot /></div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  showSortHeader: boolean;
  sortDirection: "asc" | "desc";
  sortBy: "name" | "type" | "modifiedDate";
}>();

const emit = defineEmits<{
  (e: "sort", newSortBy: "name" | "type" | "modifiedDate", newSortDirection: "asc" | "desc"): void;
}>();

const updateSort = (newSortBy: "name" | "type" | "modifiedDate") => {
  if (props.sortBy === newSortBy) {
    const sortDirection = props.sortDirection === "asc" ? "desc" : "asc";
    emit("sort", props.sortBy, sortDirection);
  } else {
    emit("sort", newSortBy, "asc");
  }
};

const getSortIcon = (column: typeof props.sortBy) => {
  if (props.sortBy !== column) return "pi pi-sort";
  return props.sortDirection === "asc" ? "pi pi-sort-up" : "pi pi-sort-down";
};
</script>

<style>
.file-scroll-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.file-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
/* Grid View specific styles */
.grid .file-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  grid-template-rows: min-content;
  gap: 16px;
}

.grid .file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px;
  height: fit-content;
}

/* Update sort header styles */
.sort-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  padding: 16px 12px;
  background: #2a2a2a;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #888;
  /* Add subtle shadow for depth */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sort-column {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.sort-column:hover {
  background: #3a3a3a;
  color: #fff;
}

.sort-column.active {
  color: #fff;
}

.sort-column i {
  font-size: 12px;
}

/* Adjust column widths */
.sort-column:nth-child(1) {
  flex: 2;
}
.sort-column:nth-child(2) {
  flex: 1;
}
.sort-column:nth-child(3) {
  flex: 1;
}

/* Hide sort header in grid view */
.grid .sort-header {
  display: none;
}
</style>
