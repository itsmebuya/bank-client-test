import type { Account } from "@/lib/types";

export function AccountList({ accounts }: { accounts: Account[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">Дансууд</h2>
        <p className="mt-1 text-sm text-slate-500">
          Дансны дугаар, валют, үлдэгдэл болон төрөл.
        </p>
      </div>

      {accounts.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">
          Данс олдсонгүй. Эхлээд шинэ данс үүсгэнэ үү.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Дансны дугаар</th>
                <th className="px-5 py-3 font-semibold">Валют</th>
                <th className="px-5 py-3 font-semibold">Үлдэгдэл</th>
                <th className="px-5 py-3 font-semibold">Төрөл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((account) => (
                <tr key={account.id} className="text-slate-700">
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    {account.accountNumber}
                  </td>
                  <td className="px-5 py-4">{account.currency}</td>
                  <td className="px-5 py-4">
                    {formatMoney(account.amount)} {account.currency}
                  </td>
                  <td className="px-5 py-4 capitalize">
                    {formatAccountType(account.accountType)}
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

function formatAccountType(type: string) {
  return type === "regular" ? "Энгийн" : type;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value));
}
