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
        title: "1 Active Tenant",
        description: "ByteTransfer currently running under the Remit infrastructure layer.",
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
    cards: [
      {
        eyebrow: "Remit",
        title: "ByteTransfer",
        description: "First tenant running on top of the Remit infrastructure.",
      },
      {
        eyebrow: "Provisioning",
        title: "New Tenant Ready",
        description: "Future tenants will receive branding, permissions and settings.",
      },
      {
        eyebrow: "Customization",
        title: "Branding as Upsell",
        description: "Visual personalization is part of the tenant model from day one.",
      },
    ],
  },
};

window.coreTenants = [
  {
    id: "bytetransfer",
    product: "Remit",
    name: "ByteTransfer",
    status: "operational",
    statusLabel: "Operational",
    description: "First operational tenant running inside the Remit infrastructure.",
  },
  {
    id: "demo-remit",
    product: "Remit",
    name: "Demo Remit",
    status: "provisioning",
    statusLabel: "Provisioning",
    description: "Example tenant slot prepared for future onboarding.",
  },
];