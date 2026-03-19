import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "social-media-assets";

/** Sanitise a filename so Supabase doesn't reject it. */
function safeName(name: string): string {
  return name
    .replace(/[^\w.\-]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 });
  }

  const files = formData.getAll("files") as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }

  // Optional: tag by userId extracted from clerk token (for path namespacing only).
  // We don't validate the token here — that's the backend's job when scheduling.
  const authHeader = request.headers.get("authorization") || "";
  const userId = extractUserIdFromJwt(authHeader) ?? "anon";

  const results: UploadResult[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!file || typeof file.name !== "string") continue;

    const timestamp = Date.now();
    const objectPath = `social-posts/${userId}/${timestamp}_${safeName(file.name)}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      errors.push(`${file.name}: ${uploadError.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(objectPath);

    results.push({
      mediaId: crypto.randomUUID(),
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      objectPath,
      mediaUrl: urlData.publicUrl,
    });
  }

  if (results.length === 0) {
    return NextResponse.json(
      { error: "All uploads failed.", details: errors },
      { status: 500 }
    );
  }

  return NextResponse.json({
    items: results,
    ...(errors.length > 0 ? { partialErrors: errors } : {}),
  });
}

interface UploadResult {
  mediaId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  objectPath: string;
  mediaUrl: string;
}

/**
 * Best-effort extraction of Clerk's `sub` claim from a JWT for path namespacing.
 * We never trust this for auth — just for organising storage paths.
 */
function extractUserIdFromJwt(authHeader: string): string | null {
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return null;
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    );
    return typeof payload?.sub === "string"
      ? payload.sub.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64)
      : null;
  } catch {
    return null;
  }
}
