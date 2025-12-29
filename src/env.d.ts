/// <reference types="astro/client" />

interface Env {
    DB: import("@cloudflare/workers-types").D1Database;
    RESEND_API_KEY: string;
}

declare namespace App {
    interface Locals {
        runtime?: {
            env: Env;
            cf: import("@cloudflare/workers-types").CfProperties;
            ctx: import("@cloudflare/workers-types").ExecutionContext;
        };
    }
}
