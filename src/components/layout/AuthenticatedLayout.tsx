import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Sidebar
        user={{
          name: session.user.name || "User",
          email: session.user.email || "",
          role: session.user.role,
        }}
      />
      <main className="ml-64 flex-1">
        <div className="relative overflow-hidden">
          {/* Background effects */}
          <div className="pointer-events-none absolute -top-32 left-1/3 h-72 w-72 rounded-full bg-purple-500/20 blur-[120px]" />
          <div className="pointer-events-none absolute right-0 top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[140px]" />

          {/* Content */}
          <div className="relative">{children}</div>
        </div>
      </main>
    </div>
  );
}
