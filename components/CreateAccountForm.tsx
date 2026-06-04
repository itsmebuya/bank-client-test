"use client";

import { FormEvent, useState } from "react";
import { createAccount, getErrorMessage } from "@/lib/api";
import type { Currency, Session } from "@/lib/types";

const currencies: Currency[] = ["MNT", "USD", "EUR"];

type CreateAccountFormProps = {
  session: Session;
  onCreated: () => Promise<void>;
  onUnauthorized: () => void;
};

export function CreateAccountForm({
  session,
  onCreated,
  onUnauthorized,
}: CreateAccountFormProps) {
  const [currency, setCurrency] = useState<Currency>("MNT");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const numericAmount = Number(amount);

    if (!currency) {
      setError("Дансны валют заавал сонгоно.");
      return;
    }

    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      setError("Эхний үлдэгдэл 0-ээс бага байж болохгүй.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createAccount(
        session.token,
        { currency, amount: numericAmount },
        onUnauthorized,
      );
      setAmount("");
      setSuccess(result.message || "Данс амжилттай үүслээ.");
      await onCreated();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">
        Данс үүсгэх
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        MNT, USD, EUR валютаар энгийн данс нээнэ.
      </p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Валют
          <select
            className="field mt-2"
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency)}
          >
            {currencies.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Эхний үлдэгдэл
          <input
            className="field mt-2"
            min="0"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            type="number"
            value={amount}
          />
        </label>

        {error ? <Message tone="error">{error}</Message> : null}
        {success ? <Message tone="success">{success}</Message> : null}

        <button
          className="h-10 w-full rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Үүсгэж байна..." : "Данс үүсгэх"}
        </button>
      </form>
    </section>
  );
}

function Message({
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
