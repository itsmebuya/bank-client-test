import type {
  Account,
  AdminUser,
  AuthResponse,
  Currency,
  ExchangeRate,
  Transaction,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  token?: string;
  onUnauthorized?: () => void;
};

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const data = await readJson(response);

  if (!response.ok) {
    if (response.status === 401) {
      options.onUnauthorized?.();
    }

    const message =
      typeof data?.message === "string"
        ? data.message
        : "Алдаа гарлаа. Дахин оролдоно уу.";

    throw new ApiError(message, response.status);
  }

  return data as T;
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Алдаа гарлаа. Дахин оролдоно уу.";
}

export function login(username: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function register(username: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function listAccounts(token: string, onUnauthorized: () => void) {
  return apiRequest<{ accounts: Account[] }>("/api/accounts", undefined, {
    token,
    onUnauthorized,
  });
}

export function createAccount(
  token: string,
  payload: { currency: Currency; amount: number },
  onUnauthorized: () => void,
) {
  return apiRequest<{ message: string; account: Account }>(
    "/api/accounts",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { token, onUnauthorized },
  );
}

export function createTransaction(
  token: string,
  payload: {
    senderAccount: string;
    receiverAccount: string;
    amount: number;
    currency: Currency | string;
    description: string;
  },
  onUnauthorized: () => void,
) {
  return apiRequest<{
    message: string;
    transaction: Transaction;
    transactions?: Transaction[];
  }>(
    "/api/transactions",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { token, onUnauthorized },
  );
}

export function listTransactions(
  token: string,
  search: string,
  onUnauthorized: () => void,
) {
  const params = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";

  return apiRequest<{ transactions: Transaction[] }>(
    `/api/transactions${params}`,
    undefined,
    { token, onUnauthorized },
  );
}

export function listAdminUsers(token: string, onUnauthorized: () => void) {
  return apiRequest<{ users: AdminUser[] }>("/api/users", undefined, {
    token,
    onUnauthorized,
  });
}

export function getRates(token: string, onUnauthorized: () => void) {
  return apiRequest<{ rates: ExchangeRate[] }>("/api/rates", undefined, {
    token,
    onUnauthorized,
  });
}
