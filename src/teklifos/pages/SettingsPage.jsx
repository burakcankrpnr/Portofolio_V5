import { useState } from "react";
import { useStore } from "../data/StoreContext.jsx";
import { canManageSettings } from "../domain/permissions.js";
import { ROLES } from "../domain/permissions.js";
import { readImageFile } from "../services/images.js";
import { Button, PageHeader, PercentField, SelectField, TextArea, TextField, useConfirm, useToast } from "../ui/ui.jsx";

export default function SettingsPage() {
  const { state, updateSettings, setDemoRole, resetDemo, replaceAll } = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  const allowed = canManageSettings(state.settings.demoRole);
  const [form, setForm] = useState(state.settings);
  const [error, setError] = useState("");

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const save = () => {
    const result = updateSettings({
      companyName: form.companyName,
      legalName: form.legalName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      taxNumber: form.taxNumber,
      logoDataUrl: form.logoDataUrl,
      currency: form.currency,
      taxBps: form.taxBps,
      rounding: form.rounding,
      quoteNumberFormat: form.quoteNumberFormat,
      validityDays: Number(form.validityDays) || 15,
      paymentTerms: form.paymentTerms,
      deliveryTerms: form.deliveryTerms,
      signatureName: form.signatureName,
      footerNote: form.footerNote,
    });
    if (!result.ok) {
      setError(result.error);
      toast(result.error, "danger");
      return;
    }
    setError("");
    toast("Ayarlar kaydedildi", "success");
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "buse-yedek.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="Ayarlar" description="Şirket, para birimi ve teklif varsayılanları. Veri bu tarayıcıda kalır." actions={<Button variant="primary" disabled={!allowed} onClick={save}>Kaydet</Button>} />
      {!allowed ? <p className="tos-note">Bu demo rolü ayar değiştiremez. Rolü üst menüden değiştirebilirsiniz.</p> : null}
      {error ? <p className="tos-error" role="alert">{error}</p> : null}
      <section className="tos-card tos-card-pad">
        <h2>Şirket</h2>
        <div className="tos-form-grid" style={{ marginTop: 12 }}>
          <TextField label="Görünen ad" value={form.companyName} disabled={!allowed} onChange={(event) => set({ companyName: event.target.value })} />
          <TextField label="Yasal ad" value={form.legalName || ""} disabled={!allowed} onChange={(event) => set({ legalName: event.target.value })} />
          <TextField label="E-posta" value={form.email || ""} disabled={!allowed} onChange={(event) => set({ email: event.target.value })} />
          <TextField label="Telefon" value={form.phone || ""} disabled={!allowed} onChange={(event) => set({ phone: event.target.value })} />
          <div className="tos-span-2"><TextArea label="Adres" value={form.address || ""} disabled={!allowed} onChange={(event) => set({ address: event.target.value })} /></div>
          <TextField label="Vergi numarası" value={form.taxNumber || ""} disabled={!allowed} onChange={(event) => set({ taxNumber: event.target.value })} />
          <TextField label="PDF imza adı" hint="Boşsa PDF’de imza satırı çıkmaz" value={form.signatureName || ""} disabled={!allowed} onChange={(event) => set({ signatureName: event.target.value })} />
        </div>
        <div className="tos-toolbar" style={{ marginTop: 12 }}>
          {form.logoDataUrl ? <img alt="Şirket logosu" src={form.logoDataUrl} style={{ height: 48 }} /> : <span className="tos-hint">Logo yok</span>}
          <label className="tos-btn tos-btn-secondary">
            Logo yükle
            <input type="file" accept="image/*" hidden disabled={!allowed} onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              try { set({ logoDataUrl: await readImageFile(file) }); } catch (imageError) { toast(imageError.message, "danger"); }
            }} />
          </label>
        </div>
      </section>
      <section className="tos-card tos-card-pad">
        <h2>Para ve teklif</h2>
        <div className="tos-form-grid" style={{ marginTop: 12 }}>
          <SelectField label="Para birimi" value={form.currency} disabled={!allowed} onChange={(event) => set({ currency: event.target.value })}>
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </SelectField>
          <PercentField label="Varsayılan vergi" bps={form.taxBps} disabled={!allowed} onValue={(taxBps) => set({ taxBps })} />
          <SelectField label="Yuvarlama" value={form.rounding} disabled={!allowed} onChange={(event) => set({ rounding: event.target.value })}>
            <option value="half-up">Yarım yukarı</option>
            <option value="half-even">Yarım çift</option>
            <option value="down">Aşağı</option>
          </SelectField>
          <TextField label="Teklif numarası" hint="{YYYY} {MM} {NNNN}" value={form.quoteNumberFormat} disabled={!allowed} onChange={(event) => set({ quoteNumberFormat: event.target.value })} />
          <TextField label="Geçerlilik (gün)" inputMode="numeric" value={form.validityDays} disabled={!allowed} onChange={(event) => set({ validityDays: event.target.value })} />
          <TextArea label="Teslimat" value={form.deliveryTerms || ""} disabled={!allowed} onChange={(event) => set({ deliveryTerms: event.target.value })} />
          <TextArea label="Ödeme" value={form.paymentTerms || ""} disabled={!allowed} onChange={(event) => set({ paymentTerms: event.target.value })} />
          <div className="tos-span-2"><TextArea label="PDF alt notu" value={form.footerNote || ""} disabled={!allowed} onChange={(event) => set({ footerNote: event.target.value })} /></div>
        </div>
        <p className="tos-note" style={{ marginTop: 12 }}>Para birimini değiştirmek mevcut tutarları kura çevirmez. Kur servisi yok.</p>
        <p className="tos-hint">Hesap sırası: satır neti, teklif iskontosu, vergi. Bu sıra demo varsayılanıdır.</p>
      </section>
      <section className="tos-card tos-card-pad">
        <h2>Demo rolü</h2>
        <p className="tos-hint">Gerçek kimlik doğrulama yoktur. Maliyet alanlarını denemek için rol seçin.</p>
        <div className="tos-page-actions" style={{ marginTop: 12 }}>
          {ROLES.map((role) => (
            <Button key={role.id} variant={state.settings.demoRole === role.id ? "primary" : "secondary"} onClick={() => { setDemoRole(role.id); toast(`${role.label}: ${role.hint}`, "success"); }}>
              {role.label}
            </Button>
          ))}
        </div>
        <p className="tos-note" style={{ marginTop: 12 }}>Kullanıcı daveti ve oturum ayarı yapılandırılmadı.</p>
      </section>
      <section className="tos-card tos-card-pad">
        <h2>Yedek</h2>
        <div className="tos-page-actions" style={{ marginTop: 12 }}>
          <Button onClick={exportBackup}>JSON indir</Button>
          <label className="tos-btn tos-btn-secondary">
            JSON yükle
            <input type="file" accept="application/json" hidden onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              try {
                const next = JSON.parse(await file.text());
                const result = replaceAll(next);
                toast(result.ok ? "Yedek yüklendi" : result.error, result.ok ? "success" : "danger");
                if (result.ok) setForm(result.state.settings);
              } catch {
                toast("Yedek okunamadı", "danger");
              }
            }} />
          </label>
          <Button variant="danger" onClick={async () => {
            const ok = await confirm({ title: "Demoyu sıfırla", body: "Bu tarayıcıdaki TeklifOS verisi örnek kayıtlara döner.", danger: true, confirmLabel: "Sıfırla" });
            if (!ok) return;
            const result = resetDemo();
            if (result?.state?.settings) setForm(result.state.settings);
            toast("Demo veri yüklendi", "success");
          }}>Demoyu sıfırla</Button>
        </div>
      </section>
      <section className="tos-card tos-card-pad">
        <h2>Yapılandırılmayanlar</h2>
        <p>Ödeme ve abonelik altyapısı yok.</p>
        <p>E-posta gönderimi yok.</p>
        <p>Çizim / CAD entegrasyonu yok. Format doğrulanmadığı için dosya okunduğu iddia edilmez.</p>
        <p className="tos-hint">Sunucu tarafı yetki, çok şirket ve yedekleme planı bu demo sayfasında yoktur. Kayıtlar localStorage anahtarı buse.v2 içindedir.</p>
      </section>
    </>
  );
}
