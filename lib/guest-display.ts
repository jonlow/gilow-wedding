function normalizeName(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function splitKidsNames(value?: string) {
  if (!value) return [];

  return value
    .split("|")
    .map((item) => normalizeName(item))
    .filter((item): item is string => Boolean(item));
}

function formatNameList(names: string[]) {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;

  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

export function formatGuestGreetingNames({
  name,
  plusOne,
  kids,
}: {
  name: string;
  plusOne?: string;
  kids?: string;
}) {
  const primaryName = normalizeName(name) ?? name.trim();
  const plusOneName = normalizeName(plusOne);
  const kidsNames = splitKidsNames(kids);
  const trailingNames = [plusOneName, ...kidsNames].filter(
    (value): value is string => Boolean(value),
  );

  if (trailingNames.length === 0) {
    return primaryName;
  }

  if (trailingNames.length === 1) {
    return `${primaryName} & ${trailingNames[0]}`;
  }

  return `${primaryName}, ${formatNameList(trailingNames)}`;
}
