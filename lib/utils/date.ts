import { format, parseISO, differenceInDays, addMonths, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";

export const formatDate = (date: string | Date, formatString = "dd/MM/yyyy"): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatString, { locale: fr });
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, "dd/MM/yyyy HH:mm");
};

export const formatRelativeDate = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const days = differenceInDays(now, dateObj);

  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
  return `Il y a ${Math.floor(days / 365)} ans`;
};

export const getDaysUntil = (date: string | Date): number => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return differenceInDays(dateObj, new Date());
};

export const isExpiringSoon = (date: string | Date, daysThreshold = 30): boolean => {
  const days = getDaysUntil(date);
  return days >= 0 && days <= daysThreshold;
};

export const isExpired = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
};

export const addMonthsToDate = (date: string | Date, months: number): Date => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return addMonths(dateObj, months);
};

export const getMonthsBetween = (startDate: string | Date, endDate: string | Date): number => {
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;
  return Math.ceil(differenceInDays(end, start) / 30);
};
