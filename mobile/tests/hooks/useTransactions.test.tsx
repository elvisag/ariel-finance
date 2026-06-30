import { renderHook, act, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTransactions, useCreateTransaction, useDeleteTransaction } from "../../hooks/useTransactions";
import { transactionsApi } from "../../services/finance";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
}));

jest.mock("../../services/finance", () => ({
  __esModule: true,
  transactionsApi: {
    list: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    transfer: jest.fn(),
  },
}));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

const mockTx = (id: string, amount: number) => ({
  id,
  account_id: "a1",
  category_id: null,
  amount,
  description: `Tx ${id}`,
  type: "expense" as const,
  transaction_date: "2026-06-01",
  is_recurring: false,
  recurrence_frequency: null,
  recurrence_end_date: null,
  recurrence_last_date: null,
  created_at: "2026-06-01T00:00:00Z",
});

describe("useTransactions hook (paginated)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty transactions on initial load", async () => {
    (transactionsApi.list as jest.Mock).mockResolvedValue({
      data: { items: [], total: 0, skip: 0, limit: 50 },
    });

    const { result } = await renderHook(() => useTransactions(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.transactions).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.hasMore).toBe(false);
    });
  });

  it("loads and returns transactions", async () => {
    const items = [mockTx("1", 100), mockTx("2", 200)];
    (transactionsApi.list as jest.Mock).mockResolvedValue({
      data: { items, total: 2, skip: 0, limit: 50 },
    });

    const { result } = await renderHook(() => useTransactions(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
      expect(result.current.total).toBe(2);
      expect(result.current.hasMore).toBe(false);
    });
  });

  it("loadMore appends new items and tracks hasMore", async () => {
    const page1 = Array.from({ length: 50 }, (_, i) => mockTx(`p1-${i}`, i));
    const page2 = Array.from({ length: 10 }, (_, i) => mockTx(`p2-${i}`, i));

    (transactionsApi.list as jest.Mock).mockResolvedValueOnce({
      data: { items: page1, total: 60, skip: 0, limit: 50 },
    });
    (transactionsApi.list as jest.Mock).mockResolvedValueOnce({
      data: { items: page2, total: 60, skip: 50, limit: 50 },
    });

    const { result } = await renderHook(() => useTransactions(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(50);
      expect(result.current.hasMore).toBe(true);
    });

    act(() => result.current.loadMore());

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(60);
      expect(result.current.hasMore).toBe(false);
    });
  });

  it("does not loadMore when hasMore is false", async () => {
    (transactionsApi.list as jest.Mock).mockResolvedValue({
      data: { items: [mockTx("1", 100)], total: 1, skip: 0, limit: 50 },
    });

    const { result } = await renderHook(() => useTransactions(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
    });

    act(() => result.current.loadMore());

    expect(transactionsApi.list).toHaveBeenCalledTimes(1);
  });
});

describe("useCreateTransaction mutation", () => {
  it("calls transactionsApi.create on mutation", async () => {
    const tx = mockTx("new", 50);
    (transactionsApi.create as jest.Mock).mockResolvedValue({ data: tx });

    const { result } = await renderHook(() => useCreateTransaction(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync(tx);
    });

    expect(transactionsApi.create).toHaveBeenCalledWith(tx);
  });
});

describe("useDeleteTransaction mutation", () => {
  it("calls transactionsApi.delete on mutation", async () => {
    (transactionsApi.delete as jest.Mock).mockResolvedValue({});

    const { result } = await renderHook(() => useDeleteTransaction(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync("tx-1");
    });

    expect(transactionsApi.delete).toHaveBeenCalledWith("tx-1");
  });
});
