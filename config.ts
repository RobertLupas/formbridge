import { type Config } from "./types";

export default {
    "smtp": {
        "host": "smtp.example.com",
        "port": 587,
        "auth": {
            "user": "formbridge@example.com",
            "pass": "password"
        }
    },
    "defaultTo": "company@example.com",
    "defaultSource": "example.com",
    "defaultSubjectPrefix": "[Form Submission]",
    "defaultRedirect": "/",
    "catchAll": false,
    "forms": {
        "contact": {}
    }
} as Config;
