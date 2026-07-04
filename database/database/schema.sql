-- FiscalDashboard: Supabase table schema
-- Run this once in your Supabase SQL editor to create the required table.

create table if not exists daily_fiscal_snapshots (
    id              bigint generated always as identity primary key,
    captured_at     timestamptz not null default now(),

    -- Raw dollar amounts (stored as bigint to avoid float precision loss)
    total_debt_raw              bigint  not null,
    debt_per_citizen_raw        bigint  not null,
    federal_budget_deficit_raw  bigint  not null,
    federal_spending_raw        bigint  not null,
    federal_revenue_raw         bigint  not null,

    -- Ratio/percentage values (stored as float)
    debt_to_gdp_ratio_raw       double precision not null,
    average_interest_rate_raw   double precision not null
);

-- Index to make the "latest snapshot" query fast
create index if not exists idx_snapshots_captured_at
    on daily_fiscal_snapshots (captured_at desc);

-- Optional: prevent duplicate inserts within the same minute
create unique index if not exists idx_snapshots_unique_minute
    on daily_fiscal_snapshots (date_trunc('minute', captured_at));
