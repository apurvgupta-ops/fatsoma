"use client";

import { useState } from "react";
import {
  createUser,
  updateUserStatus,
  deleteUser,
  updateUserRole,
} from "@/app/actions/users";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: string;
};

type Props = {
  users: User[];
  currentUserId: string;
};

export default function UserManagement({ users, currentUserId }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await createUser({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as "admin" | "user",
    });

    setIsSubmitting(false);

    if (result.ok) {
      setMessage({ type: "success", text: result.message });
      setShowAddModal(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setMessage({ type: "error", text: result.message });
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const result = await updateUserStatus(userId, !currentStatus);
    if (result.ok) {
      setMessage({ type: "success", text: result.message });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setMessage({ type: "error", text: result.message });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const result = await deleteUser(userId);
    if (result.ok) {
      setMessage({ type: "success", text: result.message });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setMessage({ type: "error", text: result.message });
    }
  };

  const handleChangeRole = async (
    userId: string,
    newRole: "admin" | "user",
  ) => {
    const result = await updateUserRole(userId, newRole);
    if (result.ok) {
      setMessage({ type: "success", text: result.message });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setMessage({ type: "error", text: result.message });
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-xl border p-4 ${
            message.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">User Management</h2>
          <p className="text-sm text-zinc-400">
            Manage users and their permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110"
        >
          Add New User
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-zinc-950/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id} className="transition hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-sm text-zinc-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleChangeRole(
                          user.id,
                          e.target.value as "admin" | "user",
                        )
                      }
                      disabled={user.id === currentUserId}
                      className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1 text-sm text-zinc-200 outline-none transition focus:border-purple-400/60 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        user.isActive
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                          : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/40"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-300">
                    {new Date(user.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          handleToggleStatus(user.id, user.isActive)
                        }
                        disabled={user.id === currentUserId}
                        className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 transition hover:border-white/20 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUserId}
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

          {users.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-zinc-400">No users found</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <h3 className="mb-6 text-xl font-semibold text-white">
              Add New User
            </h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-100">
                  Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-100">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-100">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-100">
                  Role
                </label>
                <select
                  name="role"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
