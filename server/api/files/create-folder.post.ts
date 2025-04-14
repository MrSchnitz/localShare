import { promises as fs } from "fs";

export default defineEventHandler(async (event) => {
  const { folderPath } = await readBody<{
    folderPath: string;
  }>(event);
  const base = process.env.UPLOAD_PATH || "uploads";
  const fullPath = `${base}${folderPath}`;

    await fs.mkdir(fullPath, { recursive: true });

  return { success: true };
});
