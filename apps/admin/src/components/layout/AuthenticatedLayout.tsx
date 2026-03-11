"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar />
      <main className="ml-64 flex-1">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-32 left-1/3 h-72 w-72 rounded-full bg-gold/20 blur-[120px]" />
          <div className="pointer-events-none absolute right-0 top-20 h-64 w-64 rounded-full bg-gold-light/20 blur-[140px]" />
          <div className="relative">{children}</div>
        </div>
      </main>
    </div>
  );
}
