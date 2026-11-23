/**
 * Reference-data seed for the Eco Nojin API.
 *
 * Deliberately minimal: only shared reference data that the platform needs to
 * operate (catalog category taxonomy). Sellers, products, landscapes, villages,
 * farms and reports are real user data and are created through the API/UI —
 * never by seeding.
 *
 * Run: npm run seed -w @eco-nojin/api   (or node services/api/scripts/seed.mjs)
 */
import { database, audit } from "../src/db.mjs";

const CATEGORIES = [
  { id: "cat.crops", parentId: null, labelKey: "market.roots.crops" },
  { id: "cat.livestock", parentId: null, labelKey: "market.roots.livestock" },
  { id: "cat.inputs", parentId: null, labelKey: "market.roots.inputs" },
  { id: "cat.equipment", parentId: null, labelKey: "market.roots.equipment" },
  { id: "cat.services", parentId: null, labelKey: "market.roots.services" },
  { id: "cat.handicrafts", parentId: null, labelKey: "market.roots.handicrafts" },
  { id: "cat.crops.grains", parentId: "cat.crops", labelKey: "market.grains" },
  { id: "cat.crops.legumes", parentId: "cat.crops", labelKey: "market.legumes" },
  { id: "cat.crops.fruits", parentId: "cat.crops", labelKey: "market.fruits" },
  { id: "cat.inputs.fertilizer", parentId: "cat.inputs", labelKey: "market.fertilizer" },
  { id: "cat.inputs.seeds", parentId: "cat.inputs", labelKey: "market.seeds" },
  { id: "cat.services.water", parentId: "cat.services", labelKey: "market.waterServices" },
];

const db = database();
const insert = db.prepare("INSERT INTO categories (id, parent_id, label_key) VALUES (?, ?, ?)");

let inserted = 0;
for (const category of CATEGORIES) {
  const exists = db.prepare("SELECT id FROM categories WHERE id = ?").get(category.id);
  if (exists) continue;
  insert.run(category.id, category.parentId, category.labelKey);
  inserted += 1;
}
audit(db, { action: "seed.categories", entity: "category", detail: { inserted } });
console.log(`categories seeded: ${inserted} new (total ${db.prepare("SELECT COUNT(*) AS n FROM categories").get().n})`);
