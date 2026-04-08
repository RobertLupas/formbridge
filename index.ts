import config from "./config";
import { sendResponseFromFields, formFieldsToText } from "./mailer";
import { rateLimit } from "./ratelimit";
import { isSpam } from "./antispam";

if (Bun.env.NODE_ENV === "development")
    console.warn("Running in development mode. Make sure to set NODE_ENV=production in production environments.\nDev mode disables orig checks and rate limiting.");

const port = Bun.env.PORT || 3000;

async function parseFormFields(req: Request): Promise<Record<string, string>> {
    const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";

    if (contentType.includes("application/json")) {
        const payload = await req.json();
        if (!payload || typeof payload !== "object" || Array.isArray(payload))
            throw new Error("Invalid JSON payload");

        return Object.fromEntries(
            Object.entries(payload as Record<string, unknown>).map(([key, value]) => [key, String(value ?? "")])
        );
    }

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const fields: Record<string, string> = {};

        for (const [key, value] of formData.entries())
            fields[key] = typeof value === "string" ? value : value.name;

        return fields;
    }

    throw new Error(`Unsupported content type: ${contentType || "unknown"}`);
}

Bun.serve({
    port: port,

    async fetch(req) {
        if (rateLimit(req)) return new Response("Too Many Requests", { status: 429 });

        const url = new URL(req.url);

        if (req.method === "POST" && url.pathname.startsWith("/form/")) {
            const formId = url.pathname.split("/")[2];
            if (!formId) return new Response("Form ID not specified", { status: 400 });

            const form = config.forms[formId];
            if (!config.catchAll && !form) return new Response("Form not found", { status: 404 });

            if (!req.body) return new Response("Missing request body", { status: 400 });

            let formFields: Record<string, string>;
            try {
                formFields = await parseFormFields(req);
            } catch(error) {
                console.error("Failed to parse form fields:", error);
                return new Response("Invalid request body", { status: 400 });
            }

            if (isSpam(formFields, req, formId)) return new Response("Spam detected", { status: 400 });

            console.log(`Received submission for \x1b[36m${formId}\x1b[0m: ${formFieldsToText(formFields, false, false)}`);
            await sendResponseFromFields(formId, formFields, req.headers.get("referer") || undefined);

            return Response.redirect(form?.redirect || config.defaultRedirect, 303);
        }

        return new Response("Forbidden", { status: 403 });
    },
});

console.log(`FormBridge running on port ${port}`);