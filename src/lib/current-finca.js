import { base44 } from "@/api/base44Client";

export async function getCurrentFinca() {
  const user = await base44.auth.me();

  const relaciones = await base44.entities.FincaUsuario.filter({
    email: user.email
  });

  if (!relaciones.length) {
    return null;
  }

  const relacion = relaciones[0];

  const finca = await base44.entities.Finca.get(relacion.finca_id);

  return {
    finca,
    relacion,
    user
  };
}