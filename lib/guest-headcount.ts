type GuestHeadcountFields = {
  plusOne?: string;
  kids?: string;
};

const NAME_SPLIT_PATTERN = /\s*(?:\||,|&|\band\b)\s*/i;

function countListedPeople(value?: string) {
  if (!value) return 0;

  return value
    .split(NAME_SPLIT_PATTERN)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

export function getGuestHouseholdSize(guest: GuestHeadcountFields) {
  return 1 + countListedPeople(guest.plusOne) + countListedPeople(guest.kids);
}

export function hasPlusOne(plusOne?: string) {
  return countListedPeople(plusOne) > 0;
}

export function getListedKidsCount(kids?: string) {
  return countListedPeople(kids);
}
