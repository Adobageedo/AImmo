import { STORAGE } from "@/lib/constants";

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const isAllowedMimeType = (mimeType: string): boolean => {
  return STORAGE.ALLOWED_MIME_TYPES.includes(mimeType as typeof STORAGE.ALLOWED_MIME_TYPES[number]);
};

export const isFileSizeValid = (sizeInBytes: number): boolean => {
  const maxSizeInBytes = STORAGE.MAX_FILE_SIZE_MB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
};

export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

export const getFileNameWithoutExtension = (filename: string): string => {
  return filename.replace(/\.[^/.]+$/, "");
};

export const sanitizeFileName = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9.\-_]/gi, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

export const generateUniqueFileName = (originalName: string): string => {
  const extension = getFileExtension(originalName);
  const nameWithoutExt = getFileNameWithoutExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return sanitizeFileName(`${nameWithoutExt}_${timestamp}_${random}.${extension}`);
};

export const getMimeTypeIcon = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "📷";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  if (mimeType.includes("text")) return "📃";
  return "📎";
};
