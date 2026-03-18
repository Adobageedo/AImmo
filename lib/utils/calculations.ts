export const calculateGrossYield = (
  annualRent: number,
  propertyValue: number
): number => {
  if (propertyValue === 0) return 0;
  return (annualRent / propertyValue) * 100;
};

export const calculateNetYield = (
  annualRent: number,
  propertyValue: number,
  annualCharges: number
): number => {
  if (propertyValue === 0) return 0;
  return ((annualRent - annualCharges) / propertyValue) * 100;
};

export const calculateOccupancyRate = (
  occupiedProperties: number,
  totalProperties: number
): number => {
  if (totalProperties === 0) return 0;
  return (occupiedProperties / totalProperties) * 100;
};

export const calculateVacancyRate = (
  vacantProperties: number,
  totalProperties: number
): number => {
  if (totalProperties === 0) return 0;
  return (vacantProperties / totalProperties) * 100;
};

export const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  years: number
): number => {
  const monthlyRate = annualRate / 12 / 100;
  const numberOfPayments = years * 12;
  
  if (monthlyRate === 0) return principal / numberOfPayments;
  
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
};

export const calculateROI = (
  gain: number,
  cost: number
): number => {
  if (cost === 0) return 0;
  return ((gain - cost) / cost) * 100;
};

export const formatCurrency = (amount: number, currency = "EUR"): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals = 0): string => {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};
