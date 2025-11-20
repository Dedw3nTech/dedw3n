export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number; // Exchange rate to USD
  category?: string; // For grouping currencies (Traditional, Cryptocurrencies, Stablecoins)
}

export const currencies: Currency[] = [
  // Major Global Currencies (USD per unit)
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rate: 1.27 },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rate: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rate: 1.08 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', rate: 0.14 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rate: 0.012 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', rate: 0.19 },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', flag: '🇯🇲', rate: 0.0065 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', rate: 0.66 },
  
  // East Asia & Pacific (USD per unit)
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rate: 0.0067 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', rate: 0.00075 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', rate: 0.74 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', rate: 9.95 },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼', rate: 40.85 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', rate: 45.20 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', rate: 5.95 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', rate: 19650.00 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', rate: 31250.00 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', rate: 72.15 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', rate: 2.08 },
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$', flag: '🇫🇯', rate: 2.85 },
  
  // Europe
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', rate: 1.14 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', rate: 13.85 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', rate: 14.20 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', rate: 8.75 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', rate: 5.15 },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', rate: 29.40 },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺', rate: 465.80 },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴', rate: 5.85 },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬', rate: 2.30 },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', flag: '🇭🇷', rate: 8.85 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', rate: 118.75 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', rate: 42.15 },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', flag: '🇮🇸', rate: 175.40 },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', flag: '🇦🇱', rate: 114.25 },
  
  // Americas
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', rate: 1.73 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', rate: 25.45 },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', flag: '🇵🇪', rate: 4.85 },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱', rate: 1205.60 },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$', flag: '🇺🇾', rate: 54.25 },
  { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲', flag: '🇵🇾', rate: 9145.00 },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs', flag: '🇻🇪', rate: 46.85 },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷', rate: 1285.40 },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs', flag: '🇧🇴', rate: 8.75 },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', flag: '🇨🇷', rate: 654.20 },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴', rate: 5285.00 },
  { code: 'HTG', name: 'Haitian Gourde', symbol: 'G', flag: '🇭🇹', rate: 168.50 },
  { code: 'DOP', name: 'Dominican Peso', symbol: '$', flag: '🇩🇴', rate: 76.40 },
  { code: 'SRD', name: 'Suriname Dollar', symbol: '$', flag: '🇸🇷', rate: 45.85 },
  
  // Africa
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RWF', flag: '🇷🇼', rate: 1420.75 },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', flag: '🌍', rate: 774.25 },
  { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le', flag: '🇸🇱', rate: 30590.00 },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX', flag: '🇺🇬', rate: 4650.50 },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', flag: '🇿🇲', rate: 27.85 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭', rate: 15.80 },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', flag: '🌍', rate: 774.25 },
  { code: 'GNF', name: 'Guinean Franc', symbol: 'GNF', flag: '🇬🇳', rate: 10850.00 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', rate: 162.30 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿', rate: 2985.40 },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', flag: '🇲🇼', rate: 1735.60 },
  { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar', flag: '🇲🇬', rate: 5780.25 },
  { code: 'CDF', name: 'Congolese Franc', symbol: 'FC', flag: '🇨🇩', rate: 3650.80 },
  { code: 'LRD', name: 'Liberian Dollar', symbol: 'L$', flag: '🇱🇷', rate: 245.60 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', rate: 1985.40 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', rate: 23.45 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬', rate: 62.35 },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', flag: '🇩🇿', rate: 170.25 },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', flag: '🇲🇦', rate: 12.85 },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', flag: '🇦🇴', rate: 1085.40 },
  
  // Middle East & South Asia
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', rate: 4.68 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', rate: 4.78 },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱', rate: 4.68 },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦', rate: 4.65 },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼', rate: 0.385 },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭', rate: 0.48 },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', flag: '🇴🇲', rate: 0.49 },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', flag: '🇯🇴', rate: 0.90 },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', flag: '🇱🇧', rate: 1925.00 },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', flag: '🇮🇷', rate: 53750.00 },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', flag: '🇦🇫', rate: 88.50 },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', rate: 352.80 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', rate: 152.40 },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', flag: '🇲🇻', rate: 19.65 },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰', rate: 385.40 },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs', flag: '🇳🇵', rate: 167.10 },

  // Major Cryptocurrencies (USD per coin)
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', flag: '🟠', rate: 40000.0, category: 'Cryptocurrencies' }, // ~$40,000 USD per BTC
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', flag: '🔷', rate: 2680.0, category: 'Cryptocurrencies' }, // ~$2,680 USD per ETH
  { code: 'BNB', name: 'Binance Coin', symbol: 'BNB', flag: '🟡', rate: 596.0, category: 'Cryptocurrencies' }, // ~$596 USD per BNB
  { code: 'ADA', name: 'Cardano', symbol: '₳', flag: '🔵', rate: 0.536, category: 'Cryptocurrencies' }, // ~$0.536 USD per ADA
  { code: 'SOL', name: 'Solana', symbol: 'SOL', flag: '🟣', rate: 134.0, category: 'Cryptocurrencies' }, // ~$134 USD per SOL
  { code: 'DOT', name: 'Polkadot', symbol: 'DOT', flag: '🔴', rate: 7.14, category: 'Cryptocurrencies' }, // ~$7.14 USD per DOT
  { code: 'AVAX', name: 'Avalanche', symbol: 'AVAX', flag: '🔺', rate: 35.5, category: 'Cryptocurrencies' }, // ~$35.5 USD per AVAX
  { code: 'LINK', name: 'Chainlink', symbol: 'LINK', flag: '🔗', rate: 14.3, category: 'Cryptocurrencies' }, // ~$14.3 USD per LINK
  { code: 'MATIC', name: 'Polygon', symbol: 'MATIC', flag: '🟣', rate: 0.416, category: 'Cryptocurrencies' }, // ~$0.416 USD per MATIC
  { code: 'LTC', name: 'Litecoin', symbol: 'Ł', flag: '🥈', rate: 83.5, category: 'Cryptocurrencies' }, // ~$83.5 USD per LTC

  // Major Stablecoins (USD per coin)
  { code: 'USDT', name: 'Tether', symbol: 'USDT', flag: '🟢', rate: 1.0, category: 'Stablecoins' }, // $1 USD per USDT
  { code: 'USDC', name: 'USD Coin', symbol: 'USDC', flag: '🔵', rate: 1.0, category: 'Stablecoins' }, // $1 USD per USDC
  { code: 'BUSD', name: 'Binance USD', symbol: 'BUSD', flag: '🟡', rate: 1.0, category: 'Stablecoins' }, // $1 USD per BUSD
  { code: 'DAI', name: 'DAI', symbol: 'DAI', flag: '🟠', rate: 1.0, category: 'Stablecoins' }, // $1 USD per DAI
  { code: 'TUSD', name: 'TrueUSD', symbol: 'TUSD', flag: '💙', rate: 1.0, category: 'Stablecoins' }, // $1 USD per TUSD
];
