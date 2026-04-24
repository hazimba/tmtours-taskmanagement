"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TaskAttachment } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Paperclip,
  Plus,
  Upload,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AttachmentItem } from "./attachment-item";

function getAttachmentType(
  file: File
): "IMAGE" | "PDF" | "DOC" | "EXCEL" | "OTHER" {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type === "application/pdf") return "PDF";
  if (
    file.type.includes("word") ||
    file.name.endsWith(".doc") ||
    file.name.endsWith(".docx")
  )
    return "DOC";
  if (
    file.type.includes("excel") ||
    file.type.includes("spreadsheet") ||
    file.name.endsWith(".xls") ||
    file.name.endsWith(".xlsx")
  )
    return "EXCEL";
  return "OTHER";
}

interface TaskAttachmentModalProps {
  taskId: string;
  currentUserId: string | null;
  assignedTo?: string | null;
  initialAttachments: TaskAttachment[];
}

export function TaskAttachmentModal({
  taskId,
  currentUserId,
  assignedTo,
  initialAttachments,
}: TaskAttachmentModalProps) {
  const [open, setOpen] = useState(false);
  const [attachments, setAttachments] =
    useState<TaskAttachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"file" | "link">("file");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [linkType, setLinkType] = useState<
    "IMAGE" | "PDF" | "DOC" | "EXCEL" | "OTHER"
  >("OTHER");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAssignee = currentUserId === assignedTo;

  async function saveAttachments(updated: TaskAttachment[]) {
    const { error } = await supabase
      .from("tasks")
      .update({ attachments: updated, updated_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) {
      toast.error("Failed to save attachment.");
      return false;
    }
    return true;
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: TaskAttachment[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${taskId}/${uuidv4()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("task-files")
        .upload(path, file, { upsert: false });
      if (uploadError) {
        toast.error(`Failed to upload "${file.name}"`);
        continue;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("task-files").getPublicUrl(path);
      uploaded.push({
        url: publicUrl,
        type: getAttachmentType(file),
        name: file.name,
        uploaded_at: new Date().toISOString(),
      });
    }
    if (uploaded.length > 0) {
      const updated = [...attachments, ...uploaded];
      const ok = await saveAttachments(updated);
      if (ok) {
        setAttachments(updated);
        toast.success(
          `${uploaded.length} file${uploaded.length > 1 ? "s" : ""} uploaded`
        );
        setOpen(false);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAddLink() {
    const url = linkUrl.trim();
    if (!url) {
      toast.error("Please enter a URL.");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL (include https://).");
      return;
    }
    const newAtt: TaskAttachment = {
      url,
      type: linkType,
      name: linkName.trim() || url,
      uploaded_at: new Date().toISOString(),
    };
    const updated = [...attachments, newAtt];
    const ok = await saveAttachments(updated);
    if (ok) {
      setAttachments(updated);
      setLinkUrl("");
      setLinkName("");
      setLinkType("OTHER");
      toast.success("Link added.");
      setOpen(false);
    }
  }

  async function handleRemove(idx: number) {
    const updated = attachments.filter((_, i) => i !== idx);
    const ok = await saveAttachments(updated);
    if (ok) {
      setAttachments(updated);
      toast.success("Attachment removed.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Paperclip className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wider">
            Attachments
            {attachments.length > 0 ? ` (${attachments.length})` : ""}
          </p>
        </div>
        {isAssignee && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Attachment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Attachment</DialogTitle>
              </DialogHeader>
              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg mt-1">
                {(["file", "link"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors",
                      activeTab === tab
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab === "file" ? (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        Upload File
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-3.5 w-3.5" />
                        Add Link
                      </>
                    )}
                  </button>
                ))}
              </div>

              {activeTab === "file" && (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30",
                    uploading && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileUpload(e.dataTransfer.files);
                  }}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="text-sm">Uploading…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <p className="text-sm font-medium">
                        Drop files here or click to browse
                      </p>
                      <p className="text-xs">
                        Images, PDF, Word, Excel — max 50 MB each
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </div>
              )}

              {activeTab === "link" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="link-url">
                      URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="link-url"
                      placeholder="https://example.com/document"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-name">Display Name</Label>
                    <Input
                      id="link-name"
                      placeholder="e.g. Progress Report Q2"
                      value={linkName}
                      onChange={(e) => setLinkName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-type">Type</Label>
                    <select
                      id="link-type"
                      value={linkType}
                      onChange={(e) =>
                        setLinkType(e.target.value as typeof linkType)
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="OTHER">Other / General Link</option>
                      <option value="IMAGE">Image</option>
                      <option value="PDF">PDF</option>
                      <option value="DOC">Word Document</option>
                      <option value="EXCEL">Spreadsheet</option>
                    </select>
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleAddLink}
                  >
                    Add Link
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {isAssignee
            ? "No attachments yet. Use 'Add Attachment' to upload progress files."
            : "No attachments yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {[...attachments]
            .sort(
              (a, b) =>
                (b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0) -
                (a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0)
            )
            .map((att, idx) => (
              <AttachmentItem
                key={idx}
                attachment={att}
                isAssignee={isAssignee}
                onRemove={() => handleRemove(attachments.indexOf(att))}
              />
            ))}
        </div>
      )}
    </div>
  );
}
