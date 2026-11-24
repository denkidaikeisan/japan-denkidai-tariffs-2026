import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  KOUTORIKYO_RATE,
  SAIENE_RATE_2026,
  DEFAULT_FUEL_ADJUSTMENT,
  DEFAULT_RATE_CONFIG,
  TARIFF_DATASET_META,
  POWER_COMPANIES,
  POWER_COMPANY_MAP,
  roundTo,
  getCompanyBySlug,
  getBaseTierRate,
  getEffectiveRate,
  calculateFromWatts,
  calculateFromKwh,
  calculateMonthlyBill,
  evaluateEcoImpact,
  evaluateVsScore,
  compareAppliances,
  formatYen,
  formatRate,
  formatKwh,
} from '../src/index.js';

describe('データセット基本定数・10大電力会社マスター検証', () => {
  it('公的基準値とメタデータが2026年11月基準に一致する', () => {
    assert.equal(KOUTORIKYO_RATE, 31.0);
    assert.equal(SAIENE_RATE_2026, 4.18);
    assert.equal(DEFAULT_FUEL_ADJUSTMENT, 0.0);
    assert.equal(TARIFF_DATASET_META.jurisdiction, 'JP');
    assert.equal(TARIFF_DATASET_META.currency, 'JPY');
    assert.equal(TARIFF_DATASET_META.taxIncluded, true);
    assert.equal(TARIFF_DATASET_META.updatedAt, '2026-11-24');
    assert.equal(TARIFF_DATASET_META.referenceCalculator, 'https://denkidaikeisan.com');
  });

  it('全国10大電力会社すべてが揃い、B制6社・A制4社・北海道280kWh境界が正確である', () => {
    assert.equal(POWER_COMPANIES.length, 10);
    const slugs = new Set(POWER_COMPANIES.map((c) => c.slug));
    assert.equal(slugs.size, 10);

    const planB = POWER_COMPANIES.filter((c) => c.planType === 'B');
    const planA = POWER_COMPANIES.filter((c) => c.planType === 'A');
    assert.equal(planB.length, 6);
    assert.equal(planA.length, 4);

    for (const c of POWER_COMPANIES) {
      assert.equal(POWER_COMPANY_MAP[c.slug], c);
      assert.equal(c.tier1End, 120);
      assert.equal(c.tier2End, c.slug === 'hokkaido' ? 280 : 300);
      assert.equal(c.tier1WithSaiene, roundTo(c.tier1Rate + SAIENE_RATE_2026, 2));
      assert.equal(c.tier2WithSaiene, roundTo(c.tier2Rate + SAIENE_RATE_2026, 2));
      assert.equal(c.tier3WithSaiene, roundTo(c.tier3Rate + SAIENE_RATE_2026, 2));
    }

    // 未登録slugは東京電力へフォールバック
    assert.equal(getCompanyBySlug('unknown-utility').slug, 'tokyo');
  });
});

describe('実効単価算出 (getEffectiveRate / getBaseTierRate)', () => {
  it('デフォルト設定で東京電力 第2段階 + 再エネ賦課金 = 40.63円/kWhを返す', () => {
    const res = getEffectiveRate(DEFAULT_RATE_CONFIG);
    assert.equal(res.baseRate, 36.45);
    assert.equal(res.saiene, 4.18);
    assert.equal(res.fuel, 0);
    assert.equal(res.effectiveRate, 40.63);
    assert.equal(res.label, '東京電力 第2段階');
  });

  it('公取協目安単価モードでは31.00円/kWh固定となる', () => {
    const res = getEffectiveRate({ mode: 'koutorikyo' });
    assert.equal(res.effectiveRate, 31.0);
    assert.equal(res.saiene, 0);
    assert.equal(res.fuel, 0);
  });

  it('再エネ賦課金OFFおよびマイナス燃料費調整額を正しく反映する', () => {
    const noSaiene = getEffectiveRate({
      companySlug: 'kansai',
      tier: 3,
      includeSaiene: false,
      fuelAdjustment: -2.5,
    });
    assert.equal(getBaseTierRate('kansai', 3), 29.27);
    assert.equal(noSaiene.baseRate, 29.27);
    assert.equal(noSaiene.saiene, 0);
    assert.equal(noSaiene.fuel, -2.5);
    assert.equal(noSaiene.effectiveRate, 26.77);
  });
});

describe('消費電力W・電力量kWhからの電気代計算', () => {
  it('1000W・1時間・東京電力第2段階(再エネ込み40.63円)で1時間40.63円・月1,218.9円となる', () => {
    const res = calculateFromWatts(1000, 1, 40.63, 30);
    assert.equal(res.kwhPerHour, 1);
    assert.equal(res.kwhPerDay, 1);
    assert.equal(res.kwhPerMonth, 30);
    assert.equal(res.kwhPerYear, 365);
    assert.equal(roundTo(res.costPerHour, 2), 40.63);
    assert.equal(roundTo(res.costPerMonth, 2), 1218.9);
    assert.equal(roundTo(res.costPerYear, 2), 14829.95);
  });

  it('エアコン24時間つけっぱなし（320W・24時間・30日）で月約9,361円となる', () => {
    const res = calculateFromWatts(320, 24, 40.63, 30);
    assert.equal(roundTo(res.kwhPerDay, 2), 7.68);
    assert.equal(Math.round(res.costPerDay), 312);
    assert.equal(Math.round(res.costPerMonth), 9361);
  });

  it('異常入力（負数・24時間超・日数範囲外）が安全にクランプされる', () => {
    const res = calculateFromWatts(-500, 30, 40.63, 45);
    assert.equal(res.watts, 0);
    assert.equal(res.hoursPerDay, 24);
    assert.equal(res.daysPerMonth, 31);
    assert.equal(res.costPerMonth, 0);

    const kwhRes = calculateFromKwh(10, 31.0);
    assert.equal(kwhRes.cost, 310);
  });
});

describe('10大電力会社 月間累進料金精算 (calculateMonthlyBill)', () => {
  it('従量電灯B（東京電力EP・30A・400kWh・再エネ込み）を全3段階で正確に積算する', () => {
    const bill = calculateMonthlyBill('tokyo', 400, { ampere: 30, includeSaiene: true });
    assert.equal(bill.planType, 'B');
    assert.equal(bill.fixedCharge, 1176.18);
    assert.equal(bill.tier1Kwh, 120);
    assert.equal(bill.tier2Kwh, 180);
    assert.equal(bill.tier3Kwh, 100);
    assert.equal(roundTo(bill.tier1Charge, 2), roundTo(120 * 29.85, 2));
    assert.equal(roundTo(bill.tier2Charge, 2), roundTo(180 * 36.45, 2));
    assert.equal(roundTo(bill.tier3Charge, 2), roundTo(100 * 40.54, 2));
    assert.equal(roundTo(bill.saieneCharge, 2), roundTo(400 * 4.18, 2));
    const expectedTotal = 1176.18 + 120 * 29.85 + 180 * 36.45 + 100 * 40.54 + 400 * 4.18;
    assert.equal(roundTo(bill.total, 2), roundTo(expectedTotal, 2));
  });

  it('従量電灯B（北海道電力・40A・300kWh）は280kWh超が第3段階に入る', () => {
    const bill = calculateMonthlyBill('hokkaido', 300, { ampere: 40, includeSaiene: false });
    assert.equal(bill.fixedCharge, 2288.4);
    assert.equal(bill.tier1Kwh, 120);
    assert.equal(bill.tier2Kwh, 160);
    assert.equal(bill.tier3Kwh, 20);
    const expected = 2288.4 + 120 * 35.77 + 160 * 42.06 + 20 * 45.78;
    assert.equal(roundTo(bill.total, 2), roundTo(expected, 2));
  });

  it('従量電灯A（関西電力・最低料金15kWh込み）の境界計算が正確である', () => {
    // 10kWhは最低料金内なので電力量料金0円（再エネ賦課金は10kWh分発生）
    const low = calculateMonthlyBill('kansai', 10, { includeSaiene: true });
    assert.equal(low.fixedCharge, 763.81);
    assert.equal(low.tier1Kwh, 0);
    assert.equal(low.tier1Charge, 0);
    assert.equal(roundTo(low.saieneCharge, 2), 41.8);
    assert.equal(roundTo(low.total, 2), roundTo(763.81 + 41.8, 2));

    // 350kWhは第1段階が105kWh（120-15）、第2段階が180kWh、第3段階が50kWh
    const high = calculateMonthlyBill('kansai', 350, { includeSaiene: true });
    assert.equal(high.tier1Kwh, 105);
    assert.equal(high.tier2Kwh, 180);
    assert.equal(high.tier3Kwh, 50);
    const expectedHigh = 763.81 + 105 * 20.89 + 180 * 26.29 + 50 * 29.27 + 350 * 4.18;
    assert.equal(roundTo(high.total, 2), roundTo(expectedHigh, 2));
  });

  it('四国電力（最低11kWh）と沖縄電力（最低10kWh）の固有最低kWh境界が正確である', () => {
    const shikoku = calculateMonthlyBill('shikoku', 120, { includeSaiene: false });
    assert.equal(shikoku.tier1Kwh, 109);
    assert.equal(shikoku.tier2Kwh, 0);

    const okinawa = calculateMonthlyBill('okinawa', 120, { includeSaiene: false });
    assert.equal(okinawa.tier1Kwh, 110);
    assert.equal(okinawa.tier2Kwh, 0);
  });
});

describe('2家電省エネ比較PK & 省エネランク判定', () => {
  it('エアコン暖房(580W) vs セラミックファンヒーター(1200W) の冬120日比較が正確である', () => {
    const cmp = compareAppliances(
      { name: 'エアコン暖房', watts: 580, hoursPerDay: 8, daysPerYear: 120 },
      { name: 'セラミックファンヒーター', watts: 1200, hoursPerDay: 8, daysPerYear: 120 },
      { companySlug: 'tokyo', tier: 2, includeSaiene: true }
    );
    assert.equal(cmp.cheaperSide, 'left');
    assert.equal(cmp.score.leftWins, true);
    assert.equal(cmp.score.isTie, false);
    assert.equal(Math.round(cmp.left.costPerMonth), 5656);
    assert.equal(Math.round(cmp.right.costPerMonth), 11701);
    assert.equal(Math.round(cmp.score.diffMonth), 6046);
    assert.equal(Math.round(cmp.score.diffSeason), 24183);
    assert.equal(cmp.score.ratioBadge, '約2.1倍お得');
  });

  it('同額比較では isTie=true / cheaperSide="tie" になる', () => {
    const score = evaluateVsScore(1500, 1500, 18000, 18000.4);
    assert.equal(score.isTie, true);
    assert.equal(score.ratioBadge, 'ほぼ同額');
  });

  it('省エネランク S〜D の境界値判定が正確である', () => {
    assert.equal(evaluateEcoImpact(341).rank, 'S');
    assert.equal(evaluateEcoImpact(1500).rank, 'A');
    assert.equal(evaluateEcoImpact(4291).rank, 'B');
    assert.equal(evaluateEcoImpact(9361).rank, 'C');
    assert.equal(evaluateEcoImpact(11701).rank, 'D');
  });

  it('日本語フォーマット関数が正しく整形する', () => {
    assert.equal(formatYen(40.63, true), '40.6円');
    assert.equal(formatYen(11701), '11,701円');
    assert.equal(formatRate(40.63), '40.63円/kWh');
    assert.equal(formatKwh(7.68), '7.68kWh');
    assert.equal(formatKwh(120.46), '120.5kWh');
  });
});

describe('JSON・CSVデータセット整合性チェック', () => {
  it('data/power-companies-2026.csv が JSON と全10社・全単価で完全一致する', () => {
    const csvText = readFileSync(new URL('../data/power-companies-2026.csv', import.meta.url), 'utf8').trim();
    const lines = csvText.split('\n');
    assert.equal(lines.length, 11); // header + 10 companies

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      assert.equal(cols.length, 15);
      const [
        slug,
        companyName,
        planName,
        planType,
        base30A,
        base40A,
        minCharge,
        minKwh,
        tier1End,
        tier2End,
        t1,
        t2,
        t3,
        t2s,
        t3s,
      ] = cols;

      const jsonCompany = POWER_COMPANY_MAP[slug];
      assert.ok(jsonCompany, `slug ${slug} must exist in JSON`);
      assert.equal(companyName, jsonCompany.name);
      assert.equal(planName, jsonCompany.planName);
      assert.equal(planType, jsonCompany.planType);
      assert.equal(Number(tier1End), jsonCompany.tier1End);
      assert.equal(Number(tier2End), jsonCompany.tier2End);
      assert.equal(Number(t1), jsonCompany.tier1Rate);
      assert.equal(Number(t2), jsonCompany.tier2Rate);
      assert.equal(Number(t3), jsonCompany.tier3Rate);
      assert.equal(Number(t2s), jsonCompany.tier2WithSaiene);
      assert.equal(Number(t3s), jsonCompany.tier3WithSaiene);

      if (planType === 'B') {
        assert.equal(Number(base30A), jsonCompany.base30A);
        assert.equal(Number(base40A), jsonCompany.base40A);
      } else {
        assert.equal(Number(minCharge), jsonCompany.minCharge);
        assert.equal(Number(minKwh), jsonCompany.minKwh);
      }
    }
  });

  it('data/appliances-wattage-jp.csv が全30家電で計算式と一致する', () => {
    const csvText = readFileSync(new URL('../data/appliances-wattage-jp.csv', import.meta.url), 'utf8').trim();
    const lines = csvText.split('\n');
    assert.equal(lines.length, 31); // header + 30 appliances

    const tepcoRate = getEffectiveRate({ companySlug: 'tokyo', tier: 2, includeSaiene: true }).effectiveRate;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      assert.equal(cols.length, 11);
      const watts = Number(cols[3]);
      const hours = Number(cols[5]);
      const kwh1h = Number(cols[6]);
      const cost1hK = Number(cols[7]);
      const cost1hT = Number(cols[8]);
      const costMoK = Number(cols[9]);
      const costMoT = Number(cols[10]);

      const calcK = calculateFromWatts(watts, hours, KOUTORIKYO_RATE, 30);
      const calcT = calculateFromWatts(watts, hours, tepcoRate, 30);

      assert.equal(kwh1h, roundTo(calcK.kwhPerHour, 4));
      assert.equal(cost1hK, roundTo(calcK.costPerHour, 2));
      assert.equal(cost1hT, roundTo(calcT.costPerHour, 2));
      assert.equal(costMoK, Math.round(calcK.costPerMonth));
      assert.equal(costMoT, Math.round(calcT.costPerMonth));
    }
  });
});
