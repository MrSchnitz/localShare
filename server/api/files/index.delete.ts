import { promises as fs } from "fs";

export default defineEventHandler(async (event) => {
  const { fileName, isFolder } = await readBody(event);
  const base = useRuntimeConfig().public.fileStorage.mount;
  const fullPath = `${base}${fileName}`;

  if (isFolder) {
    await fs.rm(fullPath, { recursive: true, force: true });
  } else {
    await fs.unlink(fullPath);
  }

  return { success: true };
});
