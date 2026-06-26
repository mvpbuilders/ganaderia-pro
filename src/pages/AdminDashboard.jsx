import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminService, ADMIN_OVERVIEW_QUERY_KEY } from "@/services/adminService";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    queryFn: adminService.overview,
  });

  if (isLoading || !data) return <div className="p-6">Cargando admin...</div>;

  const { stats, fincas } = data;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Ganadería Pro</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/fincas" className="bg-white border rounded-xl p-4 hover:shadow-sm transition">
          <p className="text-sm text-slate-500">FINCAS</p>
          <p className="text-2xl font-bold">{stats.fincas}</p>
          <p className="text-sm text-green-600 mt-2 font-semibold">Ver más →</p>
        </Link>

        <Link to="/admin/users" className="bg-white border rounded-xl p-4 hover:shadow-sm transition">
          <p className="text-sm text-slate-500">USUARIOS</p>
          <p className="text-2xl font-bold">{stats.usuarios}</p>
          <p className="text-sm text-green-600 mt-2 font-semibold">Ver más →</p>
        </Link>

        <Link to="/admin" className="bg-white border rounded-xl p-4 hover:shadow-sm transition">
          <p className="text-sm text-slate-500">MÉTRICAS</p>
          <p className="text-2xl font-bold">Ver</p>
          <p className="text-sm text-green-600 mt-2 font-semibold">Ver más →</p>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card title="Fincas" value={stats.fincas} />
        <Card title="Usuarios" value={stats.usuarios} />
        <Card title="Animales" value={stats.animales} />
        <Card title="Eventos" value={stats.eventos} />
        <Card title="Registros leche" value={stats.registros_leche} />
        <Card title="Transacciones" value={stats.transacciones} />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 font-semibold">Fincas</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Owner</th>
              <th className="text-left p-3">Usuarios</th>
              <th className="text-left p-3">Animales</th>
            </tr>
          </thead>
          <tbody>
            {fincas.map((finca) => (
              <tr key={finca.id} className="border-t">
                <td className="p-3">{finca.nombre}</td>
                <td className="p-3">{finca.owner_email}</td>
                <td className="p-3">{finca.usuarios_count}</td>
                <td className="p-3">{finca.animales_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
