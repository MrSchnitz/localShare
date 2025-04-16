import { createReadStream } from "fs";
import { H3Event, sendStream } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  const base = process.env.UPLOAD_DIR || "uploads";
  const { filename } = getQuery(event);

  const filePath = `${base}${filename}`;

  try {
    const stream = createReadStream(filePath);
    return sendStream(event, stream);
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: "File not found" });
  }
});
