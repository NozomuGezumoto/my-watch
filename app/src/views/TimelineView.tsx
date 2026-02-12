import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { SeedData } from "../types";
import styles from "./TimelineView.module.css";

const MIN_YEAR = 1945;
const MAX_YEAR = 2025;

export function TimelineView({ seed }: { seed: SeedData }) {
  const [year, setYear] = useState(1970);

  const milestonesInYear = useMemo(() => {
    const list = seed.milestones ?? [];
    return list.filter((m) => {
      const to = m.yearTo ?? year;
      return m.yearFrom <= year && to >= year;
    }).sort((a, b) => a.yearFrom - b.yearFrom);
  }, [seed.milestones, year]);

  const collectionsInYear = useMemo(() => {
    const collIds = new Set(milestonesInYear.map((m) => m.collectionId));
    return seed.collections
      .filter((c) => collIds.has(c.id))
      .sort((a, b) => (a.introducedYear ?? 0) - (b.introducedYear ?? 0));
  }, [seed.collections, milestonesInYear]);

  const getBrand = (brandId: string) => seed.brands.find((b) => b.id === brandId);
  const getCollection = (id: string) => seed.collections.find((c) => c.id === id);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>年代で見る</h1>

      <div className={styles.yearControl}>
        <button
          type="button"
          className={styles.yearBtn}
          onClick={() => setYear((y) => Math.max(MIN_YEAR, y - 1))}
          disabled={year <= MIN_YEAR}
          aria-label="1年戻る"
        >
          ‹
        </button>
        <span className={styles.yearDisplay}>{year} 年</span>
        <button
          type="button"
          className={styles.yearBtn}
          onClick={() => setYear((y) => Math.min(MAX_YEAR, y + 1))}
          disabled={year >= MAX_YEAR}
          aria-label="1年進む"
        >
          ›
        </button>
      </div>

      <div className={styles.sliderWrap}>
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className={styles.slider}
          aria-label="年を選択"
        />
        <div className={styles.sliderRange}>
          <span>{MIN_YEAR}</span>
          <span>{MAX_YEAR}</span>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{year} 年の進化点（Milestone）</h2>
        {milestonesInYear.length === 0 ? (
          <p className={styles.empty}>該当する進化点はありません。</p>
        ) : (
          <ul className={styles.cardList}>
            {milestonesInYear.map((m) => {
              const coll = getCollection(m.collectionId);
              const brand = coll ? getBrand(coll.brandId) : null;
              return (
                <li key={m.id} className={styles.card}>
                  <Link
                    to={`/collection/${coll?.slug ?? ""}`}
                    className={styles.cardLink}
                    state={coll ? { highlightMilestoneId: m.id } : undefined}
                  >
                    <span className={styles.cardBrand}>{brand?.name}</span>
                    <span className={styles.cardName}>{coll?.name ?? m.collectionId}</span>
                    <span className={styles.cardEra}>{m.label}</span>
                    {(m.yearFrom !== year || (m.yearTo != null && m.yearTo !== year)) && (
                      <span className={styles.cardYears}>
                        {m.yearFrom}
                        {m.yearTo != null ? `–${m.yearTo}` : "–"}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {collectionsInYear.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{year} 年に存在したコレクション</h2>
          <ul className={styles.cardList}>
            {collectionsInYear.map((coll) => {
              const brand = getBrand(coll.brandId);
              const msCount = milestonesInYear.filter((m) => m.collectionId === coll.id).length;
              return (
                <li key={coll.id} className={styles.card}>
                  <Link to={`/collection/${coll.slug}`} className={styles.cardLink}>
                    <span className={styles.cardBrand}>{brand?.name}</span>
                    <span className={styles.cardName}>{coll.name}</span>
                    {msCount > 0 && (
                      <span className={styles.cardEra}>進化点 {msCount} 件</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
