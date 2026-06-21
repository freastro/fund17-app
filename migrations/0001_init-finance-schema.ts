/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined

// Domain tables carry tenant_id + provenance and are subject to Row-Level Security.
// Order matters: parents before children (for FKs) on up, reverse on down.
const DOMAIN_TABLES = [
  'institutions',
  'accounts',
  'categories',
  'merchants',
  'tags',
  'securities',
  'security_prices',
  'transactions',
  'transaction_splits',
  'transaction_tags',
  'split_tags',
  'holdings',
  'lots',
  'lot_modifications',
  'investment_transaction_details',
] as const

const ENUMS = [
  'data_source',
  'account_type_group',
  'transaction_status',
  'category_group',
  'security_type',
  'investment_action',
] as const

// Columns shared by every tenant-scoped domain table.
function base(pgm: MigrationBuilder): ColumnDefinitions {
  return {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    tenant_id: { type: 'uuid', notNull: true, references: 'tenants', onDelete: 'CASCADE' },
    source: { type: 'data_source', notNull: true, default: 'manual' },
    source_id: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  }
}

// Per-tenant uniqueness for idempotent re-imports, plus updated_at maintenance.
function finalize(pgm: MigrationBuilder, table: string): void {
  // Every RLS policy filters `tenant_id = current_setting('app.tenant_id')`, so
  // every query carries this predicate. The partial provenance index below can't
  // serve it (it's partial and leads into source/source_id), so index tenant_id
  // directly to avoid full-table scans on the shared multi-tenant tables.
  pgm.createIndex(table, 'tenant_id')
  pgm.createIndex(table, ['tenant_id', 'source', 'source_id'], {
    name: `${table}_provenance_uidx`,
    unique: true,
    where: 'source_id IS NOT NULL',
  })
  pgm.createTrigger(table, `${table}_set_updated_at`, {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'set_updated_at',
  })
}

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension('pgcrypto', { ifNotExists: true })

  pgm.createType('data_source', ['quicken', 'monarch', 'manual'])
  pgm.createType('account_type_group', [
    'cash',
    'credit',
    'investment',
    'loan',
    'real_estate',
    'other_asset',
    'other_liability',
  ])
  pgm.createType('transaction_status', ['pending', 'posted', 'cleared', 'reconciled'])
  pgm.createType('category_group', ['income', 'expense', 'transfer'])
  pgm.createType('security_type', [
    'equity',
    'etf',
    'mutual_fund',
    'bond',
    'option',
    'crypto',
    'cash',
    'other',
  ])
  pgm.createType('investment_action', [
    'buy',
    'sell',
    'dividend',
    'reinvest',
    'interest',
    'split',
    'transfer',
    'fee',
    'other',
  ])

  // Shared trigger function: keep updated_at current.
  pgm.createFunction(
    'set_updated_at',
    [],
    { returns: 'trigger', language: 'plpgsql', replace: true },
    `BEGIN NEW.updated_at = now(); RETURN NEW; END;`,
  )

  // ---- tenants (root; the only table without tenant_id) ----
  pgm.createTable('tenants', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.createTrigger('tenants', 'tenants_set_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'set_updated_at',
  })

  // ---- institutions ----
  pgm.createTable('institutions', {
    ...base(pgm),
    name: { type: 'text', notNull: true },
    url: { type: 'text' },
    primary_color: { type: 'text' },
  })
  finalize(pgm, 'institutions')

  // ---- accounts ----
  pgm.createTable('accounts', {
    ...base(pgm),
    institution_id: { type: 'uuid', references: 'institutions', onDelete: 'SET NULL' },
    name: { type: 'text', notNull: true },
    mask: { type: 'text' },
    type: { type: 'text' },
    subtype: { type: 'text' },
    type_group: { type: 'account_type_group' },
    currency: { type: 'text', notNull: true, default: 'USD' },
    is_manual: { type: 'boolean', notNull: true, default: false },
    is_asset: { type: 'boolean', notNull: true, default: true },
    is_hidden: { type: 'boolean', notNull: true, default: false },
    include_in_net_worth: { type: 'boolean', notNull: true, default: true },
    is_closed: { type: 'boolean', notNull: true, default: false },
    current_balance: { type: 'numeric(19,4)' },
    display_balance: { type: 'numeric(19,4)' },
    data_provider: { type: 'text' },
    data_provider_account_id: { type: 'text' },
  })
  finalize(pgm, 'accounts')
  pgm.createIndex('accounts', 'institution_id')

  // ---- categories (per-tenant hierarchy; Monarch-synced or manual) ----
  pgm.createTable('categories', {
    ...base(pgm),
    name: { type: 'text', notNull: true },
    parent_id: { type: 'uuid', references: 'categories', onDelete: 'SET NULL' },
    group: { type: 'category_group' },
    is_budgetable: { type: 'boolean', notNull: true, default: true },
    is_trendable: { type: 'boolean', notNull: true, default: true },
    tax_ref: { type: 'text' },
  })
  finalize(pgm, 'categories')
  pgm.createIndex('categories', 'parent_id')

  // ---- merchants / payees ----
  pgm.createTable('merchants', {
    ...base(pgm),
    name: { type: 'text', notNull: true },
    normalized_name: { type: 'text' },
  })
  finalize(pgm, 'merchants')

  // ---- tags ----
  pgm.createTable('tags', {
    ...base(pgm),
    name: { type: 'text', notNull: true },
    color: { type: 'text' },
    sort_order: { type: 'integer', notNull: true, default: 0 },
  })
  finalize(pgm, 'tags')

  // ---- securities ----
  pgm.createTable('securities', {
    ...base(pgm),
    name: { type: 'text', notNull: true },
    ticker: { type: 'text' },
    type: { type: 'security_type' },
    cusip: { type: 'text' },
    coupon_rate: { type: 'numeric(19,6)' },
    strike_price: { type: 'numeric(19,4)' },
    current_price: { type: 'numeric(19,4)' },
    closing_price: { type: 'numeric(19,4)' },
  })
  finalize(pgm, 'securities')

  // ---- security_prices (OHLCV history) ----
  pgm.createTable('security_prices', {
    ...base(pgm),
    security_id: { type: 'uuid', notNull: true, references: 'securities', onDelete: 'CASCADE' },
    price_date: { type: 'date', notNull: true },
    close: { type: 'numeric(19,4)' },
    open: { type: 'numeric(19,4)' },
    high: { type: 'numeric(19,4)' },
    low: { type: 'numeric(19,4)' },
    volume: { type: 'numeric(19,4)' },
  })
  finalize(pgm, 'security_prices')
  // Unique (security_id, price_date) also serves latest-price lookups: a btree can
  // be scanned backwards, so a separate DESC index would be redundant.
  pgm.createIndex('security_prices', ['security_id', 'price_date'], {
    name: 'security_prices_security_date_uidx',
    unique: true,
  })

  // ---- transactions (cashflow + investment) ----
  pgm.createTable('transactions', {
    ...base(pgm),
    account_id: { type: 'uuid', notNull: true, references: 'accounts', onDelete: 'CASCADE' },
    merchant_id: { type: 'uuid', references: 'merchants', onDelete: 'SET NULL' },
    category_id: { type: 'uuid', references: 'categories', onDelete: 'SET NULL' },
    amount: { type: 'numeric(19,4)', notNull: true },
    date: { type: 'date', notNull: true },
    entered_date: { type: 'date' },
    status: { type: 'transaction_status', notNull: true, default: 'posted' },
    pending: { type: 'boolean', notNull: true, default: false },
    reference: { type: 'text' },
    original_description: { type: 'text' },
    notes: { type: 'text' },
    hide_from_reports: { type: 'boolean', notNull: true, default: false },
    needs_review: { type: 'boolean', notNull: true, default: false },
    review_status: { type: 'text' },
    is_split: { type: 'boolean', notNull: true, default: false },
    is_recurring: { type: 'boolean', notNull: true, default: false },
    is_investment: { type: 'boolean', notNull: true, default: false },
  })
  finalize(pgm, 'transactions')
  // Categorization lives in the splits when is_split; the top-level category_id must
  // be NULL then, or reports double-count (category total + split totals).
  pgm.addConstraint('transactions', 'transactions_split_category_null_chk', {
    check: 'NOT is_split OR category_id IS NULL',
  })
  pgm.createIndex('transactions', [{ name: 'account_id' }, { name: 'date', sort: 'DESC' }])
  pgm.createIndex('transactions', 'category_id')
  pgm.createIndex('transactions', 'merchant_id')

  // ---- transaction_splits (Quicken-style line items) ----
  pgm.createTable('transaction_splits', {
    ...base(pgm),
    transaction_id: {
      type: 'uuid',
      notNull: true,
      references: 'transactions',
      onDelete: 'CASCADE',
    },
    category_id: { type: 'uuid', references: 'categories', onDelete: 'SET NULL' },
    merchant_id: { type: 'uuid', references: 'merchants', onDelete: 'SET NULL' },
    amount: { type: 'numeric(19,4)', notNull: true },
    memo: { type: 'text' },
    sequence: { type: 'integer', notNull: true },
  })
  finalize(pgm, 'transaction_splits')
  pgm.createIndex('transaction_splits', ['transaction_id', 'sequence'], {
    name: 'transaction_splits_txn_seq_uidx',
    unique: true,
  })
  // Index the SET NULL FKs so deleting a category/merchant (common on re-import)
  // doesn't seq-scan the splits table, and split-by-category reports stay fast.
  pgm.createIndex('transaction_splits', 'category_id')
  pgm.createIndex('transaction_splits', 'merchant_id')

  // ---- tag join tables ----
  pgm.createTable('transaction_tags', {
    tenant_id: { type: 'uuid', notNull: true, references: 'tenants', onDelete: 'CASCADE' },
    transaction_id: {
      type: 'uuid',
      notNull: true,
      references: 'transactions',
      onDelete: 'CASCADE',
    },
    tag_id: { type: 'uuid', notNull: true, references: 'tags', onDelete: 'CASCADE' },
  })
  pgm.addConstraint('transaction_tags', 'transaction_tags_pkey', {
    primaryKey: ['transaction_id', 'tag_id'],
  })

  pgm.createTable('split_tags', {
    tenant_id: { type: 'uuid', notNull: true, references: 'tenants', onDelete: 'CASCADE' },
    split_id: {
      type: 'uuid',
      notNull: true,
      references: 'transaction_splits',
      onDelete: 'CASCADE',
    },
    tag_id: { type: 'uuid', notNull: true, references: 'tags', onDelete: 'CASCADE' },
  })
  pgm.addConstraint('split_tags', 'split_tags_pkey', { primaryKey: ['split_id', 'tag_id'] })

  // ---- holdings (current/aggregate position) ----
  pgm.createTable('holdings', {
    ...base(pgm),
    account_id: { type: 'uuid', notNull: true, references: 'accounts', onDelete: 'CASCADE' },
    security_id: { type: 'uuid', notNull: true, references: 'securities', onDelete: 'CASCADE' },
    quantity: { type: 'numeric(19,6)' },
    cost_basis: { type: 'numeric(19,4)' },
    total_value: { type: 'numeric(19,4)' },
    last_synced_at: { type: 'timestamptz' },
  })
  finalize(pgm, 'holdings')
  pgm.createIndex('holdings', ['account_id', 'security_id'], {
    name: 'holdings_account_security_uidx',
    unique: true,
  })
  // The unique index leads with account_id, so it can't serve a security_id-only
  // lookup; index it so cascading a security delete doesn't seq-scan holdings.
  pgm.createIndex('holdings', 'security_id')

  // ---- lots (Quicken tax lots) ----
  pgm.createTable('lots', {
    ...base(pgm),
    holding_id: { type: 'uuid', notNull: true, references: 'holdings', onDelete: 'CASCADE' },
    acquisition_date: { type: 'date' },
    initial_units: { type: 'numeric(19,6)' },
    initial_cost_basis: { type: 'numeric(19,4)' },
    latest_units: { type: 'numeric(19,6)' },
    latest_cost_basis: { type: 'numeric(19,4)' },
  })
  finalize(pgm, 'lots')
  pgm.createIndex('lots', 'holding_id')

  // ---- lot_modifications (per-transaction lot effects) ----
  pgm.createTable('lot_modifications', {
    ...base(pgm),
    lot_id: { type: 'uuid', notNull: true, references: 'lots', onDelete: 'CASCADE' },
    transaction_id: { type: 'uuid', references: 'transactions', onDelete: 'SET NULL' },
    transaction_date: { type: 'date' },
    before_units: { type: 'numeric(19,6)' },
    before_cost_basis: { type: 'numeric(19,4)' },
    after_units: { type: 'numeric(19,6)' },
    after_cost_basis: { type: 'numeric(19,4)' },
  })
  finalize(pgm, 'lot_modifications')
  pgm.createIndex('lot_modifications', 'lot_id')
  pgm.createIndex('lot_modifications', 'transaction_id')

  // ---- investment_transaction_details (1:1 extension of transactions) ----
  pgm.createTable('investment_transaction_details', {
    transaction_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'transactions',
      onDelete: 'CASCADE',
    },
    tenant_id: { type: 'uuid', notNull: true, references: 'tenants', onDelete: 'CASCADE' },
    security_id: { type: 'uuid', notNull: true, references: 'securities', onDelete: 'CASCADE' },
    action: { type: 'investment_action' },
    units: { type: 'numeric(19,6)' },
    price_per_unit: { type: 'numeric(19,4)' },
    commission: { type: 'numeric(19,4)', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.createTrigger('investment_transaction_details', 'investment_transaction_details_set_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'set_updated_at',
  })
  pgm.createIndex('investment_transaction_details', 'security_id')

  // ---- split-sum invariant (deferred constraint triggers) ----
  // For split transactions, the splits must sum to the parent amount. Enforced at
  // COMMIT so a multi-row split insert validates as a set rather than row-by-row.
  pgm.sql(`
    CREATE FUNCTION check_split_sum() RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE
      txn_id uuid;
      txn_amount numeric(19,4);
      txn_is_split boolean;
      split_total numeric(19,4);
    BEGIN
      -- A split row can move between parents on UPDATE (transaction_id changes),
      -- which unbalances the OLD parent too. Validate every affected parent, not
      -- just NEW, so the source transaction isn't left silently out of balance.
      FOR txn_id IN
        SELECT DISTINCT id
          FROM (VALUES (NEW.transaction_id), (OLD.transaction_id)) AS t(id)
          WHERE id IS NOT NULL
      LOOP
        SELECT amount, is_split INTO txn_amount, txn_is_split FROM transactions WHERE id = txn_id;
        IF txn_amount IS NULL THEN
          CONTINUE; -- parent transaction was deleted in the same statement
        END IF;
        IF txn_is_split THEN
          SELECT COALESCE(SUM(amount), 0) INTO split_total
            FROM transaction_splits WHERE transaction_id = txn_id;
          IF split_total <> txn_amount THEN
            RAISE EXCEPTION 'Split total % does not equal transaction amount % for transaction %',
              split_total, txn_amount, txn_id;
          END IF;
        END IF;
      END LOOP;
      RETURN NULL;
    END;
    $$;

    CREATE FUNCTION check_txn_split_sum() RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE
      split_total numeric(19,4);
    BEGIN
      IF NEW.is_split THEN
        SELECT COALESCE(SUM(amount), 0) INTO split_total
          FROM transaction_splits WHERE transaction_id = NEW.id;
        IF split_total <> NEW.amount THEN
          RAISE EXCEPTION 'Split total % does not equal transaction amount % for transaction %',
            split_total, NEW.amount, NEW.id;
        END IF;
      END IF;
      RETURN NULL;
    END;
    $$;

    CREATE CONSTRAINT TRIGGER transaction_splits_sum_check
      AFTER INSERT OR UPDATE OR DELETE ON transaction_splits
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW EXECUTE FUNCTION check_split_sum();

    CREATE CONSTRAINT TRIGGER transactions_split_sum_check
      AFTER INSERT OR UPDATE ON transactions
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW EXECUTE FUNCTION check_txn_split_sum();
  `)

  // ---- Row-Level Security: isolate every tenant by app.tenant_id GUC ----
  // FORCE is required: a table owner bypasses its own RLS by default, so without
  // it a single-role deployment (the app connecting as the migration/owner role)
  // would silently see every tenant's data. FORCE keeps the policy in effect even
  // for the owner. Note: maintenance/ETL run by the owner must therefore also set
  // app.tenant_id (or run as a true superuser, which still bypasses).
  for (const table of DOMAIN_TABLES) {
    pgm.sql(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`)
    pgm.sql(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`)
    pgm.sql(`
      CREATE POLICY ${table}_tenant_isolation ON ${table}
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
        WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
    `)
  }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Dropping tables CASCADE removes their RLS policies, triggers, indexes, and FKs.
  for (const table of [...DOMAIN_TABLES].reverse()) {
    pgm.dropTable(table, { ifExists: true, cascade: true })
  }
  pgm.dropTable('tenants', { ifExists: true, cascade: true })

  pgm.sql('DROP FUNCTION IF EXISTS check_split_sum();')
  pgm.sql('DROP FUNCTION IF EXISTS check_txn_split_sum();')
  pgm.dropFunction('set_updated_at', [], { ifExists: true })

  for (const enumName of [...ENUMS].reverse()) {
    pgm.dropType(enumName, { ifExists: true })
  }

  pgm.dropExtension('pgcrypto', { ifExists: true })
}
