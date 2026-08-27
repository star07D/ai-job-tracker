import { Trash2, Pencil, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

import { Job } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface JobCardProps {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
}

export default function JobCard({ job, onEdit, onDelete }: JobCardProps) {
  const router = useRouter();

  return (
    <div className="bg-[#020b24] border border-slate-800 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-blue-500 transition">
      <div
        className="flex-1 cursor-pointer"
        onClick={() => router.push(`/dashboard/job/${job.id}`)}
      >
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-4xl font-black">{job.title}</h2>

          <ExternalLink size={18} />
        </div>

        <p className="text-2xl text-slate-300 mb-4">{job.company}</p>

        <div className="flex flex-wrap gap-4 text-slate-400 mb-4">
          {job.location && <p>📍 {job.location}</p>}

          {job.salary && <p>💰 {job.salary}</p>}
        </div>

        <div className="mb-4">
          <StatusBadge status={job.status} />
        </div>

        {job.notes && <p className="text-slate-500">{job.notes}</p>}

        <p className="text-slate-600 text-sm mt-4">
          Applied on {new Date(job.appliedDate).toLocaleDateString()}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onEdit(job)}
          className="bg-blue-500 hover:bg-blue-600 transition px-5 py-3 rounded-xl"
        >
          <Pencil size={18} />
        </button>

        <button
          onClick={() => onDelete(job.id)}
          className="bg-red-500 hover:bg-red-600 transition px-5 py-3 rounded-xl"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
