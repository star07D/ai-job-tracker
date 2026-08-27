"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  return <>{children}</>;
}
