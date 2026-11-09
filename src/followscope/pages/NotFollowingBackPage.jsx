import AccountTable from "../components/tables/AccountTable.jsx";
import { PageHeader } from "../components/ui.jsx";
import { useFollowScope } from "../data/StoreContext.jsx";

export default function NotFollowingBackPage() {
  const { analysis, current } = useFollowScope();
  const list = analysis?.notFollowingBack || [];

  return (
    <>
      <PageHeader
        title="Geri Takip Etmeyenler"
        description="Takip ettiğin, fakat seni takip etmeyen hesaplar (following − followers)."
      />
      <AccountTable
        usernames={list}
        title="Kullanıcı"
        exportName="geri-takip-etmeyenler.csv"
        emptyTitle={current ? "Herkes geri takip ediyor" : "Henüz analiz yok"}
        emptyBody={
          current
            ? "Bu arşivde geri takip etmeyen hesap bulunamadı."
            : "Önce Genel Bakış’tan Instagram ZIP arşivini yükle."
        }
      />
    </>
  );
}
