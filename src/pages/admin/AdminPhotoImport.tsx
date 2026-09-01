import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Upload, ArrowLeft, CheckCircle2, XCircle, Loader2, Images, Trash2, Combine, SplitSquareHorizontal,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminPost } from "@/utils/adminApi";
import { uploadImages } from "@/lib/uploadImage";
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

interface PhotoFile {
  id: string;
  file: File;
  thumbnail: string;
}

type RowStatus = "draft" | "importing" | "imported" | "import_failed";

interface CatalogRow {
  id: string;
  photos: PhotoFile[];
  title: string;
  description: string;
  category: string;
  price: string;
  original_price: string;
  quantity_available: string;
  selected: boolean;
  status: RowStatus;
}

interface ImportSummary {
  imported: number;
  failed: number;
  errors: { row: number; title: string; error: string }[];
}

const makeRow = (photo: PhotoFile): CatalogRow => ({
  id: crypto.randomUUID(),
  photos: [photo],
  title: "",
  description: "",
  category: "home",
  price: "",
  original_price: "",
  quantity_available: "10",
  selected: false,
  status: "draft",
});

const AdminPhotoImport = () => {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const handleFiles = (fileList: FileList) => {
    setSummary(null);
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast.error("No image files found in that selection");
      return;
    }

    const newRows = files.map((file) =>
      makeRow({ id: crypto.randomUUID(), file, thumbnail: URL.createObjectURL(file) })
    );
    setRows((prev) => [...prev, ...newRows]);
    toast.success(`Added ${files.length} photo${files.length === 1 ? "" : "s"} - one row each. Select several and click "Group" if they're the same product.`);
  };

  const updateRow = (id: string, patch: Partial<CatalogRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleSelect = (id: string) => {
    updateRow(id, { selected: !rows.find((r) => r.id === id)?.selected });
  };

  const selectedRows = rows.filter((r) => r.selected && r.status === "draft");

  const groupSelected = () => {
    if (selectedRows.length < 2) return;
    const mergedPhotos = selectedRows.flatMap((r) => r.photos);
    // Keep the first non-empty title/description/category/price among the
    // selected rows, if any were already typed in before grouping.
    const base = selectedRows.find((r) => r.title.trim()) || selectedRows[0];
    const merged: CatalogRow = {
      id: crypto.randomUUID(),
      photos: mergedPhotos,
      title: base.title,
      description: base.description,
      category: base.category,
      price: base.price,
      original_price: base.original_price,
      quantity_available: base.quantity_available,
      selected: false,
      status: "draft",
    };
    const selectedIds = new Set(selectedRows.map((r) => r.id));
    setRows((prev) => [...prev.filter((r) => !selectedIds.has(r.id)), merged]);
    toast.success(`Grouped ${mergedPhotos.length} photos into one product`);
  };

  const splitRow = (id: string) => {
    setRows((prev) => {
      const row = prev.find((r) => r.id === id);
      if (!row || row.photos.length < 2) return prev;
      const split = row.photos.map((photo) => makeRow(photo));
      return [...prev.filter((r) => r.id !== id), ...split];
    });
  };

  const isRowReady = (r: CatalogRow) =>
    r.title.trim() && r.description.trim() && r.category && parseFloat(r.price) > 0;

  const readyRows = rows.filter((r) => r.status === "draft" && isRowReady(r));
  const incompleteCount = rows.filter((r) => r.status === "draft" && !isRowReady(r)).length;

  const runImport = async () => {
    if (readyRows.length === 0) return;
    setIsImporting(true);
    setSummary(null);
    setImportProgress({ done: 0, total: readyRows.length });

    const products: any[] = [];
    for (const row of readyRows) {
      updateRow(row.id, { status: "importing" });
      try {
        const urls = await uploadImages(row.photos.map((p) => p.file));
        products.push({
          title: row.title,
          description: row.description,
          category: row.category,
          price: parseFloat(row.price),
          original_price: row.original_price ? parseFloat(row.original_price) : undefined,
          quantity_available: parseInt(row.quantity_available, 10) || 1,
          image_url: urls[0],
          images: urls.length > 1 ? JSON.stringify(urls) : undefined,
          _rowId: row.id,
        });
      } catch {
        updateRow(row.id, { status: "import_failed" });
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

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Images className="h-6 w-6 text-purple-500" /> Import from Photos
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Select product photos - each becomes its own product by default. Tick a few and click "Group" if
            they're really the same item, then fill in the details and import.
          </p>
        </div>

        {/* Step 1: pick photos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">1. Select photos</h2>
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
            {rows.length > 0 ? `${rows.length} photo${rows.length === 1 ? "" : "s"} added - click to add more` : "Click to choose photos or a folder"}
          </button>
        </div>

        {/* Step 2: group + catalog */}
        {rows.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 lg:p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white">
                2. Group & catalog ({readyRows.length} ready{incompleteCount > 0 ? `, ${incompleteCount} need details` : ""})
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={groupSelected}
                  disabled={selectedRows.length < 2}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition disabled:opacity-40"
                >
                  <Combine className="h-3.5 w-3.5" /> Group Selected ({selectedRows.length})
                </button>
                <button
                  onClick={runImport}
                  disabled={isImporting || readyRows.length === 0}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-all disabled:opacity-50 font-semibold text-sm"
                >
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {isImporting
                    ? `Importing... (${importProgress.done}/${importProgress.total})`
                    : `Import ${readyRows.length} product${readyRows.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className={`flex flex-col sm:flex-row gap-3 rounded-xl border p-3 ${
                  row.status === "imported" ? "border-green-300 bg-green-50 dark:bg-green-950/20"
                  : row.status === "import_failed" ? "border-red-300 bg-red-50 dark:bg-red-950/20"
                  : row.selected ? "border-accent ring-1 ring-accent bg-accent/5"
                  : "border-gray-200 dark:border-gray-700"
                }`}>
                  {row.status === "draft" && (
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggleSelect(row.id)}
                      className="mt-1 h-4 w-4 shrink-0"
                    />
                  )}

                  <div className="flex shrink-0 -space-x-3">
                    {row.photos.slice(0, 3).map((p, i) => (
                      <img key={p.id} src={p.thumbnail} alt="" className="h-16 w-16 rounded-lg object-cover border-2 border-white dark:border-gray-800" style={{ zIndex: 3 - i }} />
                    ))}
                    {row.photos.length > 3 && (
                      <div className="h-16 w-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800">
                        +{row.photos.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {row.status === "draft" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                        <input
                          value={row.title}
                          onChange={(e) => updateRow(row.id, { title: e.target.value })}
                          placeholder="Title"
                          className="lg:col-span-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                        />
                        <input
                          value={row.description}
                          onChange={(e) => updateRow(row.id, { description: e.target.value })}
                          placeholder="Short description"
                          className="lg:col-span-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                        />
                        <select
                          value={row.category}
                          onChange={(e) => updateRow(row.id, { category: e.target.value })}
                          className="rounded-lg border border-gray-300 dark:border-gray-600 px-2.5 py-1.5 text-sm outline-none bg-white dark:bg-gray-900"
                        >
                          {VALID_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                        </select>
                        <input
                          value={row.price}
                          onChange={(e) => updateRow(row.id, { price: e.target.value })}
                          type="number"
                          placeholder="Price (KES)"
                          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                        />
                        <input
                          value={row.original_price}
                          onChange={(e) => updateRow(row.id, { original_price: e.target.value })}
                          type="number"
                          placeholder="Was price"
                          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                        />
                        <input
                          value={row.quantity_available}
                          onChange={(e) => updateRow(row.id, { quantity_available: e.target.value })}
                          type="number"
                          placeholder="Qty"
                          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                        />
                      </div>
                    ) : row.status === "importing" ? (
                      <p className="text-sm text-purple-600 flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Importing "{row.title}"...</p>
                    ) : row.status === "imported" ? (
                      <p className="text-sm text-green-600 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Imported "{row.title}"</p>
                    ) : (
                      <p className="text-sm text-red-600 flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> Failed: "{row.title}"</p>
                    )}
                  </div>

                  {row.status === "draft" && (
                    <div className="flex sm:flex-col items-center justify-center gap-2 shrink-0">
                      {row.photos.length > 1 && (
                        <button onClick={() => splitRow(row.id)} className="p-1.5 text-gray-400 hover:text-accent" title="Split back into separate photos">
                          <SplitSquareHorizontal className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => removeRow(row.id)} className="p-1.5 text-gray-400 hover:text-red-600" title="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
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
