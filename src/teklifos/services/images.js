export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Dosya seçin"));
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("Yalnızca görsel dosyası yükleyin"));
      return;
    }
    if (file.size > 2_500_000) {
      reject(new Error("Görsel 2,5 MB sınırını aşıyor"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Görsel okunamadı"));
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 720 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.onerror = () => reject(new Error("Görsel okunamadı"));
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
