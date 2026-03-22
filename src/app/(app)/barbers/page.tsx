"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { auth, db, uploadFile } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import type { Barber, BarberRole } from "@/lib/types";

type BarberRecord = Barber & { id: string };

const emptyForm: Barber = {
  name: "",
  bio: "",
  isActive: true,
  photoUrl: "",
};

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<BarberRecord[]>([]);
  const [form, setForm] = useState<Barber>(emptyForm);
  const [role, setRole] = useState<BarberRole>("BARBER");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTIONS.barbers),
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Barber),
        }));
        setBarbers(next);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    console.log("[barbers] Archivo seleccionado, iniciando subida...");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("[barbers] Subida bloqueada: usuario no autenticado.");
        setError("No hay sesión activa. Inicia sesión de nuevo.");
        setUploading(false);
        return;
      }

      // 1. Subir el archivo usando la función reutilizable
      const downloadURL = await uploadFile(file, "barbers");

      // 2. Decidir si actualizar un documento existente o el estado del formulario
      if (editingId) {
        console.log(
          `[barbers] Subida completa. Actualizando barbero existente: ${editingId}`
        );
        // Si estamos editando, actualizamos el documento de Firestore directamente
        const barberRef = doc(db, COLLECTIONS.barbers, editingId);
        await updateDoc(barberRef, { photoUrl: downloadURL });
        // Y también el estado del formulario para que la UI se actualice al instante
        setForm((prev) => ({ ...prev, photoUrl: downloadURL }));
        console.log("[barbers] Documento del barbero actualizado en Firestore.");
      } else {
        console.log(
          "[barbers] Subida completa. Actualizando estado del formulario para nuevo barbero."
        );
        // Si estamos creando, solo actualizamos el estado del formulario
        setForm((prev) => ({ ...prev, photoUrl: downloadURL }));
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      console.error("[barbers] Falló el proceso de subida:", errorMessage);
      setError(
        `No se pudo subir la imagen. Detalles: ${errorMessage}`
      );
    } finally {
      setUploading(false);
      console.log("[barbers] Proceso de subida finalizado.");
      // Limpiamos el input de archivo para permitir subir el mismo archivo de nuevo
      event.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (uploading) return;
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, role };
      if (editingId) {
        console.log(`[barbers] Guardando cambios del barbero: ${editingId}`);
        await updateDoc(doc(db, COLLECTIONS.barbers, editingId), payload);
      } else {
        console.log("[barbers] Creando nuevo barbero en Firestore...");
        await addDoc(collection(db, COLLECTIONS.barbers), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
      }

      console.log("[barbers] ¡Guardado con éxito!");
      setForm(emptyForm);
      setRole("BARBER");
      setEditingId(null);
    } catch (error) {
      console.log("[barbers] Falló el guardado:", error);
      setError("No se pudo guardar el barbero.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (barber: BarberRecord) => {
    setEditingId(barber.id);
    setForm({
      name: barber.name,
      bio: barber.bio ?? "",
      isActive: barber.isActive ?? true,
      photoUrl: barber.photoUrl ?? "",
    });
    setRole(barber.role ?? "BARBER");
  };

  const handleDelete = async (id: string) => {
    // TODO: Eliminar también la imagen de Storage
    console.log(`[barbers] Eliminando barbero: ${id}`);
    await deleteDoc(doc(db, COLLECTIONS.barbers, id));
    console.log(`[barbers] Barbero ${id} eliminado.`);
  };

  const toggleActive = async (barber: BarberRecord) => {
    console.log(
      `[barbers] Cambiando estado de activo para ${barber.id} a ${!barber.isActive}`
    );
    await updateDoc(doc(db, COLLECTIONS.barbers, barber.id), {
      isActive: !barber.isActive,
    });
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Barbers
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Equipo y disponibilidad
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Administra el talento y su visibilidad en la app.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">
            {editingId ? "Editar barber" : "Nuevo barber"}
          </h3>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">
              Nombre
            </label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">
              Bio
            </label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, bio: event.target.value }))
              }
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <span className="text-sm text-white/70">Activo</span>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, isActive: !prev.isActive }))
              }
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                form.isActive
                  ? "bg-emerald-400/90 text-black"
                  : "border border-white/20 text-white/70"
              }`}
            >
              {form.isActive ? "Activo" : "Inactivo"}
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">
              Rol
            </label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as BarberRole)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
            >
              <option value="BARBER">BARBER</option>
              <option value="STYLIST">STYLIST</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">
              Foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-400/90 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-black disabled:cursor-not-allowed disabled:opacity-50 file:disabled:cursor-not-allowed file:disabled:opacity-70"
            />
            {uploading && (
              <div className="text-xs text-emerald-400">
                Subiendo imagen...
              </div>
            )}
            {form.photoUrl ? (
              <div className="relative mt-3 h-40 w-full overflow-hidden rounded-2xl">
                <Image
                  src={form.photoUrl}
                  alt="Barber"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || uploading}
              className="flex-1 rounded-2xl bg-emerald-400/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                  setRole("BARBER");
                }}
                className="rounded-2xl border border-white/20 px-4 py-3 text-sm text-white/70"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">Listado</h3>
          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
          <div className="space-y-4">
            {barbers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-white/50">
                Aun no hay barberos registrados.
              </div>
            ) : (
              barbers.map((barber) => (
                <div
                  key={barber.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10">
                      {barber.photoUrl ? (
                        <Image
                          src={barber.photoUrl}
                          alt={barber.name}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                          Sin foto
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {barber.name}
                      </p>
                      <p className="text-xs text-white/50">
                        {barber.isActive ? "Activo" : "Inactivo"}
                        {barber.role ? ` · ${barber.role}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(barber)}
                      className="rounded-full border border-white/20 px-3 py-2 text-xs text-white/70"
                    >
                      {barber.isActive ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(barber)}
                      className="rounded-full border border-white/20 px-3 py-2 text-xs text-white/70"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(barber.id)}
                      className="rounded-full border border-rose-500/40 px-3 py-2 text-xs text-rose-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
