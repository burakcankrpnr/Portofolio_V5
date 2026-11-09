import AccountTable from "../components/tables/AccountTable.jsx";
import { PageHeader } from "../components/ui.jsx";
import { useFollowScope } from "../data/StoreContext.jsx";

export default function FollowersNotFollowingPage() {
  const { analysis, current } = useFollowScope();
  const list = analysis?.notFollowedBack || [];

  return (
    <>
      <PageHeader
        title="Takip Etmediklerim"
        description="Seni takip eden, fakat senin takip etmediğin hesaplar (followers − following)."
      />
      <AccountTable
        usernames={list}
        title="Kullanıcı"
        exportName="takip-etmediklerim.csv"
        emptyTitle={current ? "Liste boş" : "Henüz analiz yok"}
        emptyBody={
          current
            ? "Takipçi olup takip etmediğin hesap yok."
            : "Önce Genel Bakış’tan Instagram ZIP arşivini yükle."
        }
      />
    </>
  );
}
