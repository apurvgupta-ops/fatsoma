"use client";

import { useEffect, useState, type FormEvent } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { PanelShell, PanelTitle } from "@/components/organiser/OrganiserUi";
import { ApiError } from "@/lib/api-client";
import { createApiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { STAFF_GATE_NAMES } from "@/lib/shared/constants";
import type { EventResponse, UserResponse } from "@/lib/shared";

export default function StaffPage() {
  const { token, user } = useAuth();
  const [staff, setStaff] = useState<UserResponse[]>([]);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    staffEventId: "",
    staffGateName: "",
  });
  const [staffToDelete, setStaffToDelete] = useState<UserResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof ApiError) {
      const body = error.body as
        | { message?: string; errors?: Array<{ message?: string }> }
        | undefined;
      return body?.errors?.[0]?.message || body?.message || error.message || fallback;
    }
    return error instanceof Error ? error.message : fallback;
  };

  useEffect(() => {
    if (!token || !user || user.role === "staff") return;
    let cancelled = false;
    (async () => {
      try {
        const client = createApiClient(token);
        const res = await client.getEvents();
        if (!cancelled && res.data) setEvents(res.data);
      } catch {
        /* errors surfaced when loading staff */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user]);

  useEffect(() => {
    if (!staffToDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) setStaffToDelete(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [staffToDelete, deleting]);

  const loadStaff = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const client = createApiClient(token);
      const res = await client.getStaffUsers();
      setStaff(res.data ?? []);
    } catch (error) {
      showMessage("error", getErrorMessage(error, "Failed to load staff"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [token]);

  const handleCreateStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || creating) return;

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (name.length < 2) {
      showMessage("error", "Name must be at least 2 characters");
      return;
    }
    if (form.password.length < 6) {
      showMessage("error", "Password must be at least 6 characters");
      return;
    }
    if (!form.staffEventId.trim()) {
      showMessage("error", "Select an event for this staff member");
      return;
    }
    if (!form.staffGateName.trim()) {
      showMessage("error", "Select a gate for this staff member");
      return;
    }

    setCreating(true);
    try {
      const client = createApiClient(token);
      const res = await client.createStaffUser({
        name,
        email,
        password: form.password,
        staffEventId: form.staffEventId.trim(),
        staffGateName: form.staffGateName,
      });
      showMessage("success", res.message || "Staff user created");
      setForm({
        name: "",
        email: "",
        password: "",
        staffEventId: "",
        staffGateName: "",
      });
      loadStaff();
    } catch (error) {
      showMessage("error", getErrorMessage(error, "Failed to create staff"));
    } finally {
      setCreating(false);
    }
  };

  const toggleStaffStatus = async (row: UserResponse) => {
    if (!token) return;
    try {
      const client = createApiClient(token);
      const res = await client.updateStaffUserStatus(row.id, !row.isActive);
      showMessage("success", res.message);
      loadStaff();
    } catch (error) {
      showMessage("error", getErrorMessage(error, "Failed to update staff"));
    }
  };

  const confirmDeleteStaff = async () => {
    if (!token || !staffToDelete || deleting) return;
    setDeleting(true);
    try {
      const client = createApiClient(token);
      const res = await client.deleteStaffUser(staffToDelete.id);
      showMessage("success", res.message || "Staff member deleted");
      setStaffToDelete(null);
      loadStaff();
    } catch (error) {
      showMessage("error", getErrorMessage(error, "Failed to delete staff"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <PanelShell>
        <PanelTitle
          title="Staff"
          subtitle="Scanner-only accounts tied to one event. Staff sign in here and can only validate tickets for that event."
        />

        {message && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-rose-500/50 bg-rose-500/10 text-rose-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <form
          onSubmit={handleCreateStaff}
          className="rounded-3xl border border-border bg-void/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 lg:items-end">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Staff name"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold/50"
              required
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="staff@example.com"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold/50"
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold/50"
              required
              minLength={6}
            />
            <div className="lg:col-span-2">
              <select
                value={form.staffEventId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, staffEventId: e.target.value }))
                }
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none focus:border-gold/50"
              >
                <option value="">Select event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.eventName}
                  </option>
                ))}
              </select>
              {events.length === 0 && (
                <p className="mt-1.5 text-xs text-cream/50">
                  Create an event first; staff must be linked to an event you organise.
                </p>
              )}
            </div>
            <div>
              <select
                value={form.staffGateName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, staffGateName: e.target.value }))
                }
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none focus:border-gold/50"
              >
                <option value="">Select gate</option>
                {STAFF_GATE_NAMES.map((gate) => (
                  <option key={gate} value={gate}>
                    {gate}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={creating || events.length === 0}
              className="rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create Staff"}
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-border bg-void/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {loading ? (
            <div className="flex min-h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            </div>
          ) : staff.length === 0 ? (
            <p className="p-6 text-sm text-cream/60">No staff users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">
                      Staff
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">
                      Event
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">
                      Gate
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-cream/60">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staff.map((row) => (
                    <tr key={row.id} className="transition hover:bg-surface/40">
                      <td className="px-6 py-4">
                        <p className="font-medium text-cream">{row.name}</p>
                        <p className="text-sm text-cream/60">{row.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-cream/85">
                        {row.staffAssignedEvent?.eventName ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-cream/85">
                        {row.staffGateName ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                            row.isActive
                              ? "border-gold/40 bg-gold/10 text-gold"
                              : "border-border bg-border/40 text-cream/60"
                          }`}
                        >
                          {row.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleStaffStatus(row)}
                            className="rounded-lg border border-border bg-surface px-3 py-1 text-xs text-cream/90 transition hover:bg-surface"
                          >
                            {row.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setStaffToDelete(row)}
                            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs text-rose-300 transition hover:bg-rose-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {staffToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={() => !deleting && setStaffToDelete(null)}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-staff-title"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-void p-6 shadow-[0_28px_80px_rgba(0,0,0,0.6)]"
            >
              <h2
                id="delete-staff-title"
                className="text-lg font-semibold text-cream"
              >
                Delete staff account?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-cream/65">
                This will permanently remove{" "}
                <span className="font-medium text-cream">{staffToDelete.name}</span> (
                {staffToDelete.email}). They will no longer be able to sign in or scan tickets.
                This cannot be undone.
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setStaffToDelete(null)}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-cream/90 transition hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDeleteStaff}
                  className="rounded-lg border border-rose-500/50 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </PanelShell>
    </AuthenticatedLayout>
  );
}
