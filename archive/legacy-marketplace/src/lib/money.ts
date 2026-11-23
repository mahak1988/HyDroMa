/**
 * Money helpers re-exported from the shared domain package.
 *
 * This module previously held a second, slightly different copy of the same
 * logic (it did not reject invalid currency codes). There is now one hardened
 * implementation in `@eco-nojin/domain-types`; this re-export keeps existing
 * imports (`../lib/money`) working.
 */
export { addMoney, formatMoney, minorDigits, multiplyMoney } from "@eco-nojin/domain-types";