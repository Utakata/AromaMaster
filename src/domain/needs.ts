import type { Purpose } from "./types";

/** NVC の感情語。満たされているとき／満たされていないとき。 */
export const FEELINGS_MET = [
  "穏やか",
  "ほっとしている",
  "満ち足りている",
  "ワクワク",
  "楽しい",
  "感謝している",
  "好奇心がある",
  "生き生きしている",
] as const;

export const FEELINGS_UNMET = [
  "疲れている",
  "不安",
  "イライラ",
  "そわそわ",
  "悲しい",
  "寂しい",
  "焦っている",
  "ぼんやり",
  "退屈",
  "緊張している",
  "圧倒されている",
  "憂うつ",
] as const;

export interface Need {
  id: string;
  label: string;
  /** このニーズが満たされる方向に働く目的と重み */
  purposes: Partial<Record<Purpose, number>>;
}

export const NEEDS: Need[] = [
  { id: "rest", label: "休息", purposes: { sleep: 1, relax: 0.8 } },
  { id: "sleep", label: "よい眠り", purposes: { sleep: 1.2, relax: 0.5, calm: 0.3 } },
  { id: "safety", label: "安心・安全", purposes: { calm: 1, relax: 0.5 } },
  { id: "peace", label: "平和・落ち着き", purposes: { calm: 0.9, relax: 0.7 } },
  { id: "ease", label: "ゆとり", purposes: { relax: 1, calm: 0.4 } },
  { id: "focus", label: "集中", purposes: { focus: 1.2, refresh: 0.3 } },
  { id: "clarity", label: "明晰さ", purposes: { focus: 1, refresh: 0.6 } },
  { id: "vitality", label: "活力", purposes: { energy: 1, refresh: 0.5, mood: 0.3 } },
  { id: "motivation", label: "意欲・前進", purposes: { mood: 1, energy: 0.6 } },
  { id: "joy", label: "喜び・楽しさ", purposes: { mood: 1, warmth: 0.4 } },
  { id: "creativity", label: "創造性", purposes: { mood: 0.6, focus: 0.5, refresh: 0.4 } },
  { id: "connection", label: "つながり・温かさ", purposes: { warmth: 1, calm: 0.3 } },
  { id: "acceptance", label: "受容・やさしさ", purposes: { warmth: 0.8, calm: 0.5 } },
  { id: "order", label: "リズム・整い", purposes: { refresh: 0.7, focus: 0.4, sleep: 0.3 } },
];

export const NEED_BY_ID: Record<string, Need> = Object.fromEntries(NEEDS.map((n) => [n.id, n]));

/** 選んだニーズを目的ベクトルに変換し、最大値 1 に正規化する。 */
export function needsToPurposes(needIds: string[]): Partial<Record<Purpose, number>> {
  const acc: Partial<Record<Purpose, number>> = {};
  for (const id of needIds) {
    const need = NEED_BY_ID[id];
    if (!need) continue;
    for (const [p, w] of Object.entries(need.purposes) as [Purpose, number][]) {
      acc[p] = (acc[p] ?? 0) + w;
    }
  }
  const max = Math.max(0, ...Object.values(acc));
  if (max === 0) return {};
  for (const p of Object.keys(acc) as Purpose[]) acc[p] = (acc[p] ?? 0) / max;
  return acc;
}

/** 観察に評価・判断が混ざっていそうな語。見つけたら「観察」への言い換えをやさしく提案する。 */
const EVALUATIVE_WORDS = [
  "最悪",
  "ダメ",
  "だめ",
  "いつも",
  "絶対",
  "全然",
  "ひどい",
  "最低",
  "怠け",
  "だらしない",
  "無能",
  "べき",
  "ちゃんと",
  "普通は",
];

export function findEvaluativeWords(text: string): string[] {
  return EVALUATIVE_WORDS.filter((w) => text.includes(w));
}

/** 「〜された」「〜と思う」など、感情ではなく思考・解釈になっている表現の検出 */
const THOUGHT_PATTERNS: { pattern: RegExp; hint: string }[] = [
  { pattern: /と思(う|っ)/, hint: "「〜と思う」は考え（思考）かもしれません。体で感じている感情語を選んでみませんか？" },
  { pattern: /(無視された|見捨てられた|利用された|責められた|否定された)/, hint: "「〜された」は相手の行動への解釈です。そのとき自分の中にある感情（不安・悲しい等）に目を向けてみましょう。" },
];

export function findThoughtHints(text: string): string[] {
  return THOUGHT_PATTERNS.filter((t) => t.pattern.test(text)).map((t) => t.hint);
}
