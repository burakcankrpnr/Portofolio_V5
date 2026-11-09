# Instagram Takip Analiz Uygulaması

## Proje Gereksinimleri ve Geliştirme Planı

**Proje adı (geçici):** FollowScope  
**Sürüm:** 1.0  
**Durum:** Geliştirmeye hazır ürün taslağı  
**Hedef:** Instagram takipçi ve takip edilen listelerini karşılaştırarak geri takip etmeyen hesapları güvenli biçimde tespit etmek.

---

## 1. Projenin amacı

Kullanıcının Instagram hesabından indirdiği resmi veri arşivini uygulamaya yüklemesi ve aşağıdaki analizleri yapabilmesi:

- Kullanıcının takip ettiği ancak kendisini takip etmeyen hesapları bulmak.
- Kullanıcının takip etmediği ancak kendisini takip eden hesapları bulmak.
- Karşılıklı takip edilen hesapları listelemek.
- Önceki analizle yeni analizi karşılaştırarak takipçi artışlarını, takipçi kayıplarını ve takipten çıkılan hesapları tespit etmek.
- Sonuçları aramak, filtrelemek ve CSV olarak dışa aktarmak.

**Temel güvenlik ilkesi:** Uygulama Instagram şifresi istemeyecek, Instagram'a kullanıcı adına giriş yapmayacak ve Instagram'ın özel uç noktalarını otomatik olarak çağırmayacak. Analiz, kullanıcının kendi dışa aktardığı veriler üzerinde yerel olarak yapılacak.

---

## 2. İlk sürümün kapsamı

### 2.1 Temel ekranlar

1. **Dashboard**
   - Takipçi sayısı
   - Takip edilen sayısı
   - Geri takip etmeyen hesap sayısı
   - Karşılıklı takip sayısı
   - Takip edilen ama geri takip etmeyenlerin oranı
   - Son analiz tarihi
2. **Geri takip etmeyenler**
   - Kullanıcının takip ettiği, fakat takipçi listesinde bulunmayan hesaplar
   - Kullanıcı adı, Instagram profil bağlantısı, arama ve sıralama, CSV dışa aktarma
3. **Seni takip etmeyenler / Takip etmediklerin**
   - Takipçi listesinde olup takip edilenler listesinde olmayan hesaplar
4. **Karşılıklı takip**
   - Her iki listede de bulunan hesaplar
5. **Değişim geçmişi**
   - Önceki içe aktarımla mevcut içe aktarmayı karşılaştırma
   - Yeni takipçiler, takipten çıkanlar, yeni takip edilenler, takipten çıkarılanlar
   - İlk analizde geçmiş veri yoksa karşılaştırma yapılamayacağını açıkça gösterme
6. **Ayarlar ve veri yönetimi**
   - Yüklenen veri setini silme, analiz geçmişini temizleme, gizlilik açıklaması, dışa aktarma

### 2.2 İlk sürümde olmayacaklar

- Instagram şifresiyle giriş
- Otomatik takip etme veya takipten çıkma
- Toplu takipten çıkma
- Instagram API'sini izinsiz kullanma veya kısıtlamaları aşma
- Kullanıcının haberi olmadan arka planda veri toplama

Bu sınırlar hesap güvenliği, kullanıcı gizliliği ve platform kuralları açısından korunmalıdır.

---

## 3. Kullanıcı akışı

1. Kullanıcı Instagram'dan hesap bilgilerinin indirilmesini ister.
2. İndirme sırasında mümkünse JSON formatını seçer.
3. İndirilen ZIP dosyasını uygulamaya sürükleyip bırakır.
4. Uygulama ZIP içeriğini tarayıcı içinde açar.
5. Takipçi ve takip edilen dosyalarını bulur ve ayrıştırır.
6. Dosyalar tanınmazsa kullanıcıya anlaşılır hata ve beklenen dosya örnekleri gösterilir.
7. Kullanıcı analizi başlatır.
8. Dashboard ve listeler oluşturulur.
9. İstenirse analiz yerel geçmişe kaydedilir.
10. Kullanıcı sonraki dışa aktarımını yüklediğinde iki analiz karşılaştırılır.

Uygulama, Instagram dışa aktarma dosyalarının klasör yapısı ve dosya adları zaman içinde değişebileceği için tek bir sabit dosya adına bağımlı olmamalıdır. JSON içeriğini doğrulamalı ve desteklenen alternatif dosya yollarını kontrol etmelidir.

---

## 4. Veri ayrıştırma ve analiz mantığı

### 4.1 Normalize etme

- Kullanıcı adlarının başındaki `@` kaldırılmalı.
- Karşılaştırma büyük/küçük harfe duyarsız yapılmalı.
- Başında/sonunda boşluk varsa temizlenmeli.
- Aynı kullanıcı adı birden fazla kez gelirse tekilleştirilmeli.
- Eksik veya geçersiz kayıtlar sessizce yanlış sonuç üretmek yerine raporlanmalı.

### 4.2 Küme karşılaştırması

Tanımlar:

- `followers`: Kullanıcıyı takip eden hesaplar.
- `following`: Kullanıcının takip ettiği hesaplar.

Hesaplamalar:

- Geri takip etmeyenler: `following - followers`
- Kullanıcının takip etmedikleri: `followers - following`
- Karşılıklı takip: `following ∩ followers`

Sonuç sayıları, normalize edilmiş ve tekilleştirilmiş kullanıcı adları üzerinden hesaplanmalıdır.

### 4.3 Geçmiş karşılaştırması

İki analiz arasında:

- Yeni takipçiler = yeni followers − eski followers
- Takipten çıkanlar = eski followers − yeni followers
- Yeni takip edilenler = yeni following − eski following
- Takipten çıkarılanlar = eski following − yeni following

Arayüz, bu değişimlerin yalnızca iki dışa aktarım arasındaki farkı gösterdiğini belirtmelidir. Veriler, kullanıcının hangi tarihte gerçekten takipten çıktığını kesin olarak kanıtlamaz; yalnızca iki veri anlık görüntüsü arasındaki değişimi gösterir.

---

## 5. Teknik mimari

**Önerilen başlangıç mimarisi:** Frontend-only

İlk sürümde backend zorunlu değildir. ZIP açma, JSON ayrıştırma, analiz ve dışa aktarma kullanıcının tarayıcısında yapılır.

| Katman | Teknoloji | Sorumluluk |
| --- | --- | --- |
| UI | React | Ekranlar ve bileşenler |
| Dil | TypeScript / tip güvenli JSDoc | Tip güvenliği |
| Build | Vite | Geliştirme ve üretim derlemesi |
| Stil | Tailwind CSS | Responsive arayüz |
| ZIP | JSZip | Instagram arşivini açma |
| Grafik | Recharts veya benzeri | Dashboard grafikleri |
| İstemci depolama | IndexedDB | Kullanıcının tercih ettiği analiz geçmişi |
| Test | Vitest | Analiz ve ayrıştırma testleri |

**Not:** LocalStorage büyük veri arşivleri için uygun olmayabilir. Analiz geçmişi tutulacaksa IndexedDB tercih edilmelidir. Geçmiş kaydı kullanıcı kontrolünde olmalı ve tek tuşla silinebilmelidir.

### Önerilen klasör yapısı (portfolyo içinde)

```text
src/followscope/
├── FollowScopeRoute.jsx
├── FollowScopeApp.jsx
├── styles.css
├── README.md
├── types/
│   └── instagram.js
├── layout/
│   └── AppShell.jsx
├── components/
│   ├── dashboard/
│   ├── tables/
│   └── upload/
├── pages/
│   ├── DashboardPage.jsx
│   ├── NotFollowingBackPage.jsx
│   ├── FollowersNotFollowingPage.jsx
│   ├── MutualsPage.jsx
│   ├── HistoryPage.jsx
│   └── SettingsPage.jsx
└── lib/
    ├── instagram/
    ├── export/
    └── storage/
```

Uygulama rotası: `/followscope`

---

## 6. Tasarım ve kullanıcı deneyimi

Varsayılan tasarım yönü:

- Premium, modern dashboard
- Koyu tema öncelikli
- Mobil ve masaüstü uyumlu
- Sade kartlar ve okunaklı veri tabloları
- Sol navigasyon menüsü
- Belirgin dosya yükleme alanı
- Yükleme, ayrıştırma ve analiz durumları
- Boş durum, hata durumu ve başarılı analiz ekranları
- Erişilebilir kontrast ve klavye ile kullanım

### Önerilen navigasyon

- Genel Bakış
- Geri Takip Etmeyenler
- Takip Etmediklerim
- Karşılıklı Takip
- Değişim Geçmişi
- Ayarlar

### Liste özellikleri

- Kullanıcı adıyla arama
- Alfabetik sıralama
- Sayfalama veya sanal listeleme
- Instagram profilini yeni sekmede açma
- CSV indirme
- Sonuç bulunamadığında açıklayıcı boş durum

Profil bağlantısı, normalize edilmiş kullanıcı adına göre `https://www.instagram.com/{username}/` biçiminde oluşturulmalıdır. Geçersiz kullanıcı adlarında bağlantı oluşturulmamalıdır.

---

## 7. Veri modeli

```ts
export interface InstagramAccount {
  username: string;
  profileUrl: string;
}

export interface InstagramSnapshot {
  id: string;
  createdAt: string;
  followers: string[];
  following: string[];
  sourceFileName?: string;
}

export interface InstagramAnalysis {
  followersCount: number;
  followingCount: number;
  notFollowingBack: string[];
  notFollowedBack: string[];
  mutuals: string[];
}

export interface SnapshotChanges {
  newFollowers: string[];
  lostFollowers: string[];
  newlyFollowed: string[];
  unfollowedByUser: string[];
}
```

Ham Instagram arşivinin tamamı gereksiz yere saklanmamalıdır. Analiz için gereken normalize edilmiş kullanıcı adı listeleri tutulmalıdır.

---

## 8. Güvenlik ve gizlilik gereksinimleri

- Instagram şifresi veya oturum çerezi istenmemeli.
- Instagram'a otomatik giriş yapılmamalı.
- Kullanıcının arşivi varsayılan olarak herhangi bir sunucuya yüklenmemeli.
- Dosya ayrıştırma istemci tarafında yapılmalı.
- Yüklenen dosyanın türü ve boyutu kontrol edilmeli.
- ZIP içindeki dosya yolları güvenli biçimde işlenmeli.
- Hatalı JSON için uygulama çökmemeli.
- Kullanıcı analiz geçmişini silebilmeli.
- Uygulama, verilerin yalnızca yerel olarak işlendiğini doğru biçimde açıklamalı.
- Telemetri veya analitik eklenecekse açıkça belirtilmeli; kullanıcı verileri ve kullanıcı adları analitik sistemlere gönderilmemeli.

---

## 9. Hata durumları

Aşağıdaki durumlar kullanıcıya açıkça gösterilmelidir:

- ZIP dosyası bozuk.
- Desteklenmeyen dosya formatı.
- Takipçi dosyası bulunamadı.
- Takip edilen dosyası bulunamadı.
- JSON biçimi beklenen yapıda değil.
- Dosya boş veya eksik.
- Aynı hesap birden fazla kez bulunuyor.
- Arşiv çok büyük ve tarayıcı belleği yetersiz.
- Önceki analiz yok; geçmiş karşılaştırması yapılamıyor.

Hata mesajları teknik ayrıntıyı gerektiğinde açılabilir bir bölümde sunmalı, ana mesajda kullanıcıya çözüm önermelidir.

---

## 10. Test senaryoları

Örnek veri:

```js
const followers = ["ayse", "mehmet", "zeynep"];
const following = ["mehmet", "zeynep", "burak", "can"];
```

Beklenen sonuçlar:

- Geri takip etmeyenler: `["burak", "can"]`
- Kullanıcının takip etmedikleri: `["ayse"]`
- Karşılıklı takip: `["mehmet", "zeynep"]`

Ek testler: büyük/küçük harf, `@` öneki, boşluk, tekrar, eksik alan, boş liste, geçersiz JSON, birden fazla olası takipçi dosyası, snapshot karşılaştırması.

---

## 11. Geliştirme aşamaları

### Aşama 1 — Temel proje

- Vite + React iskeleti (portfolyo içinde `/followscope`)
- Tailwind ile koyu premium responsive dashboard
- Sayfa düzeni ve navigasyon
- Henüz Instagram ayrıştırması veya sahte gerçek sonuç yok

### Aşama 2 — Veri içe aktarma

- ZIP yükleme, JSON bulma, ayrıştırma, doğrulama ve normalize etme

### Aşama 3 — Analiz motoru

- Geri takip etmeyenler, takip etmediklerim, karşılıklı takip, sayısal özetler

### Aşama 4 — Geçmiş ve dışa aktarma

- IndexedDB, fark hesaplama, CSV, geçmişi silme

### Aşama 5 — Kalite

- Birim testleri, performans, hata/boş durumlar, mobil, üretim build

---

## 12. Kabul kriterleri

İlk sürüm tamamlandığında:

- Kullanıcı Instagram ZIP arşivini yükleyebilmeli.
- Uygulama takipçi ve takip edilen listelerini doğru bulabilmeli.
- Üç temel karşılaştırma doğru hesaplanmalı.
- Sonuçlar aranabilmeli ve CSV olarak indirilebilmeli.
- Kullanıcı isterse iki analiz arasında değişimleri görebilmeli.
- Uygulama Instagram şifresi istememeli.
- Veriler varsayılan olarak cihaz dışına gönderilmemeli.
- Hatalı dosyalarda anlaşılır hata mesajı gösterilmeli.
- Uygulama masaüstü ve mobil tarayıcılarda kullanılabilmeli.

---

## 13. Kullanıcıdan ihtiyaç duyulan bilgiler

1. **Platform:** İlk sürüm responsive web. İstenirse sonra Tauri ile Windows.
2. **Tasarım:** Koyu premium dashboard; isteğe bağlı açık tema sonraki aşamada.
3. **Uygulama adı:** FollowScope (geçici).
4. **Örnek veri:** Gerçek arşiv zorunlu değil; önce örnek/test JSON.
5. **Geçmiş analizi:** Evet, yalnızca kullanıcı tercihiyle ve cihaz üzerinde.

Kullanıcının Instagram şifresi, oturum çerezi veya doğrulama kodu hiçbir aşamada istenmemelidir.

---

## Cursor başlangıç talimatı (Aşama 1)

`PROJECT_SPEC.md` dosyasını baştan sona oku. Önce gereksinimleri ve proje mimarisini incele. Ardından **Aşama 1**'i uygula: çalışan, premium koyu temalı, responsive bir dashboard iskeleti oluştur. Henüz Instagram entegrasyonu veya sahte analiz verisiyle gerçek sonuç iddiası oluşturma. Bileşenleri modüler yaz, tipleri tanımla ve çalıştırma adımlarını `src/followscope/README.md` dosyasına ekle. İş bitince değişen dosyaları ve çalıştırma komutlarını özetle.
