import type { Oil } from "./types";

/**
 * 精油カタログ。
 * 根拠レベル: A = 系統的レビュー/メタ解析・複数RCT, B = 小規模なヒト研究, C = 動物・in vitro・総説のみ。
 * 禁忌は Tisserand & Young (2014) を中心とした一般的な安全指針にもとづく拡散（吸入）時の目安。
 */
export const OILS: Oil[] = [
  {
    id: "lavender",
    name: "ラベンダー（真正）",
    latin: "Lavandula angustifolia",
    note: "middle",
    constituents: ["リナロール", "酢酸リナリル"],
    claims: [
      { purpose: "sleep", strength: 3, evidence: "A", summary: "吸入で主観的な睡眠の質が改善（メタ解析・RCT）", refs: ["hwang2015", "lillehei2015"] },
      { purpose: "relax", strength: 3, evidence: "B", summary: "リナロールによる鎮静・抗不安作用の報告", refs: ["koulivand2013", "lehrner2005"] },
      { purpose: "calm", strength: 2, evidence: "B", summary: "待合室での不安低下", refs: ["lehrner2005"] },
    ],
    cautions: [],
  },
  {
    id: "bergamot",
    name: "ベルガモット（FCF）",
    latin: "Citrus bergamia",
    note: "top",
    constituents: ["リモネン", "酢酸リナリル", "リナロール"],
    claims: [
      { purpose: "calm", strength: 3, evidence: "B", summary: "副交感神経活動の上昇・唾液コルチゾール低下", refs: ["watanabe2015"] },
      { purpose: "relax", strength: 2, evidence: "B", summary: "気分状態（緊張・疲労）の改善", refs: ["watanabe2015"] },
      { purpose: "mood", strength: 2, evidence: "B", summary: "ネガティブ気分の軽減", refs: ["watanabe2015"] },
    ],
    cautions: ["pets"],
    safetyNote: "光毒性成分を除いた FCF タイプを推奨（拡散では影響は小さい）。",
  },
  {
    id: "sweet_orange",
    name: "スイートオレンジ",
    latin: "Citrus sinensis",
    note: "top",
    constituents: ["d-リモネン"],
    claims: [
      { purpose: "calm", strength: 2, evidence: "B", summary: "実験的不安課題での不安低下", refs: ["goes2012", "lehrner2005"] },
      { purpose: "mood", strength: 2, evidence: "B", summary: "気分の改善（歯科待合室）", refs: ["lehrner2005"] },
      { purpose: "warmth", strength: 2, evidence: "C", summary: "親しみやすく温かい印象の香り", refs: [] },
    ],
    cautions: ["pets"],
  },
  {
    id: "lemon",
    name: "レモン",
    latin: "Citrus limon",
    note: "top",
    constituents: ["d-リモネン", "γ-テルピネン"],
    claims: [
      { purpose: "mood", strength: 2, evidence: "C", summary: "マウスでセロトニン・ドーパミン系を介した抗ストレス作用", refs: ["komiya2006"] },
      { purpose: "refresh", strength: 2, evidence: "C", summary: "柑橘香による気分の切り替え", refs: ["komori1995"] },
      { purpose: "focus", strength: 1, evidence: "C", summary: "覚醒・リフレッシュ感の報告", refs: [] },
    ],
    cautions: ["pets"],
  },
  {
    id: "grapefruit",
    name: "グレープフルーツ",
    latin: "Citrus paradisi",
    note: "top",
    constituents: ["d-リモネン", "ヌートカトン"],
    claims: [
      { purpose: "energy", strength: 2, evidence: "C", summary: "ラットで交感神経活動を高める", refs: ["shen2005"] },
      { purpose: "refresh", strength: 2, evidence: "C", summary: "爽快感", refs: ["shen2005"] },
      { purpose: "mood", strength: 1, evidence: "C", summary: "柑橘香による気分の向上", refs: ["komori1995"] },
    ],
    cautions: ["pets"],
  },
  {
    id: "rosemary",
    name: "ローズマリー（シネオール）",
    latin: "Rosmarinus officinalis ct. cineole",
    note: "top",
    constituents: ["1,8-シネオール", "α-ピネン", "カンファー"],
    claims: [
      { purpose: "focus", strength: 3, evidence: "B", summary: "血中1,8-シネオール濃度と認知課題成績が相関", refs: ["moss2012", "moss2003"] },
      { purpose: "energy", strength: 2, evidence: "B", summary: "覚醒度・満足感の上昇", refs: ["moss2003"] },
    ],
    cautions: ["pregnancy", "children", "epilepsy", "pets"],
    safetyNote: "1,8-シネオール/カンファーを含むため、乳幼児・てんかん・妊娠中は避ける。",
  },
  {
    id: "peppermint",
    name: "ペパーミント",
    latin: "Mentha × piperita",
    note: "top",
    constituents: ["l-メントール", "メントン"],
    claims: [
      { purpose: "focus", strength: 2, evidence: "B", summary: "記憶課題の成績・覚醒度の向上", refs: ["moss2008"] },
      { purpose: "energy", strength: 2, evidence: "B", summary: "覚醒感の上昇", refs: ["moss2008"] },
      { purpose: "refresh", strength: 3, evidence: "C", summary: "メントールによる清涼感", refs: [] },
    ],
    cautions: ["children", "pets", "pregnancy"],
    safetyNote: "メントールは乳幼児の顔の近くでは使用しない。",
  },
  {
    id: "eucalyptus",
    name: "ユーカリ・グロブルス",
    latin: "Eucalyptus globulus",
    note: "top",
    constituents: ["1,8-シネオール"],
    claims: [
      { purpose: "refresh", strength: 3, evidence: "C", summary: "呼吸がすっきりする感覚", refs: [] },
      { purpose: "relax", strength: 1, evidence: "B", summary: "術後の疼痛・血圧低下の報告", refs: ["jun2013"] },
    ],
    cautions: ["children", "epilepsy", "pets"],
    safetyNote: "1,8-シネオールが多く、乳幼児・てんかんのある方は避ける。",
  },
  {
    id: "roman_chamomile",
    name: "ローマンカモミール",
    latin: "Chamaemelum nobile",
    note: "middle",
    constituents: ["アンゲリカ酸エステル類"],
    claims: [
      { purpose: "sleep", strength: 2, evidence: "C", summary: "伝統的な鎮静用途（ヒト吸入研究は限定的）", refs: ["srivastava2010"] },
      { purpose: "relax", strength: 2, evidence: "C", summary: "穏やかな鎮静作用", refs: ["srivastava2010"] },
    ],
    cautions: [],
    safetyNote: "キク科アレルギーのある方は注意。",
  },
  {
    id: "clary_sage",
    name: "クラリセージ",
    latin: "Salvia sclarea",
    note: "middle",
    constituents: ["酢酸リナリル", "リナロール", "スクラレオール"],
    claims: [
      { purpose: "mood", strength: 2, evidence: "B", summary: "更年期女性で血漿5-HT上昇・コルチゾール低下", refs: ["lee2014"] },
      { purpose: "relax", strength: 2, evidence: "B", summary: "ストレス指標の低下", refs: ["lee2014"] },
    ],
    cautions: ["pregnancy"],
    safetyNote: "妊娠中は避ける。飲酒時の使用は控えめに。",
  },
  {
    id: "geranium",
    name: "ゼラニウム",
    latin: "Pelargonium graveolens",
    note: "middle",
    constituents: ["シトロネロール", "ゲラニオール"],
    claims: [
      { purpose: "calm", strength: 2, evidence: "B", summary: "急性心筋梗塞患者の不安低下（三重盲検RCT）", refs: ["shirzadegan2017"] },
      { purpose: "warmth", strength: 2, evidence: "C", summary: "華やかで柔らかな香り", refs: [] },
    ],
    cautions: ["pets"],
  },
  {
    id: "ylang_ylang",
    name: "イランイラン",
    latin: "Cananga odorata",
    note: "middle",
    constituents: ["リナロール", "ゲルマクレンD", "酢酸ベンジル"],
    claims: [
      { purpose: "calm", strength: 2, evidence: "B", summary: "血圧・脈拍の低下と落ち着き・リラックス感の上昇", refs: ["hongratanaworakit2004", "moss2008"] },
      { purpose: "warmth", strength: 2, evidence: "B", summary: "調和的な気分（harmonizing effect）", refs: ["hongratanaworakit2004"] },
      { purpose: "mood", strength: 1, evidence: "B", summary: "気分の向上", refs: ["hongratanaworakit2004"] },
    ],
    cautions: ["pets"],
    safetyNote: "香りが強いので少量から。集中したい場面では覚醒度を下げることがある。",
  },
  {
    id: "hinoki",
    name: "ヒノキ",
    latin: "Chamaecyparis obtusa",
    note: "middle",
    constituents: ["α-ピネン", "δ-カジネン"],
    claims: [
      { purpose: "relax", strength: 2, evidence: "B", summary: "前頭前野活動の鎮静・副交感神経活動の上昇", refs: ["ikei2015"] },
      { purpose: "calm", strength: 2, evidence: "B", summary: "快適感・鎮静感の上昇", refs: ["ikei2015"] },
      { purpose: "focus", strength: 1, evidence: "C", summary: "森林浴様の落ち着いた集中", refs: [] },
    ],
    cautions: [],
  },
  {
    id: "sandalwood",
    name: "サンダルウッド",
    latin: "Santalum album",
    note: "base",
    constituents: ["α-サンタロール", "β-サンタロール"],
    claims: [
      { purpose: "focus", strength: 2, evidence: "B", summary: "主観的な注意・覚醒度の上昇（落ち着いた覚醒）", refs: ["heuberger2006"] },
      { purpose: "warmth", strength: 2, evidence: "C", summary: "温かく深みのある香り", refs: [] },
    ],
    cautions: [],
  },
  {
    id: "frankincense",
    name: "フランキンセンス",
    latin: "Boswellia carterii",
    note: "base",
    constituents: ["α-ピネン", "リモネン", "インセンソール"],
    claims: [
      { purpose: "calm", strength: 2, evidence: "C", summary: "マウスで TRPV3 を介した抗不安様作用", refs: ["moussaieff2008"] },
      { purpose: "relax", strength: 2, evidence: "C", summary: "瞑想に用いられてきた香り", refs: ["moussaieff2008"] },
      { purpose: "sleep", strength: 1, evidence: "C", summary: "深い呼吸を促す香り", refs: [] },
    ],
    cautions: [],
  },
];

export const OIL_BY_ID: Record<string, Oil> = Object.fromEntries(OILS.map((o) => [o.id, o]));
