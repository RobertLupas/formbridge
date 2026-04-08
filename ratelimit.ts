import config from "./config";

interface HitEntry {
    count: number;
    start: number;
}

const ipHits = new Map<string, HitEntry>();

const WINDOW_MS = 60 * 1000 * 5; // 5 minutes
const MAX_REQUESTS = config.rateLimit ?? 5;

function getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (!forwarded) return "unknown";

    // x-forwarded-for may contain a comma-separated list of proxies.
    return forwarded.split(",")[0]?.trim() || "unknown";
}

export function rateLimit(req: Request): boolean {
    if (MAX_REQUESTS <= 0 || Bun.env.NODE_ENV === "development") return false; // Rate limiting disabled
    const ip = getClientIp(req);

    const now = Date.now();
    const entry = ipHits.get(ip) || { count: 0, start: now };

    if (now - entry.start > WINDOW_MS) {
        // Reset window
        entry.count = 0;
        entry.start = now;
    }

    entry.count++;
    ipHits.set(ip, entry);

    return entry.count > MAX_REQUESTS;
}

function cleanupExpiredEntries(): void {
    for (const [ip, data] of ipHits)
        if (Date.now() - data.start > WINDOW_MS)
            ipHits.delete(ip);
}

if (MAX_REQUESTS > 0) setInterval(cleanupExpiredEntries, WINDOW_MS);