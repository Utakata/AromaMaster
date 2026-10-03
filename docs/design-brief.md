# Claude Design への依頼書（UI/UX）

現状の UI は「機能を完成させるための土台」です。見た目は Claude Design の成果物で差し替える前提で、
**色・余白・角丸・影・フォントはすべて `src/styles/tokens.css` の CSS 変数** から参照しています。
コンポーネントは `src/components/ui/` に集約しているため、トークンとこのディレクトリの差し替えで全画面に反映されます。

## ブランドの方向性
- 穏やか・信頼できる・押し付けない（NVC の「評価しない」トーン）
- 植物・香りを想起させる自然色。ダークモード対応必須。
- 科学的根拠（A/B/C レベル）が一目で分かる表現。

## 画面一覧と状態
| 画面 | パス | 主な状態 |
|---|---|---|
| ダッシュボード | `/` | 在庫アラート（なくなった/残りわずか/わからない）、最近の調合、はじめる CTA |
| OFNR ウィザード | `/blend` | 4 ステップ + 結果。評価語ヒント、未選択時の無効状態 |
| 在庫 | `/inventory` | 一覧・フィルタ、状態変更、残量メーター、追加フォーム、再購入ボタン |
| 調合レシピ | `/recipes` | 保存一覧、「作った」記録、削除 |
| 精油ライブラリ | `/library` | 主成分・根拠レベル・文献・禁忌 |
| 設定 | `/settings` | 安全設定（妊娠中/ペット/小児/てんかん）、プッシュ通知、ログイン |

## トークン（差し替え対象）
`--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-primary`, `--color-primary-contrast`,
`--color-accent`, `--color-danger`, `--color-warning`, `--color-success`, `--color-border`,
`--evidence-a`, `--evidence-b`, `--evidence-c`,
`--radius-sm/md/lg`, `--space-1..8`, `--shadow-card`, `--font-sans`。

## コンポーネント
Button / Card / Chip / Stepper / Meter / Badge(EvidenceBadge, StatusBadge) / Field。
