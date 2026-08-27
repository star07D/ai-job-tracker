"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await login(email, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Welcome back! 🎉");

      // Small delay so the toast is visible
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";

      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 via-indigo-600 to-cyan-500 p-16 flex-col justify-center">
        <h1 className="text-7xl font-extrabold text-white leading-tight">
          AI Job
          <br />
          Tracker 🚀
        </h1>

        <p className="text-white/80 text-2xl mt-8 max-w-xl">
          Organize your job applications, prepare interviews, and land your
          dream role faster.
        </p>

        <div className="space-y-6 mt-16">
          {[
            "Track applications easily",
            "Manage interview stages",
            "Analytics dashboard",
            "Modern portfolio project",
          ].map((item) => (
            <div
              key={item}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white text-2xl font-semibold"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#020b45] border border-blue-900 rounded-3xl p-10 shadow-2xl">
          <h2 className="text-6xl font-extrabold text-white leading-tight">
            Welcome Back 👋
          </h2>

          <p className="text-slate-400 mt-4 text-lg">
            Login to continue your journey
          </p>

          <form onSubmit={handleLogin} className="space-y-6 mt-10">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-200 rounded-2xl px-6 py-5 text-black text-lg outline-none"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-200 rounded-2xl px-6 py-5 text-black text-lg outline-none"
              required
            />

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:opacity-90 transition text-white py-5 rounded-2xl text-2xl font-bold"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-slate-400 text-center mt-8">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
