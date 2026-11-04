/** Canlı sitenin yerel tam sayfa ekran görüntüsü: /previews/<host>.jpg */
export const previewFileFromUrl = (url) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return `/previews/${host}.jpg`;
  } catch {
    return null;
  }
};

export const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
