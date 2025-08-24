<template>
  <div class="notes-container">
    <div class="notes-header">
      <h3>Notes</h3>
      <button class="add-note-btn" @click="addNewNote" title="Add new note">
        <i class="pi pi-plus"></i>
      </button>
    </div>

    <div class="notes-list" v-if="notes.length > 0">
      <div
        v-for="note in notes"
        :key="note.id"
        class="note-item"
        :class="{ active: selectedNote?.id === note.id }"
        @click="selectNote(note)"
      >
        <div class="note-preview">
          <div class="note-title">{{ note.title || "Untitled" }}</div>
          <div class="note-content-preview">{{ getPreview(note.content) }}</div>
          <div class="note-date">{{ formatDate(note.updatedAt) }}</div>
        </div>
        <button
          class="delete-note-btn"
          @click.stop="deleteNote(note.id)"
          title="Delete note"
        >
          <i class="pi pi-trash"></i>
        </button>
      </div>
    </div>

    <div class="empty-notes" v-else>
      <i class="pi pi-file-edit"></i>
      <p>No notes yet</p>
      <button class="add-first-note-btn" @click="addNewNote">
        Create your first note
      </button>
    </div>

    <div class="note-editor" v-if="selectedNote">
      <div class="editor-header">
        <input
          v-model="selectedNote.title"
          class="note-title-input"
          placeholder="Note title..."
          @input="onNoteChange"
        />
        <div class="editor-controls">
          <button
            class="save-btn"
            :class="{ saving: isSaving, unsaved: hasUnsavedChanges }"
            @click="saveNote(true)"
            :disabled="isSaving"
            title="Save note"
          >
            <i :class="isSaving ? 'pi pi-spinner pi-spin' : 'pi pi-save'"></i>
            <span>{{
              isSaving ? "Saving..." : hasUnsavedChanges ? "Save" : "Saved"
            }}</span>
          </button>
          <div class="view-controls">
            <button
              class="editor-toggle-btn"
              :class="{ active: viewMode === 'edit' }"
              @click="viewMode = 'edit'"
              title="Edit mode"
            >
              <i class="pi pi-pencil"></i>
              <span>Edit</span>
            </button>
            <button
              class="editor-toggle-btn"
              :class="{ active: viewMode === 'preview' }"
              @click="viewMode = 'preview'"
              title="Preview mode"
            >
              <i class="pi pi-eye"></i>
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

      <div class="editor-toolbar" v-if="viewMode === 'edit'">
        <button
          @click="insertMarkdown('**', '**')"
          title="Bold"
          class="toolbar-btn"
        >
          <span class="toolbar-text">B</span>
        </button>
        <button
          @click="insertMarkdown('*', '*')"
          title="Italic"
          class="toolbar-btn"
        >
          <span class="toolbar-text italic">I</span>
        </button>
        <button
          @click="insertMarkdown('# ', '')"
          title="Heading"
          class="toolbar-btn"
        >
          <span class="toolbar-text">H</span>
        </button>
        <button
          @click="insertMarkdown('- ', '')"
          title="List"
          class="toolbar-btn"
        >
          <i class="pi pi-list"></i>
        </button>
        <button
          @click="insertMarkdown('`', '`')"
          title="Code"
          class="toolbar-btn"
        >
          <i class="pi pi-code"></i>
        </button>
        <button
          @click="insertMarkdown('[', '](url)')"
          title="Link"
          class="toolbar-btn"
        >
          <i class="pi pi-link"></i>
        </button>
      </div>

      <div class="editor-content">
        <textarea
          v-if="viewMode === 'edit'"
          ref="contentTextarea"
          v-model="selectedNote.content"
          class="note-content-input"
          placeholder="Start writing your note in markdown..."
          @input="onNoteChange"
        ></textarea>

        <div v-else class="markdown-preview" v-html="renderedMarkdown"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { useToast } from "primevue/usetoast";
import MarkdownIt from "markdown-it";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const toast = useToast();
const notes = ref<Note[]>([]);
const selectedNote = ref<Note | null>(null);
const viewMode = ref<"edit" | "preview">("preview");
const contentTextarea = ref<HTMLTextAreaElement | null>(null);
const isSaving = ref(false);
const hasUnsavedChanges = ref(false);
const lastSavedContent = ref("");

// Initialize markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true, // Convert single newlines to <br> tags
});

// Configure links to open in new tab
const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, renderer) {
  return renderer.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function (tokens, idx, options, env, renderer) {
  // Add target="_blank" and rel="noopener noreferrer" to all links
  const aIndex = tokens[idx].attrIndex('target');
  const relIndex = tokens[idx].attrIndex('rel');
  
  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']);
  } else {
    tokens[idx].attrs![aIndex][1] = '_blank';
  }
  
  if (relIndex < 0) {
    tokens[idx].attrPush(['rel', 'noopener noreferrer']);
  } else {
    tokens[idx].attrs![relIndex][1] = 'noopener noreferrer';
  }

  return defaultRender(tokens, idx, options, env, renderer);
};

// Computed property for rendered markdown
const renderedMarkdown = computed(() => {
  if (!selectedNote.value?.content)
    return '<p class="empty-preview">Nothing to preview</p>';
  return md.render(selectedNote.value.content);
});

onMounted(() => {
  loadNotes();
});

const loadNotes = async () => {
  try {
    const response = await $fetch<{ notes: Note[] }>("/api/notes");
    notes.value = response.notes || [];

    // Select the first note if available
    if (notes.value.length > 0) {
      selectedNote.value = notes.value[0];
      lastSavedContent.value =
        notes.value[0].title + "|" + notes.value[0].content;
      hasUnsavedChanges.value = false;
    }
  } catch (error) {
    console.error("Failed to load notes:", error);
    // Fall back to localStorage if API fails
    const stored = localStorage.getItem("localShare-notes");
    if (stored) {
      notes.value = JSON.parse(stored);
      if (notes.value.length > 0) {
        selectedNote.value = notes.value[0];
        lastSavedContent.value =
          notes.value[0].title + "|" + notes.value[0].content;
        hasUnsavedChanges.value = false;
      }
    }
  }
};

const addNewNote = () => {
  const newNote: Note = {
    id: Date.now().toString(),
    title: "",
    content: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  notes.value.unshift(newNote);
  selectedNote.value = newNote;
  viewMode.value = "edit"; // Start in edit mode for new notes
  lastSavedContent.value = "|"; // Empty title and content
  hasUnsavedChanges.value = false;
  saveNotes();
  saveNote();
};

const selectNote = (note: Note) => {
  selectedNote.value = note;
  lastSavedContent.value = note.title + "|" + note.content;
  hasUnsavedChanges.value = false;
};

const deleteNote = async (noteId: string) => {
  if (confirm("Are you sure you want to delete this note?")) {
    try {
      await $fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      notes.value = notes.value.filter((note) => note.id !== noteId);

      if (selectedNote.value?.id === noteId) {
        selectedNote.value = notes.value.length > 0 ? notes.value[0] : null;
      }

      saveNotes();

      toast.add({
        severity: "info",
        summary: "Note deleted",
        life: 3000,
        group: "br",
      });
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.add({
        severity: "error",
        summary: "Failed to delete note",
        life: 3000,
        group: "br",
      });
    }
  }
};

const saveNote = async (showToast = false) => {
  if (!selectedNote.value) return;

  isSaving.value = true;
  selectedNote.value.updatedAt = new Date();

  try {
    await $fetch("/api/notes", {
      method: "POST",
      body: selectedNote.value,
    });

    saveNotes();
    lastSavedContent.value =
      selectedNote.value.title + "|" + selectedNote.value.content;
    hasUnsavedChanges.value = false;

    if (showToast) {
      toast.add({
        severity: "success",
        summary: "Note saved",
        life: 2000,
        group: "br",
      });
    }
  } catch (error) {
    console.error("Failed to save note:", error);
    // Still save locally even if API fails
    saveNotes();
    lastSavedContent.value =
      selectedNote.value.title + "|" + selectedNote.value.content;
    hasUnsavedChanges.value = false;

    if (showToast) {
      toast.add({
        severity: "warn",
        summary: "Saved locally only",
        detail: "Could not sync to server",
        life: 3000,
        group: "br",
      });
    }
  } finally {
    isSaving.value = false;
  }
};

const saveNotes = () => {
  // Save to localStorage as backup
  localStorage.setItem("localShare-notes", JSON.stringify(notes.value));
};

const getPreview = (content: string) => {
  if (!content) return "No content";
  return content.length > 50 ? content.substring(0, 50) + "..." : content;
};

const formatDate = (date: Date) => {
  const now = new Date();
  const noteDate = new Date(date);
  const diffTime = Math.abs(now.getTime() - noteDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return noteDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return noteDate.toLocaleDateString();
  }
};

const insertMarkdown = (before: string, after: string) => {
  if (!contentTextarea.value) return;

  const textarea = contentTextarea.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);

  const newText =
    text.substring(0, start) +
    before +
    selectedText +
    after +
    text.substring(end);

  selectedNote.value!.content = newText;
  onNoteChange();

  // Set cursor position
  nextTick(() => {
    const newCursorPos =
      start + before.length + selectedText.length + after.length;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  });
};

const onNoteChange = () => {
  if (!selectedNote.value) return;

  const currentContent =
    selectedNote.value.title + "|" + selectedNote.value.content;
  hasUnsavedChanges.value = currentContent !== lastSavedContent.value;

  // Auto-save after 1 second of inactivity
  if (autoSaveTimeout.value !== null) {
    clearTimeout(autoSaveTimeout.value as any);
  }
  autoSaveTimeout.value = setTimeout(() => {
    saveNote();
  }, 1000) as any;
};

// Add auto-save timeout
const autoSaveTimeout = ref<any>(null);
</script>

<style scoped>
.notes-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #2a2a2a;
}

/* Mobile-first responsive layout */
@media (max-width: 768px) {
  .notes-container {
    padding: 0;
  }
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #3a3a3a;
}

@media (max-width: 768px) {
  .notes-header {
    padding: 12px 16px;
    position: sticky;
    top: 0;
    background: #2a2a2a;
    z-index: 10;
  }
}

.notes-header h3 {
  color: #fff;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.add-note-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

@media (max-width: 768px) {
  .add-note-btn {
    width: 40px;
    height: 40px;
    min-width: 40px;
  }
}

.add-note-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.notes-list {
  flex: 1;
  overflow-y: auto;
  border-bottom: 1px solid #3a3a3a;
  max-height: 300px;
}

@media (max-width: 768px) {
  .notes-list {
    max-height: 200px;
  }
}

.note-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.2s;
  border-left: 3px solid transparent;
}

@media (max-width: 768px) {
  .note-item {
    padding: 16px;
    min-height: 60px;
  }
}

.note-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.note-item.active {
  background: rgba(0, 122, 255, 0.1);
  border-left: 3px solid #007aff;
}

.note-preview {
  flex: 1;
  min-width: 0;
}

.note-title {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-content-preview {
  color: #999;
  font-size: 12px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-date {
  color: #666;
  font-size: 11px;
}

.delete-note-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s;
}

@media (max-width: 768px) {
  .delete-note-btn {
    opacity: 1; /* Always visible on mobile */
    padding: 8px;
    min-width: 40px;
    min-height: 40px;
  }
}

.note-item:hover .delete-note-btn {
  opacity: 1;
}

.delete-note-btn:hover {
  color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
}

.empty-notes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  text-align: center;
  color: #666;
}

.empty-notes i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-notes p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.add-first-note-btn {
  background: #007aff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.add-first-note-btn:hover {
  background: #0056cc;
}

.note-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

@media (max-width: 768px) {
  .note-editor {
    padding: 12px 16px 16px 16px;
    min-height: 0;
  }
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}

.note-title-input {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  padding: 0 0 12px 0;
  border-bottom: 1px solid #3a3a3a;
  outline: none;
  flex: 1;
}

@media (max-width: 768px) {
  .note-title-input {
    font-size: 20px;
    padding: 0 0 16px 0;
  }
}

.note-title-input::placeholder {
  color: #666;
}

.editor-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .editor-controls {
    justify-content: space-between;
    gap: 12px;
  }
}

.save-btn {
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid rgba(40, 167, 69, 0.3);
  color: #28a745;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

@media (max-width: 768px) {
  .save-btn {
    padding: 8px 16px;
    font-size: 14px;
    min-height: 40px;
  }
}

.save-btn:hover:not(:disabled) {
  background: rgba(40, 167, 69, 0.15);
  border-color: rgba(40, 167, 69, 0.4);
}

.save-btn.unsaved {
  background: rgba(255, 193, 7, 0.1);
  border-color: rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

.save-btn.unsaved:hover {
  background: rgba(255, 193, 7, 0.15);
  border-color: rgba(255, 193, 7, 0.4);
}

.save-btn.saving {
  background: rgba(108, 117, 125, 0.1);
  border-color: rgba(108, 117, 125, 0.3);
  color: #6c757d;
  cursor: not-allowed;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.view-controls {
  display: flex;
  gap: 1px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 1px;
}

.editor-toggle-btn {
  background: transparent;
  border: none;
  color: #999;
  padding: 6px 12px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  transition: all 0.2s;
}

@media (max-width: 768px) {
  .editor-toggle-btn {
    padding: 8px 16px;
    font-size: 14px;
    min-height: 40px;
  }
}

.editor-toggle-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.editor-toggle-btn.active {
  color: #fff;
  background: rgba(0, 122, 255, 0.2);
  border: 1px solid rgba(0, 122, 255, 0.3);
}

.editor-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .editor-toolbar {
    gap: 8px;
    padding: 12px 0;
    flex-wrap: wrap;
    justify-content: center;
  }
}

.editor-toolbar .toolbar-btn {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #999;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

@media (max-width: 768px) {
  .editor-toolbar .toolbar-btn {
    width: 44px;
    height: 44px;
    border-radius: 8px;
  }
}

.editor-toolbar .toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.toolbar-text {
  font-weight: 700;
  font-size: 14px;
  font-family: "SF Pro Display", -apple-system, sans-serif;
}

.toolbar-text.italic {
  font-style: italic;
  font-family: "SF Pro Display", -apple-system, serif;
}

.toolbar-text.monospace {
  font-family: "SF Mono", "Monaco", "Menlo", "Consolas", monospace;
  font-size: 12px;
  font-weight: 600;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.note-content-input {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  flex: 1;
  font-family: "SF Mono", "Monaco", "Menlo", "Consolas", monospace;
  padding: 0;
}

@media (max-width: 768px) {
  .note-content-input {
    font-size: 16px; /* Prevent zoom on iOS */
    line-height: 1.4;
    padding: 8px 0;
    min-height: 200px;
  }
}

.note-content-input::placeholder {
  color: #666;
}

.markdown-preview {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  color: #fff;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .markdown-preview {
    font-size: 15px;
    line-height: 1.5;
    padding: 8px 0;
  }
}

.markdown-preview :deep(h1) {
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #3a3a3a;
}

.markdown-preview :deep(h2) {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 24px 0 12px 0;
}

.markdown-preview :deep(h3) {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 10px 0;
}

.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  color: #fff;
  font-weight: 600;
  margin: 16px 0 8px 0;
}

.markdown-preview :deep(p) {
  margin: 0 0 16px 0;
  color: #fff;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 0 0 16px 20px;
  color: #fff;
}

.markdown-preview :deep(li) {
  margin-bottom: 4px;
}

.markdown-preview :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  color: #ff6b6b;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "SF Mono", "Monaco", "Menlo", "Consolas", monospace;
  font-size: 13px;
}

.markdown-preview :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0 0 16px 0;
  border: 1px solid #3a3a3a;
}

.markdown-preview :deep(pre code) {
  background: none;
  color: inherit;
  padding: 0;
  font-size: 13px;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid #007aff;
  background: rgba(0, 122, 255, 0.1);
  margin: 0 0 16px 0;
  padding: 16px 20px;
  border-radius: 0 8px 8px 0;
  color: #ccc;
  font-style: italic;
}

.markdown-preview :deep(a) {
  color: #007aff;
  text-decoration: none;
  border-bottom: 1px solid rgba(0, 122, 255, 0.3);
  transition: all 0.2s;
}

.markdown-preview :deep(a:hover) {
  text-decoration: none;
  border-bottom-color: #007aff;
  background: rgba(0, 122, 255, 0.1);
  padding: 1px 2px;
  border-radius: 2px;
}

.markdown-preview :deep(a:after) {
  content: " ↗";
  font-size: 0.8em;
  opacity: 0.6;
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0 0 16px 0;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid #3a3a3a;
  padding: 8px 12px;
  text-align: left;
}

.markdown-preview :deep(th) {
  background: rgba(255, 255, 255, 0.1);
  font-weight: 600;
}

.markdown-preview :deep(hr) {
  border: none;
  border-top: 1px solid #3a3a3a;
  margin: 24px 0;
}

.markdown-preview :deep(strong) {
  font-weight: 700;
  color: #fff;
}

.markdown-preview :deep(em) {
  font-style: italic;
  color: #ccc;
}

.markdown-preview .empty-preview {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 40px 20px;
}

/* Custom scrollbar */
.notes-list::-webkit-scrollbar {
  width: 6px;
}

.notes-list::-webkit-scrollbar-track {
  background: transparent;
}

.notes-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.notes-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
