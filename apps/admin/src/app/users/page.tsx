"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { UserResponse } from "@fatsoma/shared";

export default function UsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadUsers = async () => {
    if (!token) return;
    const client = createApiClient(token);
    const res = await client.getUsers();
    if (res.ok && res.data) setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, [token]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    if (!token) return;
    const client = createApiClient(token);
    const res = await client.updateUserStatus(userId, !isActive);
    if (res.ok) { showMessage("success", res.message); loadUsers(); }
    else showMessage("error", res.message);
  };

  const handleChangeRole = async (userId: string, role: "admin" | "user") => {
    if (!token) return;
    const client = createApiClient(token);
    const res = await client.updateUserRole(userId, role);
    if (res.ok) { showMessage("success", res.message); loadUsers(); }
    else showMessage("error", res.message);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    if (!token) return;
    const client = createApiClient(token);
    const res = await client.deleteUser(userId);
    if (res.ok) { showMessage("success", res.message); loadUsers(); }
    else showMessage("error", res.message);
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-white">User Management</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage users and permissions</p>
        </header>

        {message && (
          <div className={`rounded-xl border p-4 ${message.type === "success" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-rose-500/40 bg-rose-500/10 text-rose-300"}`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((u) => (
                    <tr key={u.id} className="transition hover:bg-white/5">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{u.name}</p>
                        <p className="text-sm text-zinc-400">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select value={u.role} onChange={(e) => handleChangeRole(u.id, e.target.value as "admin" | "user")}
                          disabled={u.id === currentUser?.id}
                          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1 text-sm text-zinc-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${u.isActive ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40" : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/40"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleToggleStatus(u.id, u.isActive)} disabled={u.id === currentUser?.id}
                            className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed">
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => handleDelete(u.id)} disabled={u.id === currentUser?.id}
                            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
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
    </AuthenticatedLayout>
  );
}
