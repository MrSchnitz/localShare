import { promises as fs } from 'fs'
import path from 'path'

interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

const NOTES_FILE = path.join(process.cwd(), 'data', 'notes.json')

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(NOTES_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Load notes from file
async function loadNotes(): Promise<Note[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(NOTES_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Save notes to file
async function saveNotes(notes: Note[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2))
}

export default defineEventHandler(async (event) => {
  try {
    const noteId = getRouterParam(event, 'id')
    
    if (!noteId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Note ID is required'
      })
    }
    
    const notes = await loadNotes()
    const noteIndex = notes.findIndex(note => note.id === noteId)
    
    if (noteIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Note not found'
      })
    }
    
    const deletedNote = notes.splice(noteIndex, 1)[0]
    await saveNotes(notes)
    
    return {
      success: true,
      deletedNote
    }
  } catch (error) {
    console.error('Error deleting note:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete note'
    })
  }
})
