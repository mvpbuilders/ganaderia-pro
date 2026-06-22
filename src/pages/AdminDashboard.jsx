import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";


export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadAdminData() {
      const [fincas, usuariosFinca, animales, eventos, leche, transacciones] =
        await Promise.all([
          base44.entities.Finca.list(),
          base44.entities.FincaUsuario.list(),
          base44.entities.Animal.list(),
          base44.entities.Evento.list(),
          base44.entities.RegistroLeche.list(),
          base44.entities.Transaccion.list(),
        ]);

      setData({ fincas, usuariosFinca, animales, eventos, leche, transacciones });
    }

    loadAdminData();
  }, []);

  if (!data) return <div className="p-6">Cargando admin...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Ganadería Pro</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Link to="/admin/fincas" className="bg-white border rounded-xl p-4 hover:shadow-sm transition">
    <p className="text-sm text-slate-500">FINCAS</p>
    <p className="text-2xl font-bold">{data.fincas.length}</p>
    <p className="text-sm text-green-600 mt-2 font-semibold">Ver más →</p>
  </Link>

  <Link to="/admin/users" className="bg-white border rounded-xl p-4 hover:shadow-sm transition">
    <p className="text-sm text-slate-500">USUARIOS</p>
    <p className="text-2xl font-bold">{data.usuariosFinca.length}</p>
    <p className="text-sm text-green-600 mt-2 font-semibold">Ver más →</p>
  </Link>

  <Link to="/admin" className="bg-white border rounded-xl p-4 hover:shadow-sm transition">
    <p className="text-sm text-slate-500">MÉTRICAS</p>
    <p className="text-2xl font-bold">Ver</p>
    <p className="text-sm text-green-600 mt-2 font-semibold">Ver más →</p>
  </Link>
</div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card title="Fincas" value={data.fincas.length} />
        <Card title="Usuarios" value={data.usuariosFinca.length} />
        <Card title="Animales" value={data.animales.length} />
        <Card title="Eventos" value={data.eventos.length} />
        <Card title="Registros leche" value={data.leche.length} />
        <Card title="Transacciones" value={data.transacciones.length} />
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
            {data.fincas.map((finca) => {
              const usuarios = data.usuariosFinca.filter(u => u.finca_id === finca.id);
              const owner = usuarios.find(u => u.role === "owner");
              const animales = data.animales.filter(a => a.finca_id === finca.id);

              return (
                <tr key={finca.id} className="border-t">
                  <td className="p-3">{finca.nombre}</td>
                  <td className="p-3">{owner?.email || "-"}</td>
                  <td className="p-3">{usuarios.length}</td>
                  <td className="p-3">{animales.length}</td>
                </tr>
              );
            })}
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