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
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import type { GalleryItem } from "@/lib/types";

type GalleryRecord = GalleryItem & { id: string };

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryRecord[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const docRef = await addDoc(collection(db, COLLECTIONS.gallery), {
      imageUrl: "",
      storagePath: "",
      createdAt: new Date().toISOString(),
    });

    const storagePath = `gallery/${docRef.id}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await updateDoc(docRef, { imageUrl: url, storagePath });

    setUploading(false);
  };

  const handleDelete = async (item: GalleryRecord) => {
    if (item.storagePath) {
      await deleteObject(ref(storage, item.storagePath));
    }
    await deleteDoc(doc(db, COLLECTIONS.gallery, item.id));
  };

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
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="block text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-400/90 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-black"
          />
        </div>
        {uploading ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/60">
            Subiendo imagen...
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-white/50">
            Aun no hay imagenes en la galeria.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-3xl border border-white/10 bg-black/30"
            >
              {item.imageUrl ? (
                <div className="relative h-56 w-full">
                  <Image
                    src={item.imageUrl}
                    alt="Galeria"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center text-sm text-white/50">
                  Imagen no disponible
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
          ))
        )}
      </div>
    </section>
  );
}
