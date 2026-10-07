# 0007: Finnish electricity spot prices including VAT from sahkotin.fi

- **Status:** Accepted (2026-10-06)
- **Links:** Anlessi/ClaudeWIP#11, `src/electricity.ts`

## Context
The owner asked for real hourly Nord Pool prices including VAT, shown only for the days that have prices (usually
today and, from the afternoon, tomorrow), with other days left empty.

## Decision
- Source: **sahkotin.fi** with its `vat` option. It gives hourly averages of Nord Pool's 15-minute day-ahead prices
  including Finnish VAT (25.5 %). This was checked hour by hour against raw Nord Pool data.
- Prices are always for **Finland**, whatever weather location is chosen (the design says "snt/kWh" and GMT+2).
- Display in c/kWh: one decimal below 10, whole numbers from 10. Low at or below 3 and high at or above 15
  (`LOW_PRICE`, `HIGH_PRICE`).
- Reload every 30 minutes while open, so tomorrow's prices appear soon after they're published.

## Alternatives considered
- **Nord Pool's official API:** paid.
- **Nord Pool's website API, Elering, porssisahko.net:** free, but no CORS, so they need a server (see 0002).

## Consequences
- sahkotin.fi is an independent hobby-scale service that could change or disappear. `src/electricity.ts` is the
  only file that knows about it.
- The VAT rate, and VAT applied to negative prices, follow the service.
- Other countries or price areas would need another source.
