"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/common/loading-spinner";

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        setIsChecking(false);
      }
    }
  }, [user, loading, router]);

  if (loading || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <OnboardingGuard>{children}</OnboardingGuard>
    </AuthProvider>
  );
}
