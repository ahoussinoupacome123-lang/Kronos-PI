import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { groundedAnswer, llmContext, type NexusAnswer } from "@/lib/nexus";
import { BRAND } from "@/lib/brand";

const SYSTEM = `Tu es Nexus, l'assistant de ${BRAND.name}, plateforme qui croise les réclamations de plusieurs émetteurs de monnaie électronique de l'UEMOA pour repérer les comptes mules et préparer les dossiers de litige PI-SPI.
Règles : réponds en français, en 4 phrases au plus, ton direct et professionnel. N'utilise QUE les faits du CONTEXTE ; si l'information n'y est pas, dis-le. Ne recommande jamais un gel automatique : la décision est humaine. Ne donne aucun chiffre absent du contexte.`;

export async function POST(req: Request) {
  if (!(await readSession())) return NextResponse.json({ error: "Session expirée. Reconnectez-vous." }, { status: 401 });

  let body: { message?: string; decided?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }
  const message = String(body.message ?? "").slice(0, 800).trim();
  if (!message) return NextResponse.json({ error: "Écrivez une question." }, { status: 400 });

  const grounded = groundedAnswer(message, Array.isArray(body.decided) ? body.decided : []);
  const base = process.env.LLM_BASE_URL;
  if (!base) return NextResponse.json(grounded satisfies NexusAnswer);

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.LLM_API_KEY ?? "local"}` },
      signal: AbortSignal.timeout(9000),
      body: JSON.stringify({
        model: process.env.LLM_MODEL ?? "Qwen/Qwen2.5-7B-Instruct-AWQ",
        temperature: 0.2,
        max_tokens: 280,
        messages: [
          { role: "system", content: `${SYSTEM}\nCONTEXTE : ${llmContext()}\nRÉPONSE DE RÉFÉRENCE (vérifiée) : ${grounded.text}` },
          { role: "user", content: message },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM ${res.status}`);
    const json = await res.json();
    const text: string | undefined = json?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("réponse vide");
    return NextResponse.json({ text, links: grounded.links, engine: "llm" } satisfies NexusAnswer);
  } catch {
    // Le LLM est injoignable : on répond quand même, à partir des seuls résultats.
    return NextResponse.json(grounded satisfies NexusAnswer);
  }
}
