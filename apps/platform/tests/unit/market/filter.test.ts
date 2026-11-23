import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../../../src/sections/market/data/catalog";
import { filterProducts } from "../../../src/sections/market/lib/filter";

/**
 * The list view's sort control writes `sort=price-asc|price-desc` to the URL and
 * the data layer must honour it. These tests pin the ordering so a UI that shows
 * a sort arrow cannot silently return unsorted rows.
 */
describe("filterProducts — price sorting", () => {
  it("sorts ascending by price", () => {
    const prices = filterProducts(PRODUCTS, { sort: "price-asc" }).map((product) => product.price.amountMinor);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("sorts descending by price", () => {
    const prices = filterProducts(PRODUCTS, { sort: "price-desc" }).map((product) => product.price.amountMinor);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it("keeps catalogue order for the default sort", () => {
    expect(filterProducts(PRODUCTS, {}).map((product) => product.id)).toEqual(PRODUCTS.map((product) => product.id));
    expect(filterProducts(PRODUCTS, { sort: "default" }).map((product) => product.id)).toEqual(
      PRODUCTS.map((product) => product.id),
    );
  });

  it("applies filters before sorting", () => {
    const result = filterProducts(PRODUCTS, { sort: "price-asc", inStock: true });
    expect(result.every((product) => product.stock > 0)).toBe(true);
    const prices = result.map((product) => product.price.amountMinor);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});