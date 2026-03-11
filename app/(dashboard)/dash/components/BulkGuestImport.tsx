"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuthToken } from "../hooks/useAuthToken";

type ParsedGuest = {
  name: string;
  slug: string;
  email: string;
  plusOne?: string;
  kids?: string;
};

type ImportIssue = {
  rowNumber: number;
  name: string;
  message: string;
};

const REQUIRED_COLUMNS = ["name", "plus one", "kids", "slug", "email"] as const;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function parseGuestCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("CSV file is empty.");
  }

  const headerRow = parseCsvLine(lines[0]).map((column) =>
    column.trim().toLowerCase(),
  );

  const hasRequiredColumns =
    headerRow.length === REQUIRED_COLUMNS.length &&
    REQUIRED_COLUMNS.every((column) => headerRow.includes(column));

  if (!hasRequiredColumns) {
    throw new Error(
      `CSV must include exactly these columns: ${REQUIRED_COLUMNS.join(", ")}.`,
    );
  }

  const indexMap = new Map(headerRow.map((column, index) => [column, index]));

  const guests: ParsedGuest[] = [];
  const issues: ImportIssue[] = [];
  const seenEmails = new Set<string>();
  const seenSlugs = new Set<string>();

  lines.slice(1).forEach((line, rowIndex) => {
    const values = parseCsvLine(line);
    const name = values[indexMap.get("name") ?? -1]?.trim();
    const slug = values[indexMap.get("slug") ?? -1]?.trim();
    const email = values[indexMap.get("email") ?? -1]?.trim().toLowerCase();
    const plusOneValue = values[indexMap.get("plus one") ?? -1]?.trim();
    const kidsValue = values[indexMap.get("kids") ?? -1]?.trim();
    const rowNumber = rowIndex + 2;
    const label = name || email || slug || `Row ${rowNumber}`;

    if (!name) {
      issues.push({ rowNumber, name: label, message: "Missing guest name." });
      return;
    }

    if (!slug) {
      issues.push({ rowNumber, name, message: "Missing slug." });
      return;
    }

    if (!email) {
      issues.push({ rowNumber, name, message: "Missing email address." });
      return;
    }

    if (seenEmails.has(email)) {
      issues.push({
        rowNumber,
        name,
        message: "Duplicate email in this CSV.",
      });
      return;
    }

    if (seenSlugs.has(slug)) {
      issues.push({
        rowNumber,
        name,
        message: "Duplicate slug in this CSV.",
      });
      return;
    }

    seenEmails.add(email);
    seenSlugs.add(slug);

    guests.push({
      name,
      slug,
      email,
      plusOne: plusOneValue || undefined,
      kids: kidsValue || undefined,
    });
  });

  return {
    guests,
    issues,
    totalRows: lines.length - 1,
  };
}

export function BulkGuestImport() {
  const token = useAuthToken();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bulkImportGuests = useMutation(api.guests.bulkImportGuests);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedGuests, setParsedGuests] = useState<ParsedGuest[]>([]);
  const [importIssues, setImportIssues] = useState<ImportIssue[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [sourceRowCount, setSourceRowCount] = useState(0);
  const [importSummary, setImportSummary] = useState<{
    importedCount: number;
    skippedExistingEmailCount: number;
    skippedDuplicateFileEmailCount: number;
    skippedDuplicateSlugCount: number;
    skippedInvalidCount: number;
    totalRows: number;
  } | null>(null);

  const hasGuests = parsedGuests.length > 0;

  const resetFileState = () => {
    setFileName(null);
    setParsedGuests([]);
    setImportIssues([]);
    setImportSummary(null);
    setUploadProgress(0);
    setImportProgress(0);
    setSourceRowCount(0);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file.");
      return;
    }

    setIsParsing(true);
    setImportSummary(null);
    setFileName(file.name);
    setUploadProgress(0);
    setImportProgress(0);
    setImportIssues([]);
    setSourceRowCount(0);

    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        };
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Failed to read CSV file."));
        reader.readAsText(file);
      });

      setUploadProgress(100);
      const result = parseGuestCsv(text);
      setParsedGuests(result.guests);
      setImportIssues(result.issues);
      setSourceRowCount(result.totalRows);
      if (result.issues.length > 0) {
        toast.success(
          `CSV ready: ${result.guests.length} valid row(s), ${result.issues.length} issue(s) skipped.`,
        );
      } else {
        toast.success(`CSV ready: ${result.guests.length} row(s) parsed.`);
      }
    } catch (error) {
      console.error("Failed to parse CSV:", error);
      setParsedGuests([]);
      setImportIssues([]);
      setSourceRowCount(0);
      toast.error(error instanceof Error ? error.message : "Failed to parse CSV file.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!hasGuests || isImporting) return;

    setIsImporting(true);
    setImportSummary(null);
    setImportProgress(0);

    const chunkSize = 50;
    let summary = {
      importedCount: 0,
      skippedExistingEmailCount: 0,
      skippedDuplicateFileEmailCount: 0,
      skippedDuplicateSlugCount: 0,
      skippedInvalidCount: 0,
      totalRows: sourceRowCount,
    };

    try {
      for (let start = 0; start < parsedGuests.length; start += chunkSize) {
        const batch = parsedGuests.slice(start, start + chunkSize);
        const result = await bulkImportGuests({ token, guests: batch });

        summary = {
          importedCount: summary.importedCount + result.importedCount,
          skippedExistingEmailCount:
            summary.skippedExistingEmailCount + result.skippedExistingEmailCount,
          skippedDuplicateFileEmailCount:
            summary.skippedDuplicateFileEmailCount + result.skippedDuplicateFileEmailCount,
          skippedDuplicateSlugCount:
            summary.skippedDuplicateSlugCount + result.skippedDuplicateSlugCount,
          skippedInvalidCount: summary.skippedInvalidCount + result.skippedInvalidCount,
          totalRows: summary.totalRows,
        };

        const processed = Math.min(start + chunkSize, parsedGuests.length);
        setImportProgress(Math.round((processed / parsedGuests.length) * 100));
      }

      setImportSummary(summary);
      toast.success(`Import complete. Added ${summary.importedCount} guest(s).`);
    } catch (error) {
      console.error("Failed to import guests:", error);
      toast.error(error instanceof Error ? error.message : "Failed to import guests.");
    } finally {
      setIsImporting(false);
    }
  };

  const summaryItems = useMemo(() => {
    if (!importSummary) return [];

    return [
      { label: "Imported", value: importSummary.importedCount },
      {
        label: "Skipped (existing email in DB)",
        value: importSummary.skippedExistingEmailCount,
      },
      {
        label: "Skipped (duplicate email in CSV)",
        value: importSummary.skippedDuplicateFileEmailCount,
      },
      {
        label: "Skipped (duplicate slug)",
        value: importSummary.skippedDuplicateSlugCount,
      },
      { label: "Skipped (invalid row)", value: importSummary.skippedInvalidCount },
      { label: "Total rows", value: importSummary.totalRows },
    ];
  }, [importSummary]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Import Guests</CardTitle>
        <CardDescription>
          Upload a CSV with these columns: name, plus one, kids, slug, email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) {
              void processFile(file);
            }
          }}
          className={cn(
            "border-muted-foreground/30 bg-muted/20 hover:bg-muted/30 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition",
            isDragging && "border-primary bg-primary/5",
          )}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="text-muted-foreground mb-3 h-8 w-8" />
          <p className="font-medium">Drag and drop your CSV here</p>
          <p className="text-muted-foreground text-sm">or click to browse files</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void processFile(file);
              }
            }}
          />
        </div>

        {(isParsing || fileName) && (
          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="font-medium">{fileName ?? "Reading file..."}</span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-2 text-xs">Upload progress: {uploadProgress}%</p>
          </div>
        )}

        {hasGuests && (
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Ready to import {parsedGuests.length} valid row(s)
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={resetFileState} disabled={isImporting}>
                  Clear
                </Button>
                <Button type="button" onClick={handleImport} disabled={isImporting || isParsing}>
                  {isImporting ? "Importing..." : "Start import"}
                </Button>
              </div>
            </div>
            {sourceRowCount > parsedGuests.length ? (
              <p className="text-muted-foreground text-xs">
                {sourceRowCount - parsedGuests.length} row(s) will be skipped. See issues below.
              </p>
            ) : null}
            <div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-2 text-xs">Import progress: {importProgress}%</p>
            </div>
          </div>
        )}

        {importIssues.length > 0 && (
          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold">Rows with issues</p>
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto text-xs">
              {importIssues.map((issue) => (
                <p key={`${issue.rowNumber}-${issue.name}`} className="text-muted-foreground">
                  Row {issue.rowNumber} - {issue.name}: {issue.message}
                </p>
              ))}
            </div>
          </div>
        )}

        {importSummary && (
          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold">Import summary</p>
            </div>
            <ul className="space-y-1 text-sm">
              {summaryItems.map((item) => (
                <li key={item.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-3 flex items-center gap-1 text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              Existing guest records are never overwritten when an email already exists.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
