import { promises as fs } from "fs";

export default defineEventHandler(async (event) => {
  const { files, folderPath, isFolder } = await readBody<{
    files: File[];
    folderPath: string;
    isFolder?: boolean;
  }>(event);
  event.node.req.headers["content-length"] = "50gb";

  if (isFolder) {
    const base = useRuntimeConfig().public.fileStorage.mount;
    const fullPath = `${base}${folderPath}`;

    await fs.mkdir(fullPath, { recursive: true });
  } else {
    for (const file of files) {
      const fileName = file.name.split(".")[0] ?? "";
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

      await storeFileLocally(
        file as never, // the file object
        filePath // you can add a name for the file or length of Unique ID that will be automatically generated!
      );
    }
  }

  return { success: true };
});

interface File {
  name: string;
  content: string;
}
