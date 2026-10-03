import { DEVICES, DROPS_PER_ML, deviceAmounts, deviceInstructions } from "./devices";
import { isAvailable } from "./inventory";
import { OILS } from "./oils";
import { DEFAULT_ETHANOL_PRODUCT_ID, PRODUCT_BY_ID, productsForOil } from "./products";
import type {
  Blend,
  BlendComponent,
  Caution,
  DeviceId,
  EvidenceLevel,
  InventoryItem,
  Note,
  Oil,
  Purpose,
  SafetyProfile,
} from "./types";

export const EVIDENCE_FACTOR: Record<EvidenceLevel, number> = { A: 1, B: 0.8, C: 0.5 };
const NOTE_WEIGHT: Record<Note, number> = { top: 0.3, middle: 0.5, base: 0.2 };
const NOTE_ORDER: Note[] = ["top", "middle", "base"];
const OWNED_BONUS = 1.5;
const MAX_OILS = 4;

const CAUTION_LABEL: Record<Caution, string> = {
  pregnancy: "妊娠中",
  children: "乳幼児がいる",
  pets: "ペット（特に猫）がいる",
  epilepsy: "てんかんの既往",
};

export interface BlendInput {
  device: DeviceId;
  capacityMl: number;
  purposes: Partial<Record<Purpose, number>>;
  inventory?: InventoryItem[];
  preferOwned?: boolean;
  safety?: SafetyProfile;
  intensity?: "light" | "default" | "strong";
}

export interface ScoredOil {
  oil: Oil;
  score: number;
  owned?: InventoryItem;
  evidence: EvidenceLevel;
}

export function scoreOil(oil: Oil, purposes: Partial<Record<Purpose, number>>): { score: number; evidence: EvidenceLevel } {
  let score = 0;
  let best: { contrib: number; evidence: EvidenceLevel } = { contrib: 0, evidence: "C" };
  for (const c of oil.claims) {
    const contrib = c.strength * EVIDENCE_FACTOR[c.evidence] * (purposes[c.purpose] ?? 0);
    score += contrib;
    if (contrib > best.contrib) best = { contrib, evidence: c.evidence };
  }
  return { score, evidence: best.evidence };
}

export function excludedByCaution(oil: Oil, safety?: SafetyProfile): Caution[] {
  if (!safety) return [];
  return oil.cautions.filter((c) => safety[c]);
}

function findOwned(oilId: string, inventory: InventoryItem[]): InventoryItem | undefined {
  const candidates = inventory.filter((i) => i.kind === "oil" && i.oilId === oilId && isAvailable(i));
  // 残量が多いものを優先（不明は後回し）
  return candidates.sort((a, b) => (b.remaining ?? -1) - (a.remaining ?? -1))[0];
}

export function rankOils(input: BlendInput): { ranked: ScoredOil[]; excluded: { oil: Oil; reasons: Caution[] }[] } {
  const inventory = input.inventory ?? [];
  const excluded: { oil: Oil; reasons: Caution[] }[] = [];
  const ranked: ScoredOil[] = [];
  for (const oil of OILS) {
    const { score, evidence } = scoreOil(oil, input.purposes);
    if (score <= 0) continue;
    const reasons = excludedByCaution(oil, input.safety);
    if (reasons.length) {
      excluded.push({ oil, reasons });
      continue;
    }
    const owned = findOwned(oil.id, inventory);
    ranked.push({ oil, score: input.preferOwned && owned ? score * OWNED_BONUS : score, owned, evidence });
  }
  ranked.sort((a, b) => b.score - a.score || a.oil.id.localeCompare(b.oil.id));
  return { ranked, excluded };
}

function selectOils(ranked: ScoredOil[]): ScoredOil[] {
  if (ranked.length === 0) return [];
  const best = ranked[0].score;
  const selected: ScoredOil[] = [];
  for (const note of NOTE_ORDER) {
    const pick = ranked.find((r) => r.oil.note === note && r.score >= best * 0.25);
    if (pick) selected.push(pick);
  }
  for (const r of ranked) {
    if (selected.length >= MAX_OILS) break;
    if (selected.includes(r)) continue;
    if (selected.length < 2 || r.score >= best * 0.7) selected.push(r);
  }
  return selected.sort((a, b) => NOTE_ORDER.indexOf(a.oil.note) - NOTE_ORDER.indexOf(b.oil.note));
}

/** 最大剰余法で合計を正確に保ちつつ、各成分に最低 1 滴を割り当てる */
export function allocateDrops(weights: number[], total: number): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const sum = weights.reduce((a, b) => a + b, 0);
  const free = total - n;
  const raw = weights.map((w) => (w / sum) * free);
  const drops = raw.map((r) => 1 + Math.floor(r));
  let rest = total - drops.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; rest > 0; k = (k + 1) % n, rest--) drops[order[k].i] += 1;
  return drops;
}

export function computeBlend(input: BlendInput): Blend {
  const inventory = input.inventory ?? [];
  const purposes = Object.keys(input.purposes).length ? input.purposes : { relax: 1 };
  const { ranked, excluded } = rankOils({ ...input, purposes });
  const amounts = deviceAmounts(input.device, input.capacityMl, input.intensity);

  let selected = selectOils(ranked);
  if (selected.length > amounts.totalDrops) {
    selected = [...selected].sort((a, b) => b.score - a.score).slice(0, amounts.totalDrops);
    selected.sort((a, b) => NOTE_ORDER.indexOf(a.oil.note) - NOTE_ORDER.indexOf(b.oil.note));
  }

  const best = selected.reduce((m, s) => Math.max(m, s.score), 0) || 1;
  const weights = selected.map((s) => NOTE_WEIGHT[s.oil.note] * (0.5 + 0.5 * (s.score / best)));
  const drops = allocateDrops(weights, amounts.totalDrops);

  const components: BlendComponent[] = selected.map((s, idx) => {
    const product =
      (s.owned?.productId && PRODUCT_BY_ID[s.owned.productId]) || productsForOil(s.oil.id)[0];
    const ml = Math.round((drops[idx] / DROPS_PER_ML) * 100) / 100;
    const shortage = !s.owned || (s.owned.remaining !== null && s.owned.remaining < ml);
    return {
      oilId: s.oil.id,
      oilName: s.oil.name,
      note: s.oil.note,
      productId: product.id,
      brand: s.owned?.brand ?? product.brand,
      productName: s.owned?.label ?? product.name,
      ml,
      drops: drops[idx],
      evidence: s.evidence,
      inventoryItemId: s.owned?.id,
      shortage,
    };
  });

  const ethanolItem = DEVICES[input.device].usesEthanol
    ? inventory
        .filter((i) => i.kind === "ethanol" && isAvailable(i))
        .sort((a, b) => (b.remaining ?? -1) - (a.remaining ?? -1))[0]
    : undefined;
  const ethanolShortage =
    amounts.ethanolMl > 0 && (!ethanolItem || (ethanolItem.remaining !== null && ethanolItem.remaining < amounts.ethanolMl));

  const warnings: string[] = [];
  for (const e of excluded) {
    warnings.push(`${e.oil.name} は「${e.reasons.map((r) => CAUTION_LABEL[r]).join("・")}」の設定のため除外しました。`);
  }
  if (input.safety?.pets) warnings.push("猫や小鳥は精油の代謝が苦手です。同じ部屋での長時間の拡散は避け、換気をしてください。");
  for (const c of components) {
    const oil = OILS.find((o) => o.id === c.oilId);
    if (oil?.safetyNote) warnings.push(`${oil.name}: ${oil.safetyNote}`);
  }
  if (components.some((c) => c.evidence === "C")) {
    warnings.push("根拠レベル C の精油は、動物研究や伝統的な使用にもとづく参考情報です。");
  }
  for (const c of components) {
    if (c.inventoryItemId && inventory.find((i) => i.id === c.inventoryItemId)?.remaining === null) {
      warnings.push(`${c.productName} は残量が「わからない」状態です。作る前に確認しましょう。`);
    }
  }

  return {
    device: input.device,
    capacityMl: input.capacityMl,
    components,
    totalOilMl: amounts.totalOilMl,
    totalDrops: amounts.totalDrops,
    ethanolMl: amounts.ethanolMl,
    waterMl: amounts.waterMl,
    ethanolProductId: amounts.ethanolMl > 0 ? ethanolItem?.productId ?? DEFAULT_ETHANOL_PRODUCT_ID : undefined,
    ethanolInventoryItemId: amounts.ethanolMl > 0 ? ethanolItem?.id : undefined,
    ethanolShortage,
    instructions: deviceInstructions(input.device, input.capacityMl),
    warnings,
  };
}
