import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResidentDashboard from "./pages/ResidentDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import SecretaryDashboard from "./pages/SecretaryDashboard";
import Events from "./pages/Events";
import Beneficiaries from "./pages/Beneficiaries";
import ActivityLogs from "./pages/ActivityLogs";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/useAuth";
import type { Role } from "./services/authService";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return null;
  }
  if (!user) {
    return <Navigate to="/resident-login" replace />;
  }
  return children;
}

function RequireRole({ children, allowedRoles, loginPath = "/resident-login" }: { children: React.ReactNode; allowedRoles: Role[]; loginPath?: string }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return null;
  }
  if (!user) {
    return <Navigate to={loginPath} replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    const fallbackRoute = user.role === "secretary" ? "/admin" : user.role === "staff" ? "/staff" : "/resident";
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/resident-login" replace />} />
          <Route path="/login" element={<Navigate to="/resident-login" replace />} />
          <Route path="/register" element={<Navigate to="/resident-register" replace />} />
          <Route path="/resident-login" element={<Login portal="resident" />} />
          <Route path="/admin-login" element={<Login portal="admin" />} />
          <Route path="/staff-login" element={<Login portal="staff" />} />
          <Route path="/resident-register" element={<Register mode="resident" />} />
          <Route
            path="/admin/register"
            element={<RequireRole allowedRoles={["secretary"]} loginPath="/admin-login"><Register mode="staffAdmin" /></RequireRole>}
          />
          <Route
            path="/resident"
            element={<RequireRole allowedRoles={["resident"]}><ResidentDashboard /></RequireRole>}
          />
          <Route
            path="/staff"
            element={<RequireRole allowedRoles={["staff"]} loginPath="/staff-login"><StaffDashboard /></RequireRole>}
          />
          <Route
            path="/admin"
            element={<RequireRole allowedRoles={["secretary"]} loginPath="/admin-login"><SecretaryDashboard /></RequireRole>}
          />
          <Route
            path="/secretary"
            element={<RequireRole allowedRoles={["secretary"]} loginPath="/admin-login"><SecretaryDashboard /></RequireRole>}
          />
          <Route
            path="/events"
            element={<RequireAuth><Events /></RequireAuth>}
          />
          <Route
            path="/beneficiaries"
            element={<RequireAuth><Beneficiaries /></RequireAuth>}
          />
          <Route
            path="/activity-logs"
            element={<RequireRole allowedRoles={["secretary"]} loginPath="/admin-login"><ActivityLogs /></RequireRole>}
          />
          <Route path="*" element={<Navigate to="/resident-login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
