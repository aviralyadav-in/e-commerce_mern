import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInquiries,
  createInquiry,
  updateInquiryStatus,
  deleteInquiry,
} from "../features/inquiries/inquiriesSlice";
import { exportAllInquiriesToExcel } from "../utils/exportProductToExcel";
import useTableControls from "../hooks/useTableControls";

import PageHeader from "../components/common/PageHeader";
import SearchInput from "../components/common/SearchInput";
import SegmentedFilter from "../components/common/SegmentedFilter";
import SortableTh from "../components/common/SortableTh";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import Drawer from "../components/common/Drawer";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { Field } from "../components/common/Field";
import { notifySuccess, notifyError } from "../lib/toast";
import {
  MessageSquareIcon,
  WhatsAppIcon,
  MailIcon,
  PhoneIcon,
  TrashIcon,
  CheckIcon,
  EyeIcon,
  XIcon,
  RefreshIcon,
  DownloadIcon,
  InfoIcon,
  PlusIcon,
  CopyIcon,
} from "../components/common/Icon";

const InquiriesPage = () => {
  const dispatch = useDispatch();
  const { inquiries, counts, loading, error } = useSelector(
    (state) => state.inquiries,
  );

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem("niya_inquiries_guide_dismissed") !== "true";
  });

  // Active Detail / Status Edit Modal State
  const [activeModalInquiry, setActiveModalInquiry] = useState(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalStatus, setModalStatus] = useState("New");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Confirmation Dialog State
  const [deleteTarget, setDeleteTarget] = useState(null);

  // New Inquiry Drawer State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [createStatus, setCreateStatus] = useState("New");
  const [createAdminNotes, setCreateAdminNotes] = useState("");
  const [createErrors, setCreateErrors] = useState({});
  const [createTouched, setCreateTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    dispatch(fetchInquiries());
  }, [dispatch]);

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem("niya_inquiries_guide_dismissed", "true");
  };

  const cleanPhone = (phone) => {
    if (!phone) return "";
    let p = String(phone).replace(/\D/g, "");
    if (p.startsWith("91") && p.length === 12) p = p.slice(2);
    else if (p.startsWith("0") && p.length === 11) p = p.slice(1);
    return p;
  };

  const getWhatsAppUrl = (inquiry) => {
    const raw = cleanPhone(inquiry.phone);
    const num = `91${raw}`;
    const text = encodeURIComponent(
      `Hello ${inquiry.name}, thank you for contacting Niya Bags regarding "${inquiry.subject}". How can we help you today?`,
    );
    return `https://wa.me/${num}?text=${text}`;
  };

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    notifySuccess(`${label} copied to clipboard`, text);
  };

  // Filtered dataset before table controls
  const filteredInquiries = useMemo(() => {
    return (inquiries || []).filter((inq) => {
      // Status filter
      if (statusFilter && inq.status !== statusFilter) return false;

      // Search query (checks Name, Email, Phone, Subject, Message, and Inquiry ID)
      if (!debouncedSearch) return true;
      const name = String(inq.name || "").toLowerCase();
      const email = String(inq.email || "").toLowerCase();
      const phone = String(inq.phone || "").toLowerCase();
      const subject = String(inq.subject || "").toLowerCase();
      const message = String(inq.message || "").toLowerCase();
      const id = String(inq._id || "").toLowerCase();
      return (
        name.includes(debouncedSearch) ||
        email.includes(debouncedSearch) ||
        phone.includes(debouncedSearch) ||
        subject.includes(debouncedSearch) ||
        message.includes(debouncedSearch) ||
        id.includes(debouncedSearch)
      );
    });
  }, [inquiries, debouncedSearch, statusFilter]);

  // Standard table controls with sorting and pagination
  const table = useTableControls(filteredInquiries, {
    accessors: {
      customer: (i) => i.name || "",
      subject: (i) => i.subject || "",
      status: (i) => i.status || "New",
      date: (i) => new Date(i.createdAt).getTime(),
    },
    initialSort: { key: "date", dir: "desc" },
    pageSize: 10,
  });

  const openDetailModal = (inq) => {
    setActiveModalInquiry(inq);
    setModalNotes(inq.adminNotes || "");
    setModalStatus(inq.status || "New");
  };

  const handleModalSave = async () => {
    if (!activeModalInquiry) return;
    setIsUpdating(true);
    try {
      const res = await dispatch(
        updateInquiryStatus({
          id: activeModalInquiry._id,
          status: modalStatus,
          adminNotes: modalNotes,
        }),
      );
      if (updateInquiryStatus.fulfilled.match(res)) {
        notifySuccess(
          "Inquiry updated",
          `Ticket from "${activeModalInquiry.name}" marked as ${modalStatus}.`,
        );
        setActiveModalInquiry(null);
      } else {
        notifyError(
          "Update failed",
          res.payload || "Could not update inquiry status.",
        );
      }
    } catch {
      notifyError("Update error", "Something went wrong.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await dispatch(deleteInquiry(deleteTarget._id));
    if (deleteInquiry.fulfilled.match(res)) {
      notifySuccess("Inquiry deleted", `Ticket from "${deleteTarget.name}" deleted.`);
      if (activeModalInquiry?._id === deleteTarget._id) {
        setActiveModalInquiry(null);
      }
    } else {
      notifyError("Delete failed", res.payload || "Could not delete inquiry.");
    }
    setDeleteTarget(null);
  };

  const handleExport = () => {
    if (!filteredInquiries.length) {
      notifyError("Nothing to export", "No customer inquiries to export.");
      return;
    }
    exportAllInquiriesToExcel(filteredInquiries);
    notifySuccess("Export ready", "Inquiries exported to Excel successfully.");
  };

  // Validation for Create Inquiry Form
  const validateCreate = (fields = {}) => {
    const errs = {};
    const n = "name" in fields ? fields.name : createName;
    const e = "email" in fields ? fields.email : createEmail;
    const p = "phone" in fields ? fields.phone : createPhone;
    const s = "subject" in fields ? fields.subject : createSubject;
    const m = "message" in fields ? fields.message : createMessage;

    if (!n.trim()) errs.name = "Customer name is required.";
    else if (n.trim().length < 2)
      errs.name = "Name must be at least 2 characters.";

    if (!e.trim()) errs.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (p && p.trim()) {
      const cleaned = cleanPhone(p);
      if (!/^[6-9]\d{9}$/.test(cleaned)) {
        errs.phone = "Please enter a valid 10-digit Indian phone number.";
      }
    }

    if (!s.trim()) errs.subject = "Subject is required.";
    else if (s.trim().length < 3)
      errs.subject = "Subject must be at least 3 characters.";

    if (!m.trim()) errs.message = "Message is required.";
    else if (m.trim().length < 5)
      errs.message = "Message must be at least 5 characters.";

    return errs;
  };

  const resetCreateForm = () => {
    setCreateName("");
    setCreateEmail("");
    setCreatePhone("");
    setCreateSubject("");
    setCreateMessage("");
    setCreateStatus("New");
    setCreateAdminNotes("");
    setCreateErrors({});
    setCreateTouched({});
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateTouched({
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
    });
    const errs = validateCreate();
    setCreateErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: createName.trim(),
        email: createEmail.trim().toLowerCase(),
        phone: cleanPhone(createPhone),
        subject: createSubject.trim(),
        message: createMessage.trim(),
        status: createStatus,
        adminNotes: createAdminNotes.trim(),
      };

      const res = await dispatch(createInquiry(payload));
      if (createInquiry.fulfilled.match(res)) {
        notifySuccess(
          "Inquiry created",
          `Customer inquiry from "${payload.name}" logged successfully.`,
        );
        resetCreateForm();
        setIsCreateOpen(false);
      } else {
        notifyError(
          "Creation failed",
          res.payload || "Could not log customer inquiry.",
        );
      }
    } catch {
      notifyError("Creation error", "Something went wrong while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Inquiries"
        subtitle="Customer contact messages, wedding bulk requests, and support tickets with 1-click WhatsApp & Email replies."
        meta={
          <>
            <span className="meta-chip">
              <MessageSquareIcon className="w-3.5 h-3.5 text-(--brand)" />
              <b>{counts.total}</b> total inquiries
            </span>
            {counts.new > 0 && (
              <span className="meta-chip meta-chip-warning animate-pulse">
                <b>{counts.new}</b> awaiting reply
              </span>
            )}
            {counts.inProgress > 0 && (
              <span className="meta-chip meta-chip-info">
                <b>{counts.inProgress}</b> in discussion
              </span>
            )}
            {counts.resolved > 0 && (
              <span className="meta-chip meta-chip-success">
                <b>{counts.resolved}</b> resolved
              </span>
            )}
          </>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => dispatch(fetchInquiries())}
              disabled={loading}
              className="btn btn-secondary"
              title="Refresh customer inquiries"
            >
              <RefreshIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!filteredInquiries.length}
              className="btn btn-export"
              title="Export inquiries to Excel"
            >
              <DownloadIcon className="w-4 h-4" />
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setIsCreateOpen(true);
              }}
              className="btn btn-primary"
              title="Log new customer inquiry"
            >
              <PlusIcon className="w-4 h-4" />
              New Inquiry
            </button>
          </>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* 5-10 Second Non-Technical Admin CRM Guide Banner */}
      {showGuide && (
        <div className="mb-4 p-3.5 sm:p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-linear-to-r from-indigo-50/90 via-violet-50/70 to-slate-50/80 dark:from-indigo-950/40 dark:via-violet-950/20 dark:to-slate-900/40 shadow-xs relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <InfoIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold tracking-tight">
                  Customer Inquiries & Leads Guide
                </h3>
                <p className="text-[11.5px] text-indigo-700/80 dark:text-indigo-300/80 font-normal">
                  Manage website queries, bulk order requests, and customer responses:
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissGuide}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Dismiss guide"
              aria-label="Dismiss guide"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/40 text-[12px]">
            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">🆕</span>
              <div>
                <span className="font-semibold text-(--ink) block">New Customer Tickets</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Questions submitted on the storefront contact form appear here instantly.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">💬</span>
              <div>
                <span className="font-semibold text-(--ink) block">1-Click WhatsApp Reply</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Click the WhatsApp icon to open a personalized, pre-filled chat on phone or desktop.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">📝</span>
              <div>
                <span className="font-semibold text-(--ink) block">Internal Team Notes</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Save confidential notes regarding quotes, callbacks, or exchange status.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">✅</span>
              <div>
                <span className="font-semibold text-(--ink) block">Status Pipeline</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Track tickets through New → In Progress → Resolved to keep customers satisfied.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div
          onClick={() => setStatusFilter(null)}
          className={`admin-card p-3.5 cursor-pointer transition-all ${
            statusFilter === null
              ? "ring-2 ring-(--brand) border-(--brand) bg-(--brand-soft)"
              : "hover:border-(--border-strong)"
          }`}
        >
          <p className="text-[12px] font-medium text-(--ink-muted)">All Inquiries</p>
          <p className="text-2xl font-bold text-(--ink) mt-1">{counts.total}</p>
          <span className="text-[11px] text-(--ink-faint) mt-0.5 block">
            Click to view all
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("New")}
          className={`admin-card p-3.5 cursor-pointer transition-all ${
            statusFilter === "New"
              ? "ring-2 ring-blue-500 border-blue-500 bg-blue-500/10"
              : "hover:border-blue-300 dark:hover:border-blue-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium text-blue-600 dark:text-blue-400">
              Unanswered / New
            </p>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {counts.new}
          </p>
          <span className="text-[11px] text-(--ink-faint) mt-0.5 block">
            Awaiting first reply
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("In Progress")}
          className={`admin-card p-3.5 cursor-pointer transition-all ${
            statusFilter === "In Progress"
              ? "ring-2 ring-amber-500 border-amber-500 bg-amber-500/10"
              : "hover:border-amber-300 dark:hover:border-amber-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium text-amber-600 dark:text-amber-400">
              In Discussion
            </p>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {counts.inProgress}
          </p>
          <span className="text-[11px] text-(--ink-faint) mt-0.5 block">
            Follow-up in progress
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("Resolved")}
          className={`admin-card p-3.5 cursor-pointer transition-all ${
            statusFilter === "Resolved"
              ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10"
              : "hover:border-emerald-300 dark:hover:border-emerald-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
              Resolved
            </p>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {counts.resolved}
          </p>
          <span className="text-[11px] text-(--ink-faint) mt-0.5 block">
            Successfully closed
          </span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="admin-toolbar mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by customer name, email, phone, subject, or ticket ID…"
        />

        <SegmentedFilter
          options={[
            { value: null, label: "All", count: counts.total },
            { value: "New", label: "New", count: counts.new },
            { value: "In Progress", label: "In Progress", count: counts.inProgress },
            { value: "Resolved", label: "Resolved", count: counts.resolved },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Standard Admin Table Card */}
      {loading && inquiries.length === 0 ? (
        <TableSkeleton rows={6} />
      ) : (
        <div className="admin-table-wrap">
          <div className="overflow-x-auto admin-scroll">
            <table className="admin-table min-w-245">
              <thead>
                <tr>
                  <SortableTh
                    label="Customer"
                    sortKey="customer"
                    sort={table.sort}
                    onSort={table.toggleSort}
                  />
                  <SortableTh
                    label="Subject & Inquiry Message"
                    sortKey="subject"
                    sort={table.sort}
                    onSort={table.toggleSort}
                  />
                  <SortableTh
                    label="Status"
                    sortKey="status"
                    sort={table.sort}
                    onSort={table.toggleSort}
                    align="center"
                  />
                  <SortableTh
                    label="Received Date"
                    sortKey="date"
                    sort={table.sort}
                    onSort={table.toggleSort}
                  />
                  <th scope="col" className="text-right">
                    Instant Reply Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {table.rows.length > 0 ? (
                  table.rows.map((inq) => {
                    let statusBadge = (
                      <span className="badge badge-info badge-dot">
                        New
                      </span>
                    );

                    if (inq.status === "In Progress") {
                      statusBadge = (
                        <span className="badge badge-warning badge-dot">
                          In Progress
                        </span>
                      );
                    } else if (inq.status === "Resolved") {
                      statusBadge = (
                        <span className="badge badge-success badge-dot">
                          Resolved
                        </span>
                      );
                    }

                    const hasPhone = Boolean(inq.phone && inq.phone.trim());

                    return (
                      <tr key={inq._id} className="hover:bg-(--surface-sunken)/70 transition-colors">
                        {/* Customer */}
                        <td>
                          <div className="min-w-0">
                            <p className="cell-strong text-[13px] font-semibold">{inq.name}</p>
                            <div className="flex items-center gap-1.5 cell-sub text-(--ink-muted) mt-0.5">
                              <MailIcon className="w-3 h-3 shrink-0" />
                              <a
                                href={`mailto:${inq.email}`}
                                className="hover:underline hover:text-(--brand) truncate max-w-45"
                              >
                                {inq.email}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopy(inq.email, "Email")}
                                className="p-0.5 rounded text-(--ink-faint) hover:text-(--ink) hover:bg-(--surface-sunken) transition-colors cursor-pointer"
                                title="Copy email address"
                                aria-label="Copy email"
                              >
                                <CopyIcon className="w-3 h-3" />
                              </button>
                            </div>
                            {hasPhone && (
                              <div className="flex items-center gap-1.5 cell-sub text-(--ink-faint) mt-0.5">
                                <PhoneIcon className="w-3 h-3 shrink-0" />
                                <span>+91 {cleanPhone(inq.phone)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(inq.phone, "Phone")}
                                  className="p-0.5 rounded text-(--ink-faint) hover:text-(--ink) hover:bg-(--surface-sunken) transition-colors cursor-pointer"
                                  title="Copy phone number"
                                  aria-label="Copy phone"
                                >
                                  <CopyIcon className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Subject & Message Preview */}
                        <td>
                          <div
                            onClick={() => openDetailModal(inq)}
                            className="cursor-pointer group max-w-105"
                          >
                            <p className="cell-strong group-hover:text-(--brand) transition-colors truncate">
                              {inq.subject}
                            </p>
                            <p className="cell-sub line-clamp-1">
                              {inq.message}
                            </p>
                            {inq.adminNotes && (
                              <span className="inline-block mt-1 text-[10.5px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium border border-amber-500/20">
                                📝 Note: {inq.adminNotes}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="text-center whitespace-nowrap">
                          {statusBadge}
                        </td>

                        {/* Date */}
                        <td className="whitespace-nowrap">
                          <span className="cell-strong block text-[12.5px]">
                            {new Date(inq.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="cell-sub">
                            {new Date(inq.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>

                        {/* Instant Actions */}
                        <td className="text-right whitespace-nowrap">
                          <div className="flex items-center gap-1.5 justify-end">
                            {hasPhone && (
                              <a
                                href={getWhatsAppUrl(inq)}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat on WhatsApp"
                                className="btn btn-export btn-sm px-2.5 font-bold"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                                WhatsApp
                              </a>
                            )}

                            <a
                              href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`}
                              title="Reply by Email"
                              className="icon-btn icon-btn-view"
                            >
                              <MailIcon className="w-4 h-4" />
                            </a>

                            <button
                              type="button"
                              onClick={() => openDetailModal(inq)}
                              title="View Inquiry Details"
                              className="icon-btn icon-btn-ghost"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(inq)}
                              title="Delete Ticket"
                              className="icon-btn icon-btn-delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      <EmptyState
                        icon={<MessageSquareIcon className="w-8 h-8" />}
                        title="No customer inquiries found"
                        message="Messages submitted on your storefront contact form or manually logged will arrive here."
                        action={
                          <div className="flex items-center gap-2">
                            {(search || statusFilter) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearch("");
                                  setStatusFilter(null);
                                }}
                                className="btn btn-secondary btn-sm"
                              >
                                Clear filters
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                resetCreateForm();
                                setIsCreateOpen(true);
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              <PlusIcon className="w-3.5 h-3.5" />
                              Log inquiry
                            </button>
                          </div>
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={table.page}
            pageCount={table.pageCount}
            pageSize={table.pageSize}
            total={table.total}
            rangeStart={table.rangeStart}
            rangeEnd={table.rangeEnd}
            onPage={table.setPage}
            onPageSize={table.setPageSize}
            noun="inquiries"
          />
        </div>
      )}

      {/* NEW INQUIRY DRAWER */}
      <Drawer
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetCreateForm();
        }}
        icon={<MessageSquareIcon className="w-4 h-4" />}
        title="New Customer Inquiry"
        subtitle="Log a customer lead, wedding bulk order inquiry, or phone support ticket."
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                resetCreateForm();
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-inquiry-form"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting && <span className="spinner spinner-on-brand" />}
              {isSubmitting ? "Logging inquiry…" : "Create inquiry"}
            </button>
          </>
        }
      >
        <form
          id="create-inquiry-form"
          onSubmit={handleCreateSubmit}
          noValidate
          className="space-y-4"
        >
          {/* Live Identity & Lead Preview Card */}
          <div className="p-3.5 rounded-xl border border-(--border) bg-(--surface-sunken)/50 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-linear-to-tr from-amber-500 to-indigo-600 text-white font-bold text-[13px] flex items-center justify-center shrink-0 shadow-xs ring-2 ring-amber-100 dark:ring-amber-900/40">
              {createName.trim() ? createName.trim().slice(0, 2).toUpperCase() : "IN"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[13.5px] font-bold text-(--ink) truncate">
                  {createName.trim() || "Customer Name"}
                </p>
                <span className="badge badge-neutral text-[10px] px-1.5 py-0">
                  {createStatus}
                </span>
              </div>
              <p className="text-[12px] text-(--ink-muted) truncate mt-0.5">
                {createSubject.trim() || "Subject / Query title"}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-(--ink-muted)">
                <span>{createEmail.trim() || "Email pending"}</span>
                {createPhone.trim() && (
                  <>
                    <span>•</span>
                    <span>+91 {cleanPhone(createPhone)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Field
            label="Customer full name"
            required
            htmlFor="inq-name"
            error={createTouched.name ? createErrors.name : undefined}
            hint="Name of the customer or representative reaching out."
          >
            <input
              id="inq-name"
              type="text"
              value={createName}
              onChange={(e) => {
                setCreateName(e.target.value);
                if (createTouched.name) {
                  const errs = validateCreate({ name: e.target.value });
                  setCreateErrors((prev) => ({ ...prev, name: errs.name }));
                }
              }}
              onBlur={() => {
                setCreateTouched((prev) => ({ ...prev, name: true }));
                const errs = validateCreate({ name: createName });
                setCreateErrors((prev) => ({ ...prev, name: errs.name }));
              }}
              placeholder="e.g. Priya Deshmukh"
              className={`form-input ${createTouched.name && createErrors.name ? "is-invalid" : ""}`}
            />
          </Field>

          <Field
            label="Email address"
            required
            htmlFor="inq-email"
            error={createTouched.email ? createErrors.email : undefined}
            hint="Customer email for sending catalog, quotation, or status replies."
          >
            <input
              id="inq-email"
              type="email"
              value={createEmail}
              onChange={(e) => {
                setCreateEmail(e.target.value);
                if (createTouched.email) {
                  const errs = validateCreate({ email: e.target.value });
                  setCreateErrors((prev) => ({ ...prev, email: errs.email }));
                }
              }}
              onBlur={() => {
                setCreateTouched((prev) => ({ ...prev, email: true }));
                const errs = validateCreate({ email: createEmail });
                setCreateErrors((prev) => ({ ...prev, email: errs.email }));
              }}
              placeholder="e.g. priya.deshmukh@gmail.com"
              className={`form-input ${createTouched.email && createErrors.email ? "is-invalid" : ""}`}
            />
          </Field>

          <Field
            label="Mobile phone number"
            optional
            htmlFor="inq-phone"
            error={createTouched.phone ? createErrors.phone : undefined}
            hint="10-digit Indian mobile number for 1-click WhatsApp follow-ups."
          >
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[12px] font-semibold text-(--ink-muted) select-none pr-2 border-r border-(--border)">
                +91
              </span>
              <input
                id="inq-phone"
                type="tel"
                value={createPhone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "");
                  if (val.startsWith("91") && val.length > 10) val = val.slice(2);
                  else if (val.startsWith("0") && val.length > 10) val = val.slice(1);
                  val = val.slice(0, 10);
                  setCreatePhone(val);
                  if (createTouched.phone) {
                    const errs = validateCreate({ phone: val });
                    setCreateErrors((prev) => ({ ...prev, phone: errs.phone }));
                  }
                }}
                onBlur={() => {
                  setCreateTouched((prev) => ({ ...prev, phone: true }));
                  const errs = validateCreate({ phone: createPhone });
                  setCreateErrors((prev) => ({ ...prev, phone: errs.phone }));
                }}
                placeholder="9819012345"
                maxLength={14}
                style={{ paddingLeft: "54px" }}
                className={`form-input font-mono ${createTouched.phone && createErrors.phone ? "is-invalid" : ""}`}
              />
            </div>
          </Field>

          <Field
            label="Subject"
            required
            htmlFor="inq-subject"
            error={createTouched.subject ? createErrors.subject : undefined}
            hint="Short title summarizing the customer's request."
          >
            <input
              id="inq-subject"
              type="text"
              value={createSubject}
              onChange={(e) => {
                setCreateSubject(e.target.value);
                if (createTouched.subject) {
                  const errs = validateCreate({ subject: e.target.value });
                  setCreateErrors((prev) => ({ ...prev, subject: errs.subject }));
                }
              }}
              onBlur={() => {
                setCreateTouched((prev) => ({ ...prev, subject: true }));
                const errs = validateCreate({ subject: createSubject });
                setCreateErrors((prev) => ({ ...prev, subject: errs.subject }));
              }}
              placeholder="e.g. Bulk Order Inquiry for Destination Wedding"
              className={`form-input ${createTouched.subject && createErrors.subject ? "is-invalid" : ""}`}
            />
          </Field>

          <Field
            label="Inquiry Message"
            required
            htmlFor="inq-message"
            error={createTouched.message ? createErrors.message : undefined}
            hint="Customer requirements, quantity, date of event, or product question."
          >
            <textarea
              id="inq-message"
              rows={4}
              value={createMessage}
              onChange={(e) => {
                setCreateMessage(e.target.value);
                if (createTouched.message) {
                  const errs = validateCreate({ message: e.target.value });
                  setCreateErrors((prev) => ({ ...prev, message: errs.message }));
                }
              }}
              onBlur={() => {
                setCreateTouched((prev) => ({ ...prev, message: true }));
                const errs = validateCreate({ message: createMessage });
                setCreateErrors((prev) => ({ ...prev, message: errs.message }));
              }}
              placeholder="e.g. Looking to purchase 150 customized monogrammed tote bags for wedding guests in Jaipur this November..."
              className={`form-textarea ${createTouched.message && createErrors.message ? "is-invalid" : ""}`}
            />
          </Field>

          <Field
            label="Initial Ticket Status"
            htmlFor="inq-status"
            hint="Current stage of this customer lead."
          >
            <select
              id="inq-status"
              value={createStatus}
              onChange={(e) => setCreateStatus(e.target.value)}
              className="admin-select w-full"
            >
              <option value="New">🆕 New (Awaiting Reply)</option>
              <option value="In Progress">⏳ In Progress (Discussion Ongoing)</option>
              <option value="Resolved">✅ Resolved (Lead Closed / Converted)</option>
            </select>
          </Field>

          <Field
            label="Internal Team Notes"
            optional
            htmlFor="inq-notes"
            hint="Confidential administrative notes visible to store managers only."
          >
            <textarea
              id="inq-notes"
              rows={2}
              value={createAdminNotes}
              onChange={(e) => setCreateAdminNotes(e.target.value)}
              placeholder="e.g. Customer called on phone, sent custom catalog with 15% wholesale quote."
              className="form-textarea"
            />
          </Field>
        </form>
      </Drawer>

      {/* DETAIL & STATUS EDIT MODAL */}
      {activeModalInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl rounded-(--radius-lg) border border-(--border) bg-(--surface-card) shadow-2xl overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="admin-card-header">
              <div className="flex items-center gap-2">
                <MessageSquareIcon className="w-4 h-4 text-(--brand)" />
                <h3 className="admin-card-title">
                  Customer Inquiry Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalInquiry(null)}
                className="icon-btn icon-btn-ghost"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto admin-scroll">
              {/* Customer Contact Card */}
              <div className="p-3.5 rounded-(--radius) border border-(--border) bg-(--surface-sunken) space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13.5px] font-bold text-(--ink)">
                    {activeModalInquiry.name}
                  </h4>
                  <span className="text-[11.5px] text-(--ink-muted)">
                    {new Date(activeModalInquiry.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-[12px] text-(--ink-soft)">
                  <span className="flex items-center gap-1.5">
                    <MailIcon className="w-3.5 h-3.5 text-(--ink-faint)" />
                    {activeModalInquiry.email}
                  </span>
                  {activeModalInquiry.phone && (
                    <span className="flex items-center gap-1.5">
                      <PhoneIcon className="w-3.5 h-3.5 text-(--ink-faint)" />
                      +91 {cleanPhone(activeModalInquiry.phone)}
                    </span>
                  )}
                </div>
              </div>

              {/* Inquiry Message */}
              <div>
                <label className="form-label">Subject:</label>
                <div className="p-2.5 rounded-(--radius-sm) border border-(--border) bg-(--surface-card) text-[13px] font-semibold text-(--ink)">
                  {activeModalInquiry.subject}
                </div>
              </div>

              <div>
                <label className="form-label">Customer Message:</label>
                <div className="p-3 rounded-(--radius-sm) border border-(--border) bg-(--surface-sunken) text-[12.5px] text-(--ink) whitespace-pre-wrap leading-relaxed">
                  {activeModalInquiry.message}
                </div>
              </div>

              {/* Status Selector & Direct Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="form-label">Ticket Status</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="admin-select w-full"
                  >
                    <option value="New">🆕 New (Awaiting Reply)</option>
                    <option value="In Progress">⏳ In Progress (In Discussion)</option>
                    <option value="Resolved">✅ Resolved (Closed)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Direct Contact Channels</label>
                  <div className="flex items-center gap-2">
                    {activeModalInquiry.phone && (
                      <a
                        href={getWhatsAppUrl(activeModalInquiry)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-export btn-sm flex-1 font-bold"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    )}
                    <a
                      href={`mailto:${activeModalInquiry.email}?subject=Re: ${encodeURIComponent(activeModalInquiry.subject)}`}
                      className="btn btn-secondary btn-sm flex-1"
                    >
                      <MailIcon className="w-3.5 h-3.5" />
                      Email
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="form-label">Internal Team Notes</label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="e.g. Spoke on phone, sent custom catalog for wedding totes with 15% wholesale discount..."
                  className="form-textarea"
                />
                <span className="text-[11px] text-(--ink-faint) block mt-1">
                  Confidential administrative notes visible to store managers only.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-(--border) bg-(--surface-sunken) flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDeleteTarget(activeModalInquiry)}
                className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                Delete Ticket
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalInquiry(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleModalSave}
                  disabled={isUpdating}
                  className="btn btn-primary btn-sm"
                >
                  {isUpdating ? (
                    "Saving…"
                  ) : (
                    <>
                      <CheckIcon className="w-3.5 h-3.5" />
                      Save & Update Status
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete inquiry ticket?"
        message={
          deleteTarget
            ? `Inquiry from “${deleteTarget.name}” regarding “${deleteTarget.subject}” will be permanently removed.`
            : ""
        }
        confirmLabel="Delete inquiry"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default InquiriesPage;
