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
    // If file doesn't exist or is corrupted, return empty array
    return []
  }
}

export default defineEventHandler(async (event) => {
  try {
    const notes = await loadNotes()
    
    return {
      success: true,
      notes: notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }
  } catch (error) {
    console.error('Error loading notes:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load notes'
    })
  }
})
