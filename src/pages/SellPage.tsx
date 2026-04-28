import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { categories } from "@/data/products";

const SellPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", price: "", category: categories[0].slug, campus: "UoN Main", description: "" });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price) {
      toast.error("Add a title and price");
      return;
    }
    toast.success("Listing submitted!", { description: "Our team will review it shortly. M-PESA payouts are instant." });
    navigate("/profile");
  };

  return (
    <PageShell title="Sell on CampusMart">
      <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-card p-5 shadow-card md:max-w-2xl">
        <Field label="Title">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Engineering Mathematics 5th Ed" className="input" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Price (KES)">
            <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="2500" className="input" />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Campus">
          <input value={form.campus} onChange={(e) => setForm({ ...form, campus: e.target.value })} className="input" />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Condition, contact, pickup details..." className="input" />
        </Field>
        <button className="rounded-full gradient-accent py-3 text-sm font-bold text-accent-foreground shadow-accent hover:scale-[1.01] transition">
          Post listing
        </button>
        <p className="text-center text-xs text-muted-foreground">Free to list · 0% commission for the first 30 days</p>
      </form>

      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:0.6rem 0.85rem;font-size:0.875rem;outline:none}.input:focus{box-shadow:0 0 0 2px hsl(var(--primary)/.4)}`}</style>
    </PageShell>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    {children}
  </label>
);

export default SellPage;
