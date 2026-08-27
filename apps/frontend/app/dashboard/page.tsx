"use client";

import { useEffect, useMemo, useState } from "react";
import StatsCard from "./components/StatsCards";
import DashboardHeader from "./components/DashboardHeader";
import SearchFilter, { DashboardView } from "./components/SearchFilter";
import Sidebar from "./components/Sidebar";
import JobForm, { JobFormValues } from "./components/JobForm";
import JobCard from "./components/JobCard";
import EmptyState from "./components/EmptyState";
import KanbanBoard from "./components/KanbanBoard";
import StatsChart from "@/components/StatsChart";
import ProtectedRoute from "@/components/ProtectedRoute";

import { createJob, deleteJob, getJobs, updateJob } from "@/lib/api";
import { Job } from "@/lib/types";
import { JobStatus } from "@/lib/job-status";

import toast from "react-hot-toast";

const EMPTY_FORM: JobFormValues = {
  title: "",
  company: "",
  location: "",
  salary: "",
  notes: "",
  status: "Applied",
};

function DashboardContent() {
  const [jobs, setJobs] = useState<Job[]>([]);

  const [formValues, setFormValues] = useState<JobFormValues>(EMPTY_FORM);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [view, setView] = useState<DashboardView>("list");

  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const data = await getJobs();
      setJobs(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load dashboard",
      );
    }
  }

  function handleFieldChange<K extends keyof JobFormValues>(
    field: K,
    value: JobFormValues[K],
  ) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!formValues.title || !formValues.company) {
      toast.error("Title and company required");
      return;
    }

    try {
      if (editingJobId) {
        await updateJob(editingJobId, formValues);
        toast.success("Job updated 🚀");
      } else {
        await createJob(formValues);
        toast.success("Job added 🚀");
      }

      resetForm();
      loadJobs();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  }

  async function handleStatusChange(id: string, status: JobStatus) {
    const previousJobs = jobs;

    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, status } : job)),
    );

    try {
      await updateJob(id, { status });
      toast.success("Status updated 🚀");
    } catch (error) {
      setJobs(previousJobs);
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    }
  }

  async function handleDeleteJob(id: string) {
    try {
      await deleteJob(id);
      toast.success("Job deleted");
      loadJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  function handleEdit(job: Job) {
    setEditingJobId(job.id);

    setFormValues({
      title: job.title,
      company: job.company,
      location: job.location || "",
      salary: job.salary || "",
      notes: job.notes || "",
      status: job.status,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingJobId(null);
    setFormValues(EMPTY_FORM);
  }

  const filteredJobs = useMemo(() => {
    const filtered = jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === "All" ? true : job.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

    if (sortBy === "Newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime(),
      );
    }

    if (sortBy === "Oldest") {
      filtered.sort(
        (a, b) =>
          new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime(),
      );
    }

    if (sortBy === "Company") {
      filtered.sort((a, b) => a.company.localeCompare(b.company));
    }

    return filtered;
  }, [jobs, search, filterStatus, sortBy]);

  const countByStatus = (status: JobStatus) =>
    jobs.filter((job) => job.status === status).length;

  const stats = {
    applied: countByStatus("Applied"),
    interview: countByStatus("Interview"),
    accepted: countByStatus("Accepted"),
    rejected: countByStatus("Rejected"),
  };

  const interviewRate = jobs.length
    ? Math.round((stats.interview / jobs.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar totalApplications={jobs.length} interviewRate={interviewRate} />

      <div className="flex-1 p-8">
        <DashboardHeader
          onLogout={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            toast.success("Logged out successfully 👋");
            window.location.href = "/login";
          }}
        />

        <SearchFilter
          search={search}
          setSearch={setSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          view={view}
          setView={setView}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatsCard
            title="Applied"
            value={stats.applied}
            color="from-blue-500 to-indigo-500"
          />

          <StatsCard
            title="Interview"
            value={stats.interview}
            color="from-amber-500 to-orange-500"
          />

          <StatsCard
            title="Accepted"
            value={stats.accepted}
            color="from-green-500 to-emerald-500"
          />

          <StatsCard
            title="Rejected"
            value={stats.rejected}
            color="from-red-500 to-pink-600"
          />
        </div>

        <div className="mb-8">
          <StatsChart stats={stats} />
        </div>

        <JobForm
          values={formValues}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isEditing={editingJobId !== null}
        />

        {view === "board" ? (
          <KanbanBoard
            jobs={filteredJobs}
            onEdit={handleEdit}
            onDelete={handleDeleteJob}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="space-y-5">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={handleEdit}
                onDelete={handleDeleteJob}
              />
            ))}

            {filteredJobs.length === 0 && <EmptyState />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
