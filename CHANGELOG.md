# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to date-based versioning with entries grouped by date.

## 2026-01-09

### Added

- Net totals calculation: Added `includeIncomeInCategories` parameter to `transformToWrappedData` function (default: `true`) to include income transactions when calculating net totals for categories, payees, accounts, and day of week spending (expenses minus income)
- CategoryIncomeToggle component: New toggle in settings menu (renamed to "Net Totals") to switch between net calculation mode (includes income) and absolute spending mode (expenses only)

### Changed

- Renamed toggle from "Net Category Totals" to "Net Totals" to reflect that it applies to all aggregations (categories, payees, accounts, day of week)
- Net totals calculation logic: When `includeIncomeInCategories` is `true` (new mode), all aggregations (categories, payees, account breakdown, day of week spending, category trends) now calculate net spending by subtracting income transactions from expense transactions. When `false` (old mode), only expense transactions are included (absolute spending only), but income transactions are still counted in transaction counts
- Updated payee calculations: Payees now respect the `includeIncomeInCategories` toggle - income transactions reduce payee totals when the toggle is enabled
- Updated account breakdown calculations: Account breakdown now respects the `includeIncomeInCategories` toggle - income transactions reduce account totals when the toggle is enabled
- Updated day of week spending calculations: Day of week spending now respects the `includeIncomeInCategories` toggle - income transactions reduce day totals when the toggle is enabled
- Updated category trends calculations: Category trends now respect the `includeIncomeInCategories` toggle - income transactions reduce monthly category totals when the toggle is enabled
- Updated `useActualData` hook: Added `includeIncomeInCategories` parameter to `fetchData`, `refreshData`, and `retransformData` functions to support the new net totals calculation mode

### Fixed

- Fixed category totals calculation bug where income transactions (e.g., refunds) in the same category as expenses were not reducing the category total. Now correctly shows net spending (e.g., -$100 expense + $50 income = $50 net spending)
- Fixed payee totals calculation: Income transactions (e.g., refunds) now reduce payee totals when net totals mode is enabled
- Fixed account breakdown totals: Income transactions now reduce account totals when net totals mode is enabled
- Fixed account breakdown percentage calculation: Account breakdown percentages now use the correct denominator when net totals mode is enabled (sum of absolute values of net spending) instead of total expenses, fixing incorrect percentages that didn't sum to 100% and could be negative
- Fixed account breakdown chart not rendering: Account breakdown pie chart now uses absolute values for rendering (Recharts doesn't handle negative values) while preserving original net spending values for display in tooltips and stats. Accounts with zero net spending are filtered out from the chart
- Fixed day of week spending totals: Income transactions now reduce day totals when net totals mode is enabled

### Tests

- Added comprehensive unit tests for net totals calculation mode, covering categories, payees, and account breakdown in both new mode (with income) and old mode (expenses only), including scenarios with multiple income and expense transactions
- Added unit tests for account breakdown percentage calculation in both net totals mode and absolute mode, including edge cases with negative net spending

## 2026-01-05

### Added

- Split transaction support: Added `parent_id` field to Transaction interface to track split transaction relationships
- Parent split transaction filtering: Automatically excludes parent split transactions (transactions with no category and child splits pointing to them) while including child split transactions in the wrapped data
- Comprehensive unit tests for split transaction filtering covering parent splits, child splits, regular transactions, and mixed scenarios

## 2026-01-04

### Added

- Created CHANGELOG.md file to track project changes
