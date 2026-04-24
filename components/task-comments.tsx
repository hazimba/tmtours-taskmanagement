"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  taskCommentSchema,
  type TaskCommentFormData,
} from "@/lib/validations/task";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  Send,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── types ────────────────────────────────────────────────────────────────────

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: Pick<User, "id" | "full_name" | "avatar_url">;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── component ────────────────────────────────────────────────────────────────

interface TaskCommentsProps {
  taskId: string;
  currentUserId: string;
}

export function TaskComments({ taskId, currentUserId }: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskCommentFormData>({
    resolver: zodResolver(taskCommentSchema),
    defaultValues: { content: "" },
  });

  // ── fetch initial comments ─────────────────────────────────────────────────

  useEffect(() => {
    async function fetchComments() {
      const { data, error } = await supabase
        .from("task_comments")
        .select(
          `id, task_id, user_id, content, created_at, updated_at,
           user:profiles(id, full_name, avatar_url)`
        )
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (!error && data) setComments(data as unknown as TaskComment[]);
      setLoading(false);
    }
    fetchComments();
  }, [taskId]);

  // ── real-time subscription ─────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_comments",
          filter: `task_id=eq.${taskId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // fetch with joined user so we have the full_name
            const { data } = await supabase
              .from("task_comments")
              .select(
                `id, task_id, user_id, content, created_at, updated_at,
                 user:profiles(id, full_name, avatar_url)`
              )
              .eq("id", payload.new.id)
              .single();
            if (data)
              setComments((prev) => [...prev, data as unknown as TaskComment]);
          }
          if (payload.eventType === "DELETE") {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  // scroll to bottom on new comments
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  // ── refetch helper ─────────────────────────────────────────────────────────

  async function refetchComments() {
    const { data, error } = await supabase
      .from("task_comments")
      .select(
        `id, task_id, user_id, content, created_at, updated_at,
         user:profiles(id, full_name, avatar_url)`
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (!error && data) setComments(data as unknown as TaskComment[]);
  }

  // ── post comment ───────────────────────────────────────────────────────────

  const onSubmit = async (data: TaskCommentFormData) => {
    const { error } = await supabase.from("task_comments").insert([
      {
        task_id: taskId,
        user_id: currentUserId,
        content: data.content.trim(),
      },
    ]);
    if (error) {
      toast.error("Failed to post comment.");
    } else {
      reset();
      await refetchComments();
    }
  };

  // ── delete comment ─────────────────────────────────────────────────────────

  async function deleteComment(id: string) {
    const { error } = await supabase
      .from("task_comments")
      .delete()
      .eq("id", id)
      .eq("user_id", currentUserId);
    if (error) toast.error("Failed to delete comment.");
    else await refetchComments();
  }

  // ── edit comment ───────────────────────────────────────────────────────────

  function startEdit(comment: TaskComment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  async function saveEdit(id: string) {
    if (!editContent.trim()) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from("task_comments")
      .update({
        content: editContent.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", currentUserId);
    setSavingEdit(false);
    if (error) {
      toast.error("Failed to update comment.");
    } else {
      setEditingId(null);
      setEditContent("");
      await refetchComments();
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">
          Comments{comments.length > 0 ? ` (${comments.length})` : ""}
        </span>
      </div>

      {/* list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
          {comments.map((comment) => {
            const isOwn = comment.user_id === currentUserId;
            const name = comment.user?.full_name ?? "Unknown";
            const isEditing = editingId === comment.id;
            const wasEdited = comment.updated_at !== comment.created_at;
            return (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                  <AvatarImage src={comment.user?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(comment.created_at)}
                    </span>
                    {wasEdited && (
                      <span className="text-[10px] text-muted-foreground/60 italic">
                        edited
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-1 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        className="resize-none text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            saveEdit(comment.id);
                          }
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-7 px-3 gap-1.5 text-xs"
                          onClick={() => saveEdit(comment.id)}
                          disabled={savingEdit || !editContent.trim()}
                        >
                          {savingEdit ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-3 gap-1.5 text-xs"
                          onClick={cancelEdit}
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "mt-1 text-sm rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap",
                        isOwn
                          ? "bg-primary/10 text-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {comment.content}
                    </div>
                  )}
                </div>

                {isOwn && !isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1 flex items-center gap-1">
                    <button
                      onClick={() => startEdit(comment)}
                      className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                      title="Edit comment"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                      title="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* composer */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex gap-2 items-end pt-2 border-t border-border"
      >
        <div className="flex-1 space-y-1">
          <Textarea
            {...register("content")}
            placeholder="Write a comment…"
            rows={2}
            className={cn(
              "resize-none text-sm",
              errors.content && "border-red-500"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit(onSubmit)();
              }
            }}
          />
          {errors.content && (
            <p className="text-xs text-red-500">{errors.content.message}</p>
          )}
          <p className="text-[11px] text-muted-foreground">⌘ + Enter to send</p>
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={isSubmitting}
          className="shrink-0 mb-5"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
