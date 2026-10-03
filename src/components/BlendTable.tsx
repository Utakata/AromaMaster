"use client";

import { buildAmazonUrl } from "@/domain/amazon";
import { DEVICES } from "@/domain/devices";
import { OIL_BY_ID } from "@/domain/oils";
import { PRODUCT_BY_ID } from "@/domain/products";
import { REFERENCES } from "@/domain/references";
import type { Blend, Note } from "@/domain/types";
import { Card, EvidenceBadge, ExternalButton } from "@/components/ui";

const NOTE_LABEL: Record<Note, string> = { top: "トップ", middle: "ミドル", base: "ベース" };

export function BlendTable({ blend, onAddToInventory }: { blend: Blend; onAddToInventory?: (productId: string) => void }) {
  const ethanolProduct = blend.ethanolProductId ? PRODUCT_BY_ID[blend.ethanolProductId] : undefined;
  const device = DEVICES[blend.device];

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-2 font-bold">配合（{device.label}・{blend.capacityMl} mL）</h3>
        <dl className="grid grid-cols-3 gap-2 text-center text-sm" data-testid="blend-summary">
          <div className="rounded-md bg-surface-2 p-2">
            <dt className="text-xs text-muted">精油 合計</dt>
            <dd className="text-lg font-bold">{blend.totalOilMl} mL</dd>
            <dd className="text-xs text-muted">{blend.totalDrops} 滴</dd>
          </div>
          <div className="rounded-md bg-surface-2 p-2">
            <dt className="text-xs text-muted">無水エタノール</dt>
            <dd className="text-lg font-bold" data-testid="ethanol-ml">{blend.ethanolMl} mL</dd>
            {!device.usesEthanol && <dd className="text-xs text-muted">使用しない</dd>}
          </div>
          <div className="rounded-md bg-surface-2 p-2">
            <dt className="text-xs text-muted">水</dt>
            <dd className="text-lg font-bold">{blend.waterMl} mL</dd>
          </div>
        </dl>
      </Card>

      <ul className="space-y-3" aria-label="使う精油">
        {blend.components.map((c) => {
          const oil = OIL_BY_ID[c.oilId];
          const product = PRODUCT_BY_ID[c.productId];
          return (
            <li key={c.oilId}>
              <Card className="space-y-2" data-testid="blend-component">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="mr-2 text-xs text-muted">{NOTE_LABEL[c.note]}</span>
                    <strong>{c.oilName}</strong> <EvidenceBadge level={c.evidence} />
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold" data-testid="drops">{c.drops}</span> 滴
                    <span className="ml-2 text-sm text-muted">({c.ml} mL)</span>
                  </div>
                </div>
                <p className="text-sm text-muted">
                  {c.brand}「{c.productName}」
                  {c.inventoryItemId && !c.shortage && <span className="ml-1 text-success">・在庫から使用</span>}
                </p>
                {oil && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-primary">なぜこの精油？（{oil.constituents.join("・")}）</summary>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {oil.claims.map((cl) => (
                        <li key={cl.purpose + cl.summary}>
                          {cl.summary} <EvidenceBadge level={cl.evidence} />
                          {cl.refs.map((r) => (
                            <cite key={r} className="block text-xs not-italic text-muted">
                              {REFERENCES[r]?.citation}
                              {REFERENCES[r]?.doi && (
                                <>
                                  {" "}
                                  <a className="underline" href={`https://doi.org/${REFERENCES[r].doi}`} target="_blank" rel="noopener noreferrer">
                                    doi
                                  </a>
                                </>
                              )}
                            </cite>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {c.shortage && product && (
                  <div className="flex flex-wrap gap-2">
                    <ExternalButton href={buildAmazonUrl(product)} data-testid="amazon-link">
                      Amazon で探す
                    </ExternalButton>
                    {onAddToInventory && (
                      <button type="button" className="text-sm text-primary underline" onClick={() => onAddToInventory(product.id)}>
                        購入したので在庫に追加
                      </button>
                    )}
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ul>

      {blend.ethanolMl > 0 && ethanolProduct && (
        <Card className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <strong>無水エタノール</strong> {blend.ethanolMl} mL
            <p className="text-sm text-muted">
              {ethanolProduct.brand}「{ethanolProduct.name}」{!blend.ethanolShortage && <span className="text-success">・在庫から使用</span>}
            </p>
          </div>
          {blend.ethanolShortage && (
            <div className="flex flex-wrap gap-2">
              <ExternalButton href={buildAmazonUrl(ethanolProduct)} data-testid="amazon-link">
                Amazon で探す
              </ExternalButton>
              {onAddToInventory && (
                <button type="button" className="text-sm text-primary underline" onClick={() => onAddToInventory(ethanolProduct.id)}>
                  購入したので在庫に追加
                </button>
              )}
            </div>
          )}
        </Card>
      )}

      <Card>
        <h3 className="mb-2 font-bold">作り方</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {blend.instructions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </Card>

      {blend.warnings.length > 0 && (
        <Card className="border-warning/50">
          <h3 className="mb-2 font-bold">安全のために</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {blend.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
