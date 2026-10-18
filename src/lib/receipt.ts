// Builds the branded CampusMart order receipt as a PDF, in the browser.
import logoUrl from "@/assets/logo-badge.png";
import { shortProductTitle } from "@/lib/productTitle";

export interface ReceiptData {
  orderNumber: string;
  date: string | Date;
  customerName: string;
  phone: string;
  address: string;
  items: Array<{ title: string; qty: number; price: number }>;
  deliveryFee: number;
  paymentMethod: "M-Pesa" | "Wallet";
  paid: boolean;
}

const NAVY: [number, number, number] = [14, 33, 78];
const GREEN: [number, number, number] = [124, 179, 66];
const GREY: [number, number, number] = [110, 116, 130];

async function logoDataUrl(): Promise<string | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = logoUrl;
    });
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 200;
    c.getContext("2d")!.drawImage(img, 0, 0, 200, 200);
    return c.toDataURL("image/png");
  } catch {
    return null; // the receipt is still branded by name
  }
}

const money = (n: number) => `KES ${Math.round(n).toLocaleString("en-KE")}`;

export async function downloadReceipt(data: ReceiptData): Promise<void> {
  const { jsPDF } = await import("jspdf"); // loaded only when a receipt is made
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 16;

  // header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 38, "F");
  doc.setFillColor(...GREEN);
  doc.rect(0, 38, W, 1.6, "F");
  const logo = await logoDataUrl();
  if (logo) doc.addImage(logo, "PNG", M, 8, 22, 22);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CAMPUS", M + 27, 20);
  const campusW = doc.getTextWidth("CAMPUS");
  doc.setTextColor(...GREEN);
  doc.text("MART", M + 27 + campusW, 20);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Wholesale prices, real savings  |  campusmart.co.ke", M + 27, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("RECEIPT", W - M, 20, { align: "right" });

  // order meta
  const date = new Date(data.date);
  let y = 52;
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Order #${data.orderNumber}`, M, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GREY);
  doc.setFontSize(9);
  doc.text(date.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }), M, y + 6);

  // status stamp
  const label = data.paid ? "PAID" : "PAYMENT PENDING";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const stampW = doc.getTextWidth(label) + 10;
  doc.setDrawColor(...(data.paid ? GREEN : ([200, 120, 0] as [number, number, number])));
  doc.setTextColor(...(data.paid ? ([60, 120, 20] as [number, number, number]) : ([200, 120, 0] as [number, number, number])));
  doc.setLineWidth(0.6);
  doc.roundedRect(W - M - stampW, y - 6, stampW, 10, 2, 2);
  doc.text(label, W - M - stampW / 2, y, { align: "center" });

  // customer + delivery
  y += 18;
  doc.setTextColor(...NAVY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO / DELIVER TO", M, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 44, 52);
  doc.setFontSize(10);
  const addr = doc.splitTextToSize(data.address || "-", W - 2 * M - 70) as string[];
  doc.text([data.customerName, data.phone, ...addr], M, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("PAYMENT", W - M - 55, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 44, 52);
  doc.setFontSize(10);
  doc.text(data.paymentMethod, W - M - 55, y + 6);

  // items table
  y += 14 + addr.length * 5;
  doc.setFillColor(...NAVY);
  doc.rect(M, y, W - 2 * M, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ITEM", M + 3, y + 5.5);
  doc.text("QTY", W - M - 70, y + 5.5, { align: "right" });
  doc.text("PRICE", W - M - 38, y + 5.5, { align: "right" });
  doc.text("TOTAL", W - M - 3, y + 5.5, { align: "right" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 44, 52);
  doc.setFontSize(9.5);
  let subtotal = 0;
  data.items.forEach((item, i) => {
    const lines = (doc.splitTextToSize(shortProductTitle(item.title), 100) as string[]).slice(0, 2);
    const rowH = 4.6 * lines.length + 4;
    if (y + rowH > 270) { doc.addPage(); y = 20; }
    if (i % 2 === 0) { doc.setFillColor(246, 248, 252); doc.rect(M, y, W - 2 * M, rowH, "F"); }
    doc.text(lines, M + 3, y + 5);
    doc.text(String(item.qty), W - M - 70, y + 5, { align: "right" });
    doc.text(money(item.price), W - M - 38, y + 5, { align: "right" });
    doc.text(money(item.price * item.qty), W - M - 3, y + 5, { align: "right" });
    subtotal += item.price * item.qty;
    y += rowH;
  });

  // totals
  y += 6;
  const totalRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(...(bold ? NAVY : ([40, 44, 52] as [number, number, number])));
    doc.text(label, W - M - 60, y);
    doc.text(value, W - M - 3, y, { align: "right" });
    y += bold ? 8 : 6;
  };
  totalRow("Subtotal", money(subtotal));
  totalRow("Delivery", money(data.deliveryFee));
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.5);
  doc.line(W - M - 60, y - 3, W - M, y - 3);
  y += 2;
  totalRow("TOTAL", money(subtotal + data.deliveryFee), true);

  // footer
  doc.setFillColor(...NAVY);
  doc.rect(0, 280, W, 17, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Asante for shopping with CampusMart!", W / 2, 287, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Track your order anytime at campusmart.co.ke/orders  |  We deliver within Nairobi and Mombasa", W / 2, 292, { align: "center" });

  doc.save(`CampusMart-Receipt-${data.orderNumber}.pdf`);
}
