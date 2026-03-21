"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import type { Booking, BookingStatus } from "@/lib/types";

type BookingRecord = Booking & { id: string };

const statusLabels: Record<BookingStatus, string> = {
  pending: "Pendiente",
  completed: "Completada",
  cancelled: "Cancelada",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTIONS.bookings),
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Booking),
        }));
        setBookings(next);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (
    id: string,
    status: BookingStatus
  ) => {
    await updateDoc(doc(db, COLLECTIONS.bookings, id), { status });
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Bookings
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Citas</h2>
        <p className="mt-2 text-sm text-white/60">
          Controla el estado de las reservas activas.
        </p>
      </div>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-white/50">
            Aun no hay citas registradas.
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 md:grid-cols-[1.2fr_1fr_1fr_0.6fr]"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  Cliente
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {booking.customerName || "Sin nombre"}
                </p>
                <p className="text-xs text-white/50">{booking.notes}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  Servicio
                </p>
                <p className="mt-2 text-sm text-white">
                  {booking.serviceName || "No definido"}
                </p>
                <p className="text-xs text-white/50">
                  Barber: {booking.barberName || "Asignar"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  Fecha
                </p>
                <p className="mt-2 text-sm text-white">
                  {booking.date || "Sin fecha"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  Estado
                </p>
                <select
                  value={booking.status}
                  onChange={(event) =>
                    handleStatusChange(
                      booking.id,
                      event.target.value as BookingStatus
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/60"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
