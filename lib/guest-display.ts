function normalizeName(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
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
  const names = [normalizeName(name), normalizeName(plusOne), normalizeName(kids)].filter(
    (value): value is string => Boolean(value),
  );

  if (names.length <= 1) {
    return names[0] ?? name.trim();
  }

  const [firstName, ...rest] = names;
  return `${firstName}, ${rest.join(" & ")}`;
}
