"use client";

import { useEffect, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";

type Stat = {
  label: string;
  value: number;
  description: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [barbers, services, bookings, gallery] = await Promise.all([
        getCountFromServer(collection(db, COLLECTIONS.barbers)),
        getCountFromServer(collection(db, COLLECTIONS.services)),
        getCountFromServer(collection(db, COLLECTIONS.bookings)),
        getCountFromServer(collection(db, COLLECTIONS.gallery)),
      ]);

      setStats([
        {
          label: "Barberos",
          value: barbers.data().count,
          description: "Profesionales registrados",
        },
        {
          label: "Servicios",
          value: services.data().count,
          description: "Catalogo activo",
        },
        {
          label: "Citas",
          value: bookings.data().count,
          description: "Reservas totales",
        },
        {
          label: "Galeria",
          value: gallery.data().count,
          description: "Imagenes publicadas",
        },
      ]);
      setLoading(false);
    };

    load();
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Vista general
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Dashboard operativo
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Controla en tiempo real el crecimiento y la demanda del negocio.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              {stat.label}
            </p>
            <p className="mt-3 text-4xl font-semibold text-white">
              {loading ? "..." : stat.value}
            </p>
            <p className="mt-2 text-sm text-white/60">{stat.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-emerald-400/10 p-6">
        <h3 className="text-lg font-semibold text-white">
          Proximos pasos
        </h3>
        <p className="mt-2 text-sm text-white/60">
          Manten actualizados los servicios, revisa el estado de las citas y
          asegura que cada barber este activo antes de promocionar horarios.
        </p>
      </div>
    </section>
  );
}
