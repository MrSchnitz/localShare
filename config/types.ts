export type SortBy = "name" | "type" | "modifiedDate";
export type SortDirection = "asc" | "desc";

export const ERROR_TYPES = {
  UploadDirectoryNotSet: "UploadDirectoryNotSet",
  SetupError: "SetupError",
} as const;