import { useEffect, useRef, useState } from "react";
import {
  AlertIcon,
  CheckIcon,
  DownloadIcon,
  UploadIcon,
  XIcon,
} from "./Icon";

const formatSize = (bytes) =>
  bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

/**
 * Reusable CSV bulk-import modal (admin).
 *
 * Props:
 *  - onSubmit(async formData) → backend ka summary object; failure par throw kare
 *  - extraFields → file-picker ke neeche extra controls (e.g. category dropdown)
 *  - onDownloadSample() → sample CSV client-side download
 *  - isSubmitDisabled / submitDisabledReason → e.g. category select zaroori ho
 */
export default function BulkUploadModal({
  isOpen,
  onClose,
  title,
  subtitle,
  uploadHint,
  onDownloadSample,
  onSubmit,
  extraFields = null,
  isSubmitDisabled = false,
  submitDisabledReason = "",
}) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Modal band hone par state reset — React ka recommended
  // "adjust state during render" pattern (effect-setState se bachne ke liye)
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (!isOpen) {
      setFile(null);
      setSubmitting(false);
      setError("");
      setResult(null);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, submitting]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!file) {
      setError("Please choose a .csv file first.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const summary = await onSubmit(formData);
      setResult(summary);
    } catch (e) {
      setError(e?.message || "Upload failed — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForAnother = () => {
    setResult(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const ok =
    result &&
    Number(result.invalidRowCount || 0) === 0 &&
    Number(result.skippedDuplicates || 0) === 0;

  return (
    <div className="modal-backdrop" onClick={submitting ? undefined : onClose}>
      <div
        className="modal-panel max-w-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="drawer-header">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-8 h-8 shrink-0 rounded-(--radius) bg-(--brand-soft) text-(--brand) flex items-center justify-center">
              <UploadIcon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="drawer-title">{title}</h3>
              <p className="drawer-subtitle">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn icon-btn-ghost"
            aria-label="Close"
            disabled={submitting}
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body admin-scroll">
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 mb-3 rounded-(--radius) bg-red-50 border border-red-200">
              <AlertIcon className="w-4 h-4 text-(--danger) shrink-0 mt-px" />
              <p className="text-[12.5px] text-red-700">{error}</p>
            </div>
          )}

          {result ? (
            <BulkUploadResult
              result={result}
              ok={ok}
              onImportAnother={resetForAnother}
              onClose={onClose}
            />
          ) : (
            <BulkUploadForm
              file={file}
              onPick={() => inputRef.current?.click()}
              onRemove={() => setFile(null)}
              submitting={submitting}
              onCancel={onClose}
              onSubmit={handleSubmit}
              uploadHint={uploadHint}
              onDownloadSample={onDownloadSample}
              extraFields={extraFields}
              isSubmitDisabled={isSubmitDisabled}
              submitDisabledReason={submitDisabledReason}
            />
          )}

          {/* Hidden real input */}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setError("");
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Result view ---------- */
function BulkUploadResult({ result, ok, onImportAnother, onClose }) {
  const issues = [
    ...(result.invalidRows || []),
    ...(result.duplicates || []),
  ];
  return (
    <div>
      <div
        className={`mb-3 rounded-xl border px-4 py-3 text-sm ${
          ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <b>{result.insertedCount}</b> of <b>{result.totalRows}</b> rows
        imported successfully.
        {(Number(result.skippedDuplicates) > 0 ||
          Number(result.invalidRowCount) > 0) && (
          <span className="block mt-0.5 text-xs">
            {Number(result.skippedDuplicates) > 0 &&
              `${result.skippedDuplicates} duplicate(s) skipped`}
            {Number(result.skippedDuplicates) > 0 &&
              Number(result.invalidRowCount) > 0 &&
              " · "}
            {Number(result.invalidRowCount) > 0 &&
              `${result.invalidRowCount} invalid row(s)`}
          </span>
        )}
      </div>

      {issues.length > 0 && (
        <ul className="flex flex-col gap-1.5 mb-3 max-h-52 overflow-y-auto admin-scroll pr-1">
          {issues.map((r, i) => (
            <li
              key={`${r.row}-${i}`}
              className="flex items-start gap-2 rounded-lg border border-(--border) bg-white px-3 py-2 text-[12.5px]"
            >
              <XIcon className="mt-0.5 w-3.5 h-3.5 shrink-0 text-red-500" />
              <span className="min-w-0">
                <b>Row {r.row}</b>
                {r.name ? ` — ${r.name}` : ""}
                <span className="block text-xs text-red-600">{r.error}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button className="btn btn-secondary" onClick={onImportAnother}>
          Import another file
        </button>
        <button className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

/* ---------- Form view ---------- */
function BulkUploadForm({
  file,
  onPick,
  onRemove,
  submitting,
  onCancel,
  onSubmit,
  uploadHint,
  onDownloadSample,
  extraFields,
  isSubmitDisabled,
  submitDisabledReason,
}) {
  return (
    <div className="space-y-3">
      {uploadHint && (
        <div className="rounded-(--radius) bg-(--brand-soft) px-3 py-2.5 text-[12px] leading-relaxed text-(--ink-soft)">
          {uploadHint}
        </div>
      )}

      {onDownloadSample && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onDownloadSample}
        >
          <DownloadIcon className="w-3.5 h-3.5" />
          Download sample CSV
        </button>
      )}

      {!file ? (
        <button
          type="button"
          onClick={onPick}
          className="w-full flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-(--border-strong) px-4 py-7 text-center hover:bg-(--bg-raised) transition-colors"
        >
          <UploadIcon className="w-5 h-5 text-(--brand)" />
          <span className="text-sm font-semibold text-(--ink)">
            Click to choose a CSV file
          </span>
          <span className="text-[11.5px] text-(--ink-muted)">
            Max 2 MB · hundreds of rows supported
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl border border-(--border) bg-white px-3 py-2.5">
          <CheckIcon className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-(--ink)">
            {file.name}
          </span>
          <span className="shrink-0 text-[11px] text-(--ink-muted)">
            {formatSize(file.size)}
          </span>
          <button
            type="button"
            className="icon-btn icon-btn-ghost w-6! h-6!"
            aria-label="Remove file"
            onClick={onRemove}
            disabled={submitting}
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {extraFields}

      <div className="flex justify-end gap-2 pt-1">
        <button className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={!file || submitting || isSubmitDisabled}
          title={isSubmitDisabled ? submitDisabledReason : undefined}
        >
          {submitting ? (
            <>
              <span className="spinner spinner-sm" /> Importing…
            </>
          ) : (
            <>
              <UploadIcon className="w-4 h-4" /> Import
            </>
          )}
        </button>
      </div>
    </div>
  );
}