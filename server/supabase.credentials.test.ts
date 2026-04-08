import { describe, it, expect } from "vitest";

describe("Supabase credentials", () => {
  it("should have SUPABASE_URL set", () => {
    expect(process.env.SUPABASE_URL).toBeTruthy();
    expect(process.env.SUPABASE_URL).toContain("supabase.co");
  });

  it("should have SUPABASE_ANON_KEY set", () => {
    expect(process.env.SUPABASE_ANON_KEY).toBeTruthy();
    expect(process.env.SUPABASE_ANON_KEY!.length).toBeGreaterThan(20);
  });

  it("should be able to reach Supabase auth endpoint with anon key", async () => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_ANON_KEY!;
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
    });
    // 200 means auth service is reachable and key is valid
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("external");
  });
});
