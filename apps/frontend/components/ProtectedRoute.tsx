"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearSession } from "@/lib/auth";
import { getMe } from "@/lib/api";

interface Props {
  children: ReactNode;
}

type Status = "checking" | "authed";

export default function ProtectedRoute({ children }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;

    if (!getToken()) {
      router.replace("/login");
      return;
    }

    // Validate the token against the API rather than trusting its presence.
    getMe()
      .then(() => {
        if (active) setStatus("authed");
      })
      .catch(() => {
        // api.ts already redirects on 401; this covers other failures.
        clearSession();
        router.replace("/login");
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  return <>{children}</>;
}
