export type Purpose =
  | "sleep"
  | "relax"
  | "calm"
  | "focus"
  | "energy"
  | "mood"
  | "refresh"
  | "warmth";

export type EvidenceLevel = "A" | "B" | "C";

export type Note = "top" | "middle" | "base";

export type Caution = "pregnancy" | "children" | "pets" | "epilepsy";

export type DeviceId = "reed" | "nebulizer" | "ultrasonic";

export type ProductKind = "oil" | "ethanol" | "stick" | "bottle";

export interface Reference {
  id: string;
  citation: string;
  doi?: string;
}

export interface OilClaim {
  purpose: Purpose;
  /** 1 = 弱い傾向, 2 = 中程度, 3 = 主要な効果として報告 */
  strength: 1 | 2 | 3;
  evidence: EvidenceLevel;
  summary: string;
  refs: string[];
}

export interface Oil {
  id: string;
  name: string;
  latin: string;
  note: Note;
  constituents: string[];
  claims: OilClaim[];
  cautions: Caution[];
  safetyNote?: string;
}

export interface Product {
  id: string;
  kind: ProductKind;
  brand: string;
  name: string;
  /** 精油・エタノールは mL、スティックは本数 */
  size: number;
  unit: "mL" | "本";
  oilId?: string;
  asin?: string;
  searchQuery: string;
}

export type InventoryStatus = "new" | "in_use" | "unknown" | "empty";

export interface InventoryItem {
  id: string;
  productId?: string;
  kind: ProductKind;
  oilId?: string;
  brand: string;
  label: string;
  /** 容量（mL or 本） */
  size: number;
  unit: "mL" | "本";
  /** 残量。unknown の場合は null */
  remaining: number | null;
  status: InventoryStatus;
  /** 残りわずかとみなす閾値（未指定なら容量の 20%） */
  lowThreshold?: number;
  asin?: string;
  customUrl?: string;
  updatedAt: string;
}

export interface SafetyProfile {
  pregnancy: boolean;
  children: boolean;
  pets: boolean;
  epilepsy: boolean;
}

export interface Ofnr {
  observation: string;
  feelings: string[];
  needs: string[];
  request: string;
}

export interface BlendComponent {
  oilId: string;
  oilName: string;
  note: Note;
  productId: string;
  brand: string;
  productName: string;
  ml: number;
  drops: number;
  evidence: EvidenceLevel;
  /** 在庫から引き当てたアイテム ID（無ければ購入が必要） */
  inventoryItemId?: string;
  shortage: boolean;
}

export interface Blend {
  device: DeviceId;
  capacityMl: number;
  components: BlendComponent[];
  totalOilMl: number;
  totalDrops: number;
  ethanolMl: number;
  waterMl: number;
  ethanolProductId?: string;
  ethanolInventoryItemId?: string;
  ethanolShortage: boolean;
  instructions: string[];
  warnings: string[];
}

export interface Recipe {
  id: string;
  createdAt: string;
  title: string;
  ofnr: Ofnr;
  blend: Blend;
}

export interface UsageLog {
  id: string;
  recipeId: string;
  madeAt: string;
  deductions: { inventoryItemId: string; amount: number }[];
}
