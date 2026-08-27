// Shared file-type → icon mapping for the Media Hub (grid/list cards and the
// lightbox modal both use this so a given file_type always renders the same
// icon everywhere).
import { FileVideo, FileText, FileSpreadsheet, FileImage, File as FileIcon } from 'lucide-react'
import type { MediaFileType } from '@litostudio/ui-cms'

export function FileTypeIcon({ fileType, className }: { fileType: MediaFileType; className?: string }) {
  switch (fileType) {
    case 'image':
      return <FileImage className={className} aria-hidden />
    case 'pdf':
      return <FileText className={className} aria-hidden />
    case 'spreadsheet':
      return <FileSpreadsheet className={className} aria-hidden />
    case 'video':
      return <FileVideo className={className} aria-hidden />
    default:
      return <FileIcon className={className} aria-hidden />
  }
}
