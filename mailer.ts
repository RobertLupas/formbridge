import nodemailer from "nodemailer";
import config from "./config";
import { capitalizeFirstLetter } from "./util";

const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
    },
});

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
            from: { name: `${capitalizeFirstLetter(formName)} ${source ? "(on " + source + ")" : ""}`, address: config.smtp.auth.user },
            to: form?.to || config.defaultTo,
            subject: `${form?.subjectPrefix ?? config.defaultSubjectPrefix ?? ""} New ${capitalizeFirstLetter(formName)} Form Submission`,
            html: formFieldsToHtml(formName, formFields, source)
        });
    } catch (error) {
        console.error(`Failed to send email for form "${formName}":`, error);
        throw error;
    }
}
