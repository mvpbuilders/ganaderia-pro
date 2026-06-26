import { useQuery } from "@tanstack/react-query";
import { adminService, ADMIN_OVERVIEW_QUERY_KEY } from "@/services/adminService";

export default function AdminFincas() {
  const { data, isLoading } = useQuery({
    queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    queryFn: adminService.overview,
  });

  if (isLoading || !data) return <div className="p-6">Cargando fincas...</div>;

  const rows = data.fincas;

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
        <Card title="Usuarios asociados" value={data.usuarios.length} />
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
                    {finca.created_at
                      ? new Date(finca.created_at).toLocaleDateString("es-AR")
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
