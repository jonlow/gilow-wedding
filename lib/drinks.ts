export const DRINK_PREFERENCES = [
  { value: "beer", label: "Beer" },
  { value: "whiteWine", label: "White wine" },
  { value: "sparkling", label: "Sparkling" },
  { value: "lightRed", label: "Light red" },
  { value: "redWine", label: "Red" },
  { value: "aperol", label: "Aperol" },
  { value: "whisky", label: "Whisky" },
] as const;

export type DrinkPreference = (typeof DRINK_PREFERENCES)[number]["value"];
export type DrinkProfile = { score?: number; preferences: DrinkPreference[] };
export type HouseholdDrinks = { main?: DrinkProfile; partner?: DrinkProfile };
export const EMPTY_DRINK_PROFILE: DrinkProfile = { preferences: [] };

export function isDrinkProfileComplete(profile?: DrinkProfile) {
  return (
    profile?.score !== undefined &&
    (profile.score === 0 || profile.preferences.length > 0)
  );
}

export function summariseDrinks(profiles: (DrinkProfile | undefined)[]) {
  const drinkers = profiles.filter((profile) => (profile?.score ?? 0) > 0);
  return {
    drinkingAdults: drinkers.length,
    unknownAdults: profiles.filter((profile) => profile?.score === undefined)
      .length,
    averageScore: drinkers.length
      ? drinkers.reduce((sum, profile) => sum + profile!.score!, 0) /
        drinkers.length
      : null,
    completeAdults: profiles.filter(isDrinkProfileComplete).length,
  };
}
