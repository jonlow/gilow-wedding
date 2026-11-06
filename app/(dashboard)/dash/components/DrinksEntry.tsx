"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Copy, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DRINK_PREFERENCES,
  EMPTY_DRINK_PROFILE,
  isDrinkProfileComplete,
  summariseDrinks,
  type DrinkProfile,
} from "@/lib/drinks";
import { useAuthToken } from "../hooks/useAuthToken";

type Guest = FunctionReturnType<typeof api.guests.listGuests>[number];
type Person = "main" | "partner";
type SaveState = "saving" | "saved" | "error";

export function DrinksEntry({
  guests,
  onUnsavedChange,
}: {
  guests: Guest[];
  onUnsavedChange: (unsaved: boolean) => void;
}) {
  const token = useAuthToken();
  const records = useQuery(api.drinks.list, {
    token,
    guestIds: guests.map((guest) => guest._id),
  });
  const savePerson = useMutation(api.drinks.savePerson);
  const [drafts, setDrafts] = useState<
    Record<string, DrinkProfile | undefined>
  >({});
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const versions = useRef<Record<string, number>>({});
  const queues = useRef<Record<string, Promise<unknown>>>({});
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState("confirmed");
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [focusedGuest, setFocusedGuest] = useState<string | null>(null);
  const stored = new Map(records?.map((record) => [record.guestId, record]));
  const guestById = new Map(guests.map((guest) => [guest._id, guest]));
  const personKey = (guestId: Id<"guests">, person: Person) =>
    JSON.stringify([
      guestId,
      person,
      person === "partner" ? guestById.get(guestId)?.plusOne?.trim() : "",
    ]);
  const profileFor = (guestId: Id<"guests">, person: Person) =>
    drafts[personKey(guestId, person)] ?? stored.get(guestId)?.[person];

  function save(guestId: Id<"guests">, person: Person, value: DrinkProfile) {
    const profile = value.score === 0 ? { score: 0, preferences: [] } : value;
    const key = personKey(guestId, person);
    const expectedPartner =
      person === "partner"
        ? guestById.get(guestId)?.plusOne?.trim()
        : undefined;
    const version = (versions.current[key] ?? 0) + 1;
    versions.current[key] = version;
    setDrafts((current) => ({
      ...current,
      [key]: profile,
    }));
    setSaveStates((current) => ({ ...current, [key]: "saving" }));
    // Serialise rapid edits per person so a slower save cannot overwrite a newer one.
    queues.current[key] = (queues.current[key] ?? Promise.resolve())
      .then(() =>
        savePerson({ token, guestId, person, profile, expectedPartner }),
      )
      .then(() => {
        if (versions.current[key] === version) {
          setSaveStates((current) => ({ ...current, [key]: "saved" }));
          setDrafts((current) => ({
            ...current,
            [key]: undefined,
          }));
        }
      })
      .catch(() => {
        if (versions.current[key] === version)
          setSaveStates((current) => ({ ...current, [key]: "error" }));
      });
  }

  const eligible = guests.filter(
    (guest) => attendance === "all" || guest.attending === true,
  );
  const allProfiles = eligible.flatMap((guest) => [
    profileFor(guest._id, "main"),
    ...(guest.plusOne?.trim() ? [profileFor(guest._id, "partner")] : []),
  ]);
  const summary = summariseDrinks(allProfiles);
  const visible = eligible.filter((guest) => {
    const matchesSearch =
      `${guest.name} ${guest.lastName ?? ""} ${guest.plusOne ?? ""}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
    const incomplete =
      !isDrinkProfileComplete(profileFor(guest._id, "main")) ||
      (Boolean(guest.plusOne?.trim()) &&
        !isDrinkProfileComplete(profileFor(guest._id, "partner")));
    const failed =
      saveStates[personKey(guest._id, "main")] === "error" ||
      saveStates[personKey(guest._id, "partner")] === "error";
    return (
      matchesSearch &&
      (!incompleteOnly || incomplete || focusedGuest === guest._id || failed)
    );
  });
  const activeSaveStates = guests.flatMap((guest) => [
    saveStates[personKey(guest._id, "main")],
    ...(guest.plusOne?.trim()
      ? [saveStates[personKey(guest._id, "partner")]]
      : []),
  ]);
  const pending = activeSaveStates.some((state) => state === "saving");
  const failed = activeSaveStates.some((state) => state === "error");
  useEffect(() => {
    onUnsavedChange(pending || failed);
  }, [pending, failed, onUnsavedChange]);
  useEffect(() => {
    if (!pending && !failed) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [pending, failed]);

  return (
    <section
      aria-labelledby="drinks-heading"
      className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
    >
      <div className="space-y-4 border-b border-stone-200 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              id="drinks-heading"
              className="text-xl font-semibold text-stone-950"
            >
              Drinks entry
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Score each adult, then tap their drinks. Changes save
              automatically.
            </p>
          </div>
          <p
            role="status"
            className={cn(
              "text-sm",
              failed ? "text-red-700" : "text-stone-600",
            )}
          >
            {failed
              ? "Some changes need retrying"
              : pending
                ? "Saving…"
                : "All changes saved"}
          </p>
        </div>
        <p id="drinks-scale" className="text-sm text-stone-600">
          0 = no alcohol · 1–3 light · 4–6 moderate · 7–8 heavy · 9–10 very
          heavy. Drag to score; “Not set” means unknown. Press Enter on a slider to move to the next adult.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-48 flex-1 sm:max-w-sm">
            <Search
              aria-hidden="true"
              className="absolute top-2.5 left-3 h-4 w-4 text-stone-500"
            />
            <Input
              aria-label="Search adults"
              placeholder="Search guest or partner"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 placeholder:text-stone-500"
            />
          </div>
          <select
            aria-label="Attendance"
            value={attendance}
            onChange={(event) => setAttendance(event.target.value)}
            className="h-9 rounded-md border border-stone-300 bg-white px-3 text-sm"
          >
            <option value="confirmed">Confirmed guests</option>
            <option value="all">All guests</option>
          </select>
          <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={incompleteOnly}
              onChange={(event) => setIncompleteOnly(event.target.checked)}
              className="h-4 w-4 accent-stone-900"
            />
            Incomplete only
          </label>
        </div>
        {records !== undefined && (
          <p className="text-sm text-stone-600 tabular-nums">
            {summary.completeAdults} of {allProfiles.length} adults complete ·{" "}
            {summary.drinkingAdults} drinking · {summary.unknownAdults} unknown
            {summary.averageScore !== null && (
              <>
                {" "}
                · Average {summary.averageScore.toFixed(1)}/10 per drinking
                adult
              </>
            )}
          </p>
        )}
      </div>
      {records === undefined ? (
        <p role="status" className="p-6 text-sm text-stone-600">
          Loading drinks entries…
        </p>
      ) : visible.length === 0 ? (
        <p className="p-8 text-center text-stone-600">
          {incompleteOnly
            ? "No incomplete households match these filters."
            : "No guests match these filters."}
        </p>
      ) : (
        <div>
          <div
            className="hidden grid-cols-[minmax(8rem,1fr)_11rem_minmax(20rem,2.5fr)_10rem] gap-4 bg-stone-50 px-6 py-3 text-xs font-semibold text-stone-600 lg:grid"
            aria-hidden="true"
          >
            <span>Adult</span>
            <span>Score / 10</span>
            <span>Drink preferences</span>
            <span>Save / copy</span>
          </div>
          {visible.map((guest) => {
            const main = profileFor(guest._id, "main");
            const hasPartner = Boolean(guest.plusOne?.trim());
            const household = summariseDrinks([
              main,
              ...(hasPartner ? [profileFor(guest._id, "partner")] : []),
            ]);
            return (
              <div
                key={guest._id}
                className="border-t border-stone-200 first:border-t-0"
                onFocusCapture={() => setFocusedGuest(guest._id)}
                onBlurCapture={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget))
                    setFocusedGuest(null);
                }}
              >
                {(["main", ...(hasPartner ? ["partner"] : [])] as Person[]).map(
                  (person) => {
                    const name =
                      person === "main"
                        ? [guest.name, guest.lastName].filter(Boolean).join(" ")
                        : guest.plusOne!;
                    const profile =
                      profileFor(guest._id, person) ?? EMPTY_DRINK_PROFILE;
                    const state = saveStates[personKey(guest._id, person)];
                    return (
                      <div
                        key={person}
                        className={cn(
                          "grid gap-3 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(8rem,1fr)_11rem_minmax(20rem,2.5fr)_10rem] lg:items-center lg:gap-4",
                          person === "partner" &&
                            "border-t border-stone-100 bg-stone-50/50",
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium text-stone-950">
                            {name}
                          </p>
                          <p className="mt-0.5 text-xs text-stone-600">
                            {person === "partner"
                              ? `Partner of ${guest.name}`
                              : hasPartner
                                ? "Main guest"
                                : "Guest"}
                          </p>
                        </div>
                        <div className="w-full max-w-xs space-y-1">
                          <div className="flex items-center justify-between gap-2 text-xs text-stone-600">
                            <span className="font-medium tabular-nums text-stone-900">
                              {profile.score === undefined ? "Not set" : `${profile.score} / 10`}
                            </span>
                            {profile.score !== undefined && (
                              <button type="button" className="rounded px-1 py-1 underline underline-offset-2 hover:text-stone-950 focus-visible:outline-2" aria-label={`Clear drinking score for ${name}`} onClick={() => save(guest._id, person, { ...profile, score: undefined })}>Clear</button>
                            )}
                          </div>
                          <input
                            aria-label={`Drinking score for ${name}`}
                            aria-describedby="drinks-scale"
                            aria-valuetext={profile.score === undefined ? "Not set" : `${profile.score} out of 10`}
                            data-drinks-score
                            type="range"
                            min={0}
                            max={10}
                            step={1}
                            value={profile.score ?? 0}
                            className="block h-8 w-full cursor-pointer accent-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700"
                            onKeyDown={(event) => {
                              if (event.key !== "Enter") return;
                              event.preventDefault();
                              const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("[data-drinks-score]"));
                              inputs[inputs.indexOf(event.currentTarget) + 1]?.focus();
                            }}
                            onPointerUp={(event) => {
                              // A click at zero must also set a previously unknown score.
                              if (profile.score === undefined) save(guest._id, person, { ...profile, score: Number(event.currentTarget.value) });
                            }}
                            onKeyUp={(event) => {
                              if (profile.score === undefined && ["Home", "ArrowLeft", "ArrowDown"].includes(event.key)) save(guest._id, person, { ...profile, score: Number(event.currentTarget.value) });
                            }}
                            onChange={(event) => save(guest._id, person, { ...profile, score: Number(event.target.value) })}
                          />
                          <div aria-hidden="true" className="flex justify-between text-[11px] tabular-nums text-stone-500"><span>0</span><span>10</span></div>
                        </div>
                        <div
                          role="group"
                          aria-label={`Drink preferences for ${name}`}
                          className="flex flex-wrap gap-1.5"
                        >
                          {DRINK_PREFERENCES.map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              aria-pressed={profile.preferences.includes(value)}
                              disabled={profile.score === 0}
                              className={cn(
                                "min-h-9 rounded-full border px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700 disabled:cursor-not-allowed disabled:opacity-40",
                                profile.preferences.includes(value)
                                  ? "border-stone-900 bg-stone-900 text-white hover:bg-stone-700"
                                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100",
                              )}
                              onClick={() =>
                                save(guest._id, person, {
                                  ...profile,
                                  preferences: profile.preferences.includes(
                                    value,
                                  )
                                    ? profile.preferences.filter(
                                        (item) => item !== value,
                                      )
                                    : [...profile.preferences, value],
                                })
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                          {state === "error" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-700"
                              onClick={() => save(guest._id, person, profile)}
                            >
                              Retry save
                            </Button>
                          ) : (
                            <span aria-live="polite">
                              {state === "saving"
                                ? "Saving…"
                                : state === "saved"
                                  ? "Saved"
                                  : isDrinkProfileComplete(profile)
                                    ? "Complete"
                                    : "Not finished"}
                            </span>
                          )}
                          {person === "main" && hasPartner && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={!isDrinkProfileComplete(profile)}
                              className="h-8 px-2 text-xs"
                              onClick={() =>
                                save(guest._id, "partner", {
                                  ...profile,
                                  preferences: [...profile.preferences],
                                })
                              }
                              title={`Copy score and preferences to ${guest.plusOne}`}
                            >
                              <Copy
                                aria-hidden="true"
                                className="mr-1 h-3.5 w-3.5"
                              />
                              Copy to partner
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
                <p className="px-5 pb-3 text-xs text-stone-600 tabular-nums sm:px-6">
                  Household: {household.drinkingAdults} drinking{" "}
                  {household.drinkingAdults === 1 ? "adult" : "adults"}
                  {household.unknownAdults > 0 && (
                    <> · {household.unknownAdults} unknown</>
                  )}
                  {household.averageScore !== null && (
                    <> · Average {household.averageScore.toFixed(1)}/10</>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
