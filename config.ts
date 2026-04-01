import { type Config } from "./types";

export default {
    "service": "gmail",
    "defaultTo": "company@example.com",
    "defaultSource": "example.com",
    "defaultSubjectPrefix": "[Form Submission]",
    "defaultRedirect": "/",
    "catchAll": false,
    "forms": {
        "contact": {}
    }
} as Config;
