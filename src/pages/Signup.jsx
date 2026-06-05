import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.auth.register({
        full_name: fullName,
        email,
        password,
      });

      toast.success("Cuenta creada. Revisá tu email para verificar el código.");
      window.location.href = `/verify-otp?email=${encodeURIComponent(email)}`;
    } catch (error) {
      console.error(error);
      toast.error("No pudimos crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleSignup} className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🐄</div>
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">Empezá a usar Ganadería Pro</p>
        </div>

        <div>
          <Label>Nombre completo</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
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
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>

        <p className="text-center text-sm">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Ingresar
          </Link>
        </p>
      </form>
    </div>
  );
}