"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshAccessToken } from "@/lib/api";
import { setUser } from "@/lib/auth";
import { Landing } from "@/components/marketing/Landing";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    refreshAccessToken().then((session) => {
      if (!active) return;
      if (session) {
        setUser(session.user);
        router.replace("/dashboard");
      } else {
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) return <div className="min-h-screen bg-bg" />;
  return <Landing />;
}
