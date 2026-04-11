import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSubscription } from "@/hooks/useSubscription";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const mockFrom = (data: unknown) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
  (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);
};

describe("useSubscription", () => {
  beforeEach(() => vi.clearAllMocks());

  it("isActive=false when no user", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isActive).toBe(false);
    expect(result.current.subscription).toBeNull();
  });

  it("isActive=true when payment_status=active", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: { id: "u1", email: "a@b.com" } });
    mockFrom({ id: "sub-1", plan: "pro-avista", payment_status: "active", amount: 25000 });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isActive).toBe(true);
  });

  it("isActive=false when payment_status=pending", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: { id: "u2", email: "b@b.com" } });
    mockFrom({ id: "sub-2", plan: "pro-avista", payment_status: "pending", amount: 25000 });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isActive).toBe(false);
  });
});
