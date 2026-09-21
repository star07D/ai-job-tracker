"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { AppTopbar } from "@/components/app/AppTopbar";
import { InsightsContent } from "./components/InsightsContent";

export default function InsightsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg">
        <AppTopbar />
        <InsightsContent />
      </div>
    </ProtectedRoute>
  );
}
