import type { DeviceId } from "./types";

/** 精油 1 mL あたりの滴数の目安（一般的なドロッパー） */
export const DROPS_PER_ML = 20;

export interface DeviceSpec {
  id: DeviceId;
  label: string;
  description: string;
  capacityPresets: number[];
  defaultCapacity: number;
  capacityLabel: string;
  usesEthanol: boolean;
  /** リード: 精油の体積比率 */
  oilRatio?: { min: number; default: number; max: number };
  /** 超音波: 水 100mL あたりの滴数 */
  dropsPer100ml?: { min: number; default: number; max: number };
}

export const DEVICES: Record<DeviceId, DeviceSpec> = {
  reed: {
    id: "reed",
    label: "リードディフューザー",
    description: "無水エタノールで希釈し、スティックで自然に香らせる。電源不要。",
    capacityPresets: [50, 100, 150, 200],
    defaultCapacity: 100,
    capacityLabel: "容器の容量",
    usesEthanol: true,
    oilRatio: { min: 0.15, default: 0.2, max: 0.25 },
  },
  nebulizer: {
    id: "nebulizer",
    label: "ネブライザー式",
    description: "原液を微粒子化して拡散。水もエタノールも使わず、香りが最も濃い。",
    capacityPresets: [10, 20, 30],
    defaultCapacity: 10,
    capacityLabel: "ボトルの容量",
    usesEthanol: false,
  },
  ultrasonic: {
    id: "ultrasonic",
    label: "超音波式",
    description: "水に数滴たらしてミストで拡散。加湿も兼ねる。",
    capacityPresets: [100, 200, 300, 500],
    defaultCapacity: 200,
    capacityLabel: "水タンクの容量",
    usesEthanol: false,
    dropsPer100ml: { min: 3, default: 4, max: 5 },
  },
};

export const DEVICE_IDS = Object.keys(DEVICES) as DeviceId[];

export interface DeviceAmounts {
  totalDrops: number;
  totalOilMl: number;
  ethanolMl: number;
  waterMl: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** デバイスと容量から、精油の総量・エタノール量・水量を決める */
export function deviceAmounts(device: DeviceId, capacityMl: number, intensity: "light" | "default" | "strong" = "default"): DeviceAmounts {
  const spec = DEVICES[device];
  const pick = (r: { min: number; default: number; max: number }) =>
    intensity === "light" ? r.min : intensity === "strong" ? r.max : r.default;

  switch (device) {
    case "reed": {
      const ratio = pick(spec.oilRatio!);
      const totalDrops = Math.round(capacityMl * ratio * DROPS_PER_ML);
      const totalOilMl = round1(totalDrops / DROPS_PER_ML);
      return { totalDrops, totalOilMl, ethanolMl: round1(capacityMl - totalOilMl), waterMl: 0 };
    }
    case "nebulizer": {
      const totalDrops = Math.round(capacityMl * DROPS_PER_ML);
      return { totalDrops, totalOilMl: round1(capacityMl), ethanolMl: 0, waterMl: 0 };
    }
    case "ultrasonic": {
      const totalDrops = Math.max(1, Math.round((capacityMl / 100) * pick(spec.dropsPer100ml!)));
      return { totalDrops, totalOilMl: round1(totalDrops / DROPS_PER_ML), ethanolMl: 0, waterMl: capacityMl };
    }
  }
}

export function deviceInstructions(device: DeviceId, capacityMl: number): string[] {
  switch (device) {
    case "reed":
      return [
        "清潔で乾いたガラス容器に、先に無水エタノールを入れます。",
        "精油を表の滴数どおりに加え、ふたをして静かに混ぜます。",
        `ラタンスティックを ${Math.max(3, Math.round(capacityMl / 20))} 本ほど挿し、香りが弱まったら上下を返します。`,
        "目安: 3〜6 週間。液が 1/5 程度になったら作り直しましょう。",
      ];
    case "nebulizer":
      return [
        "ネブライザー用の空ボトルに精油を表の順番（ベース→ミドル→トップ）で入れます。",
        "ふたをして軽く振り、本体に取り付けます。",
        "まずは 15〜30 分の運転から。換気をしながら使いましょう。",
      ];
    case "ultrasonic":
      return [
        `タンクの目盛りまで常温の水（約 ${capacityMl} mL）を入れます。`,
        "精油を表の滴数だけ水面にたらします。",
        "無水エタノールは樹脂部品を傷めるため入れないでください。",
        "使用後は毎日水を捨て、週 1 回はタンクを掃除しましょう。",
      ];
  }
}
