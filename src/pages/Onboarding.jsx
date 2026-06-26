import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fincaService } from "@/services/fincaService";
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
      // El backend crea la finca y la membresía owner para el usuario autenticado.
      await fincaService.create(nombre);
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
