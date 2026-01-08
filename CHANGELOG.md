# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to date-based versioning with entries grouped by date.

## 2026-01-08

### Added

- Add toggle to include/exclude income transactions from calculations (default: expenses only)
- Add CLI command instructions to AGENTS.md for getting today's date when updating CHANGELOG

## 2026-01-05

### Added

- Split transaction support: Added `parent_id` field to Transaction interface to track split transaction relationships
- Parent split transaction filtering: Automatically excludes parent split transactions (transactions with no category and child splits pointing to them) while including child split transactions in the wrapped data
- Comprehensive unit tests for split transaction filtering covering parent splits, child splits, regular transactions, and mixed scenarios

## 2026-01-04

### Added

- Created CHANGELOG.md file to track project changes
