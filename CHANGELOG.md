# Changelog

All notable changes to this project will be documented in this file.

## [v2026.1.0] - 2026-11-24

### Added
- 全国10大電力会社の2026年11月1日改定 従量電灯A/B 3段階料金単価データセット（`data/power-companies-2026.json`、`data/power-companies-2026.csv`）
- 2026年度（令和8年度）再エネ賦課金単価（4.18円/kWh）および公取協目安単価（31.00円/kWh）ベンチマーク定数
- 日本の主要30家電の目安消費電力(W)・1時間/1ヶ月電気代ベンチマーク CSV（`data/appliances-wattage-jp.csv`）
- Node.js 18+ ゼロ依存 ESM 電気代計算エンジン（`src/index.js`）および TypeScript 型定義（`src/index.d.ts`）
  - 消費電力(W) / 電力量(kWh) ベース試算（`calculateFromWatts` / `calculateFromKwh`）
  - 10大電力会社別の従量電灯B（アンペア制）・従量電灯A（最低料金制・最低kWh控除）・北海道280kWh境界に対応した月間累進料金精算（`calculateMonthlyBill`）
  - 2家電の省エネ差額・倍率比較（`compareAppliances` / `evaluateVsScore`）および省エネランク判定（`evaluateEcoImpact`）
- `node:test` による包括的ユニットテストおよび JSON/CSV 整合性検証テスト（`test/calc.test.js`）
- GitHub Actions CI（Node.js 20 / 22）および `CITATION.cff` メタデータ
