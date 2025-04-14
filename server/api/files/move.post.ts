import { defineEventHandler, readBody } from 'h3';
import { rename } from 'fs/promises';
import { join } from 'path';

export default defineEventHandler(async (event) => {
  const { sourcePath, targetPath } = await readBody(event);
  
  try {
    const baseDir = process.env.UPLOAD_DIR || 'uploads';
    const sourceFullPath = join(baseDir, sourcePath);
    const targetFullPath = join(baseDir, targetPath);
    
    await rename(sourceFullPath, targetFullPath);
    
    return { success: true };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to move file',
      data: error
    });
  }
}); 