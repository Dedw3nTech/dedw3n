import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { ComponentType } from "react";

type ProtectedRouteProps = {
  path: string;
  component: ComponentType<any>;
};

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/" />;
        }

        // Render the protected component with all original props
        return <Component {...params} />;
      }}
    </Route>
  );
}

type AdminOnlyRouteProps = {
  path: string;
  component: ComponentType<any>;
};

export function AdminOnlyRoute({ path, component: Component }: AdminOnlyRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/" />;
        }

        if (user.role !== 'admin') {
          return <Redirect to="/" />;
        }

        // Render the admin-only component with all original props
        return <Component {...params} />;
      }}
    </Route>
  );
}

type FinanceOnlyRouteProps = {
  path: string;
  component: ComponentType<any>;
};

export function FinanceOnlyRoute({ path, component: Component }: FinanceOnlyRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/" />;
        }

        if (user.role !== 'admin' && user.username !== 'Serruti') {
          return <Redirect to="/" />;
        }

        // Render the finance component with all original props
        return <Component {...params} />;
      }}
    </Route>
  );
}