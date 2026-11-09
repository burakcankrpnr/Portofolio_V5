import AccountTable from "../components/tables/AccountTable.jsx";
import { PageHeader } from "../components/ui.jsx";
import { useFollowScope } from "../data/StoreContext.jsx";

export default function MutualsPage() {
  const { analysis, current } = useFollowScope();
  const list = analysis?.mutuals || [];

  return (
    <>
      <PageHeader
        title="Karşılıklı Takip"
        description="Hem senin takip ettiğin hem de seni takip eden hesaplar (following ∩ followers)."
      />
      <AccountTable
        usernames={list}
        title="Kullanıcı"
        exportName="karsilikli-takip.csv"
        emptyTitle={current ? "Karşılıklı takip yok" : "Henüz analiz yok"}
        emptyBody={
          current
            ? "Bu arşivde ortak takip bulunamadı."
            : "Önce Genel Bakış’tan Instagram ZIP arşivini yükle."
        }
      />
    </>
  );
}
