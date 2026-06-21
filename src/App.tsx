import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Login from "@/pages/Login/Login";
import Dashboard from "@/pages/Dashboard/Dashboard";
import Clients from "@/pages/Clients/Clients";
import ClientDetail from "@/pages/ClientDetail/ClientDetail";
import Progress from "@/pages/Progress/Progress";
import Statistics from "@/pages/Statistics/Statistics";
import Settings from "@/pages/Settings/Settings";
import SelectPhoto from "@/pages/SelectPhoto/SelectPhoto";
import SelectConfirm from "@/pages/SelectConfirm/SelectConfirm";
import NotFound from "@/pages/NotFound/NotFound";
import AppLayout from "@/components/layout/AppLayout";
import { useAuthStore } from "@/store/useAuthStore";

function HomeRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/select/:token" element={<SelectPhoto />} />
        <Route path="/select/:token/confirm" element={<SelectConfirm />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
