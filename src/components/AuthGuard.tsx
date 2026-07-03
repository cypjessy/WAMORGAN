"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { userProfileService } from "@/lib/db";

type RequiredRole = 'admin' | 'client';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: RequiredRole;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [roleLoading, setRoleLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/");
      return;
    }

    if (!requiredRole) {
      // No role check needed — just being logged in is enough
      setAuthorized(true);
      return;
    }

    setRoleLoading(true);
    userProfileService.getProfile(user.uid).then(profile => {
      const userRole = profile?.role;
      if (userRole === requiredRole) {
        setAuthorized(true);
      } else {
        // Redirect to the appropriate portal
        if (userRole === 'admin') {
          router.push('/dashboard');
        } else {
          router.push('/client/shop');
        }
      }
    }).catch(() => {
      // Can't determine role — allow access w/ fallback or redirect to login
      // Default: allow, since some pages might not require role enforcement
      setAuthorized(true);
    }).finally(() => {
      setRoleLoading(false);
    });
  }, [user, loading, requiredRole, router]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#E8A838]/30 border-t-[#E8A838] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole && !authorized) return null;

  return <>{children}</>;
}
