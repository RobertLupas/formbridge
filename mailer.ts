import nodemailer from "nodemailer";
import config from "./config";
import { capitalizeFirstLetter } from "./util";

var transporter: nodemailer.Transporter;

const user = config.smtp?.auth.user || Bun.env.USER as string;
if (!user) throw new Error("SMTP user is not defined. Please provide it in the configuration or set the USER environment variable.");

switch (config.service) {
    case "gmail": {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: user,
                pass: config.smtp?.auth.pass || Bun.env.GOOGLE_APP_PASSWORD,
            },
        });
        break;
    }
    default: {
        const host = config.smtp?.host || Bun.env.SMTP_HOST;
        const port = config.smtp?.port || parseInt(Bun.env.SMTP_PORT as string);
        const pass = config.smtp?.auth.pass || Bun.env.PASSWORD as string;
        if (!host || !port || !pass) throw new Error("SMTP configuration is incomplete. Please provide host, port, and auth in the configuration.");

        transporter = nodemailer.createTransport({
            host: host,
            port: port,
            auth: {
                user: user,
                pass: pass,
            },
        });
        break;
    }
}

export function formFieldsToText(formFields: Record<string, string>, formatText: boolean = false, addNewline: boolean = true): string {
    let text = "";
    for (const [key, value] of Object.entries(formFields))
        text += `${formatText ? `**${key}**: ` : `${key}: `}${value}${addNewline ? "\n" : "; "}`;
    return text;
}

function formFieldsToHtml(formName: string, formFields: Record<string, string>, source?: string | undefined): string {
    let html = `<h1>New <i>${capitalizeFirstLetter(formName)}</i> Form Submission ${source ? `(on ${source})` : ""}</h1><h2>Fields:</h2><ul>`;
    for (const [key, value] of Object.entries(formFields))
        html += `<li><strong>${key}:</strong> ${value}</li>`;
    html += "</ul>";
    return html;
}

export async function sendResponseFromFields(formName: string, formFields: Record<string, string>, source?: string | undefined) {
    const form = config.forms[formName];

    try {
        await transporter.sendMail({
            from: { name: `${capitalizeFirstLetter(formName)} ${source ? "(on " + source + ")" : ""}`, address: user },
            to: form?.to || config.defaultTo,
            subject: `${form?.subjectPrefix ?? config.defaultSubjectPrefix ?? ""} New ${capitalizeFirstLetter(formName)} Form Submission`,
            html: formFieldsToHtml(formName, formFields, source)
        });
    } catch (error) {
        console.error(`Failed to send email for form "${formName}":`, error);
        throw error;
    }
}
