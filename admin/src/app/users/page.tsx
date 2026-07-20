"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { CreateUserInput, UserResponse } from "@/lib/shared";

export default function UsersPage() {
  const { token } = useAuth();
  const [organizers, setOrganizers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [creatingOrganizer, setCreatingOrganizer] = useState(false);
  const [newOrganizer, setNewOrganizer] = useState<CreateUserInput>({
    name: "",
    email: "",
    password: "",
    role: "organizer",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getApiErrorMessage = (
    error: unknown,
    fallback = "Something went wrong",
  ) => {
    if (error instanceof ApiError) {
      const body = error.body as
        | { message?: string; errors?: Array<{ message?: string }> }
        | undefined;
      const detailed = body?.errors?.[0]?.message;
      return detailed || body?.message || error.message || fallback;
    }
    if (error instanceof Error) return error.message || fallback;
    return fallback;
  };

  const loadOrganizers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const client = createApiClient(token);
      const res = await client.getUsers({ role: "organizer" });
      if (res.ok && res.data) setOrganizers(res.data);
    } catch (error) {
      showMessage(
        "error",
        getApiErrorMessage(error, "Failed to load organisers"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizers();
  }, [token]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggleStatus = async (organizerId: string, isActive: boolean) => {
    if (!token) return;
    try {
      const client = createApiClient(token);
      const res = await client.updateUserStatus(organizerId, !isActive);
      if (res.ok) {
        showMessage("success", res.message);
        loadOrganizers();
      }
    } catch (error) {
      showMessage(
        "error",
        getApiErrorMessage(error, "Failed to update organiser status"),
      );
    }
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const client = createApiClient(token);
      const res = await client.deleteUser(deleteTarget.id);
      if (res.ok) {
        showMessage("success", res.message || "Organiser deleted");
        setDeleteTarget(null);
        loadOrganizers();
      }
    } catch (error) {
      showMessage(
        "error",
        getApiErrorMessage(error, "Failed to delete organiser"),
      );
    } finally {
      setDeleting(false);
    }
  };

  const resetAddOrganizerForm = () => {
    setNewOrganizer({ name: "", email: "", password: "", role: "organizer" });
  };

  const closeAddOrganizerModal = () => {
    resetAddOrganizerForm();
    setShowAddForm(false);
  };

  const handleCreateOrganizer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || creatingOrganizer) return;

    const name = newOrganizer.name.trim();
    const email = newOrganizer.email.trim().toLowerCase();
    if (name.length < 2) {
      showMessage("error", "Name must be at least 2 characters");
      return;
    }
    if (!email || !email.includes("@")) {
      showMessage("error", "Please enter a valid email");
      return;
    }
    if (newOrganizer.password.length < 6) {
      showMessage("error", "Password must be at least 6 characters");
      return;
    }

    setCreatingOrganizer(true);
    try {
      const client = createApiClient(token);
      const res = await client.createUser({
        name,
        email,
        password: newOrganizer.password,
        role: "organizer",
      });

      if (res.ok) {
        showMessage("success", res.message);
        resetAddOrganizerForm();
        setShowAddForm(false);
        loadOrganizers();
      }
    } catch (error) {
      showMessage(
        "error",
        getApiErrorMessage(error, "Failed to create organiser"),
      );
    } finally {
      setCreatingOrganizer(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-cream">
              Organisers
            </h1>
            <p className="mt-1 text-sm text-cream/60">
              Create and manage organiser accounts for event ownership
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/20"
          >
            Add Organiser
          </button>
        </header>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-void/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">
                      Organiser
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">
                      Owned Events
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
                  {organizers.map((u) => (
                    <tr key={u.id} className="transition hover:bg-surface/40">
                      <td className="px-6 py-4">
                        <p className="font-medium text-cream">{u.name}</p>
                        <p className="text-sm text-cream/60">{u.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-cream/85">
                        {u.ownedEventCount ?? 0}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${u.isActive ? "bg-gold/10 text-gold border border-gold/40" : "bg-border/40 text-cream/60 border border-border"}`}
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(u.id, u.isActive)}
                            className="rounded-lg border border-border bg-surface px-3 py-1 text-xs text-cream/90 transition hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            disabled={(u.ownedEventCount ?? 0) > 0}
                            title={
                              (u.ownedEventCount ?? 0) > 0
                                ? "Reassign or delete owned events before removing this organiser"
                                : "Permanently delete organiser account"
                            }
                            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
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
          </div>
        )}
      </div>

      {message && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-70 flex justify-center px-4">
          <div
            className={`pointer-events-auto w-full max-w-2xl rounded-xl border px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ${message.type === "success" ? "border-gold/40 bg-void text-gold" : "border-rose-500/50 bg-void text-rose-300"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{message.text}</p>
              <button
                type="button"
                onClick={() => setMessage(null)}
                className="rounded-md border border-border/70 bg-surface px-2 py-1 text-xs text-cream/80 transition hover:bg-surface/80"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-void p-5 shadow-[0_28px_80px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-cream">Delete organiser?</h2>
            <p className="mt-2 text-sm text-cream/70">
              This will permanently remove{" "}
              <span className="font-medium text-cream">{deleteTarget.name}</span>{" "}
              ({deleteTarget.email}). This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-cream/80 transition hover:bg-surface/80 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete organiser"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={closeAddOrganizerModal}
        >
          <form
            onSubmit={handleCreateOrganizer}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-border bg-void p-5 shadow-[0_28px_80px_rgba(0,0,0,0.6)] sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-cream">
                  Add New Organiser
                </h2>
                <p className="mt-1 text-sm text-cream/60">
                  Create organiser login credentials for the admin app
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddOrganizerModal}
                className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-cream/80 transition hover:bg-surface/80"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-cream/60">
                  Name
                </span>
                <input
                  value={newOrganizer.name}
                  onChange={(e) =>
                    setNewOrganizer((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Full name"
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold/50"
                  required
                  minLength={2}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-cream/60">
                  Email
                </span>
                <input
                  type="email"
                  value={newOrganizer.email}
                  onChange={(e) =>
                    setNewOrganizer((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="email@example.com"
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold/50"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-cream/60">
                  Password
                </span>
                <input
                  type="password"
                  value={newOrganizer.password}
                  onChange={(e) =>
                    setNewOrganizer((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Minimum 6 characters"
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold/50"
                  required
                  minLength={6}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAddOrganizerModal}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-cream/80 transition hover:bg-surface/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingOrganizer}
                className="rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingOrganizer ? "Creating..." : "Create Organiser"}
              </button>
            </div>
          </form>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
