/**
 * Vercel serverless: kalıcı arka plan kuyruğu yok.
 * Docker/beril sunucusunu kullanın. Bu endpoint bilgilendirme amaçlıdır.
 */
export default function handler(req, res) {
  return res.status(501).json({
    error:
      "Arka plan çeviri kuyruğu Docker beril servisinde çalışır. Vercel’de kalıcı job yok — Docker deploy kullanın.",
  });
}
