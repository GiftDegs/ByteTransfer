window.coreSections = {
  dashboard: {
    eyebrow: "Dhemka Core",
    title: "Ecosystem Infrastructure Overview",
    description: "Global operational visibility across the infrastructure.",
    cards: [
      {
        eyebrow: "Operational Base",
        title: "Market Stable",
        description: "Global snapshot references are synchronized correctly across the ecosystem.",
      },
      {
        eyebrow: "Quote Engine",
        title: "Binance + BCV + PTAX",
        description: "Providers, aggregation and fallback systems currently operational.",
      },
      {
        eyebrow: "Ecosystem",
        title: "Tenant-ready Core",
        description: "ByteTransfer runs as the first Remit tenant inside the Dhemka Core architecture.",
      },
    ],
  },

  "operational-base": {
    eyebrow: "Operational Base",
    title: "Market Snapshot Infrastructure",
    description: "Global market references, snapshots and operational base.",
    cards: [
      {
        eyebrow: "Snapshot",
        title: "Global Base Active",
        description: "Core market values are treated as the operational source of truth.",
      },
      {
        eyebrow: "References",
        title: "BCV / USDT / PTAX",
        description: "External references feed the base layer before tenant rules apply.",
      },
      {
        eyebrow: "Protection",
        title: "Tenants Cannot Edit Base",
        description: "Commercial adjustments must happen through tenant margins and rules.",
      },
    ],
  },

  "quote-engine": {
    eyebrow: "Quote Engine",
    title: "Providers & Aggregation",
    description: "Aggregation systems, providers and fallback logic.",
    cards: [
      {
        eyebrow: "Providers",
        title: "Multi-source Engine",
        description: "Binance, BCV, PTAX and future providers are resolved in Core.",
      },
      {
        eyebrow: "Aggregation",
        title: "Average / Median / Trim",
        description: "The engine can adapt how prices are calculated and protected.",
      },
      {
        eyebrow: "Fallbacks",
        title: "Last Good Reference",
        description: "Core keeps emergency fallbacks when external sources degrade.",
      },
    ],
  },

  monitoring: {
    eyebrow: "Monitoring",
    title: "Polling & Runtime Health",
    description: "Infrastructure health, runtime and monitoring systems.",
    cards: [
      {
        eyebrow: "Polling",
        title: "Core-owned Monitoring",
        description: "Polling belongs to Dhemka Core, not to each tenant.",
      },
      {
        eyebrow: "Alerts",
        title: "Future Notifications",
        description: "Critical movements can later trigger system-level notifications.",
      },
      {
        eyebrow: "Runtime",
        title: "Health First",
        description: "Infrastructure must remain stable before scaling tenants.",
      },
    ],
  },

  tenants: {
    eyebrow: "Tenants",
    title: "Remit Ecosystem",
    description: "Tenant management and operational ecosystem.",
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
