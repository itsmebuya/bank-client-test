export type Role = "user" | "admin";

export type Currency = "MNT" | "USD" | "EUR";

export type User = {
  id: number;
  username: string;
  role: Role;
  createdAt: string;
};

export type Account = {
  id: number;
  accountNumber: string;
  currency: Currency | string;
  amount: number;
  accountType: string;
  createdAt: string;
  userId?: number;
};

export type Transaction = {
  id: number;
  senderAccount: string;
  receiverAccount: string;
  amount: number;
  currency: Currency | string;
  type: "income" | "expenses";
  exchangeRate: number | null;
  convertedAmount: number | null;
  convertedCurrency: string | null;
  rateSource: string | null;
  description: string;
  createdAt: string;
  userId: number;
};

export type ExchangeRate = {
  id: number;
  base: string;
  target: string;
  rate: number;
  source: string;
  createdAt: string;
};

export type AdminUser = User & {
  accounts: Omit<Account, "userId">[];
  _count: {
    accounts: number;
    transactions: number;
  };
};

export type Session = {
  token: string;
  user: User;
};

export type AuthResponse = Session;
