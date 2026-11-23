import { describe, expect, it } from "vitest";
import { DECK_LAYER_BY_KIND, deckPropsFromDescriptor } from "../src/deck";
import { validateLayerDescriptor } from "../src/layer";

describe("deck adapter", () => {
  it("maps every spatial kind to a deck.gl class", () => {
    const kinds = Object.keys(DECK_LAYER_BY_KIND);
    expect(kinds.length).toBe(11);
    for (const kind of kinds) {
      expect(typeof DECK_LAYER_BY_KIND[kind as keyof typeof DECK_LAYER_BY_KIND]).toBe("string");
    }
  });

  it("derives deck props from a descriptor", () => {
    const result = validateLayerDescriptor({
      id: "l1",
      label: "Layer",
      kind: "point",
      visible: true,
      opacity: 0.5,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const props = deckPropsFromDescriptor(result.value);
    expect(props.id).toBe("l1");
    expect(props.opacity).toBe(0.5);
    expect(props.visible).toBe(true);
  });
});