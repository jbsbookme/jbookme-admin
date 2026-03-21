"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { COLLECTIONS, SHOP_DOC_ID } from "@/lib/collections";
import type { Shop } from "@/lib/types";

const emptyShop: Shop = {
  name: "",
  address: "",
  description: "",
  socials: {},
  imageUrl: "",
};

export default function ShopPage() {
  const [shop, setShop] = useState<Shop>(emptyShop);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const shopRef = doc(db, COLLECTIONS.shop, SHOP_DOC_ID);
      const snapshot = await getDoc(shopRef);
      if (snapshot.exists()) {
        setShop({ ...emptyShop, ...(snapshot.data() as Shop) });
      }
      setLoading(false);
    };

    load();
  }, []);

  const handleChange = (field: keyof Shop, value: string) => {
    setShop((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (field: keyof Shop["socials"], value: string) => {
    setShop((prev) => ({
      ...prev,
      socials: { ...prev.socials, [field]: value },
    }));
  };

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSaving(true);
    setMessage(null);

    const storageRef = ref(storage, `shop/${SHOP_DOC_ID}/cover`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setShop((prev) => ({ ...prev, imageUrl: url }));

    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const shopRef = doc(db, COLLECTIONS.shop, SHOP_DOC_ID);
    await setDoc(shopRef, shop, { merge: true });

    setSaving(false);
    setMessage("Cambios guardados.");
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
        Cargando datos del shop...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Shop</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Identidad del negocio
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Actualiza la informacion publica del salon y su presencia digital.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                Nombre
              </label>
              <input
                value={shop.name}
                onChange={(event) => handleChange("name", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                Direccion
              </label>
              <input
                value={shop.address}
                onChange={(event) => handleChange("address", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">
              Descripcion
            </label>
            <textarea
              rows={5}
              value={shop.description}
              onChange={(event) =>
                handleChange("description", event.target.value)
              }
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Redes sociales
          </p>
          {(
            [
              "instagram",
              "facebook",
              "tiktok",
              "whatsapp",
              "website",
            ] as const
          ).map((social) => (
            <div key={social} className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                {social}
              </label>
              <input
                value={shop.socials[social] ?? ""}
                onChange={(event) =>
                  handleSocialChange(social, event.target.value)
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.6fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Imagen principal
          </p>
          {shop.imageUrl ? (
            <div className="relative h-56 overflow-hidden rounded-2xl border border-white/10">
              <Image
                src={shop.imageUrl}
                alt="Shop"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 50vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-white/15 text-sm text-white/50">
              Sin imagen cargada
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-400/90 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-black"
          />
        </div>
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Guardar cambios
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl bg-emerald-400/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Guardando..." : "Guardar informacion"}
          </button>
          {message ? (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
