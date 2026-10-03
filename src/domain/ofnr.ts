import { DEVICES } from "./devices";
import { NEED_BY_ID } from "./needs";
import type { Blend, DeviceId, Ofnr } from "./types";

const DURATION: Record<DeviceId, string> = {
  reed: "これから数週間、部屋に置いて",
  nebulizer: "まず 15〜30 分",
  ultrasonic: "まず 30 分",
};

export function needLabels(needIds: string[]): string[] {
  return needIds.map((id) => NEED_BY_ID[id]?.label ?? id);
}

/** 肯定形・具体的・実行可能なリクエスト文を作る */
export function buildRequest(device: DeviceId, blend: Blend): string {
  const oils = blend.components.map((c) => c.oilName.replace(/（.*?）/g, "")).join("・");
  return `${DURATION[device]}、${DEVICES[device].label}で「${oils}」の香りを試してみませんか？`;
}

/** OFNR 4 要素をつないだ 1 文の要約 */
export function summarizeOfnr(ofnr: Ofnr): string {
  const o = ofnr.observation.trim() || "いまの状況";
  const f = ofnr.feelings.length ? ofnr.feelings.join("、") : "言葉にならない気持ち";
  const n = needLabels(ofnr.needs).join("と") || "自分を大切にすること";
  return `「${o}」という状況で、${f}と感じています。${n}を大切にしたいから。${ofnr.request}`;
}

export function recipeTitle(ofnr: Ofnr, device: DeviceId): string {
  const n = needLabels(ofnr.needs).slice(0, 2).join("・") || "わたし";
  return `${n}のための${DEVICES[device].label}ブレンド`;
}
