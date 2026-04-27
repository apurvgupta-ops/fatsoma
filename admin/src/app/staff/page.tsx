"use client";

import { useEffect, useState, type FormEvent } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { ApiError } from "@/lib/api-client";
import { createApiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { UserResponse } from "@/lib/shared";

export default function StaffPage() {
  const { token } = useAuth();
  const [staff, setStaff] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof ApiError) {
      const body = error.body as { message?: string; errors?: Array<{ message?: string }> } | undefined;
      return body?.errors?.[0]?.message || body?.message || error.message || fallback;
    }
    return error instanceof Error ? error.message : fallback;
  };

  const loadStaff = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const client = createApiClient(token);
      const res = await client.getUsers();
      setStaff((res.data ?? []).filter((user) => user.role === "staff"));
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

    setCreating(true);
    try {
      const client = createApiClient(token);
      const res = await client.createUser({
        name,
        email,
        password: form.password,
        role: "staff",
      });
      showMessage("success", res.message || "Staff user created");
      setForm({ name: "", email: "", password: "" });
      loadStaff();
    } catch (error) {
      showMessage("error", getErrorMessage(error, "Failed to create staff"));
    } finally {
      setCreating(false);
    }
  };

  const toggleStaffStatus = async (user: UserResponse) => {
    if (!token) return;
    try {
      const client = createApiClient(token);
      const res = await client.updateUserStatus(user.id, !user.isActive);
      showMessage("success", res.message);
      loadStaff();
    } catch (error) {
      showMessage("error", getErrorMessage(error, "Failed to update staff"));
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-cream">Staff</h1>
          <p className="mt-1 text-sm text-cream/60">
            Create scanner-only staff credentials for event entry.
          </p>
        </header>

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
          <div className="grid gap-4 md:grid-cols-4">
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Staff name"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold/50"
              required
            />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="staff@example.com"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold/50"
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Password"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold/50"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={creating}
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
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">Staff</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-cream/60">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staff.map((user) => (
                    <tr key={user.id} className="transition hover:bg-surface/40">
                      <td className="px-6 py-4">
                        <p className="font-medium text-cream">{user.name}</p>
                        <p className="text-sm text-cream/60">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${user.isActive ? "border-gold/40 bg-gold/10 text-gold" : "border-border bg-border/40 text-cream/60"}`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleStaffStatus(user)}
                          className="rounded-lg border border-border bg-surface px-3 py-1 text-xs text-cream/90 transition hover:bg-surface"
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
