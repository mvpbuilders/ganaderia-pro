import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Onboarding from "./pages/Onboarding";
import CurrentUser from './pages/CurrentUser';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import { Toaster as SonnerToaster } from 'sonner';

// Pages
import Dashboard from './pages/Dashboard';
import Ganado from './pages/Ganado';
import Potreros from './pages/Potreros';
import Finanzas from './pages/Finanzas';
import Calendario from './pages/Calendario';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import Perfil from './pages/Perfil';
import Eventos from './pages/Eventos';
import RegistroLeche from './pages/RegistroLeche.jsx';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';


const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, authChecked, user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkFinca = async () => {
      try {
        const user = await base44.auth.me();
        const relaciones = await base44.entities.FincaUsuario.filter({
          email: user.email
        });
        setNeedsOnboarding(relaciones.length === 0);
      } catch (error) {
        // si falla, mandar al login
        window.location.href = "/login";
      }
    };

    checkFinca();
  }, []);

  if (isLoadingPublicSettings || isLoadingAuth || !authChecked || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
            <span className="text-2xl">🐄</span>
          </div>
          <div className="w-8 h-8 border-3 border-secondary border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm">Cargando GanaderíaPro...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      window.location.href = "/login";
      return null;
    }
  }

  if (needsOnboarding === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Preparando tu finca...</p>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding />;
  }
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ganado" element={<Ganado />} />
        <Route path="/potreros" element={<Potreros />} />
        <Route path="/finanzas" element={<Finanzas />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/eventos/nuevo" element={<Eventos />} />
        <Route path="/registro-leche" element={<RegistroLeche />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/current-user" element={<CurrentUser />} />

          <Route
            path="/*"
            element={
              <AuthProvider>
                <AuthenticatedApp />
              </AuthProvider>
            }
          />
        </Routes>
      </Router>

      <Toaster />
      <SonnerToaster position="top-right" richColors />
    </QueryClientProvider>
  )
}

export default App;