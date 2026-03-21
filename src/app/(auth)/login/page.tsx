"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && role === "admin") {
      router.replace("/dashboard");
    }
  }, [authLoading, user, role, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const credentials = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("[login] signIn success uid:", credentials.user.uid);

      const uid = credentials.user.uid;
      console.log("[login] uid:", uid);

      const userRef = doc(db, "users", uid);
      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        console.log("[login] user doc missing");
        await signOut(auth);
        setError("No tienes acceso.");
        return;
      }

      const data = snapshot.data();
      console.log("[login] firestore data:", data);

      if (data.role !== "admin") {
        console.log("[login] role is not admin:", data.role);
        await signOut(auth);
        setError("No tienes acceso.");
        return;
      }

      console.log("[login] access granted");
      router.replace("/dashboard");
    } catch (error) {
      console.log("[login] signIn error:", error);
      setError("Credenciales invalidas o sin permisos de administrador.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_50%)]" />
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/60 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Acceso seguro
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Inicia sesion
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Panel privado para administrar JBookme.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/60"
              placeholder="admin@jbookme.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/60"
              placeholder="********"
              required
            />
          </div>
          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-400/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Ingresando..." : "Entrar al panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
