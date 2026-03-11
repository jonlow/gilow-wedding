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

function getGuestPartyDetails(guest: {
  name: string;
  plusOne?: string;
  kids?: string;
}) {
  const primaryName = normalizeName(guest.name) ?? guest.name.trim();
  const plusOneName = normalizeName(guest.plusOne);
  const kidsNames = splitKidsNames(guest.kids);
  const trailingNames = [plusOneName, ...kidsNames].filter(
    (value): value is string => Boolean(value),
  );

  if (trailingNames.length === 0) {
    return { names: primaryName, partySize: 1 };
  }

  if (trailingNames.length === 1) {
    return { names: `${primaryName} & ${trailingNames[0]}`, partySize: 2 };
  }

  return {
    names: `${primaryName}, ${formatNameList(trailingNames)}`,
    partySize: 1 + trailingNames.length,
  };
}

export function buildRsvpSlackMessage(guest: {
  name: string;
  plusOne?: string;
  kids?: string;
  attending: boolean;
}) {
  const { names, partySize } = getGuestPartyDetails(guest);
  const verb = partySize === 1 ? "is" : "are";
  const emoji = guest.attending ? "\u{1F389}" : "\u{1F622}";
  const outcome = guest.attending
    ? "coming to your wedding"
    : "not coming to your wedding";

  return `${names} ${verb} ${outcome}! ${emoji}`;
}

export async function sendRsvpSlackNotification(guest: {
  name: string;
  plusOne?: string;
  kids?: string;
  attending: boolean;
}) {
  const webhookUrl = process.env.RSVP_SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("RSVP_SLACK_WEBHOOK_URL is not set");
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: buildRsvpSlackMessage(guest),
      }),
    });
  } catch (error) {
    console.error("Failed to send RSVP Slack notification", error);
  }
}
