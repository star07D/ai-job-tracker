"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { registerUser } from "@/lib/api";
import { setSession } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (email !== confirmEmail) {
      setError("Emails do not match");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      const data = await registerUser({
        firstName,
        lastName,
        email,
        password,
      });

      setSession(data.token, data.user);

      toast.success("Account created 🎉");

      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";

      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-black">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-purple-700 via-pink-600 to-orange-500 p-16 flex-col justify-center">
        <h1 className="text-7xl font-extrabold text-white leading-tight">
          Build Your
          <br />
          Career 🚀
        </h1>

        <p className="text-white/90 text-2xl mt-8 max-w-xl">
          Join AI Job Tracker and manage your entire job hunt professionally.
        </p>

        <div className="mt-16 space-y-6">
          {[
            "Save unlimited jobs",
            "Track interview stages",
            "Visual analytics",
            "List & kanban board views",
          ].map((item) => (
            <div
              key={item}
              className="bg-white/10 border border-white/20 rounded-2xl px-6 py-5 text-white text-lg backdrop-blur-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#020B3D] border border-slate-800 rounded-3xl p-10 shadow-2xl">
          <h2 className="text-5xl font-extrabold text-white leading-tight">
            Create
            <br />
            Account ✨
          </h2>

          <p className="text-slate-400 mt-4">
            Start tracking your dream job journey
          </p>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-black/40 border border-slate-700 rounded-2xl px-4 py-4 text-white outline-none focus:border-pink-500"
                required
              />

              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-black/40 border border-slate-700 rounded-2xl px-4 py-4 text-white outline-none focus:border-pink-500"
                required
              />
            </div>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-slate-700 rounded-2xl px-4 py-4 text-white outline-none focus:border-pink-500"
              required
            />

            <input
              type="email"
              placeholder="Confirm Email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="w-full bg-black/40 border border-slate-700 rounded-2xl px-4 py-4 text-white outline-none focus:border-pink-500"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-slate-700 rounded-2xl px-4 py-4 text-white outline-none focus:border-pink-500"
              required
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black/40 border border-slate-700 rounded-2xl px-4 py-4 text-white outline-none focus:border-pink-500"
              required
            />

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-2xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 transition rounded-2xl py-4 text-white font-bold text-lg"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-slate-400 mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-pink-400 hover:text-pink-300">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
