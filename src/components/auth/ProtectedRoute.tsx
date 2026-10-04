import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  session: Session | null;
  children: ReactNode;
}

export const ProtectedRoute = ({
  session,
  children,
}: ProtectedRouteProps) => {
  const location = useLocation();

  if (!session) {
    const returnTo = encodeURIComponent(
      location.pathname + location.search,
    );

    return (
      <Navigate
        to={`/login?return_to=${returnTo}`}
        replace
      />
    );
  }

  return <>{children}</>;
};