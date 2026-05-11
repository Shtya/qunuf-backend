
export function trimText(text: string, limit: number = 30): string {
    if (!text) return '';
    return text.length > limit
        ? `${text.substring(0, limit)}...`
        : text;
}


export function generateSlugHelper(title: string): string {
    // 1. Create the base slug using your logic
    const baseSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, '') // Unicode support
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    return baseSlug;
}
