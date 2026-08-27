"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";

import { getSingleJob } from "@/lib/api";
import { Job } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/job-status";
import ProtectedRoute from "@/components/ProtectedRoute";

function JobDetailsContent() {
  const params = useParams();

  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJob() {
      try {
        const data = await getSingleJob(params.id as string);

        setJob(data);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load job",
        );
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-3xl font-bold">
        Loading...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-3xl font-bold">
        Job not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-10">
      {/* BACK BUTTON */}

      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-8"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      {/* TOP SECTION */}

      <div className="bg-[#020b24] border border-slate-800 rounded-3xl p-8 mb-8">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div>
            <h1 className="text-6xl font-black mb-3">{job.title}</h1>

            <div className="flex items-center gap-3 text-slate-300 text-2xl mb-6">
              <Building2 size={22} />

              {job.company}
            </div>

            <div className="flex flex-wrap gap-5 text-slate-400">
              {job.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={18} />

                  {job.location}
                </div>
              )}

              {job.salary && (
                <div className="flex items-center gap-2 text-green-400">
                  <DollarSign size={18} />

                  {job.salary}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar size={18} />
                Applied on {new Date(job.appliedDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* STATUS */}

          <div>
            <div
              className={`px-6 py-3 rounded-2xl text-lg font-bold w-fit ${
                STATUS_COLORS[job.status]?.solid ?? "bg-slate-500"
              }`}
            >
              {job.status}
            </div>
          </div>
        </div>
      </div>

      {/* NOTES */}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT */}

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#020b24] border border-slate-800 rounded-3xl p-8">
            <h2 className="text-4xl font-black mb-6">Notes 📝</h2>

            {job.notes ? (
              <p className="text-slate-300 leading-8 text-lg">{job.notes}</p>
            ) : (
              <p className="text-slate-500">No notes added yet.</p>
            )}
          </div>

          {/* INTERVIEW PREP */}

          <div className="bg-[#020b24] border border-slate-800 rounded-3xl p-8">
            <h2 className="text-4xl font-black mb-6">
              Interview Preparation 🚀
            </h2>

            <div className="space-y-4 text-slate-300">
              <div className="bg-slate-900 rounded-2xl p-5">
                Research company background
              </div>

              <div className="bg-slate-900 rounded-2xl p-5">
                Prepare STAR method answers
              </div>

              <div className="bg-slate-900 rounded-2xl p-5">
                Practice technical questions
              </div>

              <div className="bg-slate-900 rounded-2xl p-5">
                Prepare salary expectations
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}

        <div className="space-y-8">
          {/* QUICK ACTIONS */}

          <div className="bg-[#020b24] border border-slate-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black mb-6">Quick Actions</h2>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-blue-500 hover:bg-blue-600 transition rounded-2xl py-4 font-bold flex items-center justify-center gap-2"
            >
              <Pencil size={18} />
              Edit Job
            </button>
          </div>

          {/* TIMELINE */}

          <div className="bg-[#020b24] border border-slate-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black mb-6">Timeline 📅</h2>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">
                  Application Created
                </p>

                <p className="text-lg font-semibold">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Applied Date</p>

                <p className="text-lg font-semibold">
                  {new Date(job.appliedDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Current Status</p>

                <p className="text-lg font-semibold">{job.status}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobDetailsPage() {
  return (
    <ProtectedRoute>
      <JobDetailsContent />
    </ProtectedRoute>
  );
}
