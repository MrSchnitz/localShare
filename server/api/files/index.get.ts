import * as fs from "fs/promises";
import * as path from "path";
import type { TreeNode } from "primevue/treenode";
import { checkLocalByIP } from "~/helpers/checkLocal";
import { ERROR_TYPES } from "~/config/types";

const IGNORED_FILES = [".DS_Store", "__MACOSX"];

async function scanAndMapFolder(
  folderPath: string,
  parentKey = "0"
): Promise<TreeNode> {
  const base = process.env.UPLOAD_DIR || "";
  const folderName = path.basename(folderPath);

  const node: TreeNode = {
    key: parentKey,
    label: folderName,
    data: folderPath.replace(base, ""),
    type: "folder",
    icon: "pi pi-fw pi-folder", // Default folder icon
    children: [],
    selectable: true,
  };

  try {
    const items = await fs.readdir(folderPath, { withFileTypes: true });

    for (const [i, item] of Object.entries(items)) {
      const fullPath = path.join(folderPath, item.name);
      const itemKey = `${parentKey}-${i}`;

      // Skip ignored files and hidden files
      if (IGNORED_FILES.includes(item.name)) {
        continue;
      }

      if (item.isDirectory()) {
        // Recursively process subdirectories
        const subFolder = await scanAndMapFolder(fullPath, itemKey);
        node.children?.push(subFolder);
      } else {
        // Map files
        node.children?.push({
          key: itemKey,
          label: item.name,
          data: fullPath.replace(base, ""),
          type: "file",
          icon: "pi pi-fw pi-file", // File icon
          leaf: true, // Indicates it's a file and has no children
        });
      }
    }

    // If the folder has no children, remove the empty array
    if (node.children?.length === 0) {
      node.leaf = true; // Mark as a leaf node
      delete node.children;
    }
  } catch (error) {
    console.error("Error reading directory:", error);
  }

  return node;
}

export default defineEventHandler(async (event) => {
  const location = process.env.UPLOAD_DIR;
  // Check if the request is coming from a local source
  const hostname = getHeader(event, "host") || "";
  const isLocal = checkLocalByIP(hostname);

  if (!location) {
    if (!isLocal) {
      throw createError({
        statusCode: 403,
        message: ERROR_TYPES.SetupError,
        statusMessage: "Shared folder is not set",
      });
    }

    throw createError({
      statusCode: 400,
      message: ERROR_TYPES.UploadDirectoryNotSet,
      statusMessage: "Upload directory not set",
    });
  }

  const nodes = await scanAndMapFolder(location);

  return { nodes, isLocal };
});
