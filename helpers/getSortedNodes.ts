import type { SortBy, SortDirection } from "~/config/types";
import type { FileNode } from "~/types/file";

export function getSortedNodes(
  nodes: FileNode[],
  sortBy: SortBy,
  sortDirection: SortDirection
) {
  const sorted = [...nodes].sort((a, b) => {
    if (sortBy === "name") {
      return sortDirection === "asc"
        ? a.label.localeCompare(b.label)
        : b.label.localeCompare(a.label);
    }
    if (sortBy === "type") {
      // Add null checks and provide default values
      const typeA = a.type || "";
      const typeB = b.type || "";
      if (typeA === typeB) {
        return a.label.localeCompare(b.label);
      }
      return sortDirection === "asc"
        ? typeA.localeCompare(typeB)
        : typeB.localeCompare(typeA);
    }
    if (sortBy === "modifiedDate") {
      const dateA = a.modifiedDate ? new Date(a.modifiedDate).getTime() : 0;
      const dateB = b.modifiedDate ? new Date(b.modifiedDate).getTime() : 0;
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }
    return 0;
  });

  // Always keep folders at the top
  return sorted.sort((a, b) => {
    const typeA = a.type || "";
    const typeB = b.type || "";
    if (typeA === "folder" && typeB !== "folder") return -1;
    if (typeA !== "folder" && typeB === "folder") return 1;
    return 0;
  });
}
