export const CRYPTO_TV_SYMBOL = {
  bitcoin: 'BINANCE:BTCUSDT',
  ethereum: 'BINANCE:ETHUSDT',
  tether: 'BINANCE:USDCUSDT',
  bnb: 'BINANCE:BNBUSDT',
  xrp: 'BINANCE:XRPUSDT',
  solana: 'BINANCE:SOLUSDT',
  usdc: 'BINANCE:USDCUSDT',
  dogecoin: 'BINANCE:DOGEUSDT',
  cardano: 'BINANCE:ADAUSDT',
  tron: 'BINANCE:TRXUSDT',
};

// بيربط رمز العملة (اللي جاي من مصدر الأسعار الحي زي CoinPaprika) بمعرّف
// صفحة التفاصيل عندنا (اللي مبني عليه الرابط /crypto/<id>). العملات اللي
// مش موجودة هنا لسه معندهاش صفحة تفاصيل، فبتتعرض من غير رابط قابل للدوس.
export const SYMBOL_TO_ID = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'bnb',
  XRP: 'xrp',
  SOL: 'solana',
  USDC: 'usdc',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  TRX: 'tron',
};
