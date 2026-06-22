import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { isPlatformAdmin } from "@/lib/platform-admins";

export default function AdminRoute({ children }) {
  const { user, isLoadingAuth, authChecked } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!user || !isPlatformAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}