import { describe, expect, it, beforeEach } from "vitest";
import { readStored, removeStored, writeStored } from "../src/storage";

describe("auth storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips a non-sensitive preference", () => {
    writeStored("eco.test.role", "seller");
    expect(readStored("eco.test.role")).toBe("seller");
    removeStored("eco.test.role");
    expect(readStored("eco.test.role")).toBeNull();
  });

  it("never throws when storage is unavailable", () => {
    const original = window.localStorage.setItem;
    // Simulate a blocked store (private mode / policy).
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
        removeItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(() => writeStored("k", "v")).not.toThrow();
    expect(readStored("k")).toBeNull();
    expect(() => removeStored("k")).not.toThrow();
    Object.defineProperty(window, "localStorage", { configurable: true, value: window.localStorage });
    void original;
  });
});