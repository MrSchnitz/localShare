import * as fs from "fs/promises";
import * as path from "path";
import type { TreeNode } from "primevue/treenode";

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: "file" | "folder";
  lastModified: Date;
}

async function scanAndMapFolder(
  folderPath: string,
  parentKey = "0"
): Promise<TreeNode> {
  const base = useRuntimeConfig().public.fileStorage.mount;
  const folderName = path.basename(folderPath);

  const node: TreeNode = {
    key: parentKey,
    label: folderName,
    data: folderPath.replace(base, ""),
    type: "folder",
    icon: "pi pi-fw pi-inbox", // Default folder icon
    children: [],
    selectable: true,
  };

  try {
    const items = await fs.readdir(folderPath, { withFileTypes: true });

    for (const [i, item] of Object.entries(items)) {
      const fullPath = path.join(folderPath, item.name);
      const itemKey = `${parentKey}-${i}`;

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

export default defineEventHandler((event) => {
  const location = useRuntimeConfig().public.fileStorage.mount;

  return scanAndMapFolder(location);
});
