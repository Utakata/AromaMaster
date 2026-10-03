import type { Metadata } from "next";
import { Card, EvidenceBadge, PageTitle } from "@/components/ui";
import { OILS } from "@/domain/oils";
import { PURPOSES } from "@/domain/purposes";
import { REFERENCES } from "@/domain/references";
import type { Caution } from "@/domain/types";

export const metadata: Metadata = { title: "精油ライブラリ" };

const CAUTION: Record<Caution, string> = { pregnancy: "妊娠中", children: "乳幼児", pets: "ペット", epilepsy: "てんかん" };
const NOTE = { top: "トップ", middle: "ミドル", base: "ベース" } as const;

export default function LibraryPage() {
  return (
    <div className="space-y-5">
      <PageTitle
        title="精油ライブラリ"
        lead="主成分・期待される作用・根拠レベル・注意点。根拠 A=系統的レビュー/複数のヒト試験、B=小規模なヒト研究、C=動物研究・伝統的使用。"
      />
      <ul className="space-y-3">
        {OILS.map((oil) => (
          <li key={oil.id} id={oil.id}>
            <Card className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-bold">
                  {oil.name} <span className="text-xs font-normal italic text-muted">{oil.latin}</span>
                </h2>
                <span className="text-xs text-muted">{NOTE[oil.note]}ノート</span>
              </div>
              <p className="text-sm">主成分: {oil.constituents.join("・")}</p>
              <ul className="space-y-1 text-sm">
                {oil.claims.map((c) => (
                  <li key={c.purpose + c.summary}>
                    <EvidenceBadge level={c.evidence} /> <strong>{PURPOSES[c.purpose].label}</strong>: {c.summary}
                    {c.refs.map((r) => (
                      <cite key={r} className="block pl-2 text-xs not-italic text-muted">
                        {REFERENCES[r].citation}
                        {REFERENCES[r].doi && (
                          <>
                            {" "}
                            <a className="underline" href={`https://doi.org/${REFERENCES[r].doi}`} target="_blank" rel="noopener noreferrer">
                              doi:{REFERENCES[r].doi}
                            </a>
                          </>
                        )}
                      </cite>
                    ))}
                  </li>
                ))}
              </ul>
              {(oil.cautions.length > 0 || oil.safetyNote) && (
                <p className="text-sm text-warning">
                  {oil.cautions.length > 0 && `注意: ${oil.cautions.map((c) => CAUTION[c]).join("・")}。`}
                  {oil.safetyNote}
                </p>
              )}
            </Card>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">安全情報の主な出典: {REFERENCES.tisserand2014.citation}</p>
    </div>
  );
}
