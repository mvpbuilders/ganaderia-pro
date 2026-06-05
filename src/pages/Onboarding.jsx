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

    const user = await base44.auth.me();

    const finca = await base44.entities.Finca.create({
      nombre,
      owner_user_id: user.id
    });
    
    await base44.entities.FincaUsuario.create({
      finca_id: finca.id,
      user_id: user.id,
			email: user.email,
			role: "owner"
    });

    navigate("/");
    window.location.reload();
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