# FormBridge

> A small, [Bun](https://bun.sh)-based service that bridges form submissions to your email inbox.

It's like a self-hosted [Formsubmit](https://formsubmit.co/).

FormBridge is designed to receive POST requests directly from your frontend.

## What it does

- Accepts form submissions (HTML forms or JSON POST requests)
- Validates and normalizes incoming fields
- Forwards the submission to an email inbox (webhook endpoint support is WIP)
- Can be configured to either redirect to a specific URL or return a success/failure JSON response for UI feedback

## Quick start

### 1) Run locally (dev mode)

1. Clone the repo:
   ```bash
   git clone https://github.com/RobertLupas/formbridge.git
   cd formbridge
   ```

2. Configure settings and environment variables (see [**Configuration**](#configuration) below).

3. Install dependencies and start:
   ```bash
   bun install
   bun dev
   ```
   
   Use `bun start` for production use.

### 2) Send a test submission

#### Form-encoded
```bash
curl -X POST "http://localhost:3000/form/contact" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "name=Jane Doe" \
  --data-urlencode "email=jane@example.com" \
  --data-urlencode "message=Hello"
```

#### JSON
```bash
curl -X POST "http://localhost:3000/form/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "message": "Hello"
  }'
```

⚠️ This is only for testing. See bellow for production use.

## Configuration

FormBridge is configured in [config.ts](config.ts). The app uses environment variables for secrets and runtime settings, with the exported config object controlling form-specific behavior.

### Environment variables

| Variable | Required | Used for |
| --- | --- | --- |
| `PORT` | No | HTTP port for the Bun server. Defaults to `3000`. |
| `NODE_ENV` | No | Set to `development` to disable origin checks and rate limiting. |
| `SMTP_USER` | Yes, unless `smtp.auth.user` is set | SMTP username / sender email address. |
| `SMTP_HOST` | Yes for non-Gmail SMTP, unless `smtp.host` is set | SMTP host when using generic SMTP. |
| `SMTP_PORT` | Yes for non-Gmail SMTP, unless `smtp.port` is set | SMTP port when using generic SMTP. |
| `SMTP_PASSWORD` | Yes, unless `smtp.auth.pass` is set | SMTP password or Google App Password (for Gmail). |

### Config object

The exported config has this shape:

```ts
{
  service?: "gmail";
  smtp?: {
    host?: string;
    port?: number;
    auth: {
      user?: string;
      pass?: string;
    };
  };
  defaultTo: string;
  defaultSource: string;
  defaultSubjectPrefix?: string;
  defaultRedirect?: string;
  catchAll: boolean;
  rateLimit?: number;
  forms: Record<string, {
    to?: string;
    source?: string | string[];
    subjectPrefix?: string;
    redirect?: string;
  }>;
}
```

### Fields

`service`
: When set to `"gmail"`, FormBridge uses Gmail transport and expects a Gmail app password. Any other value falls back to generic SMTP.

`smtp`
: Optional SMTP overrides. `smtp.auth.user` and `smtp.auth.pass` replace the `SMTP_USER` and `SMTP_PASSWORD` environment variables. `smtp.host` and `smtp.port` replace `SMTP_HOST` and `SMTP_PORT` in the generic SMTP path.

`defaultTo`
: Default recipient address used when a form does not define its own `to` value.

`defaultSource`
: Default allowed origin for spam checks. A request origin must match this value, or one of the values in a form-specific `source` list, unless `NODE_ENV=development`. Use full origins such as `https://example.com`, because the code compares against the request `Origin` header.

`defaultSubjectPrefix`
: Optional prefix added to the generated email subject when a form does not define its own `subjectPrefix`.

`defaultRedirect`
: Fallback redirect target after a successful submission. Leave null for JSON responses.

`catchAll`
: When `false`, requests to unknown form IDs return a 404. When `true`, unknown forms are accepted and use default email and redirect settings.

`rateLimit`
: Maximum number of requests allowed per IP within the 5-minute rate-limit window. Defaults to `5`. Set to `0` to disable rate limiting.

`forms`
: Map of form IDs to per-form overrides. Each key becomes the form ID used in the request path `/form/:id`.

Per-form fields:

`to`
: Overrides `defaultTo` for that form.

`source`
: Overrides `defaultSource` for origin checks. Use a string for one allowed origin or an array for multiple allowed origins.

`subjectPrefix`
: Overrides `defaultSubjectPrefix` for that form.

`redirect`
: Overrides `defaultRedirect` for that form.

### Example

See the config.ts file for the default configuration.

## Usage

### HTML Form

**Example HTML form:**

```html
<form method="post" action="https://formbridge.example.com/form-name">
    <input type="email" name="from" placeholder="Email"/>
    <input type="text" name="name" placeholder="Name" />
    <input type="text" name="subject" placeholder="Subject" />
    <input type="text" name="_gotcha" style="display:none">
    <textarea name="message" placeholder="Your message"></textarea>
    <button type="submit">Send</button>
</form>
```

### Response behavior

After submission, the server responds based on your config:

- **Success (2xx)**: If `redirect` is configured, the user is redirected. Otherwise, you receive a JSON response: `{ "success": true, "message": "Submission received" }`
- **Failure (4xx/5xx)**: Returns JSON: `{ "success": false, "message": "error description" }`

Common errors:
- `400 Bad Request`: Missing required fields or validation failed.
- `403 Forbidden`: Origin not allowed or rate limit exceeded.
- `404 Not Found`: Unknown form ID (if `catchAll` is false).

## Antispam

Include a `<input type="text" name="_gotcha" style="display:none">`. Bots will fill it, and the submission will be ignored.

## Deployment

### Requirements
- Bun runtime installed
- Valid SMTP credentials (Gmail app password or SMTP server)
- Public HTTPS domain (required for form origins)

### Steps
1. Clone the repo and edit [config.ts](config.ts) with your form definitions and email settings.
2. Set environment variables (`SMTP_USER`, `SMTP_PASSWORD`, etc.) on your hosting platform.
3. Deploy the repository. FormBridge runs as a standard Bun HTTP server (use `bun run start`).
4. Ensure your forms send requests to `https://your-domain.com/form/:id` and that the form's origin matches your configured `source` values.

## Contribution

Feel free to create issues and pull requests if you want! For new features create an issue first.