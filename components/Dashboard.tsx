"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AccountList } from "@/components/AccountList";
import { AdminRates } from "@/components/AdminRates";
import { AdminUsers } from "@/components/AdminUsers";
import { CreateAccountForm } from "@/components/CreateAccountForm";
import { TransactionList } from "@/components/TransactionList";
import { TransferForm } from "@/components/TransferForm";
import { clearSession, getStoredSession } from "@/lib/auth";
import { getErrorMessage, listAccounts, listTransactions } from "@/lib/api";
import type { Account, Session, Transaction } from "@/lib/types";

type Section = "dashboard" | "accounts" | "transactions" | "admin" | "rates";

type DashboardProps = {
  initialSection: Section;
};

export function Dashboard({ initialSection }: DashboardProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");

  const handleUnauthorized = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  const logout = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  const loadAccounts = useCallback(async () => {
    if (!session) {
      return;
    }

    const result = await listAccounts(session.token, handleUnauthorized);
    setAccounts(result.accounts);
  }, [handleUnauthorized, session]);

  const loadTransactions = useCallback(
    async (search = "") => {
      if (!session) {
        return;
      }

      const result = await listTransactions(
        session.token,
        search,
        handleUnauthorized,
      );
      setTransactions(result.transactions);
    },
    [handleUnauthorized, session],
  );

  const refreshAll = useCallback(async () => {
    if (!session) {
      return;
    }

    setLoadingData(true);
    setDataError("");

    try {
      await Promise.all([loadAccounts(), loadTransactions()]);
    } catch (error) {
      setDataError(getErrorMessage(error));
    } finally {
      setLoadingData(false);
    }
  }, [loadAccounts, loadTransactions, session]);

  useEffect(() => {
    const storedSession = getStoredSession();

    if (!storedSession) {
      router.replace("/login");
      return;
    }

    queueMicrotask(() => {
      setSession(storedSession);
      setCheckingAuth(false);
    });
  }, [router]);

  useEffect(() => {
    if (session) {
      queueMicrotask(() => {
        refreshAll();
      });
    }
  }, [refreshAll, session]);

  const balancesByCurrency = useMemo(
    () => groupBalancesByCurrency(accounts),
    [accounts],
  );

  const effectiveSection =
    (initialSection === "admin" || initialSection === "rates") &&
    session?.user.role !== "admin"
      ? "dashboard"
      : initialSection;

  if (checkingAuth || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-600 shadow-sm">
          Нэвтрэх эрх шалгаж байна...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-medium text-teal-700">
              Банкны гүйлгээний систем
            </p>
            <h1 className="text-2xl font-semibold text-slate-950">
              Хянах самбар
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
              <span className="font-semibold text-slate-950">
                {session.user.username}
              </span>
              <span className="ml-2 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold uppercase text-amber-800">
                {formatRole(session.user.role)}
              </span>
            </div>
            <button
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
              onClick={logout}
              type="button"
            >
              Гарах
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <NavLink active={effectiveSection === "dashboard"} href="/dashboard">
            Тойм
          </NavLink>
          <NavLink active={effectiveSection === "accounts"} href="/accounts">
            Данс
          </NavLink>
          <NavLink
            active={effectiveSection === "transactions"}
            href="/transactions"
          >
            Гүйлгээ
          </NavLink>
          {session.user.role === "admin" ? (
            <>
              <NavLink active={effectiveSection === "admin"} href="/admin/users">
                Хэрэглэгчид
              </NavLink>
              <NavLink active={effectiveSection === "rates"} href="/admin/rates">
                Валютын ханш
              </NavLink>
            </>
          ) : null}
        </aside>

        <section className="space-y-6">
          {dataError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {dataError}
            </div>
          ) : null}

          {loadingData ? (
            <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              Данс болон гүйлгээний мэдээлэл уншиж байна...
            </div>
          ) : null}

          {effectiveSection === "dashboard" ? (
            <>
              <Overview
                accountCount={accounts.length}
                balancesByCurrency={balancesByCurrency}
                transactionCount={transactions.length}
              />
              <TransactionList
                onSearch={loadTransactions}
                transactions={transactions}
              />
            </>
          ) : null}

          {effectiveSection === "accounts" ? (
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <CreateAccountForm
                onUnauthorized={handleUnauthorized}
                session={session}
                onCreated={loadAccounts}
              />
              <AccountList accounts={accounts} />
            </div>
          ) : null}

          {effectiveSection === "transactions" ? (
            <>
              <TransferForm
                accounts={accounts}
                onTransferred={refreshAll}
                onUnauthorized={handleUnauthorized}
                session={session}
              />
              <TransactionList
                onSearch={loadTransactions}
                transactions={transactions}
              />
            </>
          ) : null}

          {effectiveSection === "admin" && session.user.role === "admin" ? (
            <AdminUsers onUnauthorized={handleUnauthorized} session={session} />
          ) : null}

          {effectiveSection === "rates" && session.user.role === "admin" ? (
            <AdminRates onUnauthorized={handleUnauthorized} session={session} />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function NavLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      className={`mb-1 block rounded-md px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-teal-700 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}

function Overview({
  accountCount,
  balancesByCurrency,
  transactionCount,
}: {
  accountCount: number;
  balancesByCurrency: Array<{ currency: string; amount: number }>;
  transactionCount: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Metric label="Данс" value={String(accountCount)} />
      <Metric label="Гүйлгээ" value={String(transactionCount)} />
      <BalanceMetric balancesByCurrency={balancesByCurrency} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function BalanceMetric({
  balancesByCurrency,
}: {
  balancesByCurrency: Array<{ currency: string; amount: number }>;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">Нийт үлдэгдэл</p>
      {balancesByCurrency.length === 0 ? (
        <p className="mt-2 text-2xl font-semibold text-slate-950">0.00</p>
      ) : (
        <div className="mt-3 space-y-2">
          {balancesByCurrency.map((balance) => (
            <div
              className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2"
              key={balance.currency}
            >
              <span className="text-sm font-semibold text-slate-600">
                {balance.currency}
              </span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAmount(balance.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupBalancesByCurrency(accounts: Account[]) {
  const totals = accounts.reduce<Record<string, number>>((result, account) => {
    const currency = String(account.currency || "Тодорхойгүй").toUpperCase();
    result[currency] = (result[currency] || 0) + Number(account.amount);
    return result;
  }, {});

  return Object.entries(totals)
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((first, second) => first.currency.localeCompare(second.currency));
}

function formatRole(role: string) {
  return role === "admin" ? "Админ" : "Хэрэглэгч";
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(amount);
}
