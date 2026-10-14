import { formatDate, formatMoney, formatPercent, formatQuantity } from "../domain/money.js";

export function buildQuotePdfDefinition(quote, settings) {
  const currency = quote.currency || settings.currency || "TRY";
  const content = [];
  if (settings.logoDataUrl?.startsWith("data:image/")) {
    content.push({ image: settings.logoDataUrl, fit: [120, 48], margin: [0, 0, 0, 8] });
  }
  content.push({
    columns: [
      {
        stack: [
          { text: settings.legalName || settings.companyName || "Şirket", style: "company" },
          { text: [settings.address, settings.phone, settings.email].filter(Boolean).join("\n"), style: "muted" },
          settings.taxNumber ? { text: `Vergi no: ${settings.taxNumber}`, style: "muted" } : "",
        ].filter((entry) => entry && entry.text !== ""),
      },
      {
        alignment: "right",
        stack: [
          { text: "TEKLİF", style: "docLabel" },
          { text: quote.number || "Önizleme", style: "docNumber" },
          { text: `Tarih: ${formatDate(quote.createdAt)}`, style: "muted" },
          quote.validityDate ? { text: `Geçerlilik: ${formatDate(quote.validityDate)}`, style: "muted" } : "",
        ].filter((entry) => entry && entry.text !== ""),
      },
    ],
  });

  const customer = quote.customerSnapshot || {};
  content.push({ text: "Müşteri", style: "section", margin: [0, 16, 0, 4] });
  content.push({
    text: [
      customer.name,
      customer.contactName,
      customer.email,
      customer.phone,
      customer.address,
      customer.taxNumber ? `Vergi no: ${customer.taxNumber}` : "",
    ].filter(Boolean).join("\n"),
    margin: [0, 0, 0, 12],
  });

  const showImage = quote.items.some((item) => item.imageDataUrl?.startsWith("data:image/"));
  const header = [
    ...(showImage ? ["Görsel"] : []),
    "Kod",
    "Ürün",
    "Miktar",
    "Birim fiyat",
    "İskonto",
    "Tutar",
  ].map((text) => ({ text, style: "th" }));

  const body = quote.items.map((item) => {
    const detail = [
      { text: item.name || "", bold: true },
      item.specs ? { text: item.specs, style: "muted" } : null,
      item.measures?.widthMm && item.measures?.heightMm
        ? { text: `${item.measures.widthMm} × ${item.measures.heightMm} mm`, style: "muted" }
        : null,
      item.exampleOnly ? { text: "Örnek imalat hesabı — doğrulanmamış formül", style: "muted" } : null,
    ].filter(Boolean);
    return [
      ...(showImage
        ? [item.imageDataUrl?.startsWith("data:image/")
          ? { image: item.imageDataUrl, fit: [36, 36] }
          : "—"]
        : []),
      item.code || "",
      { stack: detail },
      formatQuantity(item.quantityMilli),
      formatMoney(item.unitPriceKurus, currency),
      formatPercent(item.discountBps || 0),
      formatMoney(item.lineNetKurus, currency),
    ];
  });

  content.push({
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: showImage ? [42, "auto", "*", "auto", "auto", "auto", "auto"] : ["auto", "*", "auto", "auto", "auto", "auto"],
      body: [header, ...body],
    },
    layout: {
      hLineColor: () => "#E5E5E2",
      vLineColor: () => "#E5E5E2",
      hLineWidth: () => 0.4,
      vLineWidth: () => 0.4,
      paddingTop: () => 5,
      paddingBottom: () => 5,
      paddingLeft: () => 4,
      paddingRight: () => 4,
    },
  });

  const totals = quote.totals || {};
  content.push({
    columns: [
      { text: "", width: "*" },
      {
        width: 230,
        margin: [0, 12, 0, 0],
        table: {
          widths: ["*", "auto"],
          body: [
            ["Ara toplam", formatMoney(totals.subtotalKurus, currency)],
            ["İndirim", formatMoney(totals.discountKurus, currency)],
            [`Vergi (${formatPercent(quote.taxBps || 0)})`, formatMoney(totals.taxKurus, currency)],
            [
              { text: "Genel toplam", bold: true },
              { text: formatMoney(totals.totalKurus, currency), bold: true },
            ],
          ],
        },
        layout: "noBorders",
      },
    ],
  });

  if (quote.deliveryTerms) content.push({ text: `Teslimat\n${quote.deliveryTerms}`, style: "muted", margin: [0, 14, 0, 0] });
  if (quote.paymentTerms) content.push({ text: `Ödeme\n${quote.paymentTerms}`, style: "muted", margin: [0, 8, 0, 0] });
  if (quote.notes) content.push({ text: `Notlar\n${quote.notes}`, margin: [0, 8, 0, 0] });
  if (settings.signatureName) content.push({ text: settings.signatureName, margin: [0, 22, 0, 0] });
  if (settings.footerNote) content.push({ text: settings.footerNote, style: "muted", margin: [0, 12, 0, 0] });

  return {
    pageSize: "A4",
    pageMargins: [40, 46, 40, 52],
    footer: (current, totalPages) => ({
      columns: [
        { text: settings.companyName || "", style: "muted", margin: [40, 12, 0, 0] },
        { text: `${current} / ${totalPages}`, alignment: "right", style: "muted", margin: [0, 12, 40, 0] },
      ],
    }),
    content,
    defaultStyle: { font: "Roboto", fontSize: 9, color: "#171717" },
    styles: {
      company: { fontSize: 15, bold: true, margin: [0, 0, 0, 4] },
      docLabel: { fontSize: 10, color: "#666666" },
      docNumber: { fontSize: 13, bold: true, margin: [0, 2, 0, 2] },
      muted: { color: "#666666", fontSize: 8 },
      section: { fontSize: 11, bold: true },
      th: { bold: true, fillColor: "#F7F7F5" },
    },
  };
}

export async function quotePdfBlob(quote, settings) {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const fonts = pdfFontsModule.default || pdfFontsModule;
  const vfs = fonts.pdfMake?.vfs || fonts.vfs || fonts;
  if (!vfs || typeof vfs !== "object") throw new Error("PDF yazı tipi yüklenemedi");
  if (typeof pdfMake.addVirtualFileSystem === "function") pdfMake.addVirtualFileSystem(vfs);
  else pdfMake.vfs = vfs;
  const definition = buildQuotePdfDefinition(quote, settings);
  return pdfMake.createPdf(definition).getBlob();
}
