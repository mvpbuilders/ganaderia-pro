import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      toast.error("No pudimos iniciar sesión. Revisá email y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🐄</div>
          <h1 className="text-2xl font-bold">Ingresar a Ganadería Pro</h1>
          <p className="text-sm text-muted-foreground">Accedé a tu finca</p>
        </div>

        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <Label>Contraseña</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>

        <p className="text-center text-sm">
          ¿No tenés cuenta?{" "}
          <Link to="/signup" className="text-primary font-semibold hover:underline">
            Crear cuenta
          </Link>
        </p>
      </form>
    </div>
  );
}