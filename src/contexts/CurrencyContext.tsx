import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type CurrencyCode = 'GBP' | 'AUD' | 'JPY' | 'USD';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  rates: Record<string, number>;
  convertPrice: (priceJPY: number) => { value: number; formatted: string };
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyCode>('JPY');
  const [rates, setRates] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchRates = async () => {
      // Attempt to load from localStorage cache first
      try {
        const cachedRatesStr = localStorage.getItem('jdm_exchange_rates');
        const cachedTimeStr = localStorage.getItem('jdm_exchange_rates_timestamp');
        
        if (cachedRatesStr && cachedTimeStr) {
          const cachedTime = parseInt(cachedTimeStr, 10);
          const age = Date.now() - cachedTime;
          const twelveHours = 12 * 60 * 60 * 1000;
          
          if (age < twelveHours) {
            const parsedRates = JSON.parse(cachedRatesStr);
            setRates(parsedRates);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed retrieving cached currency rates", err);
      }

      // Fetch fresh rates
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/JPY');
        const data = await response.json();
        if (data && data.rates) {
          setRates(data.rates);
          try {
            localStorage.setItem('jdm_exchange_rates', JSON.stringify(data.rates));
            localStorage.setItem('jdm_exchange_rates_timestamp', Date.now().toString());
          } catch (err) {
            console.warn("Failed writing currency rates to cache", err);
          }
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates", error);
        // Fallback to stale cache if call failed entirely
        try {
          const cachedRatesStr = localStorage.getItem('jdm_exchange_rates');
          if (cachedRatesStr) {
            setRates(JSON.parse(cachedRatesStr));
          }
        } catch (err) {
          // No action needed
        }
      }
    };
    fetchRates();
  }, []);

  const convertPrice = (priceJPY: number) => {
    if (currency === 'JPY' || !rates[currency]) {
      return { 
        value: priceJPY, 
        formatted: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(priceJPY) 
      };
    }
    
    const converted = priceJPY * rates[currency];
    const styles: Record<CurrencyCode, string> = {
      GBP: 'en-GB',
      AUD: 'en-AU',
      USD: 'en-US',
      JPY: 'ja-JP'
    };

    return {
      value: converted,
      formatted: new Intl.NumberFormat(styles[currency], { style: 'currency', currency: currency }).format(converted)
    };
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
