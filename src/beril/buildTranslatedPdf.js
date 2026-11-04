const BERIL_URL = "https://burakcankorpinar.dev/beril";

/**
 * Çevrilmiş sayfa metinlerinden indirilebilir PDF blob üretir.
 * @param {{ title: string, pages: string[] }} doc
 * @returns {Promise<Blob>}
 */
export async function buildTranslatedPdfBlob(doc) {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const fonts = pdfFontsModule.default || pdfFontsModule;
  const vfs = fonts.pdfMake?.vfs || fonts.vfs || fonts;
  if (!vfs || typeof vfs !== "object") throw new Error("PDF yazı tipi yüklenemedi");
  if (typeof pdfMake.addVirtualFileSystem === "function") pdfMake.addVirtualFileSystem(vfs);
  else pdfMake.vfs = vfs;

  const content = [];
  const title = doc.title || "Çeviri";

  content.push({
    text: title,
    style: "title",
    margin: [0, 0, 0, 16],
  });
  content.push({
    text: "İngilizce → Türkçe çeviri",
    style: "meta",
    margin: [0, 0, 0, 24],
  });

  doc.pages.forEach((pageText, index) => {
    if (index > 0) content.push({ text: "", pageBreak: "before" });
    content.push({
      text: `Sayfa ${index + 1}`,
      style: "pageLabel",
      margin: [0, 0, 0, 10],
    });
    content.push({
      text: pageText || "—",
      style: "body",
    });
  });

  const definition = {
    pageSize: "A4",
    pageMargins: [48, 56, 48, 56],
    content,
    footer: (currentPage, pageCount) => ({
      margin: [48, 0, 48, 24],
      columns: [
        {
          text: [
            { text: "PDF’e tıkla: ", color: "#888888", fontSize: 8 },
            {
              text: BERIL_URL,
              link: BERIL_URL,
              color: "#2563eb",
              fontSize: 8,
              decoration: "underline",
            },
          ],
        },
        {
          text: `${currentPage} / ${pageCount}`,
          alignment: "right",
          color: "#888888",
          fontSize: 8,
        },
      ],
    }),
    defaultStyle: {
      font: "Roboto",
      fontSize: 11,
      lineHeight: 1.35,
      color: "#1a1a1a",
    },
    styles: {
      title: { fontSize: 18, bold: true },
      meta: { fontSize: 10, color: "#666666" },
      pageLabel: { fontSize: 9, bold: true, color: "#888888" },
      body: { fontSize: 11 },
    },
  };

  return pdfMake.createPdf(definition).getBlob();
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
