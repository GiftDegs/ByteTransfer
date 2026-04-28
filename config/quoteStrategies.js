const quoteStrategies = {
  VES: {
    buy: {
      provider: "binance",
      tradeType: "BUY",
      asset: "USDT",
      rows: 20,
      aggregation: "average",
      trimLowest: 0,
      trimHighest: 0,
      payTypes: [],
      amountMode: "usdt",
      amountUsdt: 100,
    },
    sell: {
      provider: "binance",
      tradeType: "SELL",
      asset: "USDT",
      rows: 20,
      aggregation: "average",
      trimLowest: 0,
      trimHighest: 0,
      payTypes: [],
      amountMode: "usdt",
      amountUsdt: 100,
    },
  },

  ARS: {
    buy: {
      provider: "binance",
      tradeType: "BUY",
      asset: "USDT",
      rows: 20,
      aggregation: "average",
      trimLowest: 0,
      trimHighest: 0,
      payTypes: [],
      amountMode: "usdt",
      amountUsdt: 100,
    },
    sell: {
      provider: "binance",
      tradeType: "SELL",
      asset: "USDT",
      rows: 20,
      aggregation: "average",
      trimLowest: 0,
      trimHighest: 0,
      payTypes: [],
      amountMode: "usdt",
      amountUsdt: 100,
    },
  },

  COP: {
    buy: {
      provider: "binance",
      tradeType: "BUY",
      asset: "USDT",
      rows: 20,
      aggregation: "average",
      trimLowest: 0,
      trimHighest: 0,
      payTypes: [],
      amountMode: "usdt",
      amountUsdt: 100,
    },
    sell: {
      provider: "binance",
      tradeType: "SELL",
      asset: "USDT",
      rows: 20,
      aggregation: "average",
      trimLowest: 0,
      trimHighest: 0,
      payTypes: [],
      amountMode: "usdt",
      amountUsdt: 100,
    },
  },

  PEN: {
    buy: {
      provider: "binance",
      tradeType: "BUY",
      asset: "USDT",
      rows: 20,
      aggregation: "average",
      trimLowest: 0,
      trimHighest: 0,
      payTypes: [],
      amountMode: "usdt",
      amountUsdt: 100,
    },
    sell: {
      provider: "binance",
      tradeType: "SELL",
      asset: "USDT",
      rows: 20,
      aggregation: "average",
      trimLowest: 0,
      trimHighest: 0,
      payTypes: [],
      amountMode: "usdt",
      amountUsdt: 100,
    },
  },

  CLP: {
    buy: {
      provider: "binance",
      tradeType: "BUY",
      asset: "USDT",
      rows: 20,
      aggregation: "average",
      trimLowest: 0,
      trimHighest: 0,
      payTypes: [],
      amountMode: "usdt",
      amountUsdt: 100,
    },
    sell: {
      provider: "binance",
      tradeType: "SELL",
      asset: "USDT",
      rows: 20,
      aggregation: "average",
      trimLowest: 0,
      trimHighest: 0,
      payTypes: [],
      amountMode: "usdt",
      amountUsdt: 100,
    },
  },

  MXN: {
    buy: {
      provider: "binance",
      tradeType: "BUY",
      asset: "USDT",
      rows: 20,
      aggregation: "average",
      trimLowest: 0,
      trimHighest: 0,
      payTypes: [],
      amountMode: "usdt",
      amountUsdt: 100,
    },
    sell: {
      provider: "binance",
      tradeType: "SELL",
      asset: "USDT",
      rows: 20,
      aggregation: "average",
      trimLowest: 0,
      trimHighest: 0,
      payTypes: [],
      amountMode: "usdt",
      amountUsdt: 100,
    },
  },

  BRL: {
    buy: {
      providers: [
        { provider: "ptax" },
        { provider: "snapshot" },
      ],
    },
    sell: {
      providers: [
        { provider: "ptax" },
        { provider: "snapshot" },
      ],
    },
  },
};

const referenceStrategies = {
  BCV_USD: {
    provider: "bcv",
    currency: "USD",
  },

  BCV_EUR: {
    provider: "bcv",
    currency: "EUR",
  },

  BRL_PTAX: {
    provider: "ptax",
    currency: "BRL",
  },
};

module.exports = {
  quoteStrategies,
  referenceStrategies,
};