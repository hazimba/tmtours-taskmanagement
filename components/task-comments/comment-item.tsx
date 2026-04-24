"use client";

import { TaskComment } from "./index";
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

interface CommentItemProps {
  comment: TaskComment;
  currentUserId: string;
  isEditing: boolean;
  editContent: string;
  savingEdit: boolean;
  onEditContentChange: (v: string) => void;
  onStartEdit: (c: TaskComment) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CommentItem({
  comment,
  currentUserId,
  isEditing,
  editContent,
  savingEdit,
  onEditContentChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: CommentItemProps) {
  const isOwn = comment.user_id === currentUserId;
  const name = comment.user?.full_name ?? "Unknown";
  const wasEdited = comment.updated_at !== comment.created_at;

  return (
    <div className="flex gap-3 group">
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarImage src={comment.user?.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold">{name}</span>
          <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
          {wasEdited && <span className="text-[10px] text-muted-foreground/60 italic">edited</span>}
        </div>

        {isEditing ? (
          <div className="mt-1 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              rows={2}
              className="resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSaveEdit(comment.id); }
                if (e.key === "Escape") onCancelEdit();
              }}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-7 px-3 gap-1.5 text-xs" onClick={() => onSaveEdit(comment.id)} disabled={savingEdit || !editContent.trim()}>
                {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-3 gap-1.5 text-xs" onClick={onCancelEdit}>
                <X className="h-3 w-3" />Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn("mt-1 text-sm rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap", isOwn ? "bg-primary/10 text-foreground" : "bg-muted text-foreground")}>
            {comment.content}
          </div>
        )}
      </div>

      {isOwn && !isEditing && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1 flex items-center gap-1">
          <button onClick={() => onStartEdit(comment)} className="text-muted-foreground hover:text-primary transition-colors p-0.5" title="Edit comment">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(comment.id)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5" title="Delete comment">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
