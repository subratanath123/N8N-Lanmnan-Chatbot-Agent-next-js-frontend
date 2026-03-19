import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
  );
}

/** Browser-safe Supabase client (anon / publishable key). */
export const supabase = createClient(supabaseUrl, supabaseKey);

/** Name of the Supabase Storage bucket used for social-media post assets.
 *  Create this bucket in the Supabase dashboard and set it to PUBLIC. */
export const SOCIAL_MEDIA_BUCKET = "social-media-assets";

/** Build the public URL for an already-uploaded object path. */
export function getPublicUrl(objectPath: string): string {
  const { data } = supabase.storage
    .from(SOCIAL_MEDIA_BUCKET)
    .getPublicUrl(objectPath);
  return data.publicUrl;
}
