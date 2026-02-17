/*
Number Helper class
- Easy to use functions across app to help w/ numbers
*/
// converts string to number
export const toNum = (s: string) => (s.trim() === "" ? NaN : Number(s));
// checks if number is non negative
export const nonNeg = (n: number) => !Number.isNaN(n) && n >= 0;