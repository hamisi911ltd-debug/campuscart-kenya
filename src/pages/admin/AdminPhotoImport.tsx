import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Upload, ArrowLeft, CheckCircle2, XCircle, Loader2, Sparkles, Trash2, ImageOff,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminPost } from "@/utils/adminApi";
import { uploadImage } from "@/lib/uploadImage";
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

type RowStatus = "pending" | "analyzing" | "ready" | "error" | "duplicate" | "importing" | "imported" | "import_failed";

interface PhotoRow {
  id: string;
  file: File;
  thumbnail: string;
  status: RowStatus;
  title: string;
  description: string;
  category: string;
  price: string;
  original_price: string;
  quantity_available: string;
  include: boolean;
  error?: string;
  needsReview?: boolean;
}

interface ImportSummary {
  imported: number;
  failed: number;
  errors: { row: number; title: string; error: string }[];
}

const CONCURRENCY = 3;
const DHASH_DISTANCE_THRESHOLD = 6; // out of 64 bits - conservative, avoids merging genuinely different items

function loadImageEl(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => resolve(img);
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// Difference hash: resize to 9x8 grayscale, compare adjacent pixels
// horizontally -> 64-bit fingerprint. Two photos of the same item taken a
// moment apart (or literally re-saved) land close in Hamming distance;
// genuinely different products don't.
async function computeDHash(file: File): Promise<bigint> {
  const img = await loadImageEl(file);
  const w = 9, h = 8;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(img.src);
  const { data } = ctx.getImageData(0, 0, w, h);

  const gray: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push((data[i] + data[i + 1] + data[i + 2]) / 3);
  }

  let hash = 0n;
  let bit = 0n;
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w - 1; col++) {
      if (gray[row * w + col] > gray[row * w + col + 1]) hash |= 1n << bit;
      bit++;
    }
  }
  return hash;
}

function hammingDistance(a: bigint, b: bigint): number {
  let x = a ^ b;
  let count = 0;
  while (x > 0n) { count += Number(x & 1n); x >>= 1n; }
  return count;
}

// Downscales to a max dimension before sending to the vision API - keeps
// the request small and the analysis fast/cheap without hurting accuracy.
async function toBase64(file: File, maxDim = 768): Promise<{ base64: string; mediaType: string }> {
  const img = await loadImageEl(file);
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(img.src);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  const [prefix, base64] = dataUrl.split(",");
  const mediaType = prefix.match(/data:(.*);base64/)?.[1] || "image/jpeg";
  return { base64, mediaType };
}

const AdminPhotoImport = () => {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PhotoRow[]>([]);
  const [dedupedCount, setDedupedCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ done: 0, total: 0 });
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const handleFiles = useCallback(async (fileList: FileList) => {
    setSummary(null);
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast.error("No image files found in that selection");
      return;
    }

    toast.info(`Checking ${files.length} photos for duplicates...`);

    // Group visually-identical/near-identical photos together so the same
    // item photographed twice (or re-saved by WhatsApp) becomes one row,
    // not two - "no repetition" happens here, before any AI cost is spent.
    const hashes: bigint[] = [];
    const groups: File[][] = [];
    for (const file of files) {
      let hash: bigint;
      try {
        hash = await computeDHash(file);
      } catch {
        groups.push([file]);
        continue;
      }
      const matchIndex = hashes.findIndex((h) => hammingDistance(h, hash) <= DHASH_DISTANCE_THRESHOLD);
      if (matchIndex === -1) {
        hashes.push(hash);
        groups.push([file]);
      } else {
        groups[matchIndex].push(file);
      }
    }

    setDedupedCount(files.length - groups.length);

    const newRows: PhotoRow[] = groups.map((group) => ({
      id: crypto.randomUUID(),
      file: group[0],
      thumbnail: URL.createObjectURL(group[0]),
      status: "pending",
      title: "",
      description: "",
      category: "home",
      price: "",
      original_price: "",
      quantity_available: "10",
      include: true,
    }));

    setRows(newRows);
    toast.success(`Found ${groups.length} distinct product${groups.length === 1 ? "" : "s"} (${files.length - groups.length} duplicate photo${files.length - groups.length === 1 ? "" : "s"} skipped)`);
  }, []);

  const runAnalysis = async () => {
    const pending = rows.filter((r) => r.status === "pending");
    if (pending.length === 0) return;

    setIsAnalyzing(true);
    setAnalyzeProgress({ done: 0, total: pending.length });
    setRows((prev) => prev.map((r) => (r.status === "pending" ? { ...r, status: "analyzing" } : r)));

    let cursor = 0;
    const worker = async () => {
      while (cursor < pending.length) {
        const row = pending[cursor++];
        try {
          const { base64, mediaType } = await toBase64(row.file);
          const response = await adminPost("/api/admin/analyze-product-photo", {
            image_base64: base64,
            media_type: mediaType,
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Analysis failed");

          setRows((prev) => prev.map((r) => r.id === row.id ? {
            ...r,
            status: "ready",
            title: data.title,
            description: data.description,
            category: data.category,
            price: String(data.price),
            original_price: String(data.original_price),
            needsReview: data.needs_review,
          } : r));
        } catch (err) {
          setRows((prev) => prev.map((r) => r.id === row.id ? {
            ...r,
            status: "error",
            error: err instanceof Error ? err.message : "Analysis failed",
          } : r));
        } finally {
          setAnalyzeProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));
    setIsAnalyzing(false);
    toast.success("Analysis complete - review and adjust before importing");
  };

  const updateRow = (id: string, patch: Partial<PhotoRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const readyRows = rows.filter((r) => r.include && r.status === "ready" && r.title && r.price);

  const runImport = async () => {
    if (readyRows.length === 0) return;
    setIsImporting(true);
    setSummary(null);
    setImportProgress({ done: 0, total: readyRows.length });

    const products: any[] = [];
    for (const row of readyRows) {
      updateRow(row.id, { status: "importing" });
      try {
        const image_url = await uploadImage(row.file);
        products.push({
          title: row.title,
          description: row.description,
          category: row.category,
          price: parseFloat(row.price),
          original_price: row.original_price ? parseFloat(row.original_price) : undefined,
          quantity_available: parseInt(row.quantity_available, 10) || 1,
          image_url,
          _rowId: row.id,
        });
      } catch (err) {
        updateRow(row.id, { status: "import_failed", error: "Photo upload failed" });
      }
      setImportProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    try {
      const response = await adminPost("/api/admin/bulk-import", {
        products: products.map(({ _rowId, ...rest }) => rest),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed");

      const failedRowNums = new Set((data.errors || []).map((e: any) => e.row));
      products.forEach((p, i) => {
        const rowNum = i + 2;
        updateRow(p._rowId, failedRowNums.has(rowNum) ? { status: "import_failed" } : { status: "imported" });
      });

      setSummary({ imported: data.imported, failed: data.failed, errors: data.errors || [] });
      if (data.imported > 0) toast.success(`Imported ${data.imported} product${data.imported === 1 ? "" : "s"}`);
      if (data.failed > 0) toast.error(`${data.failed} row${data.failed === 1 ? "" : "s"} failed - see details below`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" /> Import from Photos
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Select a folder of product photos - duplicate shots are skipped automatically, AI writes a title,
            description, category and wholesale price for each item, then imports them straight into your store.
          </p>
        </div>

        {/* Step 1: pick photos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">1. Select your photos</h2>
          <input
            ref={folderInputRef}
            type="file"
            accept="image/*"
            multiple
            // @ts-ignore - non-standard but widely supported attribute for folder selection
            webkitdirectory=""
            className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
          />
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-sm font-semibold text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Upload className="h-5 w-5" />
            {rows.length > 0 ? `${rows.length} products found (click to choose a different folder)` : "Click to choose a folder of photos"}
          </button>
          {dedupedCount > 0 && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <ImageOff className="h-3.5 w-3.5" /> Skipped {dedupedCount} duplicate/near-duplicate photo{dedupedCount === 1 ? "" : "s"}.
            </p>
          )}
        </div>

        {/* Step 2: analyze */}
        {rows.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="font-bold text-gray-900 dark:text-white">2. Let AI catalog them</h2>
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing || pendingCount === 0}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-semibold text-sm"
              >
                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isAnalyzing
                  ? `Analyzing... (${analyzeProgress.done}/${analyzeProgress.total})`
                  : pendingCount === 0 ? "All analyzed" : `Analyze ${pendingCount} photo${pendingCount === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: review + import */}
        {rows.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white">
                3. Review & import ({readyRows.length} ready)
              </h2>
              <button
                onClick={runImport}
                disabled={isImporting || readyRows.length === 0}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-all disabled:opacity-50 font-semibold text-sm"
              >
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isImporting
                  ? `Importing... (${importProgress.done}/${importProgress.total})`
                  : `Import ${readyRows.length} product${readyRows.length === 1 ? "" : "s"}`}
              </button>
            </div>

            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className={`flex flex-col sm:flex-row gap-3 rounded-xl border p-3 ${
                  row.status === "imported" ? "border-green-300 bg-green-50 dark:bg-green-950/20"
                  : row.status === "error" || row.status === "import_failed" ? "border-red-300 bg-red-50 dark:bg-red-950/20"
                  : "border-gray-200 dark:border-gray-700"
                }`}>
                  <img src={row.thumbnail} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />

                  <div className="flex-1 min-w-0">
                    {row.status === "pending" && <p className="text-sm text-gray-500">Waiting to be analyzed...</p>}
                    {row.status === "analyzing" && (
                      <p className="text-sm text-purple-600 flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing...</p>
                    )}
                    {row.status === "error" && (
                      <p className="text-sm text-red-600 flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> {row.error}</p>
                    )}
                    {(row.status === "ready" || row.status === "importing" || row.status === "imported" || row.status === "import_failed") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                        <input
                          value={row.title}
                          onChange={(e) => updateRow(row.id, { title: e.target.value })}
                          disabled={row.status !== "ready"}
                          placeholder="Title"
                          className="lg:col-span-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
                        />
                        <select
                          value={row.category}
                          onChange={(e) => updateRow(row.id, { category: e.target.value })}
                          disabled={row.status !== "ready"}
                          className={`rounded-lg border px-2.5 py-1.5 text-sm outline-none bg-white dark:bg-gray-900 disabled:opacity-60 ${row.needsReview ? "border-amber-400" : "border-gray-300 dark:border-gray-600"}`}
                        >
                          {VALID_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                        </select>
                        <input
                          value={row.price}
                          onChange={(e) => updateRow(row.id, { price: e.target.value })}
                          disabled={row.status !== "ready"}
                          type="number"
                          placeholder="Price (KES)"
                          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
                        />
                        <input
                          value={row.original_price}
                          onChange={(e) => updateRow(row.id, { original_price: e.target.value })}
                          disabled={row.status !== "ready"}
                          type="number"
                          placeholder="Was price"
                          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
                        />
                      </div>
                    )}
                    {row.status === "imported" && (
                      <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Imported</p>
                    )}
                    {row.status === "import_failed" && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><XCircle className="h-3 w-3" /> Import failed</p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 shrink-0">
                    {row.status === "ready" && (
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <input type="checkbox" checked={row.include} onChange={(e) => updateRow(row.id, { include: e.target.checked })} />
                        Include
                      </label>
                    )}
                    <button
                      onClick={() => removeRow(row.id)}
                      disabled={row.status === "importing" || row.status === "imported"}
                      className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-40"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {summary && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white mb-3">Import result</h2>
            <div className="flex gap-4 mb-3">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                <CheckCircle2 className="h-4 w-4" /> {summary.imported} imported
              </span>
              {summary.failed > 0 && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
                  <XCircle className="h-4 w-4" /> {summary.failed} failed
                </span>
              )}
            </div>
            <Link to="/admin/products" className="text-sm font-semibold text-accent hover:underline">
              View products →
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPhotoImport;
