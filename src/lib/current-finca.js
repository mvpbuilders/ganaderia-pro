import { authService } from "@/services/authService";

// Devuelve la finca actual del usuario autenticado consultando la API de Rails.
// El backend resuelve la finca a partir del token (current_finca); el frontend
// nunca envía ni decide finca_id.
export async function getCurrentFinca() {
  const data = await authService.me();

  if (!data?.current_finca) {
    return null;
  }

  return {
    finca: data.current_finca,
    relacion: data.membership,
    user: data.user,
  };
}
