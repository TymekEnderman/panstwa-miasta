export function pluralize(
  value: number,
  one: string,
  few: string,
  many: string,
) {
  const absoluteValue = Math.abs(value);
  const lastDigit = absoluteValue % 10;
  const lastTwoDigits = absoluteValue % 100;

  if (absoluteValue === 1) {
    return one;
  }

  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    !(lastTwoDigits >= 12 && lastTwoDigits <= 14)
  ) {
    return few;
  }

  return many;
}

export function formatCategoryCount(value: number) {
  return `${value} ${pluralize(value, "kategoria", "kategorie", "kategorii")}`;
}

export function formatAvailability(value: number) {
  return `${value} ${pluralize(value, "dostępna", "dostępne", "dostępnych")}`;
}
