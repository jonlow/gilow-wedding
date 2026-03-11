"use client";

import { forwardRef, useState, useEffect, useRef } from "react";
import {
  MoreHorizontal,
  Mail,
  Copy,
  Check,
  Plus,
  Search,
  ScrollText,
  Users,
  FileUp,
  ListFilter,
  ChevronDown,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { getGuestHouseholdSize } from "@/lib/guest-headcount";
import { cn } from "@/lib/utils";
import { useAuthToken } from "../hooks/useAuthToken";
import { EditGuestSheet } from "../EditGuestSheet";
import { BulkGuestImport } from "./BulkGuestImport";
import { DeleteGuestDialog } from "./DeleteGuestDialog";
import { GuestAuditSheet } from "./GuestAuditSheet";
import { ResendInviteDialog } from "./ResendInviteDialog";

const AddGuestSheet = dynamic(() => import("../AddGuestSheet"), {
  ssr: false,
  loading: () => (
    <Button disabled>
      <Plus className="mr-2 h-4 w-4" />
      Add Guest
    </Button>
  ),
});

type Guest = {
  _id: Id<"guests">;
  _creationTime: number;
  attending?: boolean;
  inviteSent: boolean;
  inviteViewed: boolean;
  name: string;
  lastName?: string;
  email: string;
  secondaryEmail?: string;
  slug: string;
  plusOne?: string;
  kids?: string;
};

interface GuestTableProps {
  guests: Guest[];
}

type RsvpFilter = "all" | "pending" | "yes" | "no";
type InviteFilter =
  | "all"
  | "sent"
  | "unsent"
  | "viewed"
  | "notViewed";

const RSVP_FILTER_LABELS: Record<RsvpFilter, string> = {
  all: "All",
  pending: "Pending",
  yes: "RSVP yes",
  no: "RSVP no",
};

const INVITE_FILTER_LABELS: Record<InviteFilter, string> = {
  all: "All",
  sent: "Invite sent",
  unsent: "Invite not sent",
  viewed: "Invite viewed",
  notViewed: "Invite not viewed",
};

type FilterTriggerProps = {
  label: string;
  activeValue: string | null;
  onClear: () => void;
} & React.ComponentPropsWithoutRef<"button">;

const FilterTrigger = forwardRef<HTMLButtonElement, FilterTriggerProps>(
  ({ label, activeValue, onClear, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-9 gap-2 rounded-full border-stone-200 bg-white/90 pr-2 text-stone-700 shadow-sm hover:border-stone-300 hover:bg-white",
          className,
        )}
        {...props}
      >
        <span className="truncate">
          {activeValue ? `${label}: ${activeValue}` : label}
        </span>
        <span className="ml-1 inline-flex items-center gap-1.5 text-stone-500">
          {activeValue ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={`Clear ${label.toLowerCase()} filter`}
              className="rounded-full p-0.5 transition-colors hover:bg-stone-100 hover:text-stone-900"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onClear();
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                event.stopPropagation();
                onClear();
              }}
            >
              <X className="h-3 w-3" />
            </span>
          ) : null}
          <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </button>
    );
  },
);

FilterTrigger.displayName = "FilterTrigger";

function RsvpBadge({ attending }: { attending?: boolean }) {
  const label =
    attending === true ? "Yes" : attending === false ? "No" : "Pending";

  const className =
    attending === true
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : attending === false
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}

function InviteBadge({ inviteSent }: { inviteSent: boolean }) {
  if (!inviteSent) {
    return <span className="text-stone-400">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
        "border-stone-200 bg-stone-100 text-stone-700",
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", "bg-emerald-500")}
      />
      Sent
    </span>
  );
}

function InviteViewedBadge({ inviteViewed }: { inviteViewed: boolean }) {
  if (!inviteViewed) {
    return <span className="text-stone-400">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
        "border-sky-200 bg-sky-50 text-sky-700",
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", "bg-sky-500")}
      />
      Viewed
    </span>
  );
}

export function GuestTable({ guests }: GuestTableProps) {
  const token = useAuthToken();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedGuests, setSelectedGuests] = useState<Array<Id<"guests">>>([]);
  const [mounted, setMounted] = useState(false);
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>("all");
  const [inviteFilter, setInviteFilter] = useState<InviteFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedGuestId, setCopiedGuestId] = useState<Id<"guests"> | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<{
    id: Id<"guests">;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<Guest | null>(null);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [guestToResend, setGuestToResend] = useState<Guest | null>(null);
  const [auditSheetOpen, setAuditSheetOpen] = useState(false);
  const [guestForAudit, setGuestForAudit] = useState<{
    _id: Id<"guests">;
    name: string;
  } | null>(null);
  const [sendingInviteGuestId, setSendingInviteGuestId] =
    useState<Id<"guests"> | null>(null);
  const [activeTab, setActiveTab] = useState<"guests" | "import">("guests");
  const copiedResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteGuest = useMutation(api.guests.deleteGuest);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (copiedResetTimeout.current) {
        clearTimeout(copiedResetTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "f" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      const searchInput = searchInputRef.current;
      if (!searchInput) return;

      if (document.activeElement === searchInput) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement)
      ) {
        return;
      }

      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleDeleteClick = (id: Id<"guests">, name: string) => {
    setGuestToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (guest: Guest) => {
    setGuestToEdit(guest);
    setEditSheetOpen(true);
  };

  const handleAuditLogClick = (guest: Guest) => {
    setGuestForAudit({ _id: guest._id, name: guest.name });
    setAuditSheetOpen(true);
  };

  const handleResendDialogOpenChange = (open: boolean) => {
    setResendDialogOpen(open);
    if (!open) {
      setGuestToResend(null);
    }
  };

  const confirmDelete = async () => {
    if (!guestToDelete) return;
    const deletedGuestName = guestToDelete.name;
    try {
      setIsDeleting(true);
      await deleteGuest({ token, guestId: guestToDelete.id });
      setSelectedGuests((prev) => prev.filter((id) => id !== guestToDelete.id));
      setDeleteDialogOpen(false);
      setGuestToDelete(null);
      toast.success(`${deletedGuestName} was deleted.`);
    } catch (error) {
      console.error("Failed to delete guest:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete guest",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredGuests = guests.filter((guest) => {
    const matchesRsvp =
      rsvpFilter === "all"
        ? true
        : rsvpFilter === "pending"
          ? guest.attending === undefined
          : rsvpFilter === "yes"
            ? guest.attending === true
            : guest.attending === false;

    const matchesInvite =
      inviteFilter === "all"
        ? true
        : inviteFilter === "sent"
          ? guest.inviteSent
          : inviteFilter === "unsent"
            ? !guest.inviteSent
            : inviteFilter === "viewed"
              ? guest.inviteViewed
              : !guest.inviteViewed;

    const fullName = [guest.name, guest.lastName]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(" ");
    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      [
        guest.name,
        guest.lastName ?? "",
        fullName,
        guest.email,
        guest.slug,
        guest.plusOne ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedSearchQuery));

    return matchesRsvp && matchesInvite && matchesSearch;
  });

  const hasActiveFilters =
    rsvpFilter !== "all" ||
    inviteFilter !== "all" ||
    normalizedSearchQuery.length > 0;
  const totalHeadcount = guests.reduce(
    (sum, guest) => sum + getGuestHouseholdSize(guest),
    0,
  );
  const filteredHeadcount = filteredGuests.reduce(
    (sum, guest) => sum + getGuestHouseholdSize(guest),
    0,
  );
  const confirmedHeadcount = guests
    .filter((guest) => guest.attending === true)
    .reduce((sum, guest) => sum + getGuestHouseholdSize(guest), 0);
  const filteredConfirmedHeadcount = filteredGuests
    .filter((guest) => guest.attending === true)
    .reduce((sum, guest) => sum + getGuestHouseholdSize(guest), 0);

  const isAllSelected =
    filteredGuests.length > 0 &&
    filteredGuests.every((guest) => selectedGuests.includes(guest._id));
  const isSomeSelected =
    filteredGuests.some((guest) => selectedGuests.includes(guest._id)) &&
    !isAllSelected;

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedGuests((prev) =>
        prev.filter((id) => !filteredGuests.some((guest) => guest._id === id)),
      );
    } else {
      setSelectedGuests((prev) => {
        const next = new Set(prev);
        filteredGuests.forEach((guest) => next.add(guest._id));
        return Array.from(next);
      });
    }
  };

  const toggleGuest = (id: Id<"guests">) => {
    setSelectedGuests((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id],
    );
  };

  const handleCopyGuestUrl = async (slug: string, guestId: Id<"guests">) => {
    const normalizedSlug = slug.replace(/^\/+/, "");
    const guestUrl = `${window.location.origin}/${normalizedSlug}`;

    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopiedGuestId(guestId);

      if (copiedResetTimeout.current) {
        clearTimeout(copiedResetTimeout.current);
      }

      copiedResetTimeout.current = setTimeout(() => {
        setCopiedGuestId(null);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy guest URL:", error);
    }
  };

  const getDashboardGuestName = (guest: Guest) =>
    guest.lastName?.trim() ? `${guest.name} ${guest.lastName.trim()}` : guest.name;

  const sendInvite = async (guest: Guest) => {
    if (sendingInviteGuestId) return;

    const toastId = `send-invite-${guest._id}`;

    try {
      setSendingInviteGuestId(guest._id);
      toast.loading(`Sending invite to ${guest.name}...`, {
        id: toastId,
      });
      const normalizedSlug = guest.slug.replace(/^\/+/, "");
      const buttonLink = `${window.location.origin}/${normalizedSlug}`;

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestId: guest._id,
          name: guest.name,
          email: guest.email,
          secondaryEmail: guest.secondaryEmail,
          slug: guest.slug,
          plusOne: guest.plusOne,
          kids: guest.kids,
          buttonLink,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Failed to send invite");
      }

      toast.success(`Invite sent to ${guest.name}.`, {
        id: toastId,
      });
    } catch (error) {
      console.error("Failed to send invite:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send invite",
        {
          id: toastId,
        },
      );
    } finally {
      setSendingInviteGuestId(null);
    }
  };

  const handleSendInvite = (guest: Guest) => {
    if (sendingInviteGuestId) return;

    if (guest.inviteSent) {
      setGuestToResend(guest);
      setResendDialogOpen(true);
      return;
    }

    void sendInvite(guest);
  };

  const confirmResendInvite = () => {
    if (!guestToResend) return;

    const guest = guestToResend;
    setResendDialogOpen(false);
    setGuestToResend(null);
    void sendInvite(guest);
  };

  const getFilterCount = (
    filterType: "rsvp" | "invite",
    value: string,
  ) =>
    guests.filter((guest) => {
      if (filterType === "rsvp") {
        if (value === "all") return true;
        if (value === "pending") return guest.attending === undefined;
        if (value === "yes") return guest.attending === true;
        return guest.attending === false;
      }

      if (filterType === "invite") {
        if (value === "all") return true;
        if (value === "sent") return guest.inviteSent;
        if (value === "unsent") return !guest.inviteSent;
        if (value === "viewed") return guest.inviteViewed;
        return !guest.inviteViewed;
      }
    }).length;

  const activeRsvpLabel =
    rsvpFilter === "all" ? null : RSVP_FILTER_LABELS[rsvpFilter];
  const activeInviteLabel =
    inviteFilter === "all" ? null : INVITE_FILTER_LABELS[inviteFilter];
  const clearFilters = () => {
    setRsvpFilter("all");
    setInviteFilter("all");
    setSearchQuery("");
  };

  return (
    <>
      <Card className="overflow-hidden border-stone-200/80 bg-white/88 shadow-[0_20px_70px_rgba(24,24,27,0.07)] backdrop-blur-sm">
        <CardHeader className="border-b border-stone-100/90 bg-stone-50/70 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-stone-500">
                Guest Management
              </p>
              <div>
                <CardTitle className="text-2xl tracking-tight text-stone-950">
                  Guest List
                </CardTitle>
                <CardDescription className="mt-1 text-sm leading-6 text-stone-600">
                  Manage your wedding guests and their RSVPs.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start">
              {selectedGuests.length > 0 ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  {selectedGuests.length} selected
                </div>
              ) : null}
              <div className="[&>button]:border-stone-900 [&>button]:bg-stone-950 [&>button]:text-white [&>button]:shadow-sm [&>button]:hover:bg-stone-800">
                <AddGuestSheet />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
              <Users className="h-3.5 w-3.5" />
              Workspace
            </div>
            <div className="inline-flex w-full flex-col rounded-2xl border border-stone-200 bg-stone-50 p-1.5 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => setActiveTab("guests")}
                className={cn(
                  "flex min-w-[11rem] items-start gap-3 rounded-xl px-4 py-3 text-left transition-all",
                  activeTab === "guests"
                    ? "bg-white text-stone-950 shadow-sm"
                    : "text-stone-600 hover:bg-white/80 hover:text-stone-900",
                )}
              >
                <Users
                  className={cn(
                    "mt-0.5 h-4 w-4",
                    activeTab === "guests" ? "text-stone-950" : "text-stone-500",
                  )}
                />
                <span className="space-y-0.5">
                  <span className="block text-sm font-semibold">Guest table</span>
                  <span className="block text-xs text-stone-500">
                    Review status, guests, and invite progress
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("import")}
                className={cn(
                  "flex min-w-[11rem] items-start gap-3 rounded-xl px-4 py-3 text-left transition-all",
                  activeTab === "import"
                    ? "bg-white text-stone-950 shadow-sm"
                    : "text-stone-600 hover:bg-white/80 hover:text-stone-900",
                )}
              >
                <FileUp
                  className={cn(
                    "mt-0.5 h-4 w-4",
                    activeTab === "import" ? "text-stone-950" : "text-stone-500",
                  )}
                />
                <span className="space-y-0.5">
                  <span className="block text-sm font-semibold">Bulk import CSV</span>
                  <span className="block text-xs text-stone-500">
                    Bring in guests from a spreadsheet
                  </span>
                </span>
              </button>
            </div>
          </div>

          {activeTab === "guests" ? (
            <>
              <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                      <ListFilter className="h-3.5 w-3.5" />
                      Refine List
                    </div>
                    <div className="space-y-1 text-sm text-stone-600">
                      <p>
                        Showing {filteredGuests.length} of {guests.length} guest
                        records.
                      </p>
                      <p>
                        Headcount: {filteredHeadcount} of {totalHeadcount} people.
                        Confirmed attending:{" "}
                        {hasActiveFilters
                          ? filteredConfirmedHeadcount
                          : confirmedHeadcount}{" "}
                        people.
                      </p>
                    </div>
                  </div>
                  {hasActiveFilters ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-9 rounded-full px-3 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={hasActiveFilters ? "outline" : "default"}
                      className={cn(
                        "h-9 rounded-full px-4 shadow-sm",
                        hasActiveFilters
                          ? "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-white"
                          : "bg-stone-950 text-white hover:bg-stone-800",
                      )}
                      onClick={clearFilters}
                    >
                      All guests ({guests.length})
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <FilterTrigger
                          label="RSVP"
                          activeValue={activeRsvpLabel}
                          onClear={() => setRsvpFilter("all")}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-52">
                        <DropdownMenuLabel>RSVP status</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={rsvpFilter}
                          onValueChange={(value) =>
                            setRsvpFilter(value as RsvpFilter)
                          }
                        >
                          {(Object.keys(RSVP_FILTER_LABELS) as RsvpFilter[]).map(
                            (filter) => (
                              <DropdownMenuRadioItem key={filter} value={filter}>
                                {RSVP_FILTER_LABELS[filter]} (
                                {getFilterCount("rsvp", filter)})
                              </DropdownMenuRadioItem>
                            ),
                          )}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <FilterTrigger
                          label="Invite"
                          activeValue={activeInviteLabel}
                          onClear={() => setInviteFilter("all")}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-52">
                        <DropdownMenuLabel>Invite status</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={inviteFilter}
                          onValueChange={(value) =>
                            setInviteFilter(value as InviteFilter)
                          }
                        >
                          {(Object.keys(INVITE_FILTER_LABELS) as InviteFilter[]).map(
                            (filter) => (
                              <DropdownMenuRadioItem key={filter} value={filter}>
                                {INVITE_FILTER_LABELS[filter]} (
                                {getFilterCount("invite", filter)})
                              </DropdownMenuRadioItem>
                            ),
                          )}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:max-w-md">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <Input
                        ref={searchInputRef}
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search name, last name, email, slug, plus one"
                        aria-label="Search guest records"
                        className="h-10 rounded-full border-stone-200 bg-white pl-9 text-sm text-stone-700 placeholder:text-stone-400 focus-visible:border-stone-300 focus-visible:ring-stone-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_12px_36px_rgba(24,24,27,0.05)]">
                <div className="border-b border-stone-100 bg-stone-50/70 px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">
                        Guest records
                      </p>
                      <p className="text-xs text-stone-500">
                        Invite state, response tracking, and guest details.
                      </p>
                    </div>
                    {selectedGuests.length > 0 ? (
                      <Button
                        size="sm"
                        className="rounded-full bg-stone-950 px-4 text-white hover:bg-stone-800"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email Invite
                      </Button>
                    ) : null}
                  </div>
                </div>

                <Table>
                  <TableHeader className="[&_tr]:border-stone-100">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12.5 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        <Checkbox
                          checked={
                            isAllSelected || (isSomeSelected && "indeterminate")
                          }
                          onCheckedChange={toggleAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Name
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Email
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        RSVP
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Invite Viewed
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Invite Sent
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Plus One
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Kids
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Slug
                      </TableHead>
                      <TableHead className="w-12.5 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_tr:last-child]:border-b-0">
                    {filteredGuests.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={10}
                          className="py-16 text-center text-stone-500"
                        >
                          No guests match the current search and filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGuests.map((guest) => (
                        <TableRow
                          key={guest._id}
                          className="border-stone-100 hover:bg-stone-50/70"
                          data-state={
                            selectedGuests.includes(guest._id)
                              ? "selected"
                              : undefined
                          }
                        >
                          <TableCell className="px-4">
                            <Checkbox
                              checked={selectedGuests.includes(guest._id)}
                              onCheckedChange={() => toggleGuest(guest._id)}
                              aria-label={`Select ${guest.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-stone-900">
                            {getDashboardGuestName(guest)}
                          </TableCell>
                          <TableCell className="text-stone-700">
                            {guest.email}
                          </TableCell>
                          <TableCell>
                            <RsvpBadge attending={guest.attending} />
                          </TableCell>
                          <TableCell>
                            <InviteViewedBadge inviteViewed={guest.inviteViewed} />
                          </TableCell>
                          <TableCell>
                            <InviteBadge inviteSent={guest.inviteSent} />
                          </TableCell>
                          <TableCell className="text-stone-700">
                            {guest.plusOne?.trim() || (
                              <span className="text-stone-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-stone-700">
                            {guest.kids?.trim() || (
                              <span className="text-stone-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-stone-600">
                            <div className="flex items-center gap-1">
                              <span>{guest.slug}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                                onClick={() =>
                                  handleCopyGuestUrl(guest.slug, guest._id)
                                }
                                aria-label={
                                  copiedGuestId === guest._id
                                    ? `Copied link for ${guest.name}`
                                    : `Copy guest link for ${guest.name}`
                                }
                                title={
                                  copiedGuestId === guest._id
                                    ? "Copied"
                                    : "Copy guest link"
                                }
                                disabled={!mounted}
                              >
                                {copiedGuestId === guest._id ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                                <span className="sr-only">
                                  {copiedGuestId === guest._id
                                    ? "Copied guest link"
                                    : "Copy guest link"}
                                </span>
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {mounted ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full p-0 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                                  >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                  <DropdownMenuItem
                                    onClick={() => handleSendInvite(guest)}
                                    disabled={sendingInviteGuestId === guest._id}
                                  >
                                    {sendingInviteGuestId === guest._id
                                      ? "Sending invite..."
                                      : "Send invite"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditClick(guest)}
                                  >
                                    Edit guest
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAuditLogClick(guest)}
                                  >
                                    <ScrollText className="mr-2 h-4 w-4" />
                                    View log
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      handleDeleteClick(guest._id, guest.name)
                                    }
                                  >
                                    Delete guest
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <Button
                                variant="ghost"
                                className="h-8 w-8 rounded-full p-0"
                                disabled
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white/75 p-1 shadow-[0_12px_36px_rgba(24,24,27,0.05)]">
              <BulkGuestImport />
            </div>
          )}
        </CardContent>
      </Card>

      <ResendInviteDialog
        open={resendDialogOpen && mounted}
        onOpenChange={handleResendDialogOpenChange}
        guestName={guestToResend?.name}
        isSending={Boolean(sendingInviteGuestId)}
        onConfirm={confirmResendInvite}
      />

      <DeleteGuestDialog
        open={deleteDialogOpen && mounted}
        onOpenChange={setDeleteDialogOpen}
        guestName={guestToDelete?.name}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
      />

      <EditGuestSheet
        open={editSheetOpen && mounted}
        onOpenChange={setEditSheetOpen}
        guest={guestToEdit}
      />

      <GuestAuditSheet
        open={auditSheetOpen && mounted}
        onOpenChange={setAuditSheetOpen}
        guest={guestForAudit}
        token={token}
      />
    </>
  );
}
