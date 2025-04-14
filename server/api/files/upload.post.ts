import { defineEventHandler, readMultipartFormData } from 'h3';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event);
    if (!formData) {
      throw new Error('No form data received');
    }

    // Get upload path from form data
    const pathField = formData.find(f => f.name === 'path');
    const uploadPath = pathField ? pathField.data.toString() : '';

    // Set base upload directory
    const baseDir = process.env.UPLOAD_DIR || 'uploads';
    const targetDir = join(baseDir, uploadPath);

    // Ensure upload directory exists
    await mkdir(targetDir, { recursive: true });

    // Process each uploaded file
    const uploadedFiles = [];
    for (const field of formData) {
      if (field.name === 'files' && field.filename) {
        const filePath = join(targetDir, field.filename);
        await writeFile(filePath, field.data);
        uploadedFiles.push(field.filename);
      }
    }

    return {
      success: true,
      files: uploadedFiles
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload files',
      data: error
    });
  }
}); 