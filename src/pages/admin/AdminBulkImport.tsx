import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Upload, Download, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminPost } from "@/utils/adminApi";
import { toast } from "sonner";

// Kept in sync with src/data/products.ts's `categories` array.
const VALID_CATEGORIES = [
  { slug: "phones", name: "Phones & Accessories" },
  { slug: "electronics", name: "Electronics" },
  { slug: "computing", name: "Computing" },
  { slug: "appliances", name: "Appliances" },
  { slug: "fashion", name: "Fashion" },
  { slug: "home", name: "Home & Kitchen" },
  { slug: "beauty", name: "Health & Beauty" },
  { slug: "baby", name: "Baby & Kids" },
  { slug: "gaming", name: "Gaming" },
  { slug: "watches", name: "Watches & Jewellery" },
];
const VALID_SLUGS = new Set(VALID_CATEGORIES.map((c) => c.slug));

const TEMPLATE_COLUMNS = [
  "title", "description", "category", "price", "original_price", "image_url", "quantity_available", "location",
];

interface ParsedRow {
  title: string;
  description: string;
  category: string;
  price: number;
  original_price?: number;
  image_url?: string;
  quantity_available?: number;
  location?: string;
  rowNum: number;
  issue?: string;
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: { row: number; title: string; error: string }[];
}

// Minimal CSV parser - handles quoted fields (with embedded commas/quotes/
// newlines) and plain unquoted fields. Good enough for a spreadsheet export
// without pulling in a whole CSV library dependency.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field); field = "";
    } else if (char === "\r") {
      // skip, \n handles the line break
    } else if (char === "\n") {
      row.push(field); field = "";
      rows.push(row); row = [];
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const AdminBulkImport = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const downloadTemplate = () => {
    const sample = [
      TEMPLATE_COLUMNS.join(","),
      [
        "Stainless Steel Cooking Pot Set (5pcs)",
        "\"Durable stainless steel cookware set, 5 pieces of varying sizes, suitable for gas and electric stoves.\"",
        "home",
        "3500",
        "4500",
        "",
        "10",
        "Nairobi",
      ].join(","),
    ].join("\n");

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campusmart-bulk-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFile = (file: File) => {
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const table = parseCSV(text);
      if (table.length < 2) {
        toast.error("That file has no data rows");
        setRows([]);
        return;
      }

      const header = table[0].map((h) => h.trim().toLowerCase());
      const idx = (col: string) => header.indexOf(col);

      const parsed: ParsedRow[] = table.slice(1).map((cells, i) => {
        const get = (col: string) => {
          const c = idx(col);
          return c === -1 ? "" : (cells[c] || "").trim();
        };

        const category = get("category").toLowerCase();
        const price = parseFloat(get("price"));
        const title = get("title");

        let issue: string | undefined;
        if (!title) issue = "Missing title";
        else if (!get("description")) issue = "Missing description";
        else if (!category) issue = "Missing category";
        else if (!VALID_SLUGS.has(category)) issue = `Unknown category "${category}"`;
        else if (!price || price <= 0) issue = "Missing or invalid price";

        return {
          title,
          description: get("description"),
          category,
          price,
          original_price: get("original_price") ? parseFloat(get("original_price")) : undefined,
          image_url: get("image_url") || undefined,
          quantity_available: get("quantity_available") ? parseInt(get("quantity_available"), 10) : undefined,
          location: get("location") || undefined,
          rowNum: i + 2,
          issue,
        };
      });

      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const validRows = rows.filter((r) => !r.issue);
  const invalidRows = rows.filter((r) => r.issue);

  const runImport = async () => {
    if (validRows.length === 0) return;
    setIsImporting(true);
    setResult(null);
    try {
      const response = await adminPost("/api/admin/bulk-import", {
        products: validRows.map(({ rowNum, issue, ...rest }) => rest),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed");

      setResult({ imported: data.imported, failed: data.failed, errors: data.errors || [] });
      if (data.imported > 0) {
        toast.success(`Imported ${data.imported} product${data.imported === 1 ? "" : "s"}`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} row${data.failed === 1 ? "" : "s"} failed - see details below`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">Bulk Import Products</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Upload a CSV file of products - each row becomes one listing, filed into the right category automatically.
          </p>
        </div>

        {/* Template + column reference */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">1. Get the CSV template</h2>
            <button
              onClick={downloadTemplate}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-all text-sm font-semibold"
            >
              <Download className="h-4 w-4" /> Download template
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Columns (first row of the file, any order):
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {TEMPLATE_COLUMNS.map((c) => (
              <span key={c} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-900 text-xs font-mono">
                {c}{["title", "description", "category", "price"].includes(c) ? "*" : ""}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">* required. Prices are in KES. Valid category values:</p>
          <div className="flex flex-wrap gap-2">
            {VALID_CATEGORIES.map((c) => (
              <span key={c.slug} className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                {c.slug} <span className="opacity-70">({c.name})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">2. Upload your file</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-sm font-semibold text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Upload className="h-5 w-5" />
            {fileName || "Click to choose a CSV file"}
          </button>
        </div>

        {/* Preview */}
        {rows.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white">
                3. Review ({validRows.length} ready{invalidRows.length > 0 ? `, ${invalidRows.length} need fixing` : ""})
              </h2>
              <button
                onClick={runImport}
                disabled={isImporting || validRows.length === 0}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-semibold text-sm"
              >
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isImporting ? "Importing..." : `Import ${validRows.length} product${validRows.length === 1 ? "" : "s"}`}
              </button>
            </div>

            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-2">Row</th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.rowNum} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-2 text-gray-500">{r.rowNum}</td>
                      <td className="p-2 max-w-[220px] truncate">{r.title || "—"}</td>
                      <td className="p-2">{r.category || "—"}</td>
                      <td className="p-2">{r.price ? `KES ${r.price.toLocaleString()}` : "—"}</td>
                      <td className="p-2">
                        {r.issue ? (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> {r.issue}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white mb-3">Import result</h2>
            <div className="flex gap-4 mb-3">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                <CheckCircle2 className="h-4 w-4" /> {result.imported} imported
              </span>
              {result.failed > 0 && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
                  <XCircle className="h-4 w-4" /> {result.failed} failed
                </span>
              )}
            </div>
            {result.errors.length > 0 && (
              <ul className="space-y-1 text-xs text-red-600">
                {result.errors.map((e, i) => (
                  <li key={i}>Row {e.row} ({e.title}): {e.error}</li>
                ))}
              </ul>
            )}
            <Link to="/admin/products" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
              View products →
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBulkImport;
