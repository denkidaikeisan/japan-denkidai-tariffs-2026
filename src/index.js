import { readFileSync } from 'node:fs';

const RAW_DATASET = JSON.parse(
  readFileSync(new URL('../data/power-companies-2026.json', import.meta.url), 'utf8')
);

/** 公益社団法人 全国家庭電気製品公正取引協議会 目安単価（税込・円/kWh） */
export const KOUTORIKYO_RATE = RAW_DATASET.benchmarks.koutorikyo_unit_rate_jpy_per_kwh;

/** 経済産業省 2026年度（令和8年度）再エネ賦課金単価（税込・円/kWh） */
export const SAIENE_RATE_2026 = RAW_DATASET.benchmarks.saiene_surcharge_fy2026_jpy_per_kwh;

/** デフォルト燃料費調整額（円/kWh） */
export const DEFAULT_FUEL_ADJUSTMENT = RAW_DATASET.benchmarks.default_fuel_adjustment_jpy_per_kwh;

/** データセットのメタ情報 */
export const TARIFF_DATASET_META = Object.freeze({
  schemaVersion: RAW_DATASET.schema_version,
  updatedAt: RAW_DATASET.updated_at,
  effectiveFrom: RAW_DATASET.effective_from,
  jurisdiction: RAW_DATASET.jurisdiction,
  currency: RAW_DATASET.currency,
  taxIncluded: RAW_DATASET.tax_included,
  referenceCalculator: RAW_DATASET.reference_calculator,
  sources: RAW_DATASET.sources,
});

/** 全国10大電力会社の従量電灯単価データ（2026年11月1日改定基準・税込） */
export const POWER_COMPANIES = Object.freeze(
  RAW_DATASET.companies.map((company) => Object.freeze({ ...company }))
);

/** slug から電力会社オブジェクトを引くマップ */
export const POWER_COMPANY_MAP = Object.freeze(
  Object.fromEntries(POWER_COMPANIES.map((company) => [company.slug, company]))
);

/** デフォルト単価設定（東京電力EP・第2段階・2026年度再エネ賦課金込み） */
export const DEFAULT_RATE_CONFIG = Object.freeze({
  mode: 'company',
  companySlug: 'tokyo',
  tier: 2,
  includeSaiene: true,
  saieneRate: SAIENE_RATE_2026,
  fuelAdjustment: DEFAULT_FUEL_ADJUSTMENT,
});

/**
 * 小数点以下を指定桁数で四捨五入します。
 * @param {number} num
 * @param {number} decimals
 * @returns {number}
 */
export function roundTo(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * slug から電力会社を取得します（未一致時は東京電力EPへフォールバック）。
 * @param {string} slug
 */
export function getCompanyBySlug(slug) {
  return POWER_COMPANY_MAP[slug] ?? POWER_COMPANIES[0];
}

/**
 * 電力会社と段階（1 / 2 / 3）から基本の電力量料金単価（円/kWh）を取得します。
 * @param {string | object} companyOrSlug
 * @param {1 | 2 | 3} tier
 * @returns {number}
 */
export function getBaseTierRate(companyOrSlug, tier) {
  const company =
    typeof companyOrSlug === 'string'
      ? getCompanyBySlug(companyOrSlug)
      : companyOrSlug ?? POWER_COMPANIES[0];

  if (tier === 1) return company.tier1Rate;
  if (tier === 3) return company.tier3Rate;
  return company.tier2Rate;
}

/**
 * 電力会社・段階・再エネ賦課金・燃料費調整額から実効単価（円/kWh）を算出します。
 * @param {Partial<typeof DEFAULT_RATE_CONFIG>} [config]
 */
export function getEffectiveRate(config = {}) {
  const merged = { ...DEFAULT_RATE_CONFIG, ...config };

  if (merged.mode === 'koutorikyo') {
    return {
      baseRate: KOUTORIKYO_RATE,
      saiene: 0,
      fuel: 0,
      effectiveRate: KOUTORIKYO_RATE,
      label: '公取協 目安単価（31.00円/kWh）',
    };
  }

  const company = getCompanyBySlug(merged.companySlug);
  const baseRate = getBaseTierRate(company, merged.tier);
  const saiene = merged.includeSaiene ? merged.saieneRate : 0;
  const fuel = merged.fuelAdjustment;
  const effectiveRate = Math.max(0, roundTo(baseRate + saiene + fuel, 2));

  return {
    baseRate,
    saiene,
    fuel,
    effectiveRate,
    label: `${company.shortName} 第${merged.tier}段階`,
  };
}

/**
 * 消費電力（W）・1日の使用時間（h）・実効単価（円/kWh）・月間日数から電気代を試算します。
 * 計算式: 消費電力(W) ÷ 1000 × 使用時間(h) × 実効単価(円/kWh)
 * @param {number} watts
 * @param {number} hoursPerDay
 * @param {number} effectiveRate
 * @param {number} [daysPerMonth=30]
 */
export function calculateFromWatts(watts, hoursPerDay, effectiveRate, daysPerMonth = 30) {
  const safeW = Math.max(0, watts);
  const safeH = Math.max(0, Math.min(24, hoursPerDay));
  const safeDays = Math.max(1, Math.min(31, daysPerMonth));
  const safeRate = Math.max(0, effectiveRate);

  const kwhPerHour = safeW / 1000;
  const kwhPerDay = kwhPerHour * safeH;
  const kwhPerMonth = kwhPerDay * safeDays;
  const kwhPerYear = kwhPerDay * 365;

  return {
    watts: safeW,
    hoursPerDay: safeH,
    daysPerMonth: safeDays,
    kwhPerHour,
    kwhPerDay,
    kwhPerMonth,
    kwhPerYear,
    costPerHour: kwhPerHour * safeRate,
    costPerDay: kwhPerDay * safeRate,
    costPerMonth: kwhPerMonth * safeRate,
    costPerYear: kwhPerYear * safeRate,
    effectiveRate: safeRate,
  };
}

/**
 * 電力量（kWh）と実効単価（円/kWh）から直接電気代を算出します。
 * @param {number} kwh
 * @param {number} effectiveRate
 */
export function calculateFromKwh(kwh, effectiveRate) {
  const safeKwh = Math.max(0, kwh);
  const safeRate = Math.max(0, effectiveRate);
  return {
    kwh: safeKwh,
    effectiveRate: safeRate,
    cost: safeKwh * safeRate,
  };
}

/**
 * 全国10大電力会社の月間使用量（kWh）に応じた段階累進＋基本料金／最低料金の総額を試算します。
 * - 従量電灯B（アンペア制）: 基本料金（30A / 40A）＋第1〜3段階累進
 * - 従量電灯A（最低料金制）: 最低料金（10〜15kWh込み）＋超過分の第1〜3段階累進
 * @param {string | object} companyOrSlug
 * @param {number} monthlyKwh
 * @param {{ ampere?: 30 | 40, includeSaiene?: boolean, saieneRate?: number, fuelAdjustment?: number }} [options]
 */
export function calculateMonthlyBill(companyOrSlug, monthlyKwh, options = {}) {
  const company =
    typeof companyOrSlug === 'string'
      ? getCompanyBySlug(companyOrSlug)
      : companyOrSlug ?? POWER_COMPANIES[0];

  const kwh = Math.max(0, monthlyKwh);
  const includeSaiene = options.includeSaiene ?? true;
  const saieneRate = options.saieneRate ?? SAIENE_RATE_2026;
  const fuelRate = options.fuelAdjustment ?? DEFAULT_FUEL_ADJUSTMENT;

  let fixedCharge = 0;
  let tier1Kwh = 0;
  let tier2Kwh = 0;
  let tier3Kwh = 0;

  if (company.planType === 'B') {
    fixedCharge = options.ampere === 40 ? (company.base40A ?? 0) : (company.base30A ?? 0);
    tier1Kwh = Math.min(kwh, company.tier1End);
    tier2Kwh = Math.max(0, Math.min(kwh, company.tier2End) - company.tier1End);
    tier3Kwh = Math.max(0, kwh - company.tier2End);
  } else {
    fixedCharge = company.minCharge ?? 0;
    const minKwh = company.minKwh ?? 15;
    tier1Kwh = Math.max(0, Math.min(kwh, company.tier1End) - minKwh);
    tier2Kwh = Math.max(0, Math.min(kwh, company.tier2End) - company.tier1End);
    tier3Kwh = Math.max(0, kwh - company.tier2End);
  }

  const tier1Charge = tier1Kwh * company.tier1Rate;
  const tier2Charge = tier2Kwh * company.tier2Rate;
  const tier3Charge = tier3Kwh * company.tier3Rate;
  const saieneCharge = includeSaiene ? kwh * saieneRate : 0;
  const fuelCharge = kwh * fuelRate;
  const total = Math.max(
    0,
    fixedCharge + tier1Charge + tier2Charge + tier3Charge + saieneCharge + fuelCharge
  );
  const avgUnitRate = kwh > 0 ? total / kwh : 0;

  return {
    companySlug: company.slug,
    companyName: company.name,
    planName: company.planName,
    planType: company.planType,
    monthlyKwh: kwh,
    tier1Kwh,
    tier2Kwh,
    tier3Kwh,
    fixedCharge,
    tier1Charge,
    tier2Charge,
    tier3Charge,
    saieneCharge,
    fuelCharge,
    total,
    avgUnitRate,
  };
}

/**
 * 月間電気代（円）から省エネランク（S〜D）と目安判定を算出します。
 * @param {number} costPerMonth
 */
export function evaluateEcoImpact(costPerMonth) {
  const yen = Math.max(0, Math.round(Number.isFinite(costPerMonth) ? costPerMonth : 0));

  if (yen <= 500) {
    const detail = '常時稼働でも低負荷';
    return {
      rank: 'S',
      title: '超省エネ水準',
      detail,
    };
  }

  if (yen <= 2000) {
    const detail = '家計負担は軽微・継続運用OK';
    return {
      rank: 'A',
      title: '省エネ安心帯',
      detail,
    };
  }

  if (yen <= 5000) {
    const detail = '稼働時間・設定見直しで節電可';
    return {
      rank: 'B',
      title: '標準コスト帯',
      detail,
    };
  }

  if (yen <= 10000) {
    const detail = '省エネ機種との年間差額を比較推奨';
    return {
      rank: 'C',
      title: '高コスト警戒帯',
      detail,
    };
  }

  const detail = '省エネ機買い替え・電力プラン見直し必須';
  return {
    rank: 'D',
    title: '最優先見直し帯',
    detail,
  };
}

/**
 * 2家電比較の月間・シーズン差額・倍率・構成比を算出します。
 * @param {number} leftMonth
 * @param {number} rightMonth
 * @param {number} leftSeason
 * @param {number} rightSeason
 */
export function evaluateVsScore(leftMonth, rightMonth, leftSeason, rightSeason) {
  const sA = Math.max(0, leftSeason);
  const sB = Math.max(0, rightSeason);
  const diffMonth = Math.abs(leftMonth - rightMonth);
  const diffSeason = Math.abs(sA - sB);
  const isTie = diffSeason < 1;
  const leftWins = sA <= sB;

  const minS = Math.min(sA, sB);
  const maxS = Math.max(sA, sB);
  let ratioBadge = 'ほぼ同額';
  if (!isTie) {
    if (minS <= 0) {
      ratioBadge = '大幅にお得';
    } else {
      const mult = maxS / minS;
      if (mult >= 10) {
        ratioBadge = `約${Math.round(mult)}倍お得`;
      } else if (mult >= 1.1) {
        ratioBadge = `約${mult.toFixed(1)}倍お得`;
      } else {
        const pct = Math.max(1, Math.round(((maxS - minS) / maxS) * 100));
        ratioBadge = `約${pct}%お得`;
      }
    }
  }

  const total = sA + sB;
  const leftSharePct = total > 0 ? Math.min(92, Math.max(8, (sA / total) * 100)) : 50;
  const rightSharePct = 100 - leftSharePct;

  return {
    leftWins,
    isTie,
    diffMonth,
    diffSeason,
    ratioBadge,
    leftSharePct,
    rightSharePct,
  };
}

/**
 * 2つの家電（または運用方法）の月間・シーズン電気代と差額をまとめて比較試算します。
 * @param {{ name?: string, watts: number, hoursPerDay: number, daysPerYear?: number }} left
 * @param {{ name?: string, watts: number, hoursPerDay: number, daysPerYear?: number }} right
 * @param {number | Partial<typeof DEFAULT_RATE_CONFIG>} [rateOrConfig=DEFAULT_RATE_CONFIG]
 * @param {number} [daysPerMonth=30]
 */
export function compareAppliances(left, right, rateOrConfig = DEFAULT_RATE_CONFIG, daysPerMonth = 30) {
  const rateInfo =
    typeof rateOrConfig === 'number'
      ? { effectiveRate: Math.max(0, rateOrConfig), label: `${formatRate(rateOrConfig)}` }
      : getEffectiveRate(rateOrConfig);

  const leftDays = Math.max(1, left.daysPerYear ?? 365);
  const rightDays = Math.max(1, right.daysPerYear ?? 365);

  const leftUsage = calculateFromWatts(left.watts, left.hoursPerDay, rateInfo.effectiveRate, daysPerMonth);
  const rightUsage = calculateFromWatts(right.watts, right.hoursPerDay, rateInfo.effectiveRate, daysPerMonth);

  const leftSeasonKwh = leftUsage.kwhPerDay * leftDays;
  const rightSeasonKwh = rightUsage.kwhPerDay * rightDays;
  const leftSeasonCost = leftUsage.costPerDay * leftDays;
  const rightSeasonCost = rightUsage.costPerDay * rightDays;

  const score = evaluateVsScore(
    leftUsage.costPerMonth,
    rightUsage.costPerMonth,
    leftSeasonCost,
    rightSeasonCost
  );

  return {
    effectiveRate: rateInfo.effectiveRate,
    rateLabel: rateInfo.label,
    left: {
      name: left.name ?? '家電A',
      daysPerYear: leftDays,
      ...leftUsage,
      seasonKwh: leftSeasonKwh,
      seasonCost: leftSeasonCost,
    },
    right: {
      name: right.name ?? '家電B',
      daysPerYear: rightDays,
      ...rightUsage,
      seasonKwh: rightSeasonKwh,
      seasonCost: rightSeasonCost,
    },
    score,
    cheaperSide: score.isTie ? 'tie' : score.leftWins ? 'left' : 'right',
  };
}

/**
 * 金額を日本語の円表記に整形します。
 * @param {number} amount
 * @param {boolean} [showDecimalForSmall=false]
 * @returns {string}
 */
export function formatYen(amount, showDecimalForSmall = false) {
  if (!Number.isFinite(amount)) return '0円';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (showDecimalForSmall && abs < 100) {
    return `${sign}${roundTo(abs, 1).toLocaleString('ja-JP', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}円`;
  }
  return `${sign}${Math.round(abs).toLocaleString('ja-JP')}円`;
}

/**
 * 単価を「XX.XX円/kWh」表記に整形します。
 * @param {number} rate
 * @returns {string}
 */
export function formatRate(rate) {
  return `${roundTo(rate, 2).toLocaleString('ja-JP', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}円/kWh`;
}

/**
 * 電力量を「X.XXkWh」または「XX.XkWh」表記に整形します。
 * @param {number} kwh
 * @returns {string}
 */
export function formatKwh(kwh) {
  const decimals = kwh < 10 ? 2 : 1;
  return `${roundTo(kwh, decimals).toLocaleString('ja-JP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}kWh`;
}
