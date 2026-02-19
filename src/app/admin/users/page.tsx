import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllUsers } from "@/app/actions/users";
import UserManagement from "@/components/admin/UserManagement";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  const users = await getAllUsers();

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage users and permissions
            </p>
          </div>
        </header>

        <UserManagement users={users} currentUserId={session.user.id} />
      </div>
    </AuthenticatedLayout>
  );
}
