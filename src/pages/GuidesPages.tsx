import { Link, useParams } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { findGuide, guides } from "@/data/guides";
import NotFound from "@/pages/NotFound";

export const GuidesIndexPage = () => (
  <PageShell title="Shopping guides">
    <div className="mx-auto max-w-3xl space-y-3">
      <p className="text-sm text-muted-foreground">Practical advice from the CampusMart team to help you buy well and stay safe online.</p>
      {guides.map((g) => (
        <Link key={g.slug} to={`/guides/${g.slug}`} className="block rounded-2xl bg-card p-5 shadow-card transition hover:shadow-elevated">
          <h2 className="text-base font-extrabold">{g.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{g.summary}</p>
          <span className="mt-2 inline-block text-sm font-bold text-accent">Read the guide</span>
        </Link>
      ))}
    </div>
  </PageShell>
);

export const GuidePage = () => {
  const { slug = "" } = useParams();
  const guide = findGuide(slug);
  if (!guide) return <NotFound />;
  return (
    <PageShell title={guide.title}>
      <article className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-card p-6 text-sm leading-relaxed shadow-card">
        <p className="text-muted-foreground">{guide.summary}</p>
        {guide.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mb-2 text-base font-extrabold">{s.heading}</h2>
            {s.paragraphs?.map((p, i) => <p key={i} className="mb-2">{p}</p>)}
            {s.bullets && (
              <ul className="list-disc space-y-1 pl-5">
                {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}
        <p className="border-t border-border pt-4">
          Ready to shop? <Link to="/categories" className="font-semibold text-accent underline">Browse all categories</Link> or read more{" "}
          <Link to="/guides" className="font-semibold text-accent underline">shopping guides</Link>.
        </p>
      </article>
    </PageShell>
  );
};
