interface DashboardHeaderProps {
  onLogout: () => void;
}

export default function DashboardHeader({ onLogout }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 mb-8">
      <div>
        <h1 className="text-6xl font-black">Dashboard 🚀</h1>

        <p className="text-slate-400 mt-2">
          Manage and track your applications
        </p>
      </div>

      <button
        onClick={onLogout}
        className="bg-red-500 hover:bg-red-600 transition px-6 py-3 rounded-2xl font-semibold"
      >
        Logout
      </button>
    </div>
  );
}
