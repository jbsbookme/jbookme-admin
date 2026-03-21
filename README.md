# JBookme Admin

Panel administrativo con Next.js App Router, Tailwind y Firebase (Auth, Firestore, Storage).

## Requisitos

- Node.js 18+.
- Proyecto de Firebase configurado con Auth, Firestore y Storage.

## Configuracion

1. Completa las variables en `.env.local` con tu proyecto de Firebase.
2. Asegura que el usuario admin tenga `users/{uid}.role = "admin"`.
3. Publica las reglas en `firestore.rules` y `storage.rules`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Colecciones Firestore

- `users/{uid}` con `role`.
- `shop/primary` con datos del negocio.
- `barbers/*`.
- `services/*`.
- `gallery/*`.
- `bookings/*`.
