import { describe, expect, it } from "vitest";
import { addMoney, formatMoney, minorDigits, multiplyMoney } from "../../src/lib/money";
import { addLine, cartCount, clampQuantity, groupBySeller, removeLine, setQuantity, totalsByCurrency } from "../../src/lib/cart-logic";
import { filterProducts } from "../../src/lib/filter";
import { PRODUCTS, SELLERS, sellerById } from "../../src/data/catalog";

const saffron = PRODUCTS.find((item) => item.slug === "saffron-kondor")!;
const walnut = PRODUCTS.find((item) => item.slug === "walnuts-kondor")!;
const dairy = PRODUCTS.find((item) => item.slug === "nomad-dairy")!;
const dateBox = PRODUCTS.find((item) => item.slug === "date-box-export")!;

describe("money", () => {
  it("formats IRR with two minor digits and EUR with two", () => {
    // IRR has 2 minor units per ISO 4217 (SIX List One, published 2026-09-17).
    // It was previously asserted as 0, which was the defect this corrects.
    expect(minorDigits("IRR")).toBe(2);
    expect(minorDigits("EUR")).toBe(2);
    expect(formatMoney({ amountMinor: 12500000, currency: "IRR" }, "en")).toMatch(/125,000\.00/);
    expect(formatMoney({ amountMinor: 1850, currency: "EUR" }, "en")).toMatch(/18\.50/);
    expect(formatMoney({ amountMinor: 1, currency: "IRR" }, "en")).toMatch(/0\.01/);
  });

  it("never adds different currencies", () => {
    expect(() => addMoney({ amountMinor: 1, currency: "IRR" }, { amountMinor: 1, currency: "EUR" })).toThrow();
  });

  it("multiplies without floating point drift", () => {
    expect(multiplyMoney({ amountMinor: 1850, currency: "EUR" }, 3)).toEqual({ amountMinor: 5550, currency: "EUR" });
  });
});

describe("cart logic", () => {
  it("clamps quantity to minOrder and stock", () => {
    expect(clampQuantity(walnut, 0)).toBe(walnut.minOrder);
    expect(clampQuantity(walnut, 9999)).toBe(walnut.stock);
  });

  it("merges repeated products and caps at stock", () => {
    let state = addLine([], saffron, 1);
    state = addLine(state, saffron, 2);
    expect(state).toHaveLength(1);
    expect(cartCount(state)).toBe(3);

    let capped = addLine([], walnut, walnut.stock);
    capped = addLine(capped, walnut, 5);
    expect(capped[0]?.quantity).toBe(walnut.stock);
  });

  it("updates and removes lines", () => {
    let state = addLine(addLine([], saffron, 1), walnut, 1);
    state = setQuantity(state, saffron, 2);
    expect(state.find((line) => line.productId === saffron.id)?.quantity).toBe(2);
    state = removeLine(state, saffron.id);
    expect(state).toHaveLength(1);
  });

  it("splits one cart into one group per seller", () => {
    const state = addLine(addLine([], saffron, 1), dairy, 2);
    const groups = groupBySeller(state, PRODUCTS, SELLERS);
    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.seller.id).sort()).toEqual(["sel-kondor", "sel-taleghan"]);
  });

  it("keeps totals per currency and never converts", () => {
    const state = addLine(addLine([], saffron, 1), dateBox, dateBox.minOrder);
    const totals = totalsByCurrency(groupBySeller(state, PRODUCTS, SELLERS));
    expect(Object.keys(totals).sort()).toEqual(["EUR", "IRR"]);
    expect(totals.EUR).toBe(dateBox.price.amountMinor * dateBox.minOrder);
    expect(totals.IRR).toBe(saffron.price.amountMinor);
  });
});

describe("catalog filters", () => {
  it("filters by category, seller, country and availability", () => {
    expect(filterProducts(PRODUCTS, { category: "handicrafts" }).every((p) => p.categoryId === "handicrafts")).toBe(true);
    expect(filterProducts(PRODUCTS, { seller: "sel-kondor" }).every((p) => p.sellerId === "sel-kondor")).toBe(true);
    expect(filterProducts(PRODUCTS, { country: "IR" })).toHaveLength(PRODUCTS.filter((p) => sellerById(p.sellerId)?.country === "IR").length);
    expect(filterProducts(PRODUCTS, { inStock: true }).every((p) => p.stock > 0)).toBe(true);
  });

  it("searches product and seller names", () => {
    const byProduct = filterProducts(PRODUCTS, { q: "saffron" });
    expect(byProduct.map((p) => p.slug)).toContain("saffron-kondor");
    const bySeller = filterProducts(PRODUCTS, { q: "taleghan" });
    expect(bySeller.length).toBeGreaterThan(0);
    expect(bySeller.every((p) => (sellerById(p.sellerId)?.name ?? "").toLowerCase().includes("taleghan"))).toBe(true);
  });

  it("sorts by price within the result set", () => {
    const ascending = filterProducts(PRODUCTS, { currency: "IRR", sort: "price-asc" });
    const prices = ascending.map((p) => p.price.amountMinor);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});