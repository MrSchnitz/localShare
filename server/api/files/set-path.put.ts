export default defineEventHandler(async (event) => {
  const { path } = await readBody<{
    path: string;
  }>(event);

  process.env.UPLOAD_DIR = path;

  return { success: true };
});