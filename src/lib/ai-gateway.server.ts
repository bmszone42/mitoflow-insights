// Live catalog id (https://ai-gateway.vercel.sh/v1/models): text, image, and PDF.
const DEFAULT_MODEL = "openai/gpt-6-astra";

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function aiModelId(): string {
  return envValue("AI_GATEWAY_MODEL") ?? DEFAULT_MODEL;
}

// Local runs need AI_GATEWAY_API_KEY or a pulled OIDC token. On Vercel the
// gateway provider reads the deployment OIDC token itself.
export function aiConfigured(): boolean {
  return Boolean(
    envValue("AI_GATEWAY_API_KEY") ||
    envValue("VERCEL_OIDC_TOKEN") ||
    process.env["VERCEL"] === "1",
  );
}

export function aiNotConfiguredResponse(headers?: HeadersInit): Response {
  return Response.json(
    { error: "AI is not configured. Set the server AI_GATEWAY_API_KEY." },
    headers ? { status: 500, headers } : { status: 500 },
  );
}
