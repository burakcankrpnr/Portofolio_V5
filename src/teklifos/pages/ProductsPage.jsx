import { useMemo, useState } from "react";
import { useStore } from "../data/StoreContext.jsx";
import { productUsageCount } from "../data/store.js";
import { formatMoney } from "../domain/money.js";
import { PRODUCT_TYPES, typeLabel } from "../domain/labels.js";
import { canSeeCosts, canWrite } from "../domain/permissions.js";
import { priceProduct, resolveRule } from "../domain/pricing.js";
import { useDirty } from "../layout/Dirty.jsx";
import { Badge, Button, EmptyState, PageHeader, Pagination, RowMenu, Thumb, useConfirm, usePage, useToast } from "../ui/ui.jsx";

export default function ProductsPage() {
  const store = useStore();
  const { state, setProductActive, deleteProduct } = store;
  const dirty = useDirty();
  const confirm = useConfirm();
  const toast = useToast();
  const writable = canWrite(state.settings.demoRole);
  const seeCosts = canSeeCosts(state.settings.demoRole);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [active, setActive] = useState("active");
  const [sort, setSort] = useState("name");

  const rows = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("tr-TR");
    const list = state.products.filter((product) => {
      if (term && !`${product.code} ${product.name}`.toLocaleLowerCase("tr-TR").includes(term)) return false;
      if (type && product.type !== type) return false;
      if (brandId && product.brandId !== brandId) return false;
      if (categoryId && product.categoryId !== categoryId) return false;
      if (active === "active" && !product.active) return false;
      if (active === "archived" && product.active) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === "code") return a.code.localeCompare(b.code, "tr");
      if (sort === "price") return (a.listPriceKurus || 0) - (b.listPriceKurus || 0);
      return a.name.localeCompare(b.name, "tr");
    });
    return list;
  }, [state.products, query, type, brandId, categoryId, active, sort]);
  const pager = usePage(rows);
  const nameOf = (list, id) => list.find((item) => item.id === id)?.name || "—";

  return (
    <>
      <PageHeader
        title="Ürünler"
        description="Katalog, imalat ve dış ürünler. Teklifte kullanılan kayıt silinmez, arşivlenir."
        actions={<Button variant="primary" disabled={!writable} onClick={() => dirty.attempt("/buse/urunler/yeni")}>Ürün ekle</Button>}
      />
      <div className="tos-card tos-card-pad tos-toolbar">
        <input className="tos-input" aria-label="Ürün ara" placeholder="Kod veya ad" value={query} onChange={(event) => { setQuery(event.target.value); pager.setPage(1); }} />
        <select className="tos-select" aria-label="Ürün türü" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">Tüm türler</option>
          {PRODUCT_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select className="tos-select" aria-label="Marka" value={brandId} onChange={(event) => setBrandId(event.target.value)}>
          <option value="">Tüm markalar</option>
          {state.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>
        <select className="tos-select" aria-label="Kategori" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">Tüm kategoriler</option>
          {state.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select className="tos-select" aria-label="Durum" value={active} onChange={(event) => setActive(event.target.value)}>
          <option value="active">Aktif</option>
          <option value="archived">Arşiv</option>
          <option value="all">Tümü</option>
        </select>
        <select className="tos-select" aria-label="Sıralama" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="name">Ad</option>
          <option value="code">Kod</option>
          <option value="price">Liste fiyatı</option>
        </select>
      </div>
      <section className="tos-card">
        {state.products.length === 0 ? <EmptyState title="Katalog boş" body="Ürün ekleyin veya Excel’den aktarın." action={<Button variant="primary" disabled={!writable} onClick={() => dirty.attempt("/buse/urunler/yeni")}>Ürün ekle</Button>} /> : null}
        {state.products.length > 0 && rows.length === 0 ? <EmptyState title="Sonuç bulunamadı" body="Filtreye uyan ürün yok." /> : null}
        {rows.length > 0 ? (
          <div className="tos-table-wrap">
            <table className="tos-table">
              <thead>
                <tr>
                  <th>Görsel</th>
                  <th>Kod</th>
                  <th>Ürün</th>
                  <th className="tos-hide-sm">Marka</th>
                  <th className="tos-hide-sm">Kategori</th>
                  <th>Tür</th>
                  <th>{seeCosts ? "Liste / alış" : "Liste fiyatı"}</th>
                  <th>Durum</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pager.slice.map((product) => {
                  const rule = resolveRule(state.pricingRules, product);
                  const priced = priceProduct({ product, rule, measures: product.measures, rounding: state.settings.rounding });
                  return (
                    <tr key={product.id} className="clickable" onClick={() => dirty.attempt(`/buse/urunler/${product.id}`)}>
                      <td><Thumb name={product.name} image={product.imageDataUrl} /></td>
                      <td>{product.code}</td>
                      <td>{product.name}</td>
                      <td className="tos-hide-sm">{nameOf(state.brands, product.brandId)}</td>
                      <td className="tos-hide-sm">{nameOf(state.categories, product.categoryId)}</td>
                      <td>{typeLabel(product.type)}</td>
                      <td>
                        {priced.ok ? formatMoney(priced.unitPriceKurus, state.settings.currency) : "Hesap yok"}
                        {seeCosts ? <div className="tos-hint">Alış {formatMoney(product.costKurus || 0, state.settings.currency)}</div> : null}
                      </td>
                      <td>{product.active ? <Badge tone="success">Aktif</Badge> : <Badge>Arşiv</Badge>}</td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <RowMenu items={[
                          { label: "Düzenle", disabled: !writable, onClick: () => dirty.attempt(`/buse/urunler/${product.id}`) },
                          { label: product.active ? "Arşivle" : "Yeniden aç", disabled: !writable, onClick: () => { const result = setProductActive(product.id, !product.active); toast(result.ok ? "Durum güncellendi" : result.error, result.ok ? "success" : "danger"); } },
                          { label: "Sil", disabled: !writable, onClick: async () => {
                            const used = productUsageCount(state, product.id);
                            if (used) { toast("Teklif geçmişi var. Arşivleyin.", "danger"); return; }
                            const ok = await confirm({ title: "Ürünü sil", body: `${product.code} silinsin mi?`, danger: true, confirmLabel: "Sil" });
                            if (!ok) return;
                            const result = deleteProduct(product.id);
                            toast(result.ok ? "Ürün silindi" : result.error, result.ok ? "success" : "danger");
                          } },
                        ]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        <Pagination page={pager.page} pages={pager.pages} total={pager.total} onPage={pager.setPage} />
      </section>
    </>
  );
}
