"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage, getRates } from "@/lib/api";
import type { ExchangeRate, Session } from "@/lib/types";

type AdminRatesProps = {
  session: Session;
  onUnauthorized: () => void;
};

export function AdminRates({ session, onUnauthorized }: AdminRatesProps) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRates = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const result = await getRates(session.token, onUnauthorized);
      setRates(result.rates);
    } catch (error) {
      setError(getErrorMessage(error) || "Валютын ханш уншиж чадсангүй.");
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, session.token]);

  useEffect(() => {
    if (session.user.role === "admin") {
      queueMicrotask(() => {
        loadRates();
      });
    }
  }, [loadRates, session.user.role]);

  const filteredRates = useMemo(() => {
    const value = appliedSearch.trim().toLowerCase();

    if (!value) {
      return rates;
    }

    return rates.filter((rate) =>
      [rate.base, rate.target, rate.source]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [appliedSearch, rates]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(search);
  }

  function clearSearch() {
    setSearch("");
    setAppliedSearch("");
  }

  if (session.user.role !== "admin") {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Одоогийн валютын ханш
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Backend database-д хадгалагдсан ханшууд.
          </p>
        </div>

        <button
          className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={loading}
          onClick={loadRates}
          type="button"
        >
          {loading ? "Ханш уншиж байна..." : "Ханш шинэчлэх"}
        </button>
      </div>

      <div className="border-b border-slate-100 px-5 py-4">
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSearch}>
          <input
            className="field h-10 sm:w-72"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="USD, MNT, EUR эсвэл эх сурвалжаар хайх"
            value={search}
          />
          <button
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
            type="submit"
          >
            Хайх
          </button>
          <button
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            onClick={clearSearch}
            type="button"
          >
            Цэвэрлэх
          </button>
        </form>
      </div>

      {loading ? (
        <p className="px-5 py-6 text-sm text-slate-500">Ханш уншиж байна...</p>
      ) : null}

      {error ? (
        <div className="m-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error || "Валютын ханш уншиж чадсангүй."}
        </div>
      ) : null}

      {!loading && !error && filteredRates.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">
          Валютын ханш олдсонгүй.
        </p>
      ) : null}

      {!error && filteredRates.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Хослол</th>
                <th className="px-5 py-3 font-semibold">Ханш</th>
                <th className="px-5 py-3 font-semibold">Эх сурвалж</th>
                <th className="px-5 py-3 font-semibold">Шинэчлэгдсэн</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRates.map((rate) => (
                <tr key={rate.id} className="text-slate-700">
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    {rate.base} -&gt; {rate.target}
                  </td>
                  <td className="px-5 py-4">{formatRate(rate.rate)}</td>
                  <td className="px-5 py-4">{rate.source}</td>
                  <td className="px-5 py-4">{formatDate(rate.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function formatRate(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("mn-MN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
