"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getStoredSession, saveSession } from "@/lib/auth";
import { getErrorMessage, login, register } from "@/lib/api";

type AuthMode = "login" | "register";

type AuthPageProps = {
  mode: AuthMode;
};

export function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";

  useEffect(() => {
    if (getStoredSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setError("Нэвтрэх нэр заавал оруулна.");
      return;
    }

    if (!cleanPassword) {
      setError("Нууц үг заавал оруулна.");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.");
      return;
    }

    setSubmitting(true);

    try {
      const session = isRegister
        ? await register(cleanUsername, cleanPassword)
        : await login(cleanUsername, cleanPassword);

      saveSession(session);
      setSuccess(isRegister ? "Бүртгэл амжилттай." : "Амжилттай нэвтэрлээ.");
      router.push("/dashboard");
    } catch (authError) {
      setError(getErrorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7">
            <p className="text-sm font-medium text-teal-700">
              {isRegister ? "Шинэ хэрэглэгч" : "Тавтай морил"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {isRegister ? "Бүртгүүлэх" : "Нэвтрэх"}
            </h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field label="Нэвтрэх нэр">
              <input
                className="field"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Нэвтрэх нэрээ оруулна уу"
                autoComplete="username"
              />
            </Field>

            <Field label="Нууц үг">
              <input
                className="field"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Нууц үгээ оруулна уу"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
            </Field>

            {error ? <Alert tone="error">{error}</Alert> : null}
            {success ? <Alert tone="success">{success}</Alert> : null}

            <button
              className="h-11 w-full rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Түр хүлээнэ үү..."
                : isRegister
                  ? "Бүртгүүлэх"
                  : "Нэвтрэх"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isRegister ? "Бүртгэлтэй юу?" : "Бүртгэлгүй юу?"}{" "}
            <Link
              className="font-semibold text-teal-700 hover:text-teal-900"
              href={isRegister ? "/login" : "/register"}
            >
              {isRegister ? "Нэвтрэх" : "Бүртгүүлэх"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span>{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Alert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {children}
    </div>
  );
}
