import { useState, useEffect } from "react";
import type { SeedData } from "./types";

export type VariantSpecsByCollection = Record<string, Record<string, Record<string, unknown>>>;

export function useSeed(): {
  seed: SeedData | null;
  variantSpecs: VariantSpecsByCollection | null;
  loading: boolean;
  error: string | null;
} {
  const [seed, setSeed] = useState<SeedData | null>(null);
  const [variantSpecs, setVariantSpecs] = useState<VariantSpecsByCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpts: RequestInit = {
      cache: "no-store",
      headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" },
    };
    // 開発時は毎回別URLでキャッシュを無効化。本番は v を上げて差し替え時にキャッシュ回避
    const seedUrl =
      import.meta.env.DEV
        ? `/seed.json?t=${Date.now()}`
        : "/seed.json?v=4";
    Promise.all([
      fetch(seedUrl, fetchOpts).then((r) => r.json()) as Promise<SeedData>,
      fetch("/era_variant_specs.json", fetchOpts)
        .then((r) => r.json())
        .then((j) => (typeof j === "object" && j !== null ? j as VariantSpecsByCollection : {}))
        .catch(() => ({})),
    ])
      .then(([seedData, specs]) => {
        setSeed(seedData);
        setVariantSpecs(specs);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message ?? "Failed to load");
        setLoading(false);
      });
  }, []);

  return { seed, variantSpecs, loading, error };
}
