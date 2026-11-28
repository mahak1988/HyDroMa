import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { ChallengesModule } from "../../../src/sections/rewards/ChallengesModule";
import { RewardsModule } from "../../../src/sections/rewards/RewardsModule";

describe("ChallengesModule (challenge catalogue & verified participation)", () => {
  it("creates a challenge (no client status) with code, title and reward rule", async () => {
    const api = makeApi();
    api.challenges.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.rewards.listRules.mockResolvedValue({ items: [{ id: "r1", code: "water", title: "Water saving", ecoCoinAmount: 50, issuanceLimit: null, status: "active", description: "", createdAt: "", updatedAt: "" }], nextCursor: null, total: 1 });
    api.challenges.create.mockResolvedValue({ id: "c1", status: "draft" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<ChallengesModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن چالش|add challenge/i }));
    const byId = (id: string) => document.getElementById(id) as HTMLInputElement;
    fireEvent.change(byId("chl-code"), { target: { value: "plant-trees" } });
    fireEvent.change(byId("chl-title"), { target: { value: "Plant 100 trees" } });
    fireEvent.change(byId("chl-rule"), { target: { value: "r1" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    await waitFor(() =>
      expect(api.challenges.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: "plant-trees", title: "Plant 100 trees", rewardRuleId: "r1" }),
      ),
    );
    const payload = api.challenges.create.mock.calls[0]![0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("status");
  });

  it("hides management actions for a viewer", async () => {
    const api = makeApi();
    api.challenges.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.rewards.listRules.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<ChallengesModule />);

    expect(await screen.findByText(/نقش write|write role/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /افزودن چالش|add challenge/i })).not.toBeInTheDocument();
  });
});

describe("RewardsModule (EcoCoin summary, rules, ledger)", () => {
  it("shows the caller's reconstructible balance and is read-only for a viewer", async () => {
    const api = makeApi();
    api.ecocoin.summary.mockResolvedValue({ balance: 30, totalCredits: 30, totalDebits: 0, entryCount: 1, bySource: { challenge_reward: 30 } });
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<RewardsModule />);

    expect((await screen.findAllByText("30")).length).toBeGreaterThan(0);
    expect(screen.getByText(/نقش write|write role/i)).toBeInTheDocument();
    // Viewer never triggers the restricted rules/ledger queries.
    expect(api.rewards.listRules).not.toHaveBeenCalled();
    expect(api.ecocoin.ledger).not.toHaveBeenCalled();
  });

  it("renders reward rules and the ledger for a write role", async () => {
    const api = makeApi();
    api.ecocoin.summary.mockResolvedValue({ balance: 0, totalCredits: 0, totalDebits: 0, entryCount: 0, bySource: {} });
    api.rewards.listRules.mockResolvedValue({ items: [{ id: "r1", code: "water", title: "Water saving", ecoCoinAmount: 50, issuanceLimit: 100, status: "active", description: "", createdAt: "", updatedAt: "" }], nextCursor: null, total: 1 });
    api.ecocoin.ledger.mockResolvedValue({ items: [{ id: "e1", userId: "u1", entryType: "credit", amount: 50, reason: "Challenge reward", source: "challenge_reward", reference: "challenge-reward:p1", challengeId: null, participationId: null, rewardRuleId: "r1", at: "2026-11-25" }], nextCursor: null, total: 1 });
    api.users.list.mockResolvedValue({ items: [{ id: "u1", name: "Member", email: "m@x.local" }], nextCursor: null, total: 1 });
    api.ecocoin.reconcile.mockResolvedValue({ totalBalance: 50, entryCount: 1, memberCount: 1, balances: [], anomalies: [] });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<RewardsModule />);

    expect(await screen.findByText("Water saving")).toBeInTheDocument();
    expect(screen.getByText("challenge_reward")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /افزودن قاعده|add rule/i })).toBeInTheDocument();
  });

  it("paginates the ledger with real cursors and filters by entry type", async () => {
    const api = makeApi();
    api.ecocoin.summary.mockResolvedValue({ balance: 0, totalCredits: 0, totalDebits: 0, entryCount: 0, bySource: {} });
    api.rewards.listRules.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.users.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.ecocoin.reconcile.mockResolvedValue({ totalBalance: 0, entryCount: 0, memberCount: 0, balances: [], anomalies: [] });
    api.ecocoin.ledger
      .mockResolvedValueOnce({ items: [{ id: "e1", userId: "u1", entryType: "credit", amount: 50, reason: "Challenge reward", source: "challenge_reward", reference: "challenge-reward:p1", challengeId: "c1", participationId: "p1", rewardRuleId: "r1", at: "2026-11-25" }], nextCursor: "CUR", total: 2 })
      .mockResolvedValueOnce({ items: [{ id: "e2", userId: "u1", entryType: "debit", amount: 5, reason: "Correction", source: "admin_adjustment", reference: "adjustment:a1", challengeId: null, participationId: null, rewardRuleId: null, at: "2026-11-24" }], nextCursor: null, total: 2 });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<RewardsModule />);

    expect(await screen.findByText("Challenge reward")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /بعدی|next/i }));
    await waitFor(() =>
      expect(api.ecocoin.ledger).toHaveBeenLastCalledWith(
        expect.objectContaining({ cursor: "CUR" }),
        expect.anything(),
      ),
    );

    const typeSelect = Array.from(document.querySelectorAll("select")).find((select) =>
      Array.from((select as HTMLSelectElement).options).some((option) => option.value === "debit"),
    ) as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: "debit" } });
    await waitFor(() =>
      expect(api.ecocoin.ledger).toHaveBeenLastCalledWith(
        expect.objectContaining({ entryType: "debit", cursor: undefined }),
        expect.anything(),
      ),
    );
  });

  it("lists pending reward requests and approves them for an admin (four-eyes)", async () => {
    const api = makeApi();
    api.ecocoin.summary.mockResolvedValue({ balance: 0, totalCredits: 0, totalDebits: 0, entryCount: 0, bySource: {} });
    api.rewards.listRules.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.users.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.ecocoin.reconcile.mockResolvedValue({ totalBalance: 0, entryCount: 0, memberCount: 0, balances: [], anomalies: [] });
    api.ecocoin.ledger.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.ecocoin.listAdjustmentRequests.mockResolvedValue({
      items: [{ id: "q1", orgId: "o1", requestedBy: "u2", targetUserId: "u1", entryType: "credit", amount: 10, reason: "fix-balance", status: "requested", approverId: null, decisionNote: null, decidedAt: null, executedAt: null, executionReference: null, createdAt: "2026-11-25" }],
      nextCursor: null,
      total: 1,
    });
    api.ecocoin.approveAdjustmentRequest.mockResolvedValue({});
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<RewardsModule />);

    expect(await screen.findByText("fix-balance")).toBeInTheDocument();
    const row = screen.getByText("fix-balance").closest("tr") as HTMLElement;
    fireEvent.click(row.querySelector("button")!);
    await waitFor(() => expect(api.ecocoin.approveAdjustmentRequest).toHaveBeenCalledWith("q1", undefined));
  });
});