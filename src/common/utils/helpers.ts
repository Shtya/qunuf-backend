
export function trimText(text: string, limit: number = 30): string {
    if (!text) return '';
    return text.length > limit
        ? `${text.substring(0, limit)}...`
        : text;
}