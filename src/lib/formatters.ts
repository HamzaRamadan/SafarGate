'use client';

import { format as formatFns } from 'date-fns';
import { arSA } from 'date-fns/locale';

/**
 * @file src/lib/formatters.ts
 * @description SOVEREIGN-ORD-008
 * This file acts as the "Formatting Engine". It centralizes all date and time
 * formatting logic to ensure consistency across the entire application.
 */

/**
 * The unified function to format dates throughout the application.
 * It uses a consistent Arabic locale and a predefined format string.
 * @param date The date to format (can be a Date object, string, or number).
 * @param formatString The desired format string (defaults to 'd MMMM yyyy').
 * @returns The formatted date string, or an empty string if the date is invalid.
 */
export const formatDate = (date: Date | number | string, formatString: string = 'd MMMM yyyy', locale: string): string => {
  if (!date) return '';
  try {
    const dateObj = new Date(date);
    return formatFns(dateObj, formatString, { locale: arSA });
  } catch {
    return 'تاريخ غير صالح';
  }
};

/**
 * Combines a Date object with a time string (HH:MM) to create a new Date object.
 * @param date The base date.
 * @param timeString The time in "HH:MM" format.
 * @returns A new Date object with the combined date and time.
 */
export const combineDateAndTime = (date: Date, timeString: string): Date => {
    const [hours, minutes] = timeString.split(':');
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));
    newDate.setSeconds(0, 0); // Reset seconds and milliseconds
    return newDate;
};
