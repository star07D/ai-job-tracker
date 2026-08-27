interface SidebarProps {
  totalApplications: number;
  interviewRate: number;
}

export default function Sidebar({
  totalApplications,
  interviewRate,
}: SidebarProps) {
  return (
    <div className="w-64 bg-[#020617] border-r border-slate-800 p-6 hidden lg:block">
      <h1 className="text-4xl font-black mb-2">AI Job Tracker 🚀</h1>

      <p className="text-slate-400 text-sm mb-8">
        Track your applications smarter 🚀
      </p>

      <div className="space-y-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">Total Applications</p>

          <h2 className="text-4xl font-bold mt-2">{totalApplications}</h2>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-5 rounded-2xl">
          <p className="text-sm opacity-80">Interview Rate</p>

          <h2 className="text-4xl font-bold mt-2">{interviewRate}%</h2>
        </div>
      </div>
    </div>
  );
}
