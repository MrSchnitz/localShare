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
    const body = await readBody(event)
    const { id, title, content, createdAt, updatedAt } = body
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Note ID is required'
      })
    }
    
    const notes = await loadNotes()
    const existingIndex = notes.findIndex(note => note.id === id)
    
    const note: Note = {
      id,
      title: title || '',
      content: content || '',
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: new Date()
    }
    
    if (existingIndex >= 0) {
      // Update existing note
      notes[existingIndex] = note
    } else {
      // Add new note
      notes.push(note)
    }
    
    await saveNotes(notes)
    
    return {
      success: true,
      note
    }
  } catch (error) {
    console.error('Error saving note:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save note'
    })
  }
})
