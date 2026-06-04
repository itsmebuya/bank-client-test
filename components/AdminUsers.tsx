"use client";

import { useEffect, useState } from "react";
import { getErrorMessage, listAdminUsers } from "@/lib/api";
import type { AdminUser, Session } from "@/lib/types";

type AdminUsersProps = {
  session: Session;
  onUnauthorized: () => void;
};

export function AdminUsers({ session, onUnauthorized }: AdminUsersProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setError("");
      setLoading(true);

      try {
        const result = await listAdminUsers(session.token, onUnauthorized);

        if (active) {
          setUsers(result.users);
        }
      } catch (error) {
        if (active) {
          setError(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (session.user.role === "admin") {
      loadUsers();
    }

    return () => {
      active = false;
    };
  }, [onUnauthorized, session]);

  if (session.user.role !== "admin") {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">Хэрэглэгчид</h2>
        <p className="mt-1 text-sm text-slate-500">
          Бүх хэрэглэгч, дансны тоо, гүйлгээний тоо болон дансны жагсаалт.
        </p>
      </div>

      {loading ? (
        <p className="px-5 py-6 text-sm text-slate-500">Хэрэглэгчид уншиж байна...</p>
      ) : null}

      {error ? (
        <div className="m-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && users.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-500">Хэрэглэгч олдсонгүй.</p>
      ) : null}

      <div className="divide-y divide-slate-100">
        {users.map((user) => (
          <article key={user.id} className="p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">
                    #{user.id} {user.username}
                  </h3>
                  <span className="rounded-md bg-sky-100 px-2 py-1 text-xs font-semibold uppercase text-sky-800">
                    {formatRole(user.role)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Үүссэн огноо: {formatDate(user.createdAt)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-64">
                <Stat label="Данс" value={user._count.accounts} />
                <Stat label="Гүйлгээ" value={user._count.transactions} />
              </div>
            </div>

            <div className="mt-4 rounded-md border border-slate-200">
              {user.accounts.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">
                  Данс байхгүй.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Данс</th>
                        <th className="px-4 py-3 font-semibold">Валют</th>
                        <th className="px-4 py-3 font-semibold">Үлдэгдэл</th>
                        <th className="px-4 py-3 font-semibold">Төрөл</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {user.accounts.map((account) => (
                        <tr key={account.id} className="text-slate-700">
                          <td className="px-4 py-3 font-medium text-slate-950">
                            {account.accountNumber}
                          </td>
                          <td className="px-4 py-3">{account.currency}</td>
                          <td className="px-4 py-3">
                            {formatMoney(account.amount)}
                          </td>
                          <td className="px-4 py-3 capitalize">
                            {formatAccountType(account.accountType)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("mn-MN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatRole(role: string) {
  return role === "admin" ? "Админ" : "Хэрэглэгч";
}

function formatAccountType(type: string) {
  return type === "regular" ? "Энгийн" : type;
}
