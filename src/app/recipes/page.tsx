"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BlendTable } from "@/components/BlendTable";
import { Button, ButtonLink, Card, Notice, PageTitle } from "@/components/ui";
import { DEVICES } from "@/domain/devices";
import { summarizeOfnr } from "@/domain/ofnr";
import { useAppData } from "@/lib/store";

function RecipesInner() {
  const params = useSearchParams();
  const { recipes, usage, ready, recordMade, removeRecipe } = useAppData();
  const savedId = params.get("saved");
  const [openId, setOpenId] = useState<string | null>(savedId);
  const [flash, setFlash] = useState<string | null>(
    params.get("made") === "1"
      ? Number(params.get("empty")) > 0
        ? "作った記録をつけ、在庫から差し引きました。なくなった在庫があります。"
        : "作った記録をつけ、在庫から差し引きました。"
      : savedId
        ? "レシピを保存しました。"
        : null,
  );
  const emptyAlert = params.get("made") === "1" && Number(params.get("empty")) > 0;

  return (
    <div className="space-y-5">
      <PageTitle title="レシピ" lead="保存した調合と、作った記録です。" />
      {flash && (
        <Notice tone={emptyAlert ? "danger" : "success"}>
          {flash}
          {emptyAlert && (
            <>
              {" "}
              <Link className="underline" href="/inventory?filter=alerts">
                在庫を確認して再購入する
              </Link>
            </>
          )}
        </Notice>
      )}
      {ready && recipes.length === 0 && (
        <Notice>
          まだレシピがありません。<Link className="underline" href="/blend">調合してみましょう</Link>。
        </Notice>
      )}
      <ul className="space-y-3">
        {recipes.map((r) => {
          const made = usage.filter((u) => u.recipeId === r.id);
          const open = openId === r.id;
          return (
            <li key={r.id}>
              <Card className="space-y-3" data-testid="recipe">
                <button type="button" className="w-full text-left" onClick={() => setOpenId(open ? null : r.id)} aria-expanded={open}>
                  <p className="font-bold">{r.title}</p>
                  <p className="text-xs text-muted">
                    {new Date(r.createdAt).toLocaleDateString("ja-JP")}・{DEVICES[r.blend.device].label} {r.blend.capacityMl} mL・
                    {r.blend.components.map((c) => c.oilName.replace(/（.*?）/g, "")).join(" / ")}・作った回数 {made.length}
                  </p>
                </button>
                {open && (
                  <>
                    <p className="text-sm leading-relaxed">{summarizeOfnr(r.ofnr)}</p>
                    <BlendTable blend={r.blend} />
                  </>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={async () => {
                      const { newlyEmpty } = await recordMade(r);
                      setFlash(
                        newlyEmpty.length
                          ? `作った記録をつけました。「${newlyEmpty.map((i) => i.label).join("」「")}」がなくなりました。`
                          : "作った記録をつけ、在庫から差し引きました。",
                      );
                    }}
                  >
                    もう一度作った
                  </Button>
                  <Button variant="danger" className="ml-auto" onClick={() => confirm("このレシピを削除しますか？") && removeRecipe(r.id)}>
                    削除
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
      <ButtonLink href="/blend">新しく調合する</ButtonLink>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense>
      <RecipesInner />
    </Suspense>
  );
}
