"use client";

import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import OrganiserShell from "@/components/organiser/OrganiserShell";
import { organiserPaths } from "@/lib/organiserPaths";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(organiserPaths.login);
    } else if (!loading && user) {
      if (user.role === "user") {
        router.replace(organiserPaths.login);
        return;
      }
      if (user.role === "staff" && pathname !== organiserPaths.scanner) {
        router.replace(organiserPaths.scanner);
        return;
      }
      if (user.role === "organizer" && pathname.startsWith(organiserPaths.users)) {
        router.replace(organiserPaths.events);
        return;
      }
      if (user.role !== "admin" && pathname.startsWith(organiserPaths.withdrawRequests)) {
        router.replace(organiserPaths.dashboard);
        return;
      }
      if (user.role !== "organizer" && pathname.startsWith(organiserPaths.withdrawals)) {
        router.replace(organiserPaths.dashboard);
        return;
      }
      if (
        user.role === "organizer" &&
        ["/panel"].some((prefix) => pathname.startsWith(prefix))
      ) {
        router.replace(organiserPaths.events);
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-void">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  if (user.role === "staff") {
    return <>{children}</>;
  }

  return <OrganiserShell>{children}</OrganiserShell>;
}
