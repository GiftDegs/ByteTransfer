window.coreSections = {
  dashboard: {
    eyebrow: "Dhemka Core",
    title: "Core Command Center",
    description: "Global command center for product branches, platform health, billing signals and system alerts.",
    cards: [
      {
        eyebrow: "Core Platform",
        title: "Engine Healthy",
        description: "Base providers, snapshots, polling and runtime health are represented as Core-owned infrastructure.",
      },
      {
        eyebrow: "Product Branches",
        title: "Remit Active",
        description: "Remit is the first active product branch. Ledger, Lending, Partner Network and Arbitrage remain future branches.",
      },
      {
        eyebrow: "Action Signals",
        title: "No Critical Alerts",
        description: "The dashboard should only surface tenants, demos or clients when there is a risk, expiration, support request or pending action.",
      },
    ],
  },

  "core-platform": {
    eyebrow: "Core Platform",
    title: "Core Engine & Infrastructure",
    description: "Base infrastructure owned by Dhemka Core: providers, snapshots, polling, runtime health, fallbacks and audit.",
    cards: [
      {
        eyebrow: "Operational Base",
        title: "Snapshots & References",
        description: "Global market references are controlled by Core and treated as the source of truth before tenant rules apply.",
      },
      {
        eyebrow: "Core Quote Engine",
        title: "Providers & Aggregation",
        description: "Binance, BCV, PTAX and future providers belong to the Core engine, not to individual tenants.",
      },
      {
        eyebrow: "Monitoring",
        title: "Runtime Health",
        description: "Polling, workers, fallbacks and alerts are monitored from the Core layer.",
      },
    ],
  },

  remit: {
    eyebrow: "Remit",
    title: "Remittance Product Branch",
    description: "Remit contains remittance tenants, quote centers, public calculators, roles, limits and operational workflows.",
    cards: [
      {
        eyebrow: "Remit Dashboard",
        title: "Branch Overview",
        description: "This branch should summarize Remit health, tenant activity, onboarding, alerts and pending actions.",
      },
      {
        eyebrow: "Tenants",
        title: "Tenant Registry Lives Here",
        description: "ByteTransfer and future remeseros belong inside Remit > Tenants, not in the global Core sidebar.",
      },
      {
        eyebrow: "Access Surfaces",
        title: "Quote Center + Public Calculator",
        description: "Internal quote centers and simple public calculators are Remit surfaces scoped to each tenant.",
      },
    ],
  },

  ledger: {
    eyebrow: "Ledger",
    title: "Accounts & Balances",
    description: "Future branch for balances, movements, expenses, commissions, settlements and reconciliation.",
    cards: [
      {
        eyebrow: "Accounts",
        title: "Future Ledger Accounts",
        description: "Ledger will own real balances and account movements across products.",
      },
      {
        eyebrow: "Movements",
        title: "Entries & Payouts",
        description: "Completed operations from Remit or other branches can later create ledger movements.",
      },
      {
        eyebrow: "Commissions",
        title: "Settlement Layer",
        description: "Weekly commissions, expenses and owner allocation should be handled by Ledger logic in the future.",
      },
    ],
  },

  lending: {
    eyebrow: "Lending",
    title: "Loans & Repayments",
    description: "Future branch for borrowers, loans, guarantees, interest, payments, delinquency and risk.",
    cards: [
      {
        eyebrow: "Loans",
        title: "Future Loan Book",
        description: "Lending will track loans independently from Remit while optionally using Ledger for balances.",
      },
      {
        eyebrow: "Payments",
        title: "Repayment Control",
        description: "Payment schedules, overdue signals and borrower activity will live inside this branch.",
      },
      {
        eyebrow: "Risk",
        title: "Guarantees & Delinquency",
        description: "Risk signals should be branch-specific, not mixed into the Core dashboard unless actionable.",
      },
    ],
  },

  "partner-network": {
    eyebrow: "Partner Network",
    title: "Shared Liquidity Branch",
    description: "Future branch for internal tenants, external partners, shared accounts, agreements and settlements.",
    cards: [
      {
        eyebrow: "Partners",
        title: "Internal + External",
        description: "Partners can be Dhemka tenants or manually registered external allies.",
      },
      {
        eyebrow: "Shared Liquidity",
        title: "Coverage Between Operators",
        description: "Tenants may use partner coverage while preserving percentages, commissions and debts.",
      },
      {
        eyebrow: "Settlements",
        title: "Partner Reconciliation",
        description: "Balances and obligations between parties should be tracked as their own branch.",
      },
    ],
  },

  arbitrage: {
    eyebrow: "Arbitrage",
    title: "Market Opportunities",
    description: "Future branch for provider comparison, liquidity opportunities, buy/sell signals and market alerts.",
    cards: [
      {
        eyebrow: "Signals",
        title: "Opportunity Detection",
        description: "Arbitrage can consume Core provider data and Ledger balances to detect actionable opportunities.",
      },
      {
        eyebrow: "Liquidity",
        title: "Balance-Aware Suggestions",
        description: "Future suggestions should consider available balances, not only market prices.",
      },
      {
        eyebrow: "Alerts",
        title: "Actionable Only",
        description: "Only meaningful opportunities should reach the main dashboard.",
      },
    ],
  },

  billing: {
    eyebrow: "Billing",
    title: "Plans, Trials & Access",
    description: "System branch for plans, trials, expirations, payments, module access and tenant commercial status.",
    cards: [
      {
        eyebrow: "Plans",
        title: "Module Access",
        description: "Billing should control which modules each tenant has active, paused or locked.",
      },
      {
        eyebrow: "Trials",
        title: "Expiration Signals",
        description: "Trials or demos should surface in the main dashboard only when they require action.",
      },
      {
        eyebrow: "Commercial Status",
        title: "Active / Past Due / Suspended",
        description: "Tenant commercial lifecycle belongs to Billing and should not be confused with operational health.",
      },
    ],
  },

  identity: {
    eyebrow: "Identity",
    title: "Users, Roles & Permissions",
    description: "System branch for login, users, roles, permissions, invitations, password resets, sessions and support access.",
    cards: [
      {
        eyebrow: "Users",
        title: "Core + Tenant Access",
        description: "CoreOwner, TenantAdmin, Manager, Receiver and Processor access should be modeled here.",
      },
      {
        eyebrow: "Permissions",
        title: "Role Boundaries",
        description: "Each role must have clear permissions before real authentication is implemented.",
      },
      {
        eyebrow: "Support Access",
        title: "Audited Entry",
        description: "Core support access into tenants must be controlled and audit-ready.",
      },
    ],
  },

  "operational-base": {
    eyebrow: "Operational Base",
    title: "Market Snapshot Infrastructure",
    description: "Legacy detail section kept temporarily until Core Platform subnavigation is implemented.",
    cards: [],
  },

  "quote-engine": {
    eyebrow: "Core Quote Engine",
    title: "Providers & Aggregation",
    description: "Legacy detail section kept temporarily until Core Platform subnavigation is implemented.",
    cards: [],
  },

  monitoring: {
    eyebrow: "Monitoring",
    title: "Polling & Runtime Health",
    description: "Legacy detail section kept temporarily until Core Platform subnavigation is implemented.",
    cards: [],
  },

  tenants: {
    eyebrow: "Remit Tenants",
    title: "Tenant Registry",
    description: "Legacy detail section kept temporarily until Remit internal navigation is implemented.",
    cards: [],
  },
};

window.coreTenants = [
  {
    id: "bytetransfer",
    product: "Remit",
    name: "ByteTransfer",
    slug: "bytetransfer",
    plan: "Founder",
    status: "operational",
    statusLabel: "Operational",
    lifecycle: "live",
    description: "First operational tenant running inside the Remit infrastructure.",
    branding: {
      primaryColor: "cyan",
      logoMode: "wordmark",
      poweredByCore: true,
    },
    modules: {
      tenantAdmin: {
        enabled: true,
        status: "planned",
        label: "Tenant Admin",
      },
      quoteCenter: {
        enabled: true,
        status: "current",
        label: "Quote Center",
      },
      publicCalculator: {
        enabled: true,
        status: "future-simple",
        label: "Public Calculator",
      },
      branding: {
        enabled: true,
        status: "upsell-ready",
        label: "Branding",
      },
      managers: {
        enabled: true,
        status: "future",
        label: "Managers",
      },
    },
  },
  {
    id: "demo-remit",
    product: "Remit",
    name: "Demo Remit",
    slug: "demo-remit",
    plan: "Demo",
    status: "provisioning",
    statusLabel: "Provisioning",
    lifecycle: "setup",
    description: "Example tenant slot prepared for future onboarding.",
    branding: {
      primaryColor: "amber",
      logoMode: "placeholder",
      poweredByCore: true,
    },
    modules: {
      tenantAdmin: {
        enabled: true,
        status: "planned",
        label: "Tenant Admin",
      },
      quoteCenter: {
        enabled: true,
        status: "planned",
        label: "Quote Center",
      },
      publicCalculator: {
        enabled: true,
        status: "planned",
        label: "Public Calculator",
      },
      branding: {
        enabled: true,
        status: "available",
        label: "Branding",
      },
      managers: {
        enabled: false,
        status: "locked",
        label: "Managers",
      },
    },
  },
];

window.coreOperationalBase = {
  snapshot: {
    label: "Global Snapshot",
    status: "active",
    owner: "Dhemka Core",
    description: "Single source of truth for market references before tenant commercial rules apply.",
    lastUpdated: "Mock · synced recently",
  },
  references: [
    {
      name: "BCV",
      scope: "VES official reference",
      status: "healthy",
      owner: "Core",
    },
    {
      name: "Binance P2P",
      scope: "USDT market liquidity",
      status: "healthy",
      owner: "Core",
    },
    {
      name: "PTAX",
      scope: "BRL official reference",
      status: "healthy",
      owner: "Core",
    },
  ],
  providers: [
    {
      name: "Binance Resolver",
      role: "P2P aggregation",
      status: "active",
    },
    {
      name: "BCV Resolver",
      role: "Official reference ingestion",
      status: "active",
    },
    {
      name: "Fallback Engine",
      role: "Last good reference protection",
      status: "standby",
    },
  ],
  controls: [
    {
      label: "Update Global Base",
      access: "Core only",
      lockedForTenants: true,
    },
    {
      label: "Provider Strategy",
      access: "Core only",
      lockedForTenants: true,
    },
    {
      label: "Polling Workers",
      access: "Core only",
      lockedForTenants: true,
    },
  ],
};

window.coreQuoteEngine = {
  owner: "Dhemka Core",
  description: "Core-owned quote engine that resolves providers, aggregation strategies and fallbacks before tenant commercial rules apply.",
  providers: [
    {
      name: "Binance P2P",
      role: "Market liquidity source",
      status: "active",
      scope: "USDT buy/sell references",
    },
    {
      name: "BCV",
      role: "Official reference source",
      status: "active",
      scope: "VES official exchange reference",
    },
    {
      name: "PTAX",
      role: "Official BRL reference source",
      status: "active",
      scope: "BRL official reference",
    },
  ],
  strategies: [
    {
      name: "Average",
      status: "available",
      description: "Uses average price across selected market samples.",
    },
    {
      name: "Median",
      status: "available",
      description: "Protects against extreme prices by selecting the middle market value.",
    },
    {
      name: "Trimmed Aggregation",
      status: "available",
      description: "Removes configured extremes before calculating the final reference.",
    },
  ],
  fallbacks: [
    {
      name: "Last Good Reference",
      status: "standby",
      description: "Keeps a usable market reference when a provider becomes unstable.",
    },
    {
      name: "Provider Degradation Warning",
      status: "planned",
      description: "Will flag weak provider quality before tenant pricing is affected.",
    },
  ],
  tenantBoundary: [
    {
      label: "Tenants can adjust margins",
      allowed: true,
    },
    {
      label: "Tenants can adjust enabled routes",
      allowed: true,
    },
    {
      label: "Tenants cannot edit provider strategy",
      allowed: false,
    },
    {
      label: "Tenants cannot update global market base",
      allowed: false,
    },
  ],
};

window.coreMonitoring = {
  owner: "Dhemka Core",
  description: "Core-owned monitoring layer for polling, workers, runtime health and global alerts.",
  polling: {
    label: "Market Polling",
    status: "active",
    interval: "180s",
    owner: "Core",
    description: "Core monitors market movement without depending on each tenant admin session.",
  },
  workers: [
    {
      name: "Market Polling Worker",
      role: "Refreshes live market references on a controlled interval.",
      status: "active",
    },
    {
      name: "Quote Audit Worker",
      role: "Runs provider quality checks without executing on every polling tick.",
      status: "optimized",
    },
    {
      name: "Future Cron Layer",
      role: "Will allow scheduled background jobs without keeping the admin open.",
      status: "planned",
    },
  ],
  health: [
    {
      label: "Runtime",
      status: "healthy",
      detail: "Core Console mock runtime stable.",
    },
    {
      label: "Polling Load",
      status: "optimized",
      detail: "Admin polling currently configured as lightweight 180s cycle.",
    },
    {
      label: "Provider Audit",
      status: "controlled",
      detail: "Quote audit is separated from every polling tick.",
    },
  ],
  alerts: [
    {
      label: "Market Degradation",
      severity: "watch",
      description: "Future global alert when providers degrade or references become stale.",
    },
    {
      label: "Tenant Risk Signal",
      severity: "planned",
      description: "Future signal when tenant margins are exposed by market movement.",
    },
    {
      label: "Worker Failure",
      severity: "critical",
      description: "Future alert when Core workers fail or stop reporting health.",
    },
  ],
};

