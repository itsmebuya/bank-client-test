"use client";

import { FormEvent, useState } from "react";
import { createTransaction, getErrorMessage } from "@/lib/api";
import type { Account, Session, Transaction } from "@/lib/types";

type TransferFormProps = {
  accounts: Account[];
  session: Session;
  onTransferred: () => Promise<void>;
  onUnauthorized: () => void;
};

export function TransferForm({
  accounts,
  session,
  onTransferred,
  onUnauthorized,
}: TransferFormProps) {
  const [senderAccount, setSenderAccount] = useState("");
  const [receiverAccount, setReceiverAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [completedTransaction, setCompletedTransaction] =
    useState<Transaction | null>(null);
  const [completedTransactions, setCompletedTransactions] = useState<
    Transaction[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedSenderAccount = senderAccount || accounts[0]?.accountNumber || "";
  const selectedAccount = accounts.find(
    (account) => account.accountNumber === selectedSenderAccount,
  );
  const selectedCurrency = selectedAccount?.currency || "";

  function handleSenderChange(value: string) {
    setSenderAccount(value);
    setCompletedTransaction(null);
    setCompletedTransactions([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCompletedTransaction(null);
    setCompletedTransactions([]);

    const cleanReceiver = receiverAccount.trim();
    const cleanDescription = description.trim();
    const numericAmount = Number(amount);

    if (!selectedSenderAccount) {
      setError("Илгээгч данс заавал сонгоно.");
      return;
    }

    if (!cleanReceiver) {
      setError("Хүлээн авагчийн данс заавал оруулна.");
      return;
    }

    if (selectedSenderAccount === cleanReceiver) {
      setError("Илгээгч болон хүлээн авагч данс ижил байж болохгүй.");
      return;
    }

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError("Дүн 0-ээс их байх ёстой.");
      return;
    }

    if (!selectedCurrency) {
      setError("Валют заавал шаардлагатай.");
      return;
    }

    if (!cleanDescription) {
      setError("Гүйлгээний утга заавал оруулна.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createTransaction(
        session.token,
        {
          senderAccount: selectedSenderAccount,
          receiverAccount: cleanReceiver,
          amount: numericAmount,
          currency: selectedCurrency,
          description: cleanDescription,
        },
        onUnauthorized,
      );

      setReceiverAccount("");
      setAmount("");
      setDescription("");
      setSuccess(result.message);
      setCompletedTransaction(result.transaction);
      setCompletedTransactions(result.transactions || [result.transaction]);
      await onTransferred();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Шилжүүлэг</h2>
      <p className="mt-1 text-sm text-slate-500">
        Өөрийн данснаас хүлээн авагчийн данс руу мөнгө шилжүүлнэ.
      </p>

      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700 md:col-span-2">
          Илгээгч данс
          <select
            className="field mt-2"
            value={selectedSenderAccount}
            onChange={(event) => handleSenderChange(event.target.value)}
          >
            <option value="">Данс сонгох</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.accountNumber}>
                {account.accountNumber} · {account.currency} · Үлдэгдэл:{" "}
                {formatMoney(account.amount)}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">
            Илгээх валют: {selectedCurrency || "Данс сонгоно уу"}
          </p>
          {selectedAccount ? (
            <p className="mt-1 text-slate-500">
              Одоогийн үлдэгдэл: {formatMoney(selectedAccount.amount)}
            </p>
          ) : null}
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Хүлээн авагчийн данс
          <input
            className="field mt-2"
            onChange={(event) => setReceiverAccount(event.target.value)}
            placeholder="Хүлээн авагчийн дансны дугаар"
            value={receiverAccount}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Дүн
          <input
            className="field mt-2"
            min="0.01"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            step="0.01"
            type="number"
            value={amount}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Гүйлгээний утга
          <input
            className="field mt-2"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Гүйлгээний утга"
            value={description}
          />
        </label>

        <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-800 md:col-span-2">
          Хөрвүүлэлтийг backend хамгийн сүүлийн хадгалсан ханшаар тооцно.
        </div>

        <div className="space-y-3 md:col-span-2">
          {error ? <Message tone="error">{error}</Message> : null}
          {success ? (
            <Message tone="success">
              <p>{success}</p>
              {completedTransaction ? (
                <TransferSummary transaction={completedTransaction} />
              ) : null}
              {completedTransactions.length > 1 ? (
                <p className="mt-2 text-xs">
                  Үүссэн бичилт: {completedTransactions.length}
                </p>
              ) : null}
            </Message>
          ) : null}
        </div>

        <button
          className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 md:col-span-2"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Илгээж байна..." : "Шилжүүлэг хийх"}
        </button>
      </form>
    </section>
  );
}

function TransferSummary({ transaction }: { transaction: Transaction }) {
  return (
    <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
      <span>
        {transaction.type === "income" ? "Хүлээн авсан" : "Илгээсэн"}:{" "}
        {formatSignedAmount(transaction)}
      </span>
      {transaction.exchangeRate !== null ? (
        <>
          <span>
            Хөрвүүлсэн дүн: {formatNullableMoney(transaction.convertedAmount)}{" "}
            {transaction.convertedCurrency}
          </span>
          <span>Ханш: {formatMoney(transaction.exchangeRate)}</span>
          <span>Эх сурвалж: {formatRateSource(transaction.rateSource)}</span>
        </>
      ) : null}
    </div>
  );
}

function formatSignedAmount(transaction: Transaction) {
  const sign = transaction.type === "income" ? "+" : "-";
  return `${sign} ${formatMoney(transaction.amount)} ${transaction.currency}`;
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
