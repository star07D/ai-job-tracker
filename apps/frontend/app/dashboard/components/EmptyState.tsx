export default function EmptyState() {
  return (
    <div className="bg-[#020b24] border border-slate-800 rounded-3xl p-10 text-center">
      <h2 className="text-5xl font-black mb-4">No jobs found 🚀</h2>

      <p className="text-slate-400">
        Try changing filters or add a new application.
      </p>
    </div>
  );
}
