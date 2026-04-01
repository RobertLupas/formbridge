import config from "./config";
import { sendResponseFromFields, formFieldsToText } from "./mailer";

const port = Bun.env.PORT || 3000;

Bun.serve({
    port: port,

    async fetch(req) {
        const url = new URL(req.url);

        if (req.method === "POST" && url.pathname.startsWith("/form/")) {
            const formId = url.pathname.split("/")[2];
            if (!formId) return new Response("Form ID not specified", { status: 400 });

            const form = config.forms[formId];
            if (!config.catchAll && !form) return new Response("Form not found", { status: 404 });

            if (!req.body) return new Response("Missing request body", { status: 400 });

            const formFields = await req.json() as Record<string, string>;

            if (formFields["_gotcha"]) return new Response("Spam detected", { status: 400 });

            console.log(`Received submission for \x1b[36m${formId}\x1b[0m: ${formFieldsToText(formFields, false, false)}`);
            await sendResponseFromFields(formId, formFields);

            return Response.redirect(form?.redirect || config.defaultRedirect, 302);
        }

        return new Response("Forbidden", { status: 403 });
    },
});

console.log(`FormBridge running on port ${port}`);