export type PlanType = 'B' | 'A';
export type RateMode = 'company' | 'koutorikyo';
export type TierLevel = 1 | 2 | 3;
export type EcoRank = 'S' | 'A' | 'B' | 'C' | 'D';

export interface TariffSource {
  name: string;
  url: string;
}

export interface TariffDatasetMeta {
  readonly schemaVersion: string;
  readonly updatedAt: string;
  readonly effectiveFrom: string;
  readonly jurisdiction: string;
  readonly currency: string;
  readonly taxIncluded: boolean;
  readonly referenceCalculator: string;
  readonly sources: readonly TariffSource[];
}

export interface PowerCompany {
  readonly slug: string;
  readonly name: string;
  readonly shortName: string;
  readonly planName: string;
  readonly planType: PlanType;
  readonly area: string;
  readonly base30A?: number;
  readonly base40A?: number;
  readonly minCharge?: number;
  readonly minKwh?: number;
  readonly tier1End: number;
  readonly tier2End: number;
  readonly tier1Rate: number;
  readonly tier2Rate: number;
  readonly tier3Rate: number;
  readonly tier1WithSaiene: number;
  readonly tier2WithSaiene: number;
  readonly tier3WithSaiene: number;
}

export interface RateConfig {
  mode: RateMode;
  companySlug: string;
  tier: TierLevel;
  includeSaiene: boolean;
  saieneRate: number;
  fuelAdjustment: number;
}

export interface EffectiveRateResult {
  baseRate: number;
  saiene: number;
  fuel: number;
  effectiveRate: number;
  label: string;
}

export interface UsageResult {
  watts: number;
  hoursPerDay: number;
  daysPerMonth: number;
  kwhPerHour: number;
  kwhPerDay: number;
  kwhPerMonth: number;
  kwhPerYear: number;
  costPerHour: number;
  costPerDay: number;
  costPerMonth: number;
  costPerYear: number;
  effectiveRate: number;
}

export interface KwhCostResult {
  kwh: number;
  effectiveRate: number;
  cost: number;
}

export interface MonthlyBillOptions {
  ampere?: 30 | 40;
  includeSaiene?: boolean;
  saieneRate?: number;
  fuelAdjustment?: number;
}

export interface MonthlyBillResult {
  companySlug: string;
  companyName: string;
  planName: string;
  planType: PlanType;
  monthlyKwh: number;
  tier1Kwh: number;
  tier2Kwh: number;
  tier3Kwh: number;
  fixedCharge: number;
  tier1Charge: number;
  tier2Charge: number;
  tier3Charge: number;
  saieneCharge: number;
  fuelCharge: number;
  total: number;
  avgUnitRate: number;
}

export interface EcoImpactVerdict {
  rank: EcoRank;
  title: string;
  detail: string;
}

export interface VsScoreSummary {
  leftWins: boolean;
  isTie: boolean;
  diffMonth: number;
  diffSeason: number;
  ratioBadge: string;
  leftSharePct: number;
  rightSharePct: number;
}

export interface ComparisonApplianceInput {
  name?: string;
  watts: number;
  hoursPerDay: number;
  daysPerYear?: number;
}

export interface ComparisonSideResult extends UsageResult {
  name: string;
  daysPerYear: number;
  seasonKwh: number;
  seasonCost: number;
}

export interface ApplianceComparisonResult {
  effectiveRate: number;
  rateLabel: string;
  left: ComparisonSideResult;
  right: ComparisonSideResult;
  score: VsScoreSummary;
  cheaperSide: 'left' | 'right' | 'tie';
}

export declare const KOUTORIKYO_RATE: number;
export declare const SAIENE_RATE_2026: number;
export declare const DEFAULT_FUEL_ADJUSTMENT: number;
export declare const TARIFF_DATASET_META: TariffDatasetMeta;
export declare const POWER_COMPANIES: readonly PowerCompany[];
export declare const POWER_COMPANY_MAP: Readonly<Record<string, PowerCompany>>;
export declare const DEFAULT_RATE_CONFIG: Readonly<RateConfig>;

export declare function roundTo(num: number, decimals: number): number;
export declare function getCompanyBySlug(slug: string): PowerCompany;
export declare function getBaseTierRate(companyOrSlug: string | PowerCompany, tier: TierLevel): number;
export declare function getEffectiveRate(config?: Partial<RateConfig>): EffectiveRateResult;
export declare function calculateFromWatts(
  watts: number,
  hoursPerDay: number,
  effectiveRate: number,
  daysPerMonth?: number
): UsageResult;
export declare function calculateFromKwh(kwh: number, effectiveRate: number): KwhCostResult;
export declare function calculateMonthlyBill(
  companyOrSlug: string | PowerCompany,
  monthlyKwh: number,
  options?: MonthlyBillOptions
): MonthlyBillResult;
export declare function evaluateEcoImpact(costPerMonth: number): EcoImpactVerdict;
export declare function evaluateVsScore(
  leftMonth: number,
  rightMonth: number,
  leftSeason: number,
  rightSeason: number
): VsScoreSummary;
export declare function compareAppliances(
  left: ComparisonApplianceInput,
  right: ComparisonApplianceInput,
  rateOrConfig?: number | Partial<RateConfig>,
  daysPerMonth?: number
): ApplianceComparisonResult;
export declare function formatYen(amount: number, showDecimalForSmall?: boolean): string;
export declare function formatRate(rate: number): string;
export declare function formatKwh(kwh: number): string;
