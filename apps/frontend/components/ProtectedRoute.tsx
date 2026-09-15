"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, setUser, clearSession } from "@/lib/auth";
import { getMe, refreshAccessToken } from "@/lib/api";
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

    async function check() {
      // Already have an access token in memory (e.g. we just logged in this
      // session) — no need to spend a refresh round trip confirming that.
      if (getAccessToken()) {
        try {
          const user = await getMe();
          if (active) {
            setUser(user);
            setStatus("authed");
          }
        } catch {
          clearSession();
          if (active) router.replace("/login");
        }
        return;
      }

      // A fresh page load: the access token lives only in memory, so it's
      // gone. Recover it from the httpOnly refresh cookie instead.
      const session = await refreshAccessToken();
      if (!active) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session.user);
      setStatus("authed");
    }

    check();
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
