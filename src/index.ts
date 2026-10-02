export interface Env {
  FIREBASE_DB_URL: string;
  FIREBASE_DB_SECRET: string;
  ASSETS: Fetcher;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function badRequest(message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function asStringArray(value: unknown, max = 20): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length <= 200)
    .slice(0, max);
}

function asString(value: unknown, max = 2000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname === "/api/submit") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === "/api/submit" && request.method === "POST") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return badRequest("Ongeldige JSON");
      }

      if (typeof body !== "object" || body === null) {
        return badRequest("Ongeldige payload");
      }
      const b = body as Record<string, unknown>;

      const naam = asString(b.naam, 200);
      if (!naam) {
        return badRequest("Naam is verplicht");
      }

      const hasConfig = asString(b.has_config, 20);
      const voorkeur = asString(b.voorkeur, 20);

      const payload = {
        naam,
        tools: asStringArray(b.tools),
        has_config: ["Ja", "Nee"].includes(hasConfig) ? hasConfig : "",
        config_detail: asString(b.config_detail, 4000),
        use_cases: asStringArray(b.use_cases),
        goed: asString(b.goed, 4000),
        slecht: asString(b.slecht, 4000),
        voorkeur: ["Opt-in", "Verplicht", "Geen mening"].includes(voorkeur) ? voorkeur : "",
        timestamp: new Date().toISOString(),
      };

      const dbUrl = `${env.FIREBASE_DB_URL}/ai_inventarisatie.json?auth=${env.FIREBASE_DB_SECRET}`;

      let fbRes: Response;
      try {
        fbRes = await fetch(dbUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        return new Response(JSON.stringify({ ok: false, error: "Firebase niet bereikbaar" }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      if (!fbRes.ok) {
        return new Response(
          JSON.stringify({ ok: false, error: `Firebase schrijven mislukt (${fbRes.status})` }),
          { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders() } }
        );
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // Static assets (the form itself)
    return env.ASSETS.fetch(request);
  },
};
