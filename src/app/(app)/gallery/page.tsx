"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import type { Barber, GalleryItem } from "@/lib/types";

type GalleryRecord = GalleryItem & { id: string };
type BarberRecord = Barber & { id: string };

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryRecord[]>([]);
  const [barbers, setBarbers] = useState<BarberRecord[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTIONS.gallery),
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as GalleryItem),
        }));
        setItems(next);
      }
    );

    return () => unsubscribe();
  }, []);

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

  useEffect(() => {
    if (!selectedBarberId && barbers.length > 0) {
      setSelectedBarberId(barbers[0].id);
    }
  }, [barbers, selectedBarberId]);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!selectedBarberId) {
      setError("Selecciona un profesional antes de subir media.");
      return;
    }
    if (!cloudName || !uploadPreset) {
      setError(
        "Cloudinary no esta configurado. Revisa las variables de entorno."
      );
      return;
    }

    const selectedBarber = barbers.find((barber) => barber.id === selectedBarberId);
    if (!selectedBarber) {
      setError("No se encontro el profesional seleccionado.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "gallery");

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("No se pudo subir a Cloudinary.");
      }

      const uploadData = (await uploadResponse.json()) as {
        secure_url?: string;
        public_id?: string;
        resource_type?: "image" | "video";
      };

      if (!uploadData.secure_url || !uploadData.public_id) {
        throw new Error("Respuesta invalida de Cloudinary.");
      }

      await addDoc(collection(db, COLLECTIONS.gallery), {
        imageUrl: uploadData.secure_url,
        cloudinaryPublicId: uploadData.public_id,
        mediaType: uploadData.resource_type ?? "image",
        barberId: selectedBarber.id,
        barberName: selectedBarber.name,
        role: selectedBarber.role ?? (selectedBarber.category === "women" ? "STYLIST" : "BARBER"),
        category: selectedBarber.category ?? "men",
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al subir.";
      setError(message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (item: GalleryRecord) => {
    try {
      if (item.cloudinaryPublicId) {
        const response = await fetch("/api/cloudinary/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicId: item.cloudinaryPublicId,
            resourceType: item.mediaType ?? "image",
          }),
        });
        if (!response.ok) {
          throw new Error("No se pudo eliminar en Cloudinary.");
        }
      } else if (item.storagePath) {
        await deleteObject(ref(storage, item.storagePath));
      }

      await deleteDoc(doc(db, COLLECTIONS.gallery, item.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar.";
      setError(message);
    }
  };

  const sortedBarbers = useMemo(
    () => [...barbers].sort((a, b) => a.name.localeCompare(b.name)),
    [barbers]
  );

  const groupedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    );
    return sorted.reduce<Record<string, GalleryRecord[]>>((acc, item) => {
      const key = item.barberId ?? "unassigned";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Gallery
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Galeria</h2>
        <p className="mt-2 text-sm text-white/60">
          Sube y elimina contenido visual del negocio.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/70">
            {items.length} imagenes publicadas
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedBarberId}
              onChange={(event) => setSelectedBarberId(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
            >
              {sortedBarbers.length === 0 ? (
                <option value="">Sin profesionales</option>
              ) : (
                sortedBarbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name} • {barber.role ?? (barber.category === "women" ? "STYLIST" : "BARBER")} • {barber.category ?? "men"}
                  </option>
                ))
              )}
            </select>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleUpload}
              className="block text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-400/90 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-black"
            />
          </div>
        </div>
        {uploading ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/60">
            Subiendo imagen...
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-white/50">
            Aun no hay imagenes en la galeria.
          </div>
        ) : (
          Object.entries(groupedItems).map(([barberId, group]) => {
            const barber = barbers.find((entry) => entry.id === barberId);
            const label = barber?.name ?? group[0]?.barberName ?? "Sin asignar";
            const role = barber?.role ?? group[0]?.role ?? "BARBER";
            const category = barber?.category ?? group[0]?.category ?? "men";

            return (
              <div key={barberId} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-white/50">
                      {role} • {category}
                    </p>
                  </div>
                  <span className="text-xs text-white/40">
                    {group.length} item(s)
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.map((item) => (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-3xl border border-white/10 bg-black/30"
                    >
                      {item.imageUrl ? (
                        item.mediaType === "video" ? (
                          <video
                            src={item.imageUrl}
                            controls
                            className="h-56 w-full object-cover"
                          />
                        ) : (
                          <div className="relative h-56 w-full">
                            <Image
                              src={item.imageUrl}
                              alt="Galeria"
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                        )
                      ) : (
                        <div className="flex h-56 items-center justify-center text-sm text-white/50">
                          Media no disponible
                        </div>
                      )}
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-white/50">{item.id}</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="rounded-full border border-rose-500/40 px-3 py-1 text-xs text-rose-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
