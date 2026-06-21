# Fund17 Database Design

The persistent data model for Fund17, a personal-finance app. The schema merges data from
**Quicken** (historical) and **Monarch Money** (the source of truth going forward) into one
PostgreSQL database targeting **Aurora PostgreSQL**. This first pass covers **accounts,
transactions (with splits), and investments**.

## Why this design

- **Two sources, one schema.** Monarch is primary, but Quicken has a richer split-transaction
  model and deeper investment/cost-basis tracking. The schema is a superset that adopts
  Quicken's split and tax-lot structures while keeping Monarch's account/transaction fields.
- **Mergeable & re-importable.** Every row records its origin via `source` (`quicken` |
  `monarch` | `manual`) + `source_id` (the native id). A partial unique index
  `(tenant_id, source, source_id) WHERE source_id IS NOT NULL` makes re-imports idempotent and
  lets the two datasets coexist without id collisions (UUID surrogate primary keys).
- **Multi-tenant, shared database.** One database serves all tenants; every domain row carries a
  `tenant_id`. Isolation is enforced two ways: app-level filtering and Postgres **Row-Level
  Security** (see below).

## Conventions

- **Primary keys:** `uuid` defaulting to `gen_random_uuid()` (needs `pgcrypto`, enabled by the
  migration; built into Aurora PG 13+).
- **Money:** `NUMERIC(19,4)`. **Share quantities:** `NUMERIC(19,6)`.
- **Dates:** `DATE` for transaction/posted dates; `TIMESTAMPTZ` for `created_at` / `updated_at`.
  An `updated_at` trigger (`set_updated_at`) maintains the timestamp on every domain table.
- **Provenance:** `source data_source NOT NULL DEFAULT 'manual'`, `source_id text` on every
  domain table.

## Tables

### Core
- **tenants** — root of every FK chain; the only table without `tenant_id`.
- **institutions** — `name`, `url`, `primary_color`.
- **accounts** — `institution_id`, `name`, `mask`, `type`, `subtype`, `type_group`, `currency`,
  `is_manual`, `is_asset`, `is_hidden`, `include_in_net_worth`, `is_closed`, `current_balance`,
  `display_balance`, `data_provider`, `data_provider_account_id`.
- **categories** — per-tenant hierarchy via self-FK `parent_id`; `group` (income/expense/transfer),
  `is_budgetable`, `is_trendable`, `tax_ref`. Each tenant owns its tree; categories may be
  **Monarch-synced** (`source = 'monarch'`, upserted by `source_id`) or **manually created**
  (`source = 'manual'`, `source_id NULL`).
- **merchants** — payees: `name`, `normalized_name`.
- **tags** — `name`, `color`, `sort_order`.

### Transactions & splits (Quicken-style)
- **transactions** — `account_id`, `merchant_id`, `category_id`, `amount` (signed), `date`,
  `entered_date`, `status`, `pending`, `reference` (check #), `original_description`
  (Monarch `plaidName`), `notes`, `hide_from_reports`, `needs_review`, `review_status`,
  `is_split`, `is_recurring`, `is_investment`.
- **transaction_splits** — line items: `transaction_id`, `category_id`, `merchant_id`, `amount`
  (signed), `memo`, `sequence`.
- **transaction_tags** / **split_tags** — M:N joins (Monarch tags a transaction; Quicken tags a
  split — both supported).

**Split model (hybrid).** A normal single-category transaction stores its category in
`transactions.category_id` with no split rows. When `is_split = true`, `category_id` is `NULL`
and categorization lives entirely in `transaction_splits`. Rationale: Monarch is primary and most
transactions are single-category, so exploding every transaction into a split row would be
wasteful; the hybrid keeps the common path lean while giving splits Quicken's full power
(per-split category, tag, and memo).

**Sum invariant.** For split transactions, `SUM(transaction_splits.amount) =
transactions.amount`. A cross-row `CHECK` can't express this, so it is enforced by **deferrable
constraint triggers** (`transaction_splits_sum_check` on the splits, `transactions_split_sum_check`
on the parent) that validate at `COMMIT` — a multi-row split insert is checked as a set, not
row-by-row.

### Investments (full tax-lot depth)
- **securities** — `name`, `ticker`, `type`, `cusip`, `coupon_rate`, `strike_price`,
  `current_price`, `closing_price`.
- **security_prices** — OHLCV history; unique `(security_id, price_date)`.
- **holdings** — current/aggregate position (Monarch): `account_id`, `security_id`, `quantity`,
  `cost_basis`, `total_value`, `last_synced_at`; unique `(account_id, security_id)`.
- **lots** — Quicken tax lots: `holding_id`, `acquisition_date`, `initial_units`,
  `initial_cost_basis`, `latest_units`, `latest_cost_basis`.
- **lot_modifications** — per-transaction lot effects: `lot_id`, `transaction_id`,
  `transaction_date`, `before/after_units`, `before/after_cost_basis`.
- **investment_transaction_details** — 1:1 extension of `transactions` (keeps one transactions
  table for cashflow + investment activity, mirroring Quicken's single `ZTRANSACTION`):
  `security_id`, `action` (buy/sell/dividend/…), `units` (signed), `price_per_unit`, `commission`.

## Tenant isolation (Row-Level Security)

Every domain table has RLS enabled with a policy keyed on the `app.tenant_id` GUC:

```sql
USING      (tenant_id = current_setting('app.tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid)
```

The data layer sets the GUC per request inside a transaction. Use the `withTenant` helper in
`src/db/index.ts`, which opens a transaction, sets `app.tenant_id` with `is_local = true` (so it
resets on commit — safe for pooled connections), and runs your queries. RLS is defense-in-depth
on top of app-level filtering; it fails closed (no GUC → no rows). Note: the table owner /
superuser bypasses RLS, so run the app as a non-owner role in production.

## Enums

`data_source`, `account_type_group`, `transaction_status`, `category_group`, `security_type`,
`investment_action`.

## Migrations

Tooling is **`node-pg-migrate`** — TypeScript-native, Postgres-specific, lightweight (no JVM like
Flyway, no full ORM like Sequelize), and connects to Aurora over the standard `pg` driver.

- **Run:** `npm run db:migrate` (alias for `node-pg-migrate up`). Needs `DATABASE_URL`.
- **Roll back (ad hoc):** `npx node-pg-migrate down`.
- **Config:** `.node-pg-migraterc.json` (migrations dir + TS settings). TS migrations are loaded
  via ts-node using `tsconfig.migrate.json` (CommonJS), kept separate from the app's ESM tsconfig.
- **Add a migration:** create `migrations/NNNN_name.ts` with the next zero-padded number
  (`0002_…`); node-pg-migrate orders by filename and tracks applied migrations in `pgmigrations`.
- The initial migration (`0001_init-finance-schema.ts`) creates `pgcrypto`, the enums, the
  `set_updated_at` function, all tables in dependency order with FKs/indexes, the split-sum
  constraint triggers, and the RLS policies. Its `down` reverses everything.

## Aurora / connection notes

- **Migrations** run in CI / the deploy step (or locally over a tunnel) with a Secrets-Manager
  password in `DATABASE_URL` — not inside the request-path Lambda. node-pg-migrate uses TCP.
- **App runtime** (Lambda) options: **RDS Proxy + direct `pg`** (Lambda in the VPC; Proxy absorbs
  connection storms) or the **RDS Data API** (HTTP, good for Serverless v2, no VPC/pooling).
- **SST wiring (future):** add `sst.aws.Aurora` (Serverless v2, `engine: "postgres"`) to
  `sst.config.ts`, link it to the `web` app, and run `db:migrate` at deploy time.

## Out of scope (next steps)

Budgets, goals, bills/taxes, reports; a `users` table mapping logins → `tenant_id` (this pass
establishes the tenant boundary itself); wiring TanStack `createServerFn` to read from the DB and
set `app.tenant_id` per request; the actual Quicken→Monarch merge/dedup ETL; SST Aurora
provisioning.

## Sources

- Monarch Money API: <https://github.com/hammem/monarchmoney/blob/main/monarchmoney/monarchmoney.py>
- Quicken (Mac) SQLite schema: <https://github.com/dweekly/quicken-mac-mcp> (`docs/schema.md`)
