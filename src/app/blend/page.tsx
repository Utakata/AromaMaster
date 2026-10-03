"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BlendTable } from "@/components/BlendTable";
import { Button, Card, Chip, Field, Notice, PageTitle, Stepper, inputClass } from "@/components/ui";
import { computeBlend, rankOils } from "@/domain/blendEngine";
import { DEVICES, DEVICE_IDS } from "@/domain/devices";
import { createItemFromProduct } from "@/domain/inventory";
import {
  FEELINGS_MET,
  FEELINGS_UNMET,
  NEEDS,
  findEvaluativeWords,
  findThoughtHints,
  needsToPurposes,
} from "@/domain/needs";
import { buildRequest, recipeTitle, summarizeOfnr } from "@/domain/ofnr";
import { PRODUCT_BY_ID } from "@/domain/products";
import { PURPOSES } from "@/domain/purposes";
import type { DeviceId, Ofnr, Purpose, Recipe } from "@/domain/types";
import { newId, useAppData } from "@/lib/store";

const STEPS = ["観察", "感情", "ニーズ", "リクエスト", "調合"];

const OBS_EXAMPLES = [
  "23時、寝室で布団に入って30分たっても眠れていない",
  "14時、デスクで同じ資料を3回読み直している",
  "朝7時、アラームを2回止めてまだ起き上がれていない",
  "夕方、帰宅してからソファで1時間スマホを見ている",
];

export default function BlendPage() {
  const router = useRouter();
  const { inventory, safety, ready, saveRecipe, saveInventory, recordMade } = useAppData();
  const [step, setStep] = useState(0);
  const [observation, setObservation] = useState("");
  const [feelings, setFeelings] = useState<string[]>([]);
  const [feelingNote, setFeelingNote] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [device, setDevice] = useState<DeviceId>("ultrasonic");
  const [capacity, setCapacity] = useState<number>(DEVICES.ultrasonic.defaultCapacity);
  const [intensity, setIntensity] = useState<"light" | "default" | "strong">("default");
  const [preferOwned, setPreferOwned] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const evaluative = findEvaluativeWords(observation);
  const thoughtHints = findThoughtHints(feelingNote);
  const purposes = useMemo(() => needsToPurposes(needs), [needs]);

  const blend = useMemo(
    () => computeBlend({ device, capacityMl: capacity, purposes, inventory, preferOwned, safety, intensity }),
    [device, capacity, purposes, inventory, preferOwned, safety, intensity],
  );
  const topPurposes = (Object.entries(purposes) as [Purpose, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const candidateCount = useMemo(() => rankOils({ device, capacityMl: capacity, purposes, safety }).ranked.length, [device, capacity, purposes, safety]);

  const ofnr: Ofnr = {
    observation,
    feelings: feelingNote.trim() ? [...feelings, feelingNote.trim()] : feelings,
    needs,
    request: buildRequest(device, blend),
  };

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const canNext = [observation.trim().length > 0, true, needs.length > 0, capacity > 0, true][step];

  const selectDevice = (d: DeviceId) => {
    setDevice(d);
    setCapacity(DEVICES[d].defaultCapacity);
  };

  const makeRecipe = (): Recipe => ({ id: newId(), createdAt: new Date().toISOString(), title: recipeTitle(ofnr, device), ofnr, blend });

  const save = async (made: boolean) => {
    setBusy(true);
    try {
      const recipe = makeRecipe();
      await saveRecipe(recipe);
      if (made) {
        const { newlyEmpty } = await recordMade(recipe);
        router.push(`/recipes?saved=${recipe.id}&made=1&empty=${newlyEmpty.length}`);
      } else {
        router.push(`/recipes?saved=${recipe.id}`);
      }
    } catch (e) {
      setMessage(`保存できませんでした: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const addToInventory = async (productId: string) => {
    const product = PRODUCT_BY_ID[productId];
    if (!product) return;
    await saveInventory([createItemFromProduct(product, "new", newId())]);
    setMessage(`「${product.name}」を新品として在庫に追加しました。`);
  };

  return (
    <div className="space-y-5">
      <PageTitle title="香りを調合する" lead="いまの自分を、観察 → 感情 → ニーズ → リクエスト の順に言葉にしていきます。" />
      <Stepper steps={STEPS} current={step} />

      {step === 0 && (
        <Card className="space-y-3">
          <h2 className="text-lg font-bold">O 観察：いま、何が起きていますか？</h2>
          <p className="text-sm text-muted">評価や判断をまじえず、カメラに映るように「いつ・どこで・何が」を書いてみましょう。</p>
          <Field label="観察" hint="例をタップすると入力されます">
            <textarea
              className={inputClass}
              rows={3}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="例: 23時、寝室で布団に入って30分たっても眠れていない"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {OBS_EXAMPLES.map((ex) => (
              <Chip key={ex} onClick={() => setObservation(ex)}>
                {ex}
              </Chip>
            ))}
          </div>
          {evaluative.length > 0 && (
            <Notice tone="warning">
              「{evaluative.join("」「")}」は評価の言葉かもしれません。時間・回数・場所など、事実に置きかえるとどうなりますか？
              （例:「いつも眠れない」→「今週は3日、1時過ぎまで眠れなかった」）
            </Notice>
          )}
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-3">
          <h2 className="text-lg font-bold">F 感情：そのとき、どんな気持ちですか？</h2>
          <p className="text-sm text-muted">いくつ選んでもかまいません。どれもしっくりこなければ、選ばずに進んでも大丈夫です。</p>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">ニーズが満たされていないとき</legend>
            <div className="flex flex-wrap gap-2">
              {FEELINGS_UNMET.map((f) => (
                <Chip key={f} selected={feelings.includes(f)} onClick={() => toggle(feelings, setFeelings, f)}>
                  {f}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">ニーズが満たされているとき</legend>
            <div className="flex flex-wrap gap-2">
              {FEELINGS_MET.map((f) => (
                <Chip key={f} selected={feelings.includes(f)} onClick={() => toggle(feelings, setFeelings, f)}>
                  {f}
                </Chip>
              ))}
            </div>
          </fieldset>
          <Field label="自分の言葉で（任意）">
            <input className={inputClass} value={feelingNote} onChange={(e) => setFeelingNote(e.target.value)} placeholder="例: 胸のあたりがざわざわする" />
          </Field>
          {thoughtHints.map((h) => (
            <Notice key={h} tone="warning">
              {h}
            </Notice>
          ))}
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-3">
          <h2 className="text-lg font-bold">N ニーズ：本当に大切にしたいものは？</h2>
          <p className="text-sm text-muted">
            {feelings.length ? `「${feelings.slice(0, 3).join("・")}」の奥にある` : "いまの気持ちの奥にある"}、満たしたいニーズを選んでください（1つ以上）。
          </p>
          <div className="flex flex-wrap gap-2">
            {NEEDS.map((n) => (
              <Chip key={n.id} selected={needs.includes(n.id)} onClick={() => toggle(needs, setNeeds, n.id)}>
                {n.label}
              </Chip>
            ))}
          </div>
          {topPurposes.length > 0 && (
            <p className="text-sm">
              香りでのアプローチ：
              {topPurposes.map(([p]) => (
                <span key={p} className="mr-2 inline-block rounded-sm bg-surface-2 px-2 py-0.5" title={PURPOSES[p].description}>
                  {PURPOSES[p].label}
                </span>
              ))}
              （候補の精油 {candidateCount} 種）
            </p>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">R リクエスト：自分に、何を試してみますか？</h2>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">使う道具</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {DEVICE_IDS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={device === d}
                  onClick={() => selectDevice(d)}
                  className={`rounded-md border p-3 text-left text-sm ${device === d ? "border-primary bg-surface-2" : "border-line bg-surface"}`}
                >
                  <strong className="block">{DEVICES[d].label}</strong>
                  <span className="text-xs text-muted">{DEVICES[d].description}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <Field label={`${DEVICES[device].capacityLabel}（mL）`}>
            <div className="flex flex-wrap items-center gap-2">
              {DEVICES[device].capacityPresets.map((c) => (
                <Chip key={c} selected={capacity === c} onClick={() => setCapacity(c)}>
                  {c} mL
                </Chip>
              ))}
              <input
                type="number"
                min={1}
                max={2000}
                aria-label="容量を直接入力"
                className={`${inputClass} w-28`}
                value={capacity}
                onChange={(e) => setCapacity(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </Field>
          {device !== "nebulizer" && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">香りの強さ</legend>
              <div className="flex gap-2">
                {(["light", "default", "strong"] as const).map((v) => (
                  <Chip key={v} selected={intensity === v} onClick={() => setIntensity(v)}>
                    {{ light: "ほのか", default: "ふつう", strong: "しっかり" }[v]}
                  </Chip>
                ))}
              </div>
            </fieldset>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={preferOwned} onChange={(e) => setPreferOwned(e.target.checked)} className="h-5 w-5" />
            手持ちの在庫を優先して選ぶ
          </label>
          {(safety.pregnancy || safety.children || safety.pets || safety.epilepsy) && (
            <Notice>安全設定にもとづいて、注意が必要な精油を除外します（設定ページで変更できます）。</Notice>
          )}
        </Card>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <Card className="space-y-2 border-primary/50">
            <h2 className="text-lg font-bold">あなたへのリクエスト</h2>
            <p data-testid="ofnr-summary" className="leading-relaxed">
              {summarizeOfnr(ofnr)}
            </p>
          </Card>
          <BlendTable blend={blend} onAddToInventory={addToInventory} />
          {message && <Notice tone="success">{message}</Notice>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => save(true)} disabled={busy || !ready}>
              作った（在庫から差し引く）
            </Button>
            <Button variant="secondary" onClick={() => save(false)} disabled={busy || !ready}>
              レシピに保存
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          ← 戻る
        </Button>
        {step < 4 && (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            {step === 3 ? "調合を見る" : "次へ →"}
          </Button>
        )}
      </div>
    </div>
  );
}
