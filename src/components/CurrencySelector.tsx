import { motion } from 'framer-motion';

import { getCurrencySymbolFromCode, CURRENCY_OPTIONS } from '../utils/currency';
import styles from './CurrencySelector.module.css';

interface CurrencySelectorProps {
  selectedCurrency: string;
  defaultCurrency: string;
  onCurrencyChange: (currencySymbol: string) => void;
}

export function CurrencySelector({
  selectedCurrency,
  defaultCurrency,
  onCurrencyChange,
}: CurrencySelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    if (code === '__default__') {
      onCurrencyChange(defaultCurrency);
    } else {
      const symbol = getCurrencySymbolFromCode(code);
      onCurrencyChange(symbol);
    }
  };

  // Find the current currency code based on symbol, or use '__default__'
  const getCurrentValue = () => {
    if (selectedCurrency === defaultCurrency) {
      return '__default__';
    }
    // Find the code that matches the current symbol
    const found = CURRENCY_OPTIONS.find(
      opt => getCurrencySymbolFromCode(opt.code) === selectedCurrency,
    );
    return found ? found.code : '__default__';
  };

  return (
    <motion.div
      className={styles.selector}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
    >
      <label htmlFor="currency-select" className={styles.label}>
        <span className={styles.labelText}>Currency</span>
        <select
          id="currency-select"
          className={styles.select}
          value={getCurrentValue()}
          onChange={handleChange}
          aria-label="Select currency"
        >
          <option value="__default__">Current ({defaultCurrency})</option>
          {CURRENCY_OPTIONS.map(option => (
            <option key={option.code} value={option.code}>
              {option.code} ({option.symbol})
            </option>
          ))}
        </select>
      </label>
    </motion.div>
  );
}
