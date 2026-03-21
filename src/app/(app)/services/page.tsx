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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import type { Service } from "@/lib/types";

type ServiceRecord = Service & { id: string };

const emptyForm: Service = {
  name: "",
  price: 0,
  duration: 0,
  category: "men",
  imageUrl: "",
  description: "",
};

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [form, setForm] = useState<Service>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTIONS.services),
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Service),
        }));
        setServices(next);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const storageRef = ref(storage, `services/${editingId ?? "new"}/image`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setForm((prev) => ({ ...prev, imageUrl: url }));
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      ...form,
      price: Number(form.price),
      duration: Number(form.duration),
    };

    if (editingId) {
      await updateDoc(doc(db, COLLECTIONS.services, editingId), payload);
    } else {
      await addDoc(collection(db, COLLECTIONS.services), {
        ...payload,
        createdAt: new Date().toISOString(),
      });
    }

    setForm(emptyForm);
    setEditingId(null);
    setSaving(false);
  };

  const handleEdit = (service: ServiceRecord) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      price: service.price ?? 0,
      duration: service.duration ?? 0,
      category: service.category ?? "men",
      imageUrl: service.imageUrl ?? "",
      description: service.description ?? "",
    });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.services, id));
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Services
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Catalogo de servicios
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Controla precios, duracion y categoria de cada servicio.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">
            {editingId ? "Editar servicio" : "Nuevo servicio"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
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
                Categoria
              </label>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    category: event.target.value as Service["category"],
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                Precio
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    price: Number(event.target.value),
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                Duracion (min)
              </label>
              <input
                type="number"
                value={form.duration}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    duration: Number(event.target.value),
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">
              Descripcion
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">
              Imagen
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-400/90 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-black"
            />
            {form.imageUrl ? (
              <div className="relative mt-3 h-40 w-full overflow-hidden rounded-2xl">
                <Image
                  src={form.imageUrl}
                  alt="Servicio"
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
              disabled={saving}
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
          <div className="space-y-4">
            {services.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-white/50">
                Aun no hay servicios registrados.
              </div>
            ) : (
              services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10">
                      {service.imageUrl ? (
                        <Image
                          src={service.imageUrl}
                          alt={service.name}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {service.name}
                      </p>
                      <p className="text-xs text-white/50">
                        {service.category} - ${service.price} - {service.duration}m
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(service)}
                      className="rounded-full border border-white/20 px-3 py-2 text-xs text-white/70"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(service.id)}
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
