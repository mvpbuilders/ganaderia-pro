import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function AdminFincas() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadFincas() {
      const [fincas, usuariosFinca, animales] = await Promise.all([
        base44.entities.Finca.list(),
        base44.entities.FincaUsuario.list(),
        base44.entities.Animal.list(),
      ]);

      setData({ fincas, usuariosFinca, animales });
    }

    loadFincas();
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];

    return data.fincas.map((finca) => {
      const usuarios = data.usuariosFinca.filter((u) => u.finca_id === finca.id);
      const owner = usuarios.find((u) => u.role === "owner");
      const animales = data.animales.filter((a) => a.finca_id === finca.id);

      return {
        ...finca,
        owner_email: owner?.email || "-",
        usuarios_count: usuarios.length,
        animales_count: animales.length,
      };
    });
  }, [data]);

  if (!data) return <div className="p-6">Cargando fincas...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fincas</h1>
        <p className="text-slate-500">Listado general de fincas registradas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Total fincas" value={rows.length} />
        <Card title="Con animales" value={rows.filter((f) => f.animales_count > 0).length} />
        <Card title="Sin animales" value={rows.filter((f) => f.animales_count === 0).length} />
        <Card title="Usuarios asociados" value={data.usuariosFinca.length} />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 font-semibold">Listado de fincas</div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Owner</th>
                <th className="text-left p-3">Usuarios</th>
                <th className="text-left p-3">Animales</th>
                <th className="text-left p-3">Fecha alta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((finca) => (
                <tr key={finca.id} className="border-t">
                  <td className="p-3 font-medium">{finca.nombre}</td>
                  <td className="p-3">{finca.owner_email}</td>
                  <td className="p-3">{finca.usuarios_count}</td>
                  <td className="p-3">{finca.animales_count}</td>
                  <td className="p-3">
                    {finca.created_date
                      ? new Date(finca.created_date).toLocaleDateString("es-AR")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}