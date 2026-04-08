interface FormConfig {
    to?: string;
    source?: string | string[];
    subjectPrefix?: string;
    redirect?: string;
}

interface SmtpConfig {
    host?: string;
    port?: number;
    auth: {
        user?: string;
        pass?: string;
    };
}

export interface Config {
    service?: "gmail";
    smtp?: SmtpConfig;
    defaultTo: string;
    defaultSource: string;
    defaultSubjectPrefix?: string;
    defaultRedirect: string;
    catchAll: boolean;
    noHonetpot?: boolean;
    rateLimit?: number;
    forms: Record<string, FormConfig>;
}
