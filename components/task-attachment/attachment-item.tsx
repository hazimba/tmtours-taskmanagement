"use client";

import { TaskAttachment } from "@/types";
import { FileText, FileImage, FileSpreadsheet, File, ExternalLink, X } from "lucide-react";

function AttachmentIcon({ type }: { type: string }) {
  if (type === "IMAGE") return <FileImage className="h-4 w-4 text-blue-500" />;
  if (type === "PDF") return <FileText className="h-4 w-4 text-red-500" />;
  if (type === "EXCEL") return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
  if (type === "DOC") return <FileText className="h-4 w-4 text-blue-400" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function formatUploadedAt(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

interface AttachmentItemProps {
  attachment: TaskAttachment;
  isAssignee: boolean;
  onRemove: () => void;
}

export function AttachmentItem({ attachment, isAssignee, onRemove }: AttachmentItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors group">
      <AttachmentIcon type={attachment.type} />
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 flex items-center gap-2">
        <div className="min-w-0">
          <p className="text-sm truncate">{attachment.name ?? attachment.url}</p>
          {attachment.uploaded_at && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatUploadedAt(attachment.uploaded_at)}</p>
          )}
        </div>
        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase shrink-0">
        {attachment.type}
      </span>
      {isAssignee && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
