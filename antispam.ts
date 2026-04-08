import config from "./config";

/** Anti-spam measure
 * 
 * Use `<input type="text" name="_gotcha" style="display:none">` in your form to implement this.
 * 
 * @returns true if the form submission is spam, false otherwise.
 */
function gotcha(formFields: Record<string, string>) {
    return !!formFields["_gotcha"];
}


function originCheck(req: Request, formName: string) {
    if (Bun.env.NODE_ENV === "development") return false; // Skip origin check in development mode
    const origin = req.headers.get("origin");
    if (!origin) return false;
    const allowedOrigins = config.forms[formName]?.source || config.defaultSource;

    return Array.isArray(allowedOrigins)
        ? allowedOrigins.includes(origin)
        : allowedOrigins === origin;
}

export function isSpam(formFields: Record<string, string>, req: Request, formName: string) {
    return (gotcha(formFields) || originCheck(req, formName));
}