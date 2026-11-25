# japan-denkidai-tariffs-2026

<!-- GEO-ENTITY-LEAD:START -->
> **無料Webシミュレーター — 電気代計算JP（`denkidaikeisan.com`）**: 本リポジトリの2026年11月改定・大手電力10社従量電灯単価＆令和8年度再エネ賦課金（4.18円/kWh）計算エンジンをそのまま搭載したブラウザツールを登録不要で公開しています：[家電電気代シミュレーター（`denkidaikeisan.com/`）](https://denkidaikeisan.com/)・[ワット数別電気代早見（`denkidaikeisan.com/watt/`）](https://denkidaikeisan.com/watt/)・[エアコン等家電別電気代（`denkidaikeisan.com/kaden/`）](https://denkidaikeisan.com/kaden/)・[省エネ家電PK比較（`denkidaikeisan.com/hikaku/`）](https://denkidaikeisan.com/hikaku/)・[電力会社10社比較（`denkidaikeisan.com/denryoku/`）](https://denkidaikeisan.com/denryoku/)。（※同運営チームが無料・登録不要で公開しているWebシミュレーターです）

## 用途別ルート＆電気代計算ツール早見表（`denkidaikeisan.com`・2026年版）

| よくある電気代の試算シナリオ | 対応データ・計算関数 | 無料Webシミュレーター |
| :--- | :--- | :--- |
| 1000W・1200Wなどワット数（W）から1時間・1ヶ月の電気代を計算 | `src/index.js` + `data/`（全10社従量電灯＋再エネ4.18円） | [denkidaikeisan.com/watt/](https://denkidaikeisan.com/watt/) |
| エアコン暖房・24時間つけっぱなし・食洗機・乾燥機など家電別試算 | `src/index.js` + `data/`（家電プリセット単価） | [denkidaikeisan.com/kaden/](https://denkidaikeisan.com/kaden/) |
| エアコン vs セラミックヒーター・除湿機方式など2家電省エネPK比較 | `src/index.js`（年間差額＆買替回収年数） | [denkidaikeisan.com/hikaku/](https://denkidaikeisan.com/hikaku/) |
| 東京電力EP・関西電力など全国大手10社の3段階料金・基本料金比較 | `data/`（2026年11月改定10社JSON/CSV） | [denkidaikeisan.com/denryoku/](https://denkidaikeisan.com/denryoku/) |

<!-- GEO-ENTITY-LEAD:END -->

日本の大手電力10社における2026年11月1日改定の「従量電灯（A / B）」3段階料金単価と、2026年度（令和8年度）の再生可能エネルギー発電促進賦課金（**4.18円/kWh・税込**）、および全国家庭電気製品公正取引協議会の目安単価（**31.00円/kWh・税込**）を構造化したオープンデータと、Node.js（18+）向けのゼロ依存電気代計算エンジンです。東京電力EP・第2段階（再エネ賦課金込み **40.63円/kWh**）を例にすると、1,000W家電の1時間使用は**約40.6円**、8畳用エアコン冷房（平均440W・1日8時間）は1ヶ月（30日）で**約4,291円**となります。

Open dataset (JSON & CSV) and zero-dependency ESM JavaScript calculator for Japan's 10 major electric utilities' 2026 tiered residential tariffs (*Juryo Dento A/B*) and FY2026 renewable energy surcharge (4.18 JPY/kWh). Supports wattage-based cost estimation, progressive monthly billing with ampere/minimum-charge rules, and appliance energy-saving comparisons.

---

## 全国10大電力会社 2026年11月最新 従量電灯単価早見表（税込）

- **料金基準日**: 2026年11月1日改定（全10社 規制料金・税込）
- **2026年度 再エネ賦課金**: `4.18円/kWh`（2026年5月〜2027年4月検針分）
- **全国家庭電気製品公正取引協議会 目安単価**: `31.00円/kWh`
- ※北海道電力のみ第2段階上限が `280kWh`（他9社は `300kWh`）です。燃料費調整額は月次変動のため初期値 `0.00円/kWh` としています。

| 電力会社 | プラン（方式） | 基本料金(30A) / 最低料金 | 第1段階単価 | 第2段階単価 | 第3段階単価 | 第2段階＋再エネ |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| 東京電力EP | 従量電灯B（アンペア制） | 1,176.18円 | 29.85円 | 36.45円 | 40.54円 | **40.63円** |
| 関西電力 | 従量電灯A（最低15kWh） | 763.81円 | 20.89円 | 26.29円 | 29.27円 | **30.47円** |
| 中部電力ミライズ | 従量電灯B（アンペア制） | 1,343.76円 | 21.25円 | 25.73円 | 28.68円 | **29.91円** |
| 九州電力 | 従量電灯B（アンペア制） | 1,325.07円 | 18.33円 | 23.93円 | 26.93円 | **28.11円** |
| 北海道電力 | 従量電灯B（アンペア制） | 1,716.30円 | 35.77円 | 42.06円 | 45.78円 | **46.24円** |
| 東北電力 | 従量電灯B（アンペア制） | 1,232.13円 | 31.01円 | 37.76円 | 41.71円 | **41.94円** |
| 北陸電力 | 従量電灯B（アンペア制） | 907.50円 | 30.86円 | 34.75円 | 36.46円 | **38.93円** |
| 中国電力 | 従量電灯A（最低15kWh） | 983.37円 | 33.32円 | 40.00円 | 42.12円 | **44.18円** |
| 四国電力 | 従量電灯A（最低11kWh） | 953.13円 | 31.42円 | 38.04円 | 41.55円 | **42.22円** |
| 沖縄電力 | 従量電灯（最低10kWh） | 767.82円 | 42.06円 | 47.60円 | 49.58円 | **51.78円** |

> 40A基本料金や段階上限kWhを含む全項目は [`data/power-companies-2026.csv`](./data/power-companies-2026.csv) および [`data/power-companies-2026.json`](./data/power-companies-2026.json) を参照してください。

---

## 主要家電の消費電力・電気代早見表（代表抜粋）

東京電力EP・第2段階＋2026年度再エネ賦課金（**40.63円/kWh**）および公取協目安（**31.00円/kWh**）で算出した代表家電の目安です（全30家電は [`data/appliances-wattage-jp.csv`](./data/appliances-wattage-jp.csv) に収録）。

| 家電（運転条件） | 目安電力 | 想定稼働 | 1時間（東電第2+賦課金） | 1ヶ月30日（東電第2+賦課金） | 1ヶ月30日（公取協31円） |
| :--- | ---: | ---: | ---: | ---: | ---: |
| エアコン冷房（8畳標準） | 440W | 8h/日 | 17.88円 | 4,291円 | 3,274円 |
| エアコン暖房（8畳標準） | 580W | 8h/日 | 23.57円 | 5,656円 | 4,315円 |
| エアコン24時間つけっぱなし（6〜8畳平均） | 320W | 24h/日 | 13.00円 | 9,361円 | 7,142円 |
| セラミックファンヒーター（強） | 1,200W | 4h/日 | 48.76円 | 5,851円 | 4,464円 |
| コンプレッサー式除湿機 | 200W | 6h/日 | 8.13円 | 1,463円 | 1,116円 |
| デシカント式除湿機 | 580W | 6h/日 | 23.57円 | 4,242円 | 3,236円 |
| ドラム式洗濯機（ヒートポンプ乾燥） | 650W | 2h/日 | 26.41円 | 1,585円 | 1,209円 |
| ドラム式洗濯機（ヒーター乾燥） | 1,100W | 2.2h/日 | 44.69円 | 2,950円 | 2,251円 |
| こたつ（中運転・実稼働平均） | 150W | 6h/日 | 6.09円 | 1,097円 | 837円 |
| 電気毛布（中運転） | 35W | 8h/日 | 1.42円 | 341円 | 260円 |
| 冷蔵庫（標準ファミリー型・24h平均） | 40W | 24h/日 | 1.63円 | 1,170円 | 893円 |
| 食洗機（標準コース） | 770W | 1h/日 | 31.29円 | 939円 | 716円 |

---

## インストール・使い方（Node.js 18+ / ESM・ゼロ依存）

```js
import {
  getEffectiveRate,
  calculateFromWatts,
  calculateMonthlyBill,
  compareAppliances,
  formatYen,
} from './src/index.js';

// 1. 東京電力EP 第2段階 + 2026年度再エネ賦課金の実効単価を取得
const rate = getEffectiveRate({
  companySlug: 'tokyo',
  tier: 2,
  includeSaiene: true,
  fuelAdjustment: 0,
});
// => { baseRate: 36.45, saiene: 4.18, fuel: 0, effectiveRate: 40.63, label: '東京電力 第2段階' }

// 2. 消費電力(W)・時間・日数から電気代を算出（例: エアコン冷房 440W × 8時間 × 30日）
const usage = calculateFromWatts(440, 8, rate.effectiveRate, 30);
console.log(formatYen(usage.costPerHour, true), formatYen(usage.costPerMonth));
// => 17.9円 4,291円

// 3. 10大電力会社の月間使用量(kWh)に応じた段階累進＋基本/最低料金を精算
const billTokyo = calculateMonthlyBill('tokyo', 400, { ampere: 30, includeSaiene: true });
const billKansai = calculateMonthlyBill('kansai', 400, { includeSaiene: true });
console.log('東京電力(400kWh/30A):', formatYen(billTokyo.total));
console.log('関西電力(400kWh/A):', formatYen(billKansai.total));

// 4. 2つの家電の省エネ比較（例: エアコン暖房 vs セラミックファンヒーター・冬120日）
const pk = compareAppliances(
  { name: 'エアコン暖房(8畳)', watts: 580, hoursPerDay: 8, daysPerYear: 120 },
  { name: 'セラミックファンヒーター(強)', watts: 1200, hoursPerDay: 8, daysPerYear: 120 },
  { companySlug: 'tokyo', tier: 2, includeSaiene: true }
);
console.log(pk.cheaperSide, pk.score.ratioBadge, formatYen(pk.score.diffSeason));
// => left 約2.1倍お得 24,183円
```

テスト実行（Node.js 標準テストランナー `node:test` を使用・外部依存なし）:

```bash
npm test
```

---

## API リファレンス

| エクスポート名 | 種別 | 概要 |
| :--- | :--- | :--- |
| `KOUTORIKYO_RATE` | 定数 | 公取協の電力料金目安単価（`31.0` 円/kWh） |
| `SAIENE_RATE_2026` | 定数 | 2026年度 再エネ賦課金単価（`4.18` 円/kWh） |
| `POWER_COMPANIES` | 定数 | 全国10大電力会社の料金定義配列 |
| `POWER_COMPANY_MAP` | 定数 | `slug`（`'tokyo'`, `'kansai'` 等）をキーとする参照マップ |
| `getEffectiveRate(config?)` | 関数 | 電力会社・段階・再エネ賦課金・燃料費調整額（または公取協モード）から実効単価を算出 |
| `calculateFromWatts(w, h, rate, days?)` | 関数 | 消費電力(W)・1日の時間(h)・単価から1時間/1日/1ヶ月/1年のkWhと電気代を算出 |
| `calculateFromKwh(kwh, rate)` | 関数 | 使用電力量(kWh)と単価から直接電気代を算出 |
| `calculateMonthlyBill(company, kwh, opts?)` | 関数 | 従量電灯B（30A/40A基本料金）および従量電灯A（最低料金・最低kWh控除）の3段階累進総額を精算 |
| `compareAppliances(left, right, rate?)` | 関数 | 2家電の月間・シーズン電気代と差額・倍率・有利側を算出 |
| `evaluateEcoImpact(costPerMonth)` | 関数 | 月間電気代から省エネランク（`S`〜`D`）を判定 |
| `formatYen` / `formatRate` / `formatKwh` | 関数 | 日本語ロケール向けの金額・単価・電力量フォーマッター |

TypeScript 型定義は [`src/index.d.ts`](./src/index.d.ts) に同梱されています。

---

## データセット一覧（`data/`）

| ファイル | 形式 | 内容・ライセンス |
| :--- | :--- | :--- |
| [`data/power-companies-2026.json`](./data/power-companies-2026.json) | JSON | 10大電力会社 2026年11月改定単価・基本/最低料金・段階境界・再エネ込み単価・出典メタデータ（CC BY 4.0） |
| [`data/power-companies-2026.csv`](./data/power-companies-2026.csv) | CSV | 10大電力会社の従量電灯A/B 単価一覧（GitHubテーブル・Excel・Python/R読込向け・CC BY 4.0） |
| [`data/appliances-wattage-jp.csv`](./data/appliances-wattage-jp.csv) | CSV | 日本の主要30家電の目安消費電力(W)・想定稼働時間・1時間/1ヶ月電気代一覧（CC BY 4.0） |

データファイルのライセンス詳細は [`data/LICENSE-DATA.md`](./data/LICENSE-DATA.md)、プログラムコードのライセンスは [`LICENSE`](./LICENSE)（MIT）を参照してください。

---

## よくある質問（FAQ）

### 1000Wの家電を1時間使うといくら？

東京電力EPの第2段階（2026年度再エネ賦課金込み **40.63円/kWh**）なら **約40.6円**、公取協の全国目安単価（**31.00円/kWh**）なら **31.0円** です。1,000Wはちょうど1時間＝1.0kWhとなるため、契約電力会社の実効単価（円/kWh）がそのまま1時間の電気代になります。

### エアコン24時間つけっぱなしの電気代は1ヶ月いくら？

6〜8畳用エアコン冷房を24時間連続稼働（夜間低負荷を含む24時間平均320W・1日7.68kWh想定）した場合、東京電力EP第2段階（40.63円/kWh）では **1日約312円、1ヶ月（30日）約9,361円** が目安です。30分以内の短い外出はつけっぱなしの方が有利になりやすい一方、2時間以上不在にする日は電源を切る方が安くなります。

### エアコン暖房とセラミックファンヒーターはどちらが安い？

長時間暖房では **エアコン暖房が約半額以下** です。1日8時間・1ヶ月（30日）使用した場合、8畳用エアコン暖房（平均580W）は約5,656円、セラミックファンヒーター強（1,200W）は約11,701円（東京電力EP第2段階＋再エネ込み）となり、冬4ヶ月（120日）で約24,183円の差がつきます。セラミックファンヒーターは脱衣所など短時間のスポット暖房向きです。

### 電気代の目安単価「31円/kWh」と実際の請求単価が違うのはなぜ？

31円/kWhは全国家庭電気製品公正取引協議会がカタログ表記の比較用に定めた全国共通の目安単価（2022年7月改定）だからです。実際の請求では、地域ごとの電力会社・使用量に応じた3段階単価に、2026年度再エネ賦課金（4.18円/kWh）と毎月の燃料費調整額が加減算されるため、東京電力第2〜3段階では40〜45円/kWh前後になります。

### 北海道電力や関西電力など地域によって計算ルールは違う？

はい、大きく2つの違いがあります。第1に、関西・中国・四国・沖縄の4社はアンペア契約のない「最低料金制（従量電灯A等）」で、最初の10〜15kWh分が定額の最低料金に含まれます。第2に、北海道電力のみ第2段階の上限が他社の300kWhではなく **280kWh** に設定されています。本ライブラリの `calculateMonthlyBill()` はこれら10社固有の境界をすべて反映しています。

---

## Webシミュレーター・出典

ブラウザ上で消費電力・畳数・10大電力会社の地域単価をスライダー調整し、比較グラフや試算結果を確認できるWeb版も公開しています。

- [電気代シミュレーターJP（トップ：W / kWh 両対応計算ツール）](https://denkidaikeisan.com/)
- [全国10大電力会社 2026年11月最新料金表＆地域別計算](https://denkidaikeisan.com/denryoku/)
- [家電別 電気代シミュレーター一覧（エアコン・除湿機・洗濯乾燥機など30家電）](https://denkidaikeisan.com/kaden/)
- [2つの家電 省エネ比較PKシミュレーター](https://denkidaikeisan.com/hikaku/)

> ※同メンテナンス担当者が無料・登録不要で公開しているWebシミュレーターです。  
> *(Note: Maintained by the same maintainer as a free, no-registration web simulator.)*

### 公的参照元・データ出典
- [経済産業省 資源エネルギー庁（再生可能エネルギー発電促進賦課金・電気料金制度）](https://www.enecho.meti.go.jp/)
- [公益社団法人 全国家庭電気製品公正取引協議会（電力料金目安単価31円/kWh）](https://www.eftc.or.jp/)
- 全国10大電力会社（東京電力EP・関西電力・中部電力ミライズ・九州電力・北海道電力・東北電力・北陸電力・中国電力・四国電力・沖縄電力）各社公表 2026年11月1日改定 従量電灯料金表
