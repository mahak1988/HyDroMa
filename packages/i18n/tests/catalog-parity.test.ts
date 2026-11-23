import { describe, expect, it } from "vitest";

import { ar } from "../src/catalogs/ar";
import { de } from "../src/catalogs/de";
import { en } from "../src/catalogs/en";
import { es } from "../src/catalogs/es";
import { fa } from "../src/catalogs/fa";
import { fr } from "../src/catalogs/fr";
import { hi } from "../src/catalogs/hi";
import { id } from "../src/catalogs/id";
import { it as itCatalog } from "../src/catalogs/it";
import { ja } from "../src/catalogs/ja";
import { ko } from "../src/catalogs/ko";
import { pt } from "../src/catalogs/pt";
import { ru } from "../src/catalogs/ru";
import { tr } from "../src/catalogs/tr";
import { zh } from "../src/catalogs/zh";

type Dict = Record<string, unknown>;

/** Flatten nested catalog objects into sorted dot-paths of their leaves. */
function flatten(obj: Dict, prefix = ""): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      out.push(...flatten(value as Dict, path));
    } else {
      out.push(path);
    }
  }
  return out.sort();
}

/** Assert every leaf in the catalog is a string (no object/array leaked as a leaf). */
function assertStringLeaves(obj: Dict, prefix = ""): void {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      assertStringLeaves(value as Dict, path);
    } else {
      expect(typeof value, `${path} must be a string`).toBe("string");
    }
  }
}

const enKeys = flatten(en as unknown as Dict);
const faKeys = flatten(fa as unknown as Dict);
const arKeys = flatten(ar as unknown as Dict);
const deKeys = flatten(de as unknown as Dict);
const esKeys = flatten(es as unknown as Dict);
const frKeys = flatten(fr as unknown as Dict);
const hiKeys = flatten(hi as unknown as Dict);
const idKeys = flatten(id as unknown as Dict);
const itKeys = flatten(itCatalog as unknown as Dict);
const jaKeys = flatten(ja as unknown as Dict);
const koKeys = flatten(ko as unknown as Dict);
const ptKeys = flatten(pt as unknown as Dict);
const ruKeys = flatten(ru as unknown as Dict);
const trKeys = flatten(tr as unknown as Dict);
const zhKeys = flatten(zh as unknown as Dict);

describe("i18n catalog parity (runtime guard)", () => {
  it("fa exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(faKeys).toEqual(enKeys);
  });

  it("ar exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(arKeys).toEqual(enKeys);
  });

  it("es exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(esKeys).toEqual(enKeys);
  });

  it("de exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(deKeys).toEqual(enKeys);
  });

  it("fr exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(frKeys).toEqual(enKeys);
  });

  it("ja exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(jaKeys).toEqual(enKeys);
  });

  it("it exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(itKeys).toEqual(enKeys);
  });

  it("hi exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(hiKeys).toEqual(enKeys);
  });

  it("id exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(idKeys).toEqual(enKeys);
  });

  it("ko exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(koKeys).toEqual(enKeys);
  });

  it("pt exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(ptKeys).toEqual(enKeys);
  });

  it("ru exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(ruKeys).toEqual(enKeys);
  });

  it("tr exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(trKeys).toEqual(enKeys);
  });

  it("zh exposes exactly the same keys as en (no missing / no extra)", () => {
    expect(zhKeys).toEqual(enKeys);
  });

  it("catalog keys are unique (no duplicate dot-paths)", () => {
    expect(new Set(enKeys).size).toBe(enKeys.length);
  });

  it("every leaf value is a string", () => {
    assertStringLeaves(en as unknown as Dict);
    assertStringLeaves(fa as unknown as Dict);
    assertStringLeaves(ar as unknown as Dict);
    assertStringLeaves(de as unknown as Dict);
    assertStringLeaves(es as unknown as Dict);
    assertStringLeaves(fr as unknown as Dict);
    assertStringLeaves(hi as unknown as Dict);
    assertStringLeaves(id as unknown as Dict);
    assertStringLeaves(itCatalog as unknown as Dict);
    assertStringLeaves(ja as unknown as Dict);
    assertStringLeaves(ko as unknown as Dict);
    assertStringLeaves(pt as unknown as Dict);
    assertStringLeaves(ru as unknown as Dict);
    assertStringLeaves(tr as unknown as Dict);
    assertStringLeaves(zh as unknown as Dict);
  });

  it("catalogs are non-trivial", () => {
    expect(enKeys.length).toBeGreaterThan(100);
  });
});