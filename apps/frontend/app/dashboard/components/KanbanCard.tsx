import { Trash2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { Job } from "@/lib/types";

interface KanbanCardProps {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
}

export default function KanbanCard({ job, onEdit, onDelete }: KanbanCardProps) {
  const router = useRouter();

  return (
    <div className="bg-[#020b24] border border-slate-800 rounded-2xl p-4 hover:border-blue-500 transition">
      <div
        className="cursor-pointer"
        onClick={() => router.push(`/dashboard/job/${job.id}`)}
      >
        <h3 className="font-bold text-lg mb-1">{job.title}</h3>
        <p className="text-slate-300 text-sm mb-2">{job.company}</p>

        <div className="flex flex-wrap gap-3 text-slate-500 text-xs">
          {job.location && <span>📍 {job.location}</span>}
          {job.salary && <span>💰 {job.salary}</span>}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onEdit(job)}
          className="bg-blue-500 hover:bg-blue-600 transition p-2 rounded-lg"
        >
          <Pencil size={14} />
        </button>

        <button
          onClick={() => onDelete(job.id)}
          className="bg-red-500 hover:bg-red-600 transition p-2 rounded-lg"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
