
export const formatCompactNumber = (num: number, currency: string) => {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (currency.toUpperCase() === 'INR') {
    if (absNum >= 10000000) return sign + (absNum / 10000000).toFixed(2) + ' Cr';
    if (absNum >= 100000) return sign + (absNum / 100000).toFixed(2) + ' L';
    return sign + absNum.toLocaleString('en-IN');
  }
  if (absNum >= 1000000) return sign + (absNum / 1000000).toFixed(2) + 'M';
  if (absNum >= 1000) return sign + (absNum / 1000).toFixed(2) + 'K';
  return sign + absNum.toLocaleString('en-US');
};

export const formatCurrency = (amount: number, currency: string) => {
  if (currency.toUpperCase() === 'INR') {
    return '₹' + formatCompactNumber(amount, 'INR');
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    // Fallback if currency code is invalid
    return currency + ' ' + amount.toLocaleString();
  }
};
