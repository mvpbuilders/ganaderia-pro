import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function AdminUsers() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      const [usuariosFinca, fincas] = await Promise.all([
        base44.entities.FincaUsuario.list(),
        base44.entities.Finca.list(),
      ]);

      setData({ usuariosFinca, fincas });
    }

    loadUsers();
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];

    return data.usuariosFinca.map((usuario) => {
      const finca = data.fincas.find((f) => f.id === usuario.finca_id);

      return {
        ...usuario,
        finca_nombre: finca?.nombre || "-",
      };
    });
  }, [data]);

  if (!data) return <div className="p-6">Cargando usuarios...</div>;

  const owners = rows.filter((u) => u.role === "owner").length;
  const admins = rows.filter((u) => u.role === "admin").length;
  const managers = rows.filter((u) => u.role === "manager").length;
  const employees = rows.filter((u) => u.role === "employee").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-slate-500">Usuarios asociados a fincas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card title="Total" value={rows.length} />
        <Card title="Owners" value={owners} />
        <Card title="Admins" value={admins} />
        <Card title="Managers" value={managers} />
        <Card title="Employees" value={employees} />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 font-semibold">Listado de usuarios</div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Rol</th>
                <th className="text-left p-3">Finca</th>
                <th className="text-left p-3">Fecha alta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((usuario) => (
                <tr key={usuario.id} className="border-t">
                  <td className="p-3">{usuario.email}</td>
                  <td className="p-3">{usuario.role}</td>
                  <td className="p-3">{usuario.finca_nombre}</td>
                  <td className="p-3">
                    {usuario.created_date
                      ? new Date(usuario.created_date).toLocaleDateString("es-AR")
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