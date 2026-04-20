"use client";
import { useEffect } from "react";
import { toast } from "sonner";

export default function SignoutToast({ show }: { show: boolean }) {
  useEffect(() => {
    if (show) {
      toast.success("Successfully signed out!", { position: "top-center" });
      // Optionally, remove the query param from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [show]);
  return null;
}
