import type { Purpose } from "./types";

export const PURPOSES: Record<Purpose, { label: string; description: string }> = {
  sleep: { label: "睡眠", description: "眠りに入りやすく、休まる夜のために" },
  relax: { label: "リラックス", description: "体と心の緊張をゆるめる" },
  calm: { label: "安心・落ち着き", description: "不安やそわそわを静める" },
  focus: { label: "集中・明晰さ", description: "注意を保ち、頭をクリアに" },
  energy: { label: "活力", description: "目覚め・エネルギーを呼び起こす" },
  mood: {
    label: "気分・意欲",
    description: "前向きな気分と意欲を支える（ドーパミン系への作用は主に動物研究）",
  },
  refresh: { label: "リフレッシュ", description: "気分を切り替える・すっきりさせる" },
  warmth: { label: "温かさ・つながり", description: "やさしさ・親しみを感じる空間に" },
};

export const PURPOSE_IDS = Object.keys(PURPOSES) as Purpose[];
