"use client";

import { FormEvent, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/api";
import type { Transaction } from "@/lib/types";

type TransactionListProps = {
  transactions: Transaction[];
  onSearch: (search: string) => Promise<void>;
};

type TypeFilter = "all" | "income" | "expenses";

export function TransactionList({
  transactions,
  onSearch,
}: TransactionListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredTransactions = useMemo(() => {
    if (typeFilter === "all") {
      return transactions;
    }

    return transactions.filter((transaction) => transaction.type === typeFilter);
  }, [transactions, typeFilter]);

  async function runSearch(value: string) {
    setError("");
    setLoading(true);

    try {
      await onSearch(value);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSearch(search);
  }

  async function clearSearch() {
    setSearch("");
    await runSearch("");
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Дансны хуулга
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Данс, утга, дүн эсвэл валютаар хайж, төрлөөр шүүнэ.
          </p>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={handleSubmit}
          >
            <input
              className="field h-10 sm:w-64"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Гүйлгээ хайх"
              value={search}
            />
            <button
              className="h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={loading}
              type="submit"
            >
              {loading ? "Хайж байна..." : "Хайх"}
            </button>
            <button
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              disabled={loading && !search}
              onClick={clearSearch}
              type="button"
            >
              Цэвэрлэх
            </button>
          </form>

          <select
            className="field h-10 lg:w-44"
            onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
            value={typeFilter}
          >
            <option value="all">Бүгд</option>
            <option value="income">Орлого</option>
            <option value="expenses">Зарлага</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="mx-5 mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {filteredTransactions.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">
          Гүйлгээ олдсонгүй.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Төрөл</th>
                <th className="px-5 py-3 font-semibold">Илгээгч</th>
                <th className="px-5 py-3 font-semibold">Хүлээн авагч</th>
                <th className="px-5 py-3 font-semibold">Дүн</th>
                <th className="px-5 py-3 font-semibold">Хөрвүүлэлт</th>
                <th className="px-5 py-3 font-semibold">Ханш</th>
                <th className="px-5 py-3 font-semibold">Эх сурвалж</th>
                <th className="px-5 py-3 font-semibold">Утга</th>
                <th className="px-5 py-3 font-semibold">Огноо</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="text-slate-700">
                  <td className="px-5 py-4">
                    <TypeBadge type={transaction.type} />
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-950">
                    {transaction.senderAccount}
                  </td>
                  <td className="px-5 py-4">{transaction.receiverAccount}</td>
                  <td
                    className={`px-5 py-4 font-semibold ${
                      transaction.type === "income"
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {formatSignedAmount(transaction)}
                  </td>
                  <td className="px-5 py-4">
                    {transaction.exchangeRate === null
                      ? "-"
                      : `${formatNullableMoney(transaction.convertedAmount)} ${
                          transaction.convertedCurrency || ""
                        }`}
                  </td>
                  <td className="px-5 py-4">
                    {transaction.exchangeRate === null
                      ? "-"
                      : formatMoney(transaction.exchangeRate)}
                  </td>
                  <td className="px-5 py-4">
                    {formatRateSource(transaction.rateSource)}
                  </td>
                  <td className="px-5 py-4">{transaction.description}</td>
                  <td className="px-5 py-4">
                    {formatDate(transaction.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TypeBadge({ type }: { type: Transaction["type"] }) {
  const isIncome = type === "income";

  return (
    <span
      className={`rounded-md px-2 py-1 text-xs font-semibold ${
        isIncome
          ? "bg-emerald-100 text-emerald-700"
          : "bg-rose-100 text-rose-700"
      }`}
    >
      {isIncome ? "Орлого" : "Зарлага"}
    </span>
  );
}

function formatSignedAmount(transaction: Transaction) {
  const sign = transaction.type === "income" ? "+" : "-";
  return `${sign} ${formatMoney(transaction.amount)} ${transaction.currency}`;
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

function formatNullableMoney(value: number | null) {
  return value === null ? "-" : formatMoney(value);
}

function formatRateSource(value: string | null) {
  if (!value) {
    return "-";
  }

  if (value === "SAME_CURRENCY") {
    return "Ижил валют";
  }

  if (value === "EXTERNAL_API") {
    return "Гадаад API";
  }

  return value;
}
