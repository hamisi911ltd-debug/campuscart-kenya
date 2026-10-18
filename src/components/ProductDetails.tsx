import { Check } from "lucide-react";

const HEADINGS = ["Specifications", "Available options", "In the box"];

interface Section {
  title: string;
  lines: string[];
}

/** Splits the stored description (intro paragraphs, then optional headed sections) for display. */
function parseDescription(description: string): { intro: string[]; sections: Section[] } {
  const intro: string[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const raw of description.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (HEADINGS.includes(line)) {
      current = { title: line, lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line.replace(/^[•\-*]\s*/, ""));
    } else {
      intro.push(line);
    }
  }
  return { intro, sections: sections.filter((s) => s.lines.length > 0) };
}

/** The "more details" block shown under a product when it is opened. Renders nothing without details. */
export const ProductDetails = ({ description }: { description?: string | null }) => {
  if (!description || description.trim().length < 20) return null;
  const { intro, sections } = parseDescription(description);
  if (intro.length === 0 && sections.length === 0) return null;

  return (
    <section className="mt-8 space-y-5 rounded-2xl bg-card p-5 shadow-card">
      <h2 className="text-lg font-extrabold">Product details</h2>
      {intro.length > 0 && (
        <div className="space-y-2 text-sm leading-relaxed text-foreground/90">
          {intro.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">{section.title}</h3>
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {section.lines.map((line, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
};
