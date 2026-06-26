import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Rails no requiere verificación por OTP: la cuenta queda activa al registrarse.
  // Si llega una contraseña guardada del registro, completa el inicio de sesión;
  // si no, redirige al login.
  const handleContinue = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const pwd = sessionStorage.getItem("signup_password");
      sessionStorage.removeItem("signup_email");
      sessionStorage.removeItem("signup_password");

      if (pwd && email) {
        await authService.login(email, pwd);
        window.location.href = "/";
      } else {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Continuar error:", err);
      setError("No pudimos iniciar sesión automáticamente. Ingresá desde el login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleContinue} className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🐄</div>
          <h1 className="text-2xl font-bold">Cuenta verificada</h1>
          <p className="text-sm text-muted-foreground">Tu cuenta ya está activa. No se requiere código de verificación.</p>
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Continuando..." : "Continuar"}
        </Button>
        <p className="text-center text-sm">
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Volver al login
          </Link>
        </p>
      </form>
    </div>
  );
}
