"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { dbUser, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !dbUser) {
      router.replace("/login");
    }
  }, [dbUser, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center animate-pulse">
            <span className="text-lg">✦</span>
          </div>
          <p className="text-zinc-500 text-sm">Loading UIWiz...</p>
        </div>
      </div>
    );
  }

  if (!dbUser) return null;

  return <>{children}</>;
}
