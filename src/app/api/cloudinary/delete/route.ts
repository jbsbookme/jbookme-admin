import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

type DeletePayload = {
  publicId?: string;
  resourceType?: "image" | "video";
};

export async function POST(request: Request) {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return NextResponse.json(
      { error: "Cloudinary env vars are missing." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as DeletePayload;
  if (!body.publicId) {
    return NextResponse.json(
      { error: "publicId is required." },
      { status: 400 }
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signatureBase = `public_id=${body.publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(signatureBase + API_SECRET)
    .digest("hex");

  const resourceType = body.resourceType === "video" ? "video" : "image";
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`;

  const form = new URLSearchParams();
  form.set("public_id", body.publicId);
  form.set("timestamp", String(timestamp));
  form.set("api_key", API_KEY);
  form.set("signature", signature);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to delete Cloudinary asset." },
      { status: 502 }
    );
  }

  const data = (await response.json()) as { result?: string };

  return NextResponse.json({ result: data.result ?? "ok" });
}
