"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearSession } from "@/lib/auth";
import { getMe } from "@/lib/api";
import { LogoMark } from "@/components/brand/Logo";

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

    getMe()
      .then(() => {
        if (active) setStatus("authed");
      })
      .catch(() => {
        clearSession();
        router.replace("/login");
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (status === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-bg">
        <LogoMark className="h-8 w-8 animate-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}
