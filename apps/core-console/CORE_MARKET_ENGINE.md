# Core Market Engine Blueprint

## Position inside Dhemka Core

Core Platform is the heart of Dhemka Core.

Inside Core Platform, the Core Market Engine / Core Pricing Engine is the crown jewel. It is the layer that gives life to the whole ecosystem: Remit, Ledger, Lending, Partner Network, Arbitrage, Billing and future products.

The current ByteTransfer engine only uses a small set of sources and currencies. The future Dhemka Core engine must be designed as a scalable market intelligence system, not as a hardcoded remittance calculator.

## Product Principle

The engine must not be limited to what one tenant uses today.

Dhemka Core must be able to support currencies, countries, official references, P2P markets, exchanges, stable references, cross calculations and opportunity signals across the Americas first, then more regions.

A tenant may only activate a small subset. The Core must still be prepared to offer more.

## Non-Negotiable Rules

1. No hardcoded currencies.
2. No hardcoded countries.
3. No hardcoded routes.
4. No hardcoded provider logic inside UI.
5. No hardcoded tenant behavior.
6. No hardcoded module access.
7. No hardcoded operational rules.
8. No hidden business logic living only in frontend text.
9. Every source must be represented by a source/provider contract.
10. Every currency must come from a currency catalog.
11. Every country/market must come from a market catalog.
12. Every route/cross must come from a route catalog or generated route model.
13. Every tenant must consume processed market feeds, not edit the Core engine directly.
14. Every sensitive change must be auditable.
15. Every new implementation must be debated before being built.

## Implementation Debate Protocol

Before implementing any feature, the team must answer:

- What does this feature mean?
- Where does it live?
- Is it Core, Remit, tenant, module, provider, catalog, runtime or UI?
- How does it work?
- What data does it need?
- What does it produce?
- Who can configure it?
- Who can only view it?
- What benefits does it bring?
- What risks does it create?
- Is it priority now or backlog?
- Does it create new ideas?
- Should those ideas go to ROADMAP, IDEAS, DATA_CONTRACT or UI_ARCHITECTURE?

No feature should be implemented just because it looks useful. It must have a clear role in the system.

## Engine Mission

The Core Market Engine should:

- collect prices from multiple sources;
- normalize incompatible market data;
- calculate reliable references;
- calculate cross rates;
- measure confidence;
- detect stale or risky data;
- detect opportunities;
- feed tenants with clean market data;
- support future modules without rewriting the engine;
- provide auditability and traceability.

## Source Types

The engine should support multiple source types:

### Official Sources

Central bank and official references.

Examples:

- BCV for Venezuela.
- PTAX for Brazil.
- official USD references by country where available.
- official EUR/USD references where needed.
- future official FX references across the Americas.

### P2P Sources

Peer-to-peer liquidity references.

Examples:

- Binance P2P.
- future P2P markets from other exchanges or providers.

### Exchange Sources

Exchange order books, tickers, stablecoin markets and FX pairs.

Examples:

- USDT/local currency.
- USDC/local currency.
- BTC or crypto pairs only if useful as reference, not as default operational base.
- EUR/USD.
- USD/local currency.
- stable/local currency.

### Stable References

Stablecoin references used as common operational base.

Examples:

- USDT.
- USDC.
- future stable assets if needed.

### Manual / Internal Sources

Controlled manual references for cases where API data is unavailable, unreliable or commercially adjusted.

Manual does not mean informal. It still needs:

- owner;
- reason;
- timestamp;
- expiration;
- audit;
- confidence level;
- affected routes.

## Region Scope

### Americas First

The engine should be designed to support at least:

- Venezuela;
- Argentina;
- Colombia;
- Peru;
- Chile;
- Mexico;
- Brazil;
- Bolivia;
- Dominican Republic;
- Ecuador;
- Panama;
- Uruguay;
- Paraguay;
- Costa Rica;
- Guatemala;
- Honduras;
- El Salvador;
- Nicaragua;
- United States;
- Canada.

Not all markets need to be active from day one. But the system must not be designed in a way that blocks them.

### Future Regions

Future expansion may include:

- Spain;
- Eurozone;
- other Europe corridors;
- other remittance-heavy regions.

## Core Components

### 1. Currency Catalog

Defines each currency supported by Dhemka Core.

Possible fields:

- code;
- name;
- symbol;
- decimals;
- country scope;
- stable flag;
- fiat flag;
- display precision;
- operational precision;
- status;
- supported modules.

### 2. Market Catalog

Defines countries, local markets and operational regions.

Possible fields:

- country code;
- country name;
- default currency;
- timezone;
- official FX source;
- market status;
- risk level;
- available sources;
- operational notes.

### 3. Source Catalog

Defines every source the engine can use.

Possible fields:

- source id;
- source name;
- source type;
- provider;
- country;
- currency pair;
- update method;
- authentication need;
- freshness threshold;
- confidence rules;
- fallback priority;
- status.

### 4. Provider Adapter Layer

Each external provider should have an adapter.

The adapter knows how to fetch raw data, but it does not decide commercial logic.

Examples:

- Binance adapter;
- BCV adapter;
- PTAX adapter;
- future central bank adapters;
- future exchange adapters.

### 5. Normalization Layer

Transforms raw provider data into a consistent internal format.

The same engine should be able to compare data from official banks, P2P markets, exchanges and manual references.

### 6. Confidence Engine

Scores the reliability of every price.

Confidence may depend on:

- source type;
- source freshness;
- number of P2P ads;
- liquidity;
- spread;
- provider health;
- fallback usage;
- manual override;
- historical deviation;
- missing data;
- stale data.

Possible confidence values:

- high;
- medium;
- low;
- blocked;
- unknown.

### 7. Cross Engine

Generates or calculates route references.

Examples:

- ARS to VES;
- COP to VES;
- CLP to VES;
- PEN to VES;
- MXN to VES;
- BRL to USD;
- Ecuador to Panama;
- Bolivia to Dominican Republic;
- any supported source-target combination allowed by catalogs.

A route should not exist because it was hardcoded in UI. It should exist because the route catalog or route generation rules allow it.

### 8. Opportunity Engine

Detects useful market conditions.

The Opportunity Engine does not execute operations and does not tell a tenant to move money through a specific exchange. It detects pricing differences and recommends review.

Correct language:

- review this source;
- review this exchange;
- possible better taker price;
- possible spread opportunity;
- possible route risk;
- possible source degradation.

Incorrect language:

- send through this exchange;
- execute automatically;
- operate this route without review.

The first version should focus on Taker Opportunity Scanner logic.

Taker opportunities compare existing offers across approved intelligence sources.

Example:

- Binance P2P ARS/USDT;
- Bybit P2P ARS/USDT;
- KuCoin P2P ARS/USDT;
- OKX P2P ARS/USDT;
- future P2P sources where data access is reliable.

The engine must be side-aware.

Buying USDT with ARS is not the same as selling USDT for ARS.

For buying USDT with local currency, the lower price is better.

For selling USDT into local currency, the higher price is better.

Examples:

- buy USDT with ARS cheaper on Bybit than Binance;
- sell USDT for ARS better on Binance than Bybit;
- BRL missing or weak on Binance, review complementary source;
- source spread abnormal, review before updating route;
- tenant margin risk detected from current market movement;
- stale reference warning;
- price source degradation;
- update recommendation;
- route pause recommendation.

Opportunity signals may be Core-only or tenant-visible depending on module access and permissions.

Maker logic is future.

Maker Strategy Simulator and Maker Arbitrage should be treated as advanced future modules because they require liquidity, reputation, execution risk controls, payment method modeling and stronger audit.

### 9. Tenant Market Feed

Tenants do not own the Core engine.

The system must separate Core Intelligence Universe from Tenant Operational Feed.

Core Intelligence Universe can inspect many sources:

- Binance;
- Bybit;
- KuCoin;
- OKX;
- official sources;
- exchange sources;
- stable references;
- manual/internal references;
- future APIs.

Tenant Operational Feed must stay clean and commercially controlled.

For Remit tenants, the recommended tenant-grade source strategy is:

- Binance P2P as primary source;
- Bybit P2P as complementary source for base routes, missing coverage or validation gaps;
- KuCoin, OKX and other sources as Core Intelligence by default, not tenant pricing by default.

This prevents tenant pricing from becoming noisy or confusing.

A tenant should not see every source the Core can inspect.

A tenant should receive a clean Core-approved market base with confidence, warnings and route availability.

Each tenant receives a filtered, processed feed according to:

- enabled countries;
- enabled currencies;
- enabled routes;
- active modules;
- permissions;
- commercial plan;
- tenant margins;
- limits;
- schedule;
- risk settings;
- approved tenant-grade sources;
- source confidence;
- Core-only warnings vs tenant-visible warnings.

### 10. Runtime / Workers

Polling is important, but it is not the engine itself.

Runtime is the machinery that keeps the Market Engine alive.

Workers are background tasks that execute engine jobs without depending on an admin clicking buttons.

Examples:

- Market Polling Worker;
- Official Source Worker;
- Provider Health Worker;
- Opportunity Scanner Worker;
- Quote Expiration Worker;
- Tenant Feed Worker;
- Snapshot Worker.

Cron jobs or scheduled jobs run tasks at planned times.

Examples:

- refresh official references at publication windows;
- scan P2P opportunities every few minutes;
- expire quotes at end of day;
- generate daily snapshots;
- check provider health;
- clean stale cache.

Render paid uptime helps because the service does not sleep, but it does not replace scheduled jobs. A service can be awake and still need controlled timing rules.

Refresh policies define how often each source or process updates.

Examples:

- Binance P2P every few minutes;
- Bybit P2P every few minutes where enabled;
- official sources daily or by publication window;
- opportunity scanner every defined interval;
- tenant feeds after meaningful source changes or scheduled regeneration.

Cache stores short-lived results to avoid unnecessary provider calls.

Fallback activation defines what happens when a primary source fails.

Rate limits protect the engine from exceeding provider limits.

Queues are future infrastructure for processing many jobs safely without overloading APIs or the server.

Runtime should support the engine, not visually dominate Core Platform.

### 11. Audit Layer

Every sensitive market change must be traceable.

Examples:

- source changed;
- provider failed;
- fallback activated;
- manual reference entered;
- route blocked;
- confidence degraded;
- tenant feed affected;
- opportunity generated;
- worker failed.

## Data Flow

Basic future flow:

1. Provider adapters collect raw prices.
2. Normalization layer converts raw prices into standard market quotes.
3. Confidence engine evaluates quality.
4. Snapshot layer stores the current market base.
5. Cross engine calculates route references.
6. Opportunity engine detects useful or risky conditions.
7. Tenant feed layer exposes only what each tenant can use.
8. Remit, Ledger, Lending and future modules consume the feed.
9. Audit stores relevant changes and sensitive actions.

## Commercial Benefits

A strong Core Market Engine allows Dhemka Core to sell more than software screens.

It can support:

- smarter remittance pricing;
- multi-country market intelligence;
- premium alerts;
- opportunity detection;
- route expansion;
- tenant-specific feeds;
- safer operations;
- better risk control;
- future arbitrage tools;
- future partner network intelligence;
- stronger SaaS differentiation.

## UI Direction

Core Platform should not look like a simple monitoring page.

It should feel like the living engine of Dhemka Core.

Suggested Core Platform navigation:

- Overview;
- Market Engine;
- Sources;
- Cross Engine;
- Opportunities;
- Runtime;
- Health;
- Audit.

Operational Base, Quote Engine and Monitoring are not top-level global sidebar items. They are internal layers of Core Platform.

## Current Mock Status

The current mock is only a shell.

It may display Binance, BCV, PTAX, polling and basic health. That is acceptable for now, but the architecture must point toward the larger future engine.

The mock should eventually become a serious blueprint for the real system.
