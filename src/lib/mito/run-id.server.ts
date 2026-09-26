const H = "X-Lovable-AIG-Run-ID";

// Captures the gateway-minted run id and resends it on follow-up calls in the same request.
export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(H)) headers.set(H, runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get(H)?.trim() || undefined;
      return res;
    },
  };
}
