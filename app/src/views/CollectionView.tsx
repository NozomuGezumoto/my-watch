import { useParams, Link, useLocation } from "react-router-dom";
import { useState, useRef, useCallback, useEffect } from "react";
import type { SeedData, Era, Milestone, Release, RefGroup } from "../types";
import { getIndustryContextForYears, USE_SEED_CONTEXT_COLLECTIONS } from "../periodContext";
import { addMyWatch, getMyWatches, removeMyWatch, getWishlist, addToWishlist, removeFromWishlist, type MyWatchEntry } from "../myWatches";
import { getCollectionPhotos, setCollectionPhoto } from "../collectionPhotos";
import styles from "./CollectionView.module.css";

function getMilestonesForCollection(seed: SeedData, collectionId: string): Milestone[] {
  const list = seed.milestones ?? [];
  return list
    .filter((m) => m.collectionId === collectionId)
    .sort((a, b) => a.yearFrom - b.yearFrom);
}

function getErasForCollection(seed: SeedData, collectionId: string): Era[] {
  return (seed.eras ?? [])
    .filter((e) => e.collectionId === collectionId)
    .sort((a, b) => a.startYear - b.startYear);
}

/** Era をクリックしたとき、その Era の先頭 milestone の id を返す。 */
function getFirstMilestoneIdInEra(milestones: Milestone[], eraId: string): string | null {
  const m = milestones.find((x) => x.eraId === eraId);
  return m?.id ?? null;
}

function getReleasesForMilestone(seed: SeedData, milestoneId: string): Release[] {
  const list = seed.releases ?? [];
  return list
    .filter((r) => r.milestoneId === milestoneId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.yearFrom - b.yearFrom);
}

/** 表示用の1スライド = Release または Release が無い Milestone。進化の粒度はリリース単位。 */
type DisplayItem =
  | { id: string; type: "release"; release: Release; milestone: Milestone }
  | { id: string; type: "milestone"; milestone: Milestone };

function buildDisplayItems(seed: SeedData, collectionId: string): DisplayItem[] {
  const milestones = getMilestonesForCollection(seed, collectionId);
  const items: DisplayItem[] = [];
  for (const m of milestones) {
    const releases = getReleasesForMilestone(seed, m.id);
    if (releases.length > 0) {
      for (const r of releases) {
        items.push({ id: `release:${r.id}`, type: "release", release: r, milestone: m });
      }
    } else {
      items.push({ id: `milestone:${m.id}`, type: "milestone", milestone: m });
    }
  }
  return items.sort((a, b) => {
    const yearA = a.type === "release" ? a.release.yearFrom : a.milestone.yearFrom;
    const yearB = b.type === "release" ? b.release.yearFrom : b.milestone.yearFrom;
    return yearA - yearB;
  });
}

function AccordionSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.accordionSection}>
      <button
        type="button"
        className={styles.accordionHead}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className={styles.accordionIcon}>{open ? "−" : "+"}</span>
      </button>
      {open && <div className={styles.accordionBody}>{children}</div>}
    </div>
  );
}

export function CollectionView({ seed }: { seed: SeedData }) {
  const { collectionSlug } = useParams();
  const location = useLocation();
  const [added, setAdded] = useState(false);
  const [addedToWishlist, setAddedToWishlist] = useState(false);
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0);
  const [currentRefGroupId, setCurrentRefGroupId] = useState<string | null>(null);
  const highlightMilestoneId = (location.state as { highlightMilestoneId?: string } | null)?.highlightMilestoneId;
  const [accordionOpen, setAccordionOpen] = useState<Record<string, boolean>>({});
  const [selectedVariantMeta, setSelectedVariantMeta] = useState<Record<string, (string | number)[]>>({});
  const [collectionPhotos, setCollectionPhotos] = useState<(string | undefined)[]>([undefined, undefined, undefined, undefined]);
  const touchStartX = useRef(0);
  const photoInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const coll = seed.collections.find((c) => c.slug === collectionSlug);
  if (!coll) return <div className={styles.empty}>コレクションが見つかりません。</div>;

  const brand = seed.brands.find((b) => b.id === coll.brandId);
  const eras = getErasForCollection(seed, coll.id);
  const milestones = getMilestonesForCollection(seed, coll.id);
  const displayItems = buildDisplayItems(seed, coll.id);

  // コレクション変更時: 先頭 or Timeline の milestone に該当する表示項目を選択
  useEffect(() => {
    if (displayItems.length === 0) return;
    let targetIndex = 0;
    if (highlightMilestoneId) {
      const idx = displayItems.findIndex(
        (i) => (i.type === "milestone" && i.milestone.id === highlightMilestoneId) || (i.type === "release" && i.milestone.id === highlightMilestoneId)
      );
      if (idx >= 0) targetIndex = idx;
    }
    setCurrentDisplayIndex(targetIndex);
  }, [coll.id, displayItems.length, highlightMilestoneId]);

  const currentItem = displayItems[currentDisplayIndex] ?? displayItems[0] ?? null;
  const currentMilestone = currentItem?.milestone ?? null;
  const currentRelease = currentItem?.type === "release" ? currentItem.release : null;

  useEffect(() => {
    setCollectionPhotos(getCollectionPhotos(coll.id));
  }, [coll.id]);

  const refGroupsForRelease =
    currentRelease != null
      ? (seed.refGroups ?? [])
          .filter((rg: RefGroup) => rg.releaseId === currentRelease.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      : [];
  const currentRefGroup =
    currentRefGroupId != null && refGroupsForRelease.some((rg) => rg.id === currentRefGroupId)
      ? refGroupsForRelease.find((rg) => rg.id === currentRefGroupId)!
      : refGroupsForRelease[0] ?? null;

  useEffect(() => {
    if (refGroupsForRelease.length > 0) {
      const firstId = refGroupsForRelease[0].id;
      setCurrentRefGroupId((prev) => (refGroupsForRelease.some((rg) => rg.id === prev) ? prev : firstId));
    } else {
      setCurrentRefGroupId(null);
    }
  }, [currentRelease?.id]);

  const go = useCallback(
    (delta: number) => {
      setCurrentDisplayIndex((i) => Math.max(0, Math.min(displayItems.length - 1, i + delta)));
    },
    [displayItems.length]
  );

  const handleEraClick = (eraId: string) => {
    const idx = displayItems.findIndex((i) => i.milestone.eraId === eraId);
    if (idx >= 0) setCurrentDisplayIndex(idx);
  };

  const toggleAccordion = (key: string) => {
    setAccordionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddMine = () => {
    addMyWatch({
      collectionId: coll.id,
      eraId: currentMilestone?.eraId ?? null,
      variantId: null,
      milestoneId: currentItem?.milestone.id ?? null,
      refGroupId: currentRefGroup?.id ?? null,
      variantMeta: Object.keys(selectedVariantMeta).length > 0 ? selectedVariantMeta : undefined,
      customName: null,
      acquiredYear: null,
    });
    setAdded(true);
  };

  /** 表示中1ページ＋選択中派生に一致するマイ時計の1件（削除用） */
  const existingMyWatchEntry: MyWatchEntry | undefined = getMyWatches().find(
    (w) =>
      w.collectionId === coll.id &&
      w.milestoneId === (currentItem?.milestone.id ?? null) &&
      (w.refGroupId ?? null) === (currentRefGroup?.id ?? null)
  );
  const alreadyInMyWatches = existingMyWatchEntry != null;
  const addDisabled = added || alreadyInMyWatches;

  const handleRemoveMine = () => {
    if (existingMyWatchEntry) {
      removeMyWatch(existingMyWatchEntry.id);
      setAdded(false);
    }
  };

  /** 表示中1ページ＋選択中派生に一致する欲しい時計の1件（削除用） */
  const existingWishlistEntry: MyWatchEntry | undefined = getWishlist().find(
    (w) =>
      w.collectionId === coll.id &&
      w.milestoneId === (currentItem?.milestone.id ?? null) &&
      (w.refGroupId ?? null) === (currentRefGroup?.id ?? null)
  );
  const alreadyInWishlist = existingWishlistEntry != null;
  const addWishlistDisabled = addedToWishlist || alreadyInWishlist;

  const handleAddWishlist = () => {
    addToWishlist({
      collectionId: coll.id,
      eraId: currentMilestone?.eraId ?? null,
      variantId: null,
      milestoneId: currentItem?.milestone.id ?? null,
      refGroupId: currentRefGroup?.id ?? null,
      variantMeta: Object.keys(selectedVariantMeta).length > 0 ? selectedVariantMeta : undefined,
      customName: null,
      acquiredYear: null,
    });
    setAddedToWishlist(true);
  };

  const handleRemoveWishlist = () => {
    if (existingWishlistEntry) {
      removeFromWishlist(existingWishlistEntry.id);
      setAddedToWishlist(false);
    }
  };

  const toggleVariantChip = (category: string, value: string | number) => {
    setSelectedVariantMeta((prev) => {
      const arr = (prev[category] ?? []) as (string | number)[];
      const next = [...arr];
      const idx = next.indexOf(value);
      if (idx >= 0) next.splice(idx, 1);
      else next.push(value);
      const out = { ...prev };
      if (next.length === 0) delete out[category];
      else out[category] = next;
      return out;
    });
  };

  const handlePhotoChange = (slotIndex: number, file: File | null) => {
    if (file == null) {
      setCollectionPhoto(coll.id, slotIndex, null);
      setCollectionPhotos((prev) => {
        const next = [...prev];
        next[slotIndex] = undefined;
        return next;
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCollectionPhoto(coll.id, slotIndex, dataUrl);
      setCollectionPhotos((prev) => {
        const next = [...prev];
        next[slotIndex] = dataUrl;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  if (displayItems.length === 0) {
    return (
      <div className={styles.page}>
        <Link to={brand ? `/brands/${brand.slug}` : "/brands"} className={styles.back}>
          ← {brand?.name}
        </Link>
        <p className={styles.brandName}>{brand?.name}</p>
        <h1 className={styles.title}>{coll.name}</h1>
        <p className={styles.empty}>進化データがありません。</p>
      </div>
    );
  }

  const vm = currentRefGroup?.variantMap ?? currentMilestone?.variantMap;
  const spec = currentMilestone?.specSnapshot;

  return (
    <div className={styles.page}>
      <Link to={brand ? `/brands/${brand.slug}` : "/brands"} className={styles.back}>
        ← {brand?.name}
      </Link>
      <p className={styles.brandName}>{brand?.name}</p>
      <h1 className={styles.title}>{coll.name}</h1>
      {coll.type && <span className={styles.type}>{coll.type}</span>}
      {coll.introducedYear != null && (
        <p className={styles.year}>{coll.introducedYear}年〜</p>
      )}

      <section className={styles.evolutionSection} aria-label="進化の歴史">
        {/* 上段: Era タブ（フィルタ） */}
        {eras.length > 0 && (
          <div className={styles.eraTabs}>
            {eras.map((era) => {
              const active = currentItem?.milestone.eraId === era.id;
              return (
                <button
                  key={era.id}
                  type="button"
                  className={active ? styles.eraTabActive : styles.eraTab}
                  onClick={() => handleEraClick(era.id)}
                  aria-pressed={active}
                >
                  {era.name}
                </button>
              );
            })}
          </div>
        )}

        {/* リリース単位スライダー（スワイプ対応）。コンテンツは常に全幅。 */}
        <div className={styles.milestoneArea}>
          <div
            className={styles.milestoneCarousel}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              if (dx > 50) go(-1);
              else if (dx < -50) go(1);
            }}
          >
            {currentItem && (() => {
              const display = currentRelease ?? currentMilestone;
              const delta = currentRelease?.delta ?? currentMilestone?.delta ?? { added: [], changed: [], removed: [] };
              const whyItMattersRaw = currentRelease?.whyItMatters ?? currentMilestone?.whyItMatters ?? "";
              const displayLabel = currentRelease ? currentRelease.label : currentMilestone!.label;
              const yFrom = currentRelease?.yearFrom ?? currentMilestone!.yearFrom;
              const yTo = currentRelease?.yearTo ?? currentMilestone!.yearTo ?? null;
              const displayYears =
                yTo == null
                  ? currentRelease
                    ? `${yFrom}`
                    : `${yFrom} — 現在`
                  : yFrom === yTo
                    ? `${yFrom}`
                    : `${yFrom}–${yTo}`;
              const heroLabel = currentRefGroup?.label ?? displayLabel;
              const heroSublineRaw = currentRelease?.heroSubline ?? currentMilestone?.heroSubline ?? null;
              const heroSubline =
                heroSublineRaw &&
                heroSublineRaw.trim() !== whyItMattersRaw.trim() &&
                heroSublineRaw.trim() !== displayLabel.trim()
                  ? heroSublineRaw.trim()
                  : null;
              const hasDelta = (delta.added?.length ?? 0) > 0 || (delta.changed?.length ?? 0) > 0 || (delta.removed?.length ?? 0) > 0;
              const deltaFirstLine = delta.added?.[0] ?? delta.changed?.[0] ?? null;

              return (
              <div className={styles.milestoneCard}>
                {/* 主役: 選ばれた Ref またはリリース名。人格化して「1本」を前面に */}
                <header className={styles.slideHero}>
                  <span className={styles.eraYears}>{displayYears}</span>
                  <h2 className={styles.slideHeroTitle}>{heroLabel}</h2>
                  {heroSubline && <p className={styles.slideHeroSub}>{heroSubline}</p>}
                  {whyItMattersRaw.trim() && <p className={styles.slideHeroCatch}>{whyItMattersRaw}</p>}
                </header>

                {/* 時計史全体の動き（左側の表示年 yFrom–yTo をキーに年代共通文言。デイトナ・エルプリメロは seed の個別文言） */}
                {(() => {
                  const useSeedContext = USE_SEED_CONTEXT_COLLECTIONS.has(coll.slug);
                  const ctx = useSeedContext
                    ? (() => {
                        const releaseId = currentRelease?.id ?? null;
                        const releaseFromSeed = releaseId ? (seed.releases ?? []).find((r) => r.id === releaseId) : null;
                        const msFromSeed = currentMilestone?.id ? (seed.milestones ?? []).find((m) => m.id === currentMilestone!.id) : null;
                        if (releaseFromSeed?.industryContext?.length) return releaseFromSeed.industryContext;
                        if (msFromSeed?.industryContext?.length) return msFromSeed.industryContext;
                        return currentMilestone?.industryContext ?? [];
                      })()
                    : getIndustryContextForYears(yFrom, yTo);
                  const filtered = ctx.map((s) => (s ?? "").trim()).filter(Boolean);
                  return filtered.length > 0 ? (
                    <div key={`${yFrom}-${yTo ?? "n"}`} className={styles.evolutionSubBlock}>
                      <h3 className={styles.sectionTitle}>時計史全体の動き</h3>
                      <ul className={styles.bulletListStandalone}>
                        {filtered.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null;
                })()}

                {/* 画像カード：1枚目の＋の下に注釈、その下に小3 */}
                <section className={styles.imageCard} aria-label="写真">
                  <div className={styles.imageFirstWrap}>
                    <div
                      className={`${styles.imageSlotLarge} ${!collectionPhotos[0] ? styles.imageSlotEmpty : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => !collectionPhotos[0] && photoInputRefs.current[0]?.click()}
                      onKeyDown={(e) => !collectionPhotos[0] && (e.key === "Enter" || e.key === " ") && photoInputRefs.current[0]?.click()}
                      aria-label="写真を追加"
                    >
                      <input
                        ref={(el) => { photoInputRefs.current[0] = el; }}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        aria-label="大きい写真を追加"
                        className={styles.photoInput}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePhotoChange(0, f);
                          e.target.value = "";
                        }}
                      />
                      {collectionPhotos[0] ? (
                        <>
                          <img src={collectionPhotos[0]} alt="" className={styles.photoImg} />
                          <button
                            type="button"
                            className={styles.photoRemove}
                            onClick={(e) => { e.stopPropagation(); handlePhotoChange(0, null); }}
                            aria-label="写真を削除"
                          >
                            ×
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.imageGridSmall}>
                    {[1, 2, 3].map((slotIndex) => {
                      const dataUrl = collectionPhotos[slotIndex];
                      return (
                        <div
                          key={slotIndex}
                          className={`${styles.imageSlotSmall} ${!dataUrl ? styles.imageSlotEmpty : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => !dataUrl && photoInputRefs.current[slotIndex]?.click()}
                          onKeyDown={(e) => !dataUrl && (e.key === "Enter" || e.key === " ") && photoInputRefs.current[slotIndex]?.click()}
                          aria-label="写真を追加"
                        >
                          <input
                            ref={(el) => { photoInputRefs.current[slotIndex] = el; }}
                            type="file"
                            accept="image/*"
                            aria-label={`写真${slotIndex}を追加`}
                            className={styles.photoInput}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handlePhotoChange(slotIndex, f);
                              e.target.value = "";
                            }}
                          />
                          {dataUrl ? (
                            <>
                              <img src={dataUrl} alt="" className={styles.photoImg} />
                              <button
                                type="button"
                                className={styles.photoRemove}
                                onClick={(e) => { e.stopPropagation(); handlePhotoChange(slotIndex, null); }}
                                aria-label="写真を削除"
                              >
                                ×
                              </button>
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 画像について：画像エリアの下・この世代のポイントの上 */}
                <p className={styles.imageAnnotation}>
                  <span className={styles.imageAnnotationIcon} aria-hidden>ⓘ</span>
                  <span className={styles.imageAnnotationText}>
                    公式画像は掲載していません。お持ちの時計を撮影した写真を、端末内に個人利用で保存して楽しめます。
                  </span>
                </p>

                {/* Ref切替: 説明＋選択中Refの特徴（optional） */}
                <div className={`${styles.refGroupWrap} ${refGroupsForRelease.length === 0 ? styles.refGroupWrapReserved : ""}`.trim()}>
                  {refGroupsForRelease.length > 0 && (
                    <>
                      <p className={styles.refGroupLead}>この世代で存在する主な Ref（型番）</p>
                      <div className={styles.refGroupTabs}>
                        {refGroupsForRelease.map((rg) => (
                          <button
                            key={rg.id}
                            type="button"
                            className={currentRefGroup?.id === rg.id ? styles.refGroupTabActive : styles.refGroupTab}
                            onClick={() => setCurrentRefGroupId(rg.id)}
                            aria-pressed={currentRefGroup?.id === rg.id}
                          >
                            {rg.label}
                          </button>
                        ))}
                      </div>
                      {currentRefGroup?.tagline && (
                        <p className={styles.refGroupTagline}>{currentRefGroup.tagline}</p>
                      )}
                    </>
                  )}
                </div>

                {/* 差分を強調: この世代のポイント */}
                <div className={styles.deltaBlock}>
                  {hasDelta && (
                    <p className={styles.deltaBlockLead}>この世代のポイント</p>
                  )}
                  {deltaFirstLine && (
                    <p className={styles.deltaKeyLine}>{deltaFirstLine}</p>
                  )}
                  {(delta.added?.length ?? 0) > 0 && (
                    <div className={styles.deltaRow}>
                      <span className={styles.deltaLabel}>追加:</span>
                      <ul className={styles.deltaList}>
                        {(delta.added ?? []).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(delta.changed?.length ?? 0) > 0 && (
                    <div className={styles.deltaRow}>
                      <span className={styles.deltaLabel}>変更:</span>
                      <ul className={styles.deltaList}>
                        {(delta.changed ?? []).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(delta.removed?.length ?? 0) > 0 && (
                    <div className={styles.deltaRow}>
                      <span className={styles.deltaLabel}>廃止:</span>
                      <ul className={styles.deltaList}>
                        {(delta.removed ?? []).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 理解用アコーディオン（見分け方・仕様スナップショット） */}
                <div className={styles.accordionGroup}>
                  <AccordionSection
                    title="世代の違い"
                    open={accordionOpen.howToSpot ?? true}
                    onToggle={() => toggleAccordion("howToSpot")}
                  >
                    <ul className={styles.bulletList}>
                      {((currentMilestone?.howToSpot?.length ?? 0) > 0
                        ? currentMilestone!.howToSpot!
                        : ["ダイアル刻印・色", "ベゼル形状・素材", "ケース径", "ムーブメント型番（裏蓋またはスペック表）", "ブレス・ベルト"]
                      ).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </AccordionSection>
                  <AccordionSection
                    title="型番の仕様"
                    open={accordionOpen.specSnapshot ?? false}
                    onToggle={() => toggleAccordion("specSnapshot")}
                  >
                    {spec && (
                      <div className={styles.specGrid}>
                        {spec.movementType != null && (
                          <div className={styles.specRow}>
                            <span className={styles.specLabel}>ムーブメント</span>
                            <span className={styles.specValue}>{spec.movementType}</span>
                          </div>
                        )}
                        {spec.caliber != null && (
                          <div className={styles.specRow}>
                            <span className={styles.specLabel}>キャリバー</span>
                            <span className={styles.specValue}>{spec.caliber}</span>
                          </div>
                        )}
                        {spec.caseSizeMmRange != null && (
                          <div className={styles.specRow}>
                            <span className={styles.specLabel}>ケース径</span>
                            <span className={styles.specValue}>
                              {spec.caseSizeMmRange[0]}–{spec.caseSizeMmRange[1]} mm
                            </span>
                          </div>
                        )}
                        {spec.waterResistanceM != null && (
                          <div className={styles.specRow}>
                            <span className={styles.specLabel}>防水</span>
                            <span className={styles.specValue}>{spec.waterResistanceM} m</span>
                          </div>
                        )}
                        {(spec.materials?.length ?? 0) > 0 && (
                          <div className={styles.specRow}>
                            <span className={styles.specLabel}>素材</span>
                            <span className={styles.specValue}>{spec.materials!.join(", ")}</span>
                          </div>
                        )}
                        {(spec.bezels?.length ?? 0) > 0 && (
                          <div className={styles.specRow}>
                            <span className={styles.specLabel}>ベゼル</span>
                            <span className={styles.specValue}>{spec.bezels!.join(", ")}</span>
                          </div>
                        )}
                        {(spec.bracelets?.length ?? 0) > 0 && (
                          <div className={styles.specRow}>
                            <span className={styles.specLabel}>ベルト</span>
                            <span className={styles.specValue}>{spec.bracelets!.join(", ")}</span>
                          </div>
                        )}
                        {(spec.dialTags?.length ?? 0) > 0 && (
                          <div className={styles.specRow}>
                            <span className={styles.specLabel}>ダイアル</span>
                            <span className={styles.specValue}>{spec.dialTags!.join(", ")}</span>
                          </div>
                        )}
                        {!spec.movementType && !spec.caliber && !spec.caseSizeMmRange && !spec.waterResistanceM && (spec.materials?.length ?? 0) === 0 && (spec.bezels?.length ?? 0) === 0 && (spec.bracelets?.length ?? 0) === 0 && (spec.dialTags?.length ?? 0) === 0 && (
                          <span className={styles.muted}>—</span>
                        )}
                      </div>
                    )}
                    {!spec && <span className={styles.muted}>—</span>}
                  </AccordionSection>
                </div>
              </div>
            );
            })()}
          </div>
        </div>

        <div className={styles.carouselNavRow}>
          <button
            type="button"
            className={styles.carouselNavBtn}
            onClick={() => go(-1)}
            disabled={currentDisplayIndex <= 0}
            aria-label="前へ"
          >
            前へ
          </button>
          <div className={styles.dots}>
            {displayItems.map((item, i) => {
              const label = item.type === "release" ? item.release.label : item.milestone.label;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentDisplayIndex(i)}
                  className={i === currentDisplayIndex ? styles.dotActive : styles.dot}
                  aria-label={`${label}に切り替え`}
                />
              );
            })}
          </div>
          <button
            type="button"
            className={styles.carouselNavBtn}
            onClick={() => go(1)}
            disabled={currentDisplayIndex >= displayItems.length - 1}
            aria-label="次へ"
          >
            次へ
          </button>
        </div>
        <p className={styles.swipeHint}>左右にスワイプで切り替え</p>
      </section>

      {/* 操作用: このリリースで選べる仕様（選択肢一覧） */}
      {(vm && (vm.materials?.length || vm.bezels?.length || vm.dials?.length || vm.bracelets?.length || vm.sizes?.length)) && (
        <section className={styles.sectionSpecList}>
          <h2 className={styles.sectionTitleSecondary}>このリリースで選べる仕様（選択肢一覧）</h2>
          <p className={styles.sectionLeadSecondary}>素材・ベゼル・ダイアル・ベルト・サイズから選んだ条件をマイ時計に保存できます。</p>
          <div className={styles.chipWrap}>
            {(vm.materials ?? []).map((v) => (
              <button
                key={v}
                type="button"
                className={(selectedVariantMeta.materials as string[] | undefined)?.includes(v) ? styles.chipActive : styles.chip}
                onClick={() => toggleVariantChip("materials", v)}
              >
                {v}
              </button>
            ))}
            {(vm.bezels ?? []).map((v) => (
              <button
                key={v}
                type="button"
                className={(selectedVariantMeta.bezels as string[] | undefined)?.includes(v) ? styles.chipActive : styles.chip}
                onClick={() => toggleVariantChip("bezels", v)}
              >
                {v}
              </button>
            ))}
            {(vm.dials ?? []).map((v) => (
              <button
                key={v}
                type="button"
                className={(selectedVariantMeta.dials as string[] | undefined)?.includes(v) ? styles.chipActive : styles.chip}
                onClick={() => toggleVariantChip("dials", v)}
              >
                {v}
              </button>
            ))}
            {(vm.bracelets ?? []).map((v) => (
              <button
                key={v}
                type="button"
                className={(selectedVariantMeta.bracelets as string[] | undefined)?.includes(v) ? styles.chipActive : styles.chip}
                onClick={() => toggleVariantChip("bracelets", v)}
              >
                {v}
              </button>
            ))}
            {(vm.sizes ?? []).map((v) => (
              <button
                key={v}
                type="button"
                className={(selectedVariantMeta.sizes as number[] | undefined)?.includes(v) ? styles.chipActive : styles.chip}
                onClick={() => toggleVariantChip("sizes", v)}
              >
                {v}mm
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.addRemoveWrap}>
          <button
            type="button"
            onClick={handleAddMine}
            disabled={addDisabled}
            className={styles.addBtn}
          >
            {alreadyInMyWatches ? "追加済み" : added ? "追加しました" : "マイウォッチへ追加"}
          </button>
          {alreadyInMyWatches && (
            <button
              type="button"
              onClick={handleRemoveMine}
              className={styles.removeBtn}
            >
              削除
            </button>
          )}
          <button
            type="button"
            onClick={handleAddWishlist}
            disabled={addWishlistDisabled}
            className={styles.addBtnSecondary}
          >
            {alreadyInWishlist ? "追加済み" : addedToWishlist ? "追加しました" : "欲しい時計を追加"}
          </button>
          {alreadyInWishlist && (
            <button
              type="button"
              onClick={handleRemoveWishlist}
              className={styles.removeBtn}
            >
              削除
            </button>
          )}
        </div>
      </section>

      {coll.wikipediaUrlEn && (
        <p className={styles.wiki}>
          <a href={coll.wikipediaUrlEn} target="_blank" rel="noopener noreferrer">
            Wikipedia（英語）
          </a>
        </p>
      )}
    </div>
  );
}
