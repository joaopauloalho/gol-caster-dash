import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useParticipant } from "@/hooks/useParticipant";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const mockFrom = (data: unknown, error: unknown = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
  (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
};

describe("useParticipant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when user is not logged in", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null });

    const { result } = renderHook(() => useParticipant());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.participant).toBeNull();
    expect(result.current.hasPaid).toBe(false);
  });

  it("returns participant and hasPaid=true when payment_confirmed", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: { id: "user-1" } });
    mockFrom({
      id: "part-1",
      full_name: "João Teste",
      username: "joao",
      payment_confirmed: true,
      is_test_user: false,
      plan: "pro-avista",
      state: "SP",
      city: "São Paulo",
      referral_code: "REF123",
      bonus_points: 0,
      favorite_team: null,
    });

    const { result } = renderHook(() => useParticipant());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.participant?.full_name).toBe("João Teste");
    expect(result.current.hasPaid).toBe(true);
  });

  it("returns hasPaid=true for is_test_user even without payment_confirmed", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: { id: "user-2" } });
    mockFrom({
      id: "part-2",
      full_name: "Tester",
      username: "tester1",
      payment_confirmed: false,
      is_test_user: true,
      plan: "basico",
      state: "SP",
      city: "Teste",
      referral_code: "TEST01",
      bonus_points: 0,
      favorite_team: null,
    });

    const { result } = renderHook(() => useParticipant());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasPaid).toBe(true);
  });

  it("returns hasPaid=false when neither payment_confirmed nor is_test_user", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: { id: "user-3" } });
    mockFrom({
      id: "part-3",
      full_name: "Sem Plano",
      username: null,
      payment_confirmed: false,
      is_test_user: false,
      plan: "basico",
      state: "RJ",
      city: "Rio",
      referral_code: "REF456",
      bonus_points: 0,
      favorite_team: null,
    });

    const { result } = renderHook(() => useParticipant());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasPaid).toBe(false);
  });
});
