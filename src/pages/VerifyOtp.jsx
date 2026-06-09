import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.auth.verifyOtp({ email, otpCode });
      toast.success("Email verificado. Bienvenido.");
      window.location.href = "/";
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error(error?.data?.message || error?.message || "No pudimos verificar el código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleVerify} className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🐄</div>
          <h1 className="text-2xl font-bold">Verificar email</h1>
          <p className="text-sm text-muted-foreground">Ingresá el código que recibiste por email</p>
        </div>

        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <Label>Código</Label>
          <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Verificando..." : "Verificar"}
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