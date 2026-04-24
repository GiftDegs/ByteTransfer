const quoteStrategies = {
 VES: {
    buy: {
        provider: "binance",
        tradeType: "BUY",
        asset: "USDT",
        rows: 20,
        aggregation: "average",
        trimLowest: 1,
        trimHighest: 1,
        transAmount: 10000,
    },
    sell: {
        provider: "derived",
        from: "VES.buy",
        operation: "multiply",
        factor: 0.9975,
    },
    },

 ARS: {
    buy: {
        provider: "binance",
        tradeType: "BUY",
        asset: "USDT",
        rows: 20,
        aggregation: "average",
        trimLowest: 1,
        trimHighest: 1,
        transAmount: 100000,
    },
    sell: {
        provider: "binance",
        tradeType: "SELL",
        asset: "USDT",
        rows: 20,
        aggregation: "average",
        trimLowest: 1,
        trimHighest: 1,
        transAmount: 100000,
    },
 },

  COP: {
    buy: {
      provider: 'binance',
      tradeType: 'BUY',
      asset: 'USDT',
      rows: 20,
      aggregation: "average",
      trimLowest: 1,
        trimHighest: 1,
        transAmount: 100000,
    },
    sell: {
      provider: 'binance',
      tradeType: 'SELL',
      asset: 'USDT',
      rows: 20,
      aggregation: 'average',trimLowest: 1,
        trimHighest: 1,
        transAmount: 100000,
    },
  },

  PEN: {
    buy: {
      provider: 'binance',
      tradeType: 'BUY',
      asset: 'USDT',
      rows: 20,
      aggregation: 'average',
      trimLowest: 1,
        trimHighest: 1,
        transAmount: 500,
    },
    sell: {
      provider: 'binance',
      tradeType: 'SELL',
      asset: 'USDT',
      rows: 20,
      aggregation: 'average',
      trimLowest: 1,
        trimHighest: 1,
        transAmount: 500,
    },
  },

  CLP: {
    buy: {
      provider: 'binance',
      tradeType: 'BUY',
      asset: 'USDT',
      rows: 20,
      aggregation: 'average',
      trimLowest: 1,
        trimHighest: 1,
        transAmount: 100000,
    },
    sell: {
      provider: 'binance',
      tradeType: 'SELL',
      asset: 'USDT',
      rows: 20,
      aggregation: 'average',
      trimLowest: 1,
        trimHighest: 1,
        transAmount: 100000,
    },
  },

  MXN: {
    buy: {
      provider: 'binance',
      tradeType: 'BUY',
      asset: 'USDT',
      rows: 20,
      aggregation: 'average',
      trimLowest: 1,
        trimHighest: 1,
        transAmount: 100000,
    },
    sell: {
      provider: 'binance',
      tradeType: 'SELL',
      asset: 'USDT',
      rows: 20,
      aggregation: 'average',
      trimLowest: 1,
        trimHighest: 1,
        transAmount: 100000,
    },
  },

  BRL: {
    buy: {
      provider: 'ptax',
    },
    sell: {
      provider: 'ptax',
    },
  },
};

module.exports = { quoteStrategies };
