import { useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { useRealSession } from "@eco-nojin/auth-client";
import { Badge, Button, Card, CardBody, CardHeader, FormRow, Select, useToast } from "@eco-nojin/ui";
import { ApiBoundary } from "../../components/ApiState";
import { useAssessment, useAssessments, useCreateAssessment, useReadiness, useResourceList, useReviewAssessment, useReviews } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };
const L = {
  eyebrow: { fa: "آمادگی یکپارچگی", en: "Integration readiness", ar: "جاهزية التكامل" },
  title: { fa: "آمادگی داده برای هایدراما", en: "Data readiness for HyDroMA", ar: "جاهزية البيانات لهايدروما" },
  restriction: { fa: "فقط ارزیابی آمادگی — اجرای علمی مجاز نیست.", en: "READINESS ASSESSMENT ONLY — SCIENTIFIC EXECUTION NOT AUTHORIZED", ar: "تقييم الجاهزية فقط — التنفيذ العلمي غير مصرح" },
  farm: { fa: "مزرعه", en: "Farm", ar: "المزرعة" },
  cycle: { fa: "دورهٔ کشت", en: "Crop cycle", ar: "دورة المحصول" },
  run: { fa: "ارزیابی آمادگی", en: "Run assessment", ar: "تشغيل التقييم" },
  state: { fa: "وضعیت", en: "State", ar: "الحالة" },
  available: { fa: "موجود", en: "Available", ar: "متاح" },
  missing: { fa: "ناقص", en: "Missing", ar: "مفقود" },
  units: { fa: "ناسازگاری واحد", en: "Unit mismatches", ar: "تعارض الوحدات" },
  temporal: { fa: "مسائل زمانی", en: "Temporal issues", ar: "مشاكل زمنية" },
  sources: { fa: "منابع", en: "Sources", ar: "المصادر" },
  none: { fa: "—", en: "—", ar: "—" },
  selectFarm: { fa: "ابتدا مزرعه را انتخاب کنید.", en: "Select a farm first.", ar: "اختر مزرعة أولاً." },
  save: { fa: "ذخیرهٔ ارزیابی", en: "Save assessment", ar: "حفظ التقييم" },
  saved: { fa: "ارزیابی‌های ذخیره‌شده", en: "Saved assessments", ar: "التقييمات المحفوظة" },
  review: { fa: "ثبت بازبینی", en: "Record review", ar: "تسجيل المراجعة" },
  acceptable: { fa: "قابل قبول", en: "Acceptable", ar: "مقبول" },
  findings: { fa: "دارای یافته", en: "With findings", ar: "به نتائج" },
  current: { fa: "جاری", en: "current", ar: "حالي" },
  inputs_changed: { fa: "داده‌ها تغییر کرده", en: "inputs changed", ar: "تغيرت البيانات" },
  reviews: { fa: "تاریخچهٔ بازبینی", en: "Review history", ar: "سجل المراجعة" },
  noSaved: { fa: "ارزیابی ذخیره‌شده‌ای نیست.", en: "No saved assessments.", ar: "لا تقييمات محفوظة." },
  readOnly: { fa: "برای بازبینی به نقش write نیاز دارید.", en: "A write role is required to review.", ar: "يلزم دور كتابة للمراجعة." },
  provenance: { fa: "منشأ", en: "Provenance", ar: "المصدر" },
  spatial: { fa: "آمادگی مکانی", en: "Spatial", ar: "المكانية" },
  qualityFindings: { fa: "یافته‌های کیفیت داده", en: "Data-quality findings", ar: "نتائج جودة البيانات" },
  noFindings: { fa: "یافته‌ای نیست.", en: "No findings.", ar: "لا نتائج." },
  qualityNotice: { fa: "فقط کیفیت و آمادگی داده — اجرای علمی و اعتبارسنجی مجاز نیست.", en: "DATA QUALITY & READINESS ASSESSMENT ONLY — SCIENTIFIC EXECUTION AND VALIDATION NOT AUTHORIZED", ar: "جودة البيانات والجاهزية فقط — التنفيذ العلمي والتحقق غير مصرح" },
};
const TONE: Record<string, "success" | "warning" | "neutral"> = { READY_FOR_REVIEW: "success", NOT_READY: "warning", NOT_ASSESSED: "neutral", REVIEW_REQUIRED: "warning" };

export function ReadinessModule() {
  const { locale } = useI18n();
  const l = (v: Loc) => tl(v, locale);
  const { role } = useRealSession();
  const canWrite = new Set(["owner", "admin", "manager"]).has(role ?? "");
  const toast = useToast();
  const farms = useResourceList("farms");
  const cycles = useResourceList("cropCycles");
  const [farmId, setFarmId] = useState("");
  const [cycleId, setCycleId] = useState("");
  const q = useReadiness(farmId, cycleId || undefined);
  const create = useCreateAssessment();
  const saved = useAssessments(farmId || undefined);
  const [openId, setOpenId] = useState<string | null>(null);
  const detail = useAssessment(openId ?? "");
  const reviews = useReviews(openId ?? "");
  const review = useReviewAssessment();
  const r = q.data;
  return (
    <div className="pl-stack">
      <header className="pl-pageHead"><div><p className="pl-eyebrow">{l(L.eyebrow)}</p><h1>{l(L.title)}</h1></div></header>
      <p className="pl-note">{l(L.restriction)}</p>

      <div className="pl-toolbar">
        <FormRow label={l(L.farm)} field="r-farm">{(p) => <Select {...p} value={farmId} onChange={(e) => { setFarmId(e.target.value); setCycleId(""); }}><option value="">{l(L.none)}</option>{(farms.data?.items ?? []).map((f) => <option key={String(f.id)} value={String(f.id)}>{String(f.name ?? f.id)}</option>)}</Select>}</FormRow>
        <FormRow label={l(L.cycle)} field="r-cycle">{(p) => <Select {...p} value={cycleId} onChange={(e) => setCycleId(e.target.value)}><option value="">{l(L.none)}</option>{(cycles.data?.items ?? []).filter((c) => !farmId || (c as unknown as { farmId?: string }).farmId === farmId).map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name ?? c.id)}</option>)}</Select>}</FormRow>
        {canWrite && farmId ? <Button onClick={async () => { try { await create.mutateAsync({ farmId, cropCycleId: cycleId || undefined }); toast.push({ title: l(L.saved), tone: "success" }); } catch (e) { toast.push({ title: e instanceof Error ? e.message : "Error", tone: "danger" }); } }} disabled={create.isPending}>{l(L.save)}</Button> : null}
      </div>

      {!farmId ? <p className="pl-muted">{l(L.selectFarm)}</p> : (
        <ApiBoundary state={q}>
          {r ? (
            <Card>
              <CardHeader title={l(L.state)} subtitle={`${r.contractId} · v${r.contractVersion}`} />
              <CardBody>
                <Badge tone={TONE[r.state] ?? "neutral"}>{r.state}</Badge>
                <dl className="pl-defs">
                  <div><dt>{l(L.available)}</dt><dd>{r.available.join(", ") || l(L.none)}</dd></div>
                  <div><dt>{l(L.missing)}</dt><dd>{r.missing.join(", ") || l(L.none)}</dd></div>
                  <div><dt>{l(L.units)}</dt><dd>{r.unitMismatches.length}</dd></div>
                  <div><dt>{l(L.temporal)}</dt><dd>{r.temporalIssues.length}</dd></div>
                  <div><dt>{l(L.sources)}</dt><dd>{r.sources.length}</dd></div>
                  <div><dt>{l(L.provenance)}</dt><dd>{r.provenance ?? "—"}</dd></div>
                  <div><dt>{l(L.spatial)}</dt><dd>{r.spatial ?? "—"}</dd></div>
                </dl>
                <p className="pl-note">{l(L.qualityNotice)}</p>
                <div className="mt-3">
                  <p className="pl-kpiLabel">{l(L.qualityFindings)}</p>
                  {(r.findings?.length ?? 0) === 0 ? <p className="pl-muted">{l(L.noFindings)}</p> : (
                    <ul className="pl-list">{r.findings!.map((f) => <li key={f.id}><span className="pl-listTitle">{f.category} · {f.field}</span><span className="pl-listMeta">{f.reason} · {f.rulesVersion}</span><Badge tone={f.severity === "high" ? "danger" : f.severity === "medium" ? "warning" : "neutral"}>{f.severity}</Badge></li>)}</ul>
                  )}
                </div>
              </CardBody>
            </Card>
          ) : null}
        </ApiBoundary>
      )}

      <Card>
        <CardHeader title={l(L.saved)} />
        <CardBody>
          <ApiBoundary state={saved}>
            {(saved.data?.items.length ?? 0) === 0 ? <p className="pl-muted">{l(L.noSaved)}</p> : (
              <ul className="pl-list">
                {saved.data!.items.map((a) => (
                  <li key={a.id}>
                    <button type="button" className="pl-link" onClick={() => setOpenId(a.id)}>{a.id.slice(0, 12)}</button>
                    <span className="pl-listMeta">{a.state}</span>
                    <Badge tone={a.reviewState === "REVIEWED_ACCEPTABLE" ? "success" : "neutral"}>{a.reviewState}</Badge>
                    {canWrite && ["ASSESSMENT_CREATED", "PENDING_REVIEW"].includes(a.reviewState) ? (
                      <>
                        <Button size="sm" onClick={() => review.mutate({ id: a.id, decision: "acceptable" })}>{l(L.acceptable)}</Button>
                        <Button variant="danger" size="sm" onClick={() => review.mutate({ id: a.id, decision: "findings" })}>{l(L.findings)}</Button>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </ApiBoundary>
        </CardBody>
      </Card>

      {openId ? (
        <Card>
          <CardHeader title={l(L.reviews)} subtitle={detail.data?.currentness} />
          <CardBody>
            <ApiBoundary state={detail}>
              {detail.data ? <div className="pl-defs"><div><dt>{l(L.state)}</dt><dd>{detail.data.state}</dd></div><div><dt>{l(L.current)}</dt><dd>{detail.data.currentness === "current" ? l(L.current) : l(L.inputs_changed)}</dd></div></div> : null}
            </ApiBoundary>
            <ApiBoundary state={reviews}>
              {(reviews.data?.items.length ?? 0) === 0 ? <p className="pl-muted">—</p> : (
                <ul className="pl-list">{reviews.data!.items.map((rv) => <li key={rv.id}><span className="pl-listTitle">{rv.decision}</span><span className="pl-listMeta">{rv.at}{rv.note ? ` · ${rv.note}` : ""}</span></li>)}</ul>
              )}
            </ApiBoundary>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}