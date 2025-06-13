"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Loader2, AlertTriangle } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfPreviewProps {
  url: string;
}

export default function PdfPreview({ url }: PdfPreviewProps) {
  return (
    <Document
      file={url}
      loading={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      }
      error={
        <div className="flex items-center justify-center h-full text-destructive">
          <AlertTriangle className="w-6 h-6 mr-2" /> Failed to load PDF
        </div>
      }
      className="max-h-full max-w-full overflow-hidden"
    >
      <Page pageNumber={1} renderTextLayer={false} />
    </Document>
  );
} 