import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Onboarding() {
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const crearFinca = async () => {
    if (!nombre) return;

    setLoading(true);

    try {
      const user = await base44.auth.me();
      console.log("ONBOARDING USER", user);

      const finca = await base44.entities.Finca.create({
        nombre,
        owner_user_id: user.id
      });
      console.log("FINCA CREADA", finca);

      const relacion = await base44.entities.FincaUsuario.create({
        finca_id: finca.id,
        user_id: user.id,
        email: user.email,
        role: "owner"
      });
      console.log("RELACION CREADA", relacion);

      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error("crearFinca error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">
          Crear mi finca
        </h1>

        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Estancia La Esperanza"
        />

        <Button
          onClick={crearFinca}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Creando..." : "Crear finca"}
        </Button>
      </div>
    </div>
  );
}