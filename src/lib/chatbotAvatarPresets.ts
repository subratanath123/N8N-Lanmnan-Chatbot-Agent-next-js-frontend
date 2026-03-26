/**
 * Self-hosted preset avatars (public/chatbot-avatars/*.svg) so the picker always shows
 * six clearly different icons — no external API, no identical fallbacks.
 * Use relative paths in UI; convert to absolute URLs on save so embedded widgets load correctly.
 */
export const AVATAR_FALLBACK_DATA_URI = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#e2e8f0"/><text x="50" y="68" font-size="52" text-anchor="middle">🤖</text></svg>'
)}`;

/** Relative paths — work in Next.js public/ and in the creation form img src */
export const PRESET_AI_AVATARS = [
    { id: 'preset-1', url: '/chatbot-avatars/preset-1.svg', label: 'Blue bot' },
    { id: 'preset-2', url: '/chatbot-avatars/preset-2.svg', label: 'Green chat' },
    { id: 'preset-3', url: '/chatbot-avatars/preset-3.svg', label: 'Purple headset' },
    { id: 'preset-4', url: '/chatbot-avatars/preset-4.svg', label: 'Orange star' },
    { id: 'preset-5', url: '/chatbot-avatars/preset-5.svg', label: 'Pink face' },
    { id: 'preset-6', url: '/chatbot-avatars/preset-6.svg', label: 'Teal badge' },
];

export const DEFAULT_AI_AVATAR_URL = PRESET_AI_AVATARS[0].url;

/** True if this URL is one of our bundled presets (relative or absolute). */
export function isBundledPresetAvatarUrl(url: string | undefined | null): boolean {
    if (!url || typeof url !== 'string') return false;
    return PRESET_AI_AVATARS.some((a) => url === a.url || url.endsWith(a.url));
}

/** Persist as absolute URL so embed/widget on other domains can load the image */
export function toAbsoluteAvatarUrlIfNeeded(url: string): string {
    if (!url || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }
    if (typeof window !== 'undefined' && url.startsWith('/')) {
        return `${window.location.origin}${url}`;
    }
    return url;
}
