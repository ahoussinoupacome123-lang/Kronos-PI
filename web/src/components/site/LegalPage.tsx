import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteFooter, SiteHeader } from "./SiteChrome";

export async function readLegal(slug: "cgu" | "confidentialite" | "mentions-legales") {
  "use cache";
  return readFile(join(process.cwd(), "content", "legal", `${slug}.md`), "utf-8");
}

export default async function LegalPage({ slug }: { slug: "cgu" | "confidentialite" | "mentions-legales" }) {
  const md = await readLegal(slug);
  const others = [
    ["/cgu", "Conditions d'utilisation"],
    ["/confidentialite", "Confidentialité"],
    ["/mentions-legales", "Mentions légales"],
  ].filter(([href]) => href !== `/${slug}`);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1fr_15rem]">
        <article className="legal max-w-[72ch]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
        </article>
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-sm font-medium text-ink">Autres documents</p>
          <ul className="mt-3 space-y-2">
            {others.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-sm text-slate underline hover:text-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 rounded-2xl border border-paper-line bg-paper-2 p-4 text-xs leading-relaxed text-slate">
            Documents de prototype, rédigés pour le GPU Challenge 2026. Ils doivent être relus par un juriste avant tout
            pilote sur données réelles.
          </p>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
