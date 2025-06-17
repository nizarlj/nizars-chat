import { type Model } from './models';
import { File as FileIcon, Image, FileText, Code, Database, Archive, Music, Video, FileSpreadsheet } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

export function getFileTypeIcon(fileName: string, contentType: string): LucideIcon {
  if (contentType.startsWith('image/')) {
    return Image;
  }
  
  if (contentType.startsWith('audio/')) {
    return Music;
  }
  
  if (contentType.startsWith('video/')) {
    return Video;
  }
  
  if (contentType === 'application/pdf') {
    return FileText;
  }
  
  if (contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('csv')) {
    return FileSpreadsheet;
  }
  
  if (contentType.includes('zip') || contentType.includes('archive') || contentType.includes('compressed')) {
    return Archive;
  }
  
  if (contentType.includes('database') || contentType.includes('sql')) {
    return Database;
  }
  
  const extension = fileName.toLowerCase().split('.').pop();
  switch (extension) {
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'h':
    case 'php':
    case 'rb':
    case 'go':
    case 'rs':
    case 'swift':
    case 'kt':
    case 'scala':
    case 'sh':
    case 'html':
    case 'css':
    case 'json':
    case 'xml':
    case 'yml':
    case 'yaml':
      return Code;
    
    case 'txt':
    case 'md':
    case 'pdf':
      return FileText;
    
    case 'csv':
    case 'xlsx':
    case 'xls':
      return FileSpreadsheet;
    
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return Archive;
    
    case 'sql':
    case 'db':
    case 'sqlite':
      return Database;
    
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'bmp':
      return Image;
    
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
      return Music;
    
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'webm':
      return Video;
    
    default:
      return FileIcon;
  }
}

export function getAcceptedFileTypes(model?: Model): string[] {
  if (!model) {
    return [
      'text/*',
      'image/*',
      'application/pdf'
    ];
  }

  const acceptedTypes: string[] = [
    // Always accept text files
    'text/*'
  ];

  if (model.capabilities.vision) acceptedTypes.push('image/*');
  if (model.capabilities.pdfUpload) acceptedTypes.push('application/pdf');

  return acceptedTypes;
}

export function getFileTypesTooltipContent(model?: Model): { title: string; description: string } {
  if (!model) {
    return {
      title: "Add an attachment",
      description: "Accepts: Text, Images, PDFs"
    };
  }

  const supportedTypes: string[] = ["Text files"];
  
  if (model.capabilities.vision) {
    supportedTypes.push("Images");
  }
  
  if (model.capabilities.pdfUpload) {
    supportedTypes.push("PDFs");
  }

  return {
    title: "Add an attachment",
    description: `Accepts: ${supportedTypes.join(", ")}`
  };
}

export function getSupportedTypesDescription(model?: Model): string {
  if (!model) {
    return "Supports: Text, Images, PDFs";
  }

  const supportedTypes: string[] = ["Text files"];
  
  if (model.capabilities.vision) {
    supportedTypes.push("Images");
  }
  
  if (model.capabilities.pdfUpload) {
    supportedTypes.push("PDFs");
  }

  return `Supports: ${supportedTypes.join(", ")}`;
} 

export function formatFileSize(bytes?: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("text/")) return "Text";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar")) return "Archive";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return "Spreadsheet";
  if (mimeType.includes("presentation")) return "Presentation";
  if (mimeType.includes("font")) return "Font";
  return "Other";
} 