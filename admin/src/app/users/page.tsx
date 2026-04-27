"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { CreateUserInput, UserResponse } from "@/lib/shared";

type UserRole = UserResponse["role"];

export default function UsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserInput>({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  const loadUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const client = createApiClient(token);
      const res = await client.getUsers();
      if (res.ok && res.data) setUsers(res.data);
    } catch (error) {
      showMessage("error", getApiErrorMessage(error, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    if (!token) return;
    try {
      const client = createApiClient(token);
      const res = await client.updateUserStatus(userId, !isActive);
      if (res.ok) {
        showMessage("success", res.message);
        loadUsers();
      }
    } catch (error) {
      showMessage(
        "error",
        getApiErrorMessage(error, "Failed to update user status"),
      );
    }
  };

  const handleChangeRole = async (userId: string, role: UserRole) => {
    if (!token) return;
    try {
      const client = createApiClient(token);
      const res = await client.updateUserRole(userId, role);
      if (res.ok) {
        showMessage("success", res.message);
        loadUsers();
      }
    } catch (error) {
      showMessage(
        "error",
        getApiErrorMessage(error, "Failed to update user role"),
      );
    }
  };

  const openDeleteModal = (user: UserResponse) => {
    if (user.id === currentUser?.id) return;
    setDeleteTarget(user);
  };

  const closeDeleteModal = () => {
    if (deletingUser) return;
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget || deletingUser) return;
    setDeletingUser(true);
    try {
      const client = createApiClient(token);
      const res = await client.deleteUser(deleteTarget.id);
      if (res.ok) {
        showMessage("success", res.message);
        setDeleteTarget(null);
        loadUsers();
      }
    } catch (error) {
      showMessage("error", getApiErrorMessage(error, "Failed to delete user"));
    } finally {
      setDeletingUser(false);
    }
  };

  const resetAddUserForm = () => {
    setNewUser({ name: "", email: "", password: "", role: "user" });
  };

  const closeAddUserModal = () => {
    resetAddUserForm();
    setShowAddForm(false);
  };

  const handleCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || creatingUser) return;

    const name = newUser.name.trim();
    const email = newUser.email.trim().toLowerCase();
    if (name.length < 2) {
      showMessage("error", "Name must be at least 2 characters");
      return;
    }
    if (!email || !email.includes("@")) {
      showMessage("error", "Please enter a valid email");
      return;
    }
    if (newUser.password.length < 6) {
      showMessage("error", "Password must be at least 6 characters");
      return;
    }

    setCreatingUser(true);
    try {
      const client = createApiClient(token);
      const res = await client.createUser({
        name,
        email,
        password: newUser.password,
        role: newUser.role,
      });

      if (res.ok) {
        showMessage("success", res.message);
        resetAddUserForm();
        setShowAddForm(false);
        loadUsers();
      }
    } catch (error) {
      showMessage("error", getApiErrorMessage(error, "Failed to create user"));
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-cream">
              User Management
            </h1>
            <p className="mt-1 text-sm text-cream/60">
              Manage users and permissions
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/20"
          >
            Add User
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
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">
                      Role
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
                  {users.map((u) => (
                    <tr key={u.id} className="transition hover:bg-surface/40">
                      <td className="px-6 py-4">
                        <p className="font-medium text-cream">{u.name}</p>
                        <p className="text-sm text-cream/60">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleChangeRole(
                              u.id,
                              e.target.value as UserRole,
                            )
                          }
                          disabled={u.id === currentUser?.id}
                          className="rounded-lg border border-border bg-surface px-3 py-1 text-sm text-cream/90 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="user">User</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
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
                            disabled={u.id === currentUser?.id}
                            className="rounded-lg border border-border bg-surface px-3 py-1 text-xs text-cream/90 transition hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => openDeleteModal(u)}
                            disabled={u.id === currentUser?.id}
                            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={closeAddUserModal}
        >
          <form
            onSubmit={handleCreateUser}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-border bg-void p-5 shadow-[0_28px_80px_rgba(0,0,0,0.6)] sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-cream">
                  Add New User
                </h2>
                <p className="mt-1 text-sm text-cream/60">
                  Create a user with role and login credentials
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddUserModal}
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
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, name: e.target.value }))
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
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, email: e.target.value }))
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
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((prev) => ({
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

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-cream/60">
                  Role
                </span>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser((prev) => ({
                      ...prev,
                      role: e.target.value as UserRole,
                    }))
                  }
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none focus:border-gold/50"
                >
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAddUserModal}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-cream/80 transition hover:bg-surface/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingUser}
                className="rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingUser ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={closeDeleteModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-void p-5 shadow-[0_28px_80px_rgba(0,0,0,0.6)] sm:p-6"
          >
            <h2 className="text-lg font-semibold text-cream">Delete User</h2>
            <p className="mt-2 text-sm text-cream/70">
              Are you sure you want to delete
              <span className="font-medium text-cream">
                {" "}
                {deleteTarget.name}
              </span>
              ? This action cannot be undone.
            </p>
            <p className="mt-1 text-xs text-cream/50">{deleteTarget.email}</p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deletingUser}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-cream/80 transition hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletingUser}
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingUser ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
