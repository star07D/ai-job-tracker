import { LayoutGrid, List, Search } from "lucide-react";
import { JOB_STATUSES } from "@/lib/job-status";

export type DashboardView = "list" | "board";

interface SearchFilterProps {
  search: string;
  setSearch: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  view: DashboardView;
  setView: (value: DashboardView) => void;
}

export default function SearchFilter({
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  view,
  setView,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col xl:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-4 text-slate-500" size={18} />

        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#081028] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500"
        />
      </div>

      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="bg-[#081028] border border-slate-800 rounded-2xl px-5 py-4 outline-none"
      >
        <option>All</option>
        {JOB_STATUSES.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="bg-[#081028] border border-slate-800 rounded-2xl px-5 py-4 outline-none"
      >
        <option>Newest</option>
        <option>Oldest</option>
        <option>Company</option>
      </select>

      <div className="flex bg-[#081028] border border-slate-800 rounded-2xl p-1">
        <button
          onClick={() => setView("list")}
          className={`p-3 rounded-xl transition ${
            view === "list" ? "bg-blue-500" : "hover:bg-slate-800"
          }`}
          aria-label="List view"
        >
          <List size={18} />
        </button>

        <button
          onClick={() => setView("board")}
          className={`p-3 rounded-xl transition ${
            view === "board" ? "bg-blue-500" : "hover:bg-slate-800"
          }`}
          aria-label="Board view"
        >
          <LayoutGrid size={18} />
        </button>
      </div>
    </div>
  );
}
