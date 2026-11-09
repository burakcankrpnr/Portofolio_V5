# Görünüm rehberi: burakcankorpinar.dev

Sitenin şu anki görsel sistemi: renkler, yazı tipleri, yerleşim, bileşenler, hareket ve mobil davranış.
Yeni bir bölüm eklerken ya da başka bir AI'a değişiklik yaptırırken bu dosyayı referans verin.

---

## 1. Karakter

- **Konu:** Markalar için e-ticaret siteleri, kurumsal siteler ve mobil uygulamalar geliştiren full-stack geliştirici.
- **Kahraman malzeme:** Yayındaki sitelerin gerçek ekran görüntüleri (`public/previews/*.jpg`). Dekor değil, kanıt.
- **Ton:** Koyu indigo bir gece zemini, tek sıcak vurgu rengi, büyük ve sıkı başlıklar, sakin gövde metni.
- **Kural:** Cesaret tek yerde: hero'daki dev isim ve görsel şeridi. Geri kalan her şey sade.

---

## 2. Renkler

| Token | Hex | Tailwind | Kullanım |
|---|---|---|---|
| Gece | `#0D0B1F` | `bg-gece` | Sayfa zemini, form alanı içi |
| Mürekkep | `#17142F` | `bg-murekkep` | Kartlar, form kutusu, açılış perdesi |
| Çizgi | `#2A2650` | `border-cizgi` | Tüm kenarlıklar ve ayraçlar |
| Kar | `#F3F0FF` | `text-kar` | Başlıklar, ana metin |
| Lila | `#C9BEFF` | `text-lila` | Öne çıkan paragraflar, ikincil vurgu |
| Sis | `#9C97C4` | `text-sis` | Gövde metni, etiketler, açıklamalar |
| Kayısı | `#FFB27A` | `bg-kayisi` / `text-kayisi` | Tek vurgu: ana buton, aktif menü, hover, odak halkası, durum noktası |

**Kurallar**
- Kayısı sadece etkileşim ve durum için kullanılır, dekor için kullanılmaz.
- Gradyan metin, parlayan blur lekeleri ve mor→mavi geçişler kullanılmaz.
- Tek istisna: hero'nun üstünde çok hafif bir lila ışık (`rgba(201,190,255,0.10)`).
- Seçili metin: kayısı zemin, gece rengi yazı.

Renkler hem `tailwind.config.js` içinde hem `src/index.css` içinde CSS değişkeni (`--gece`, `--kayisi` …) olarak tanımlı.

---

## 3. Yazı tipleri

| Rol | Font | Nerede |
|---|---|---|
| Başlık | **Bricolage Grotesque** (değişken: `opsz`, `wdth`, `wght`) | `.display` sınıfı, `font-display` |
| Gövde | **Instrument Sans** | Varsayılan `font-sans` |

İkisi de Google Fonts'tan `index.html` ile yükleniyor.

### Ölçek

| Öğe | Boyut | Ağırlık | Not |
|---|---|---|---|
| Hero ismi | `clamp(5rem, 21vw, 14.5rem)` | 600 | `wdth 80`, satır aralığı `0.86`, harf aralığı `-0.045em` |
| Açılış yazısı | `clamp(3rem, 11vw, 10rem)` | 600 | `wdth 80` |
| Bölüm başlığı (h2) | `text-5xl` → `md:text-7xl` | 600 | satır aralığı `0.95` |
| Alt başlık (h3) | `text-4xl` → `md:text-5xl` | 600 | |
| Büyük rakamlar | `text-6xl` → `md:text-[8rem]` | 600 | `wdth 80` |
| Kart başlığı | `text-2xl` → `md:text-[1.75rem]` (öne çıkan: `md:text-[2.75rem]`) | 600 | |
| Öne çıkan paragraf | `text-xl` → `md:text-2xl` | 400 | Lila renk |
| Gövde | `17px` / `18px` | 400 | `leading-relaxed`, en fazla ~62 karakter genişlik |
| Küçük metin | `14–15px` | 400 | Sis renk |

**Kaçınılanlar:** BÜYÜK HARF etiketler, başlıkta tek kelimeyi renklendirmek, mono font, başlık üstü küçük "eyebrow" etiketleri.

---

## 4. Yerleşim

- **Kap:** `.shell` sınıfı: en fazla `80rem` genişlik, kenar boşluğu `16px` (mobil) / `32px` (sm) / `48px` (lg).
- **Izgara:** 12 sütun. Masaüstünde metin blokları genelde 5/7 ya da 7/5 bölünür.
- **Hizalama:** Her şey sola yaslı. Ortalanmış başlık yok.
- **Bölüm ayrımı:** Her bölüm üstte ince bir `border-cizgi` çizgisiyle başlar.
- **Dikey boşluk:** `py-20` (mobil) → `sm:py-24` → `md:py-32`.

### Köşe yuvarlaklıkları (hiyerarşiye göre)

| Öğe | Radius |
|---|---|
| Kartlar, form kutusu, ziyaretçi defteri | `28px` |
| Kart içindeki görsel | `18px` |
| Hero şerit görselleri, form alanları | `16px` |
| Butonlar | Tam yuvarlak (hap) |

Gölge kullanılmaz. Derinlik, zemin tonu farkı ve ince kenarlıkla verilir.

---

## 5. Bölümler

### Menü (`Navbar.jsx`)
- Sabit üst bar. Kaydırınca yarı saydam gece zemini, bulanıklık ve alt çizgi gelir.
- Solda isim (dar genişlikte başlık fontu), sağda menü linkleri ve kayısı **"Projeni konuşalım"** butonu.
- Aktif bölüm kayısı renkte.
- Mobilde tam ekran menü: büyük (5xl) linkler, altta e-posta. Escape ile kapanır, açıkken sayfa kaydırılamaz.

### Hero (`Home.jsx`)
```
● Şu an StylingPark'ta full-stack geliştiriciyim

Burak Can
Körpınar                       (dev, ekran genişliğinin ~%21'i)

Markalar için hızlı, satış yapan          [İşleri gör] [İletişime geç]
web siteleri ve mobil uygulamalar...

┌──────┐┌──────┐┌──────┐┌──────┐  ← yayındaki sitelerin ekran görüntüleri
└──────┘└──────┘└──────┘└──────┘
Site adı              alan adı
```
- Kayısı durum noktası nabız gibi atar.
- Şerit kartları `4:3`, görselin üst kısmı gösterilir, hover'da hafif büyür.

### Hakkımda (`About.jsx`)
- Solda portre (mobilde kare, tablet ve üstünde `4:5`), sağda başlık ve üç kısa paragraf.
- **"Çalıştığım yerler"**: ince çizgilerle ayrılmış büyük linkler. StylingPark'ın yanında kayısı "Şu an".
- Altta tek satır büyük rakamlar: **9** yayında olan proje · **6** yıllık deneyim · **4** sertifika. Kart yok.

### İşler (`Portofolio.jsx`, `CardProject.jsx`)
- Başlık "Seçilmiş işler" ve yanında kısa açıklama.
- İlk proje (StylingPark) iki sütunu kaplayan öne çıkan kart. Masaüstünde görsel solda (8/12), metin sağda.
- Diğerleri iki sütunlu ızgarada.
- Kart: tarayıcı çerçeveli canlı site önizlemesi (hover/dokunma ile sayfa kayar), başlık, "X bünyesinde", 180 karaktere kısaltılmış açıklama ("Devamını oku"), alan adı linki, varsa App Store / Google Play rozetleri.
- **"Kullandığım araçlar"**: ince çizgili ızgara (mobilde 2, sm'de 3, xl'de 4 sütun), ikon ve isim.

### İletişim (`Contact.jsx`)
- Solda "Bir projeniz mi var?", kısa metin, büyük kayısı e-posta linki, sosyal linkler (çizgili liste).
- Sağda form kutusu: Adınız, E-posta adresiniz, Projeniz hakkında, **"Mesajı gönder"**.
- Altta "Ziyaretçi defteri" başlığı ve Firebase yorum kutusu.
- Bildirimler (SweetAlert) koyu temada, kayısı butonlu.

### Footer (`Footer.jsx`)
- Üstte çizgi, solda "© 2026 Burak Can Körpınar. Tüm hakları saklıdır.", sağda "Başa dön".

---

## 6. Bileşen sınıfları (`src/index.css`)

| Sınıf | Ne yapar |
|---|---|
| `.shell` | Sayfa kabı ve kenar boşlukları |
| `.display` | Başlık fontu, optik boyut, `-0.03em` harf aralığı |
| `.btn-primary` | Kayısı hap buton, hover'da kar rengine döner |
| `.btn-ghost` | Çizgili hap buton, hover'da lila kenar ve mürekkep zemin |
| `.field` | Form alanı: gece zemin, çizgi kenar, odakta kayısı kenar |
| `.link-underline` | İnce alt çizgili link, hover'da kayısı |
| `.mask-line` | Yazının maskeden yükselme animasyonu için taşmayı gizleyen satır |

**Odak:** Klavyeyle gezerken her öğede `2px` kayısı halka (`:focus-visible`).

---

## 7. Hareket

Kütüphaneler: **GSAP + ScrollTrigger + @gsap/react**, yumuşak kaydırma için **Lenis**. Kurulum `src/lib/motion.js` içinde.

| Ne | Nasıl | Süre |
|---|---|---|
| Açılış perdesi (`Intro.jsx`) | "Portfolyo siteme / hoş geldiniz" maskeden yükselir, kayısı çizgi dolar, `burakcankorpinar.dev` harf harf belirir, perde kavisli alt kenarla yukarı kalkar | ~2,5 sn. Tıklama ya da tuşla atlanır. Sadece `/` adresinde |
| Hero ismi | Perde kalkarken harfler sırayla aşağıdan yükselir, ardından metin ve şerit belirir | ~1,5 sn |
| Hero şeridi | Fareyle gezilen ≥768px ekranlarda sayfa kaydıkça yatay kayar (scrub) | Scroll'a bağlı |
| Portre | Kaydırırken hafif yakınlaşmadan normale iner (scrub) | Scroll'a bağlı |
| Rakamlar | Görünür olunca 0'dan sayarak artar | 1,6 sn, bir kez |
| Hover | Renk geçişleri, şerit görselinde hafif büyüme | 200–700 ms |

**Kurallar**
- Her bölüme ayrı "fade-up" verilmez. Tek orkestre an açılış ve hero'dur.
- Sistemde **"hareketi azalt"** açıksa açılış perdesi, tüm GSAP animasyonları ve Lenis kapanır.

---

## 8. Mobil ve tablet

| Genişlik | Davranış |
|---|---|
| **< 640px** | Kenar boşluğu 16px. Tek sütun. Portre kare ve en fazla 420px. Araçlar 2 sütun, küçük kutular. Hero şeridi **parmakla kaydırılır**, kart kart durur, sonraki kartın ucu görünür |
| **640–767px** | Kenar boşluğu 32px. Portre `4:5`. Araçlar 3 sütun |
| **≥ 768px** | 12 sütunluk ızgara devreye girer. Masaüstü menü. Fareyle gezilirken şerit scroll ile kayar; dokunmatik tablette parmakla kaydırılır |
| **≥ 1024px** | Hakkımda ve İletişim iki sütun. Öne çıkan proje kartı yatay yerleşim |

- 320px'e kadar yatay taşma yok.
- Hover gerektiren önizleme, dokunmatik ekranda dokunarak çalışır ("Gezmek için dokun").

---

## 9. Dosya haritası

| Dosya | İçerik |
|---|---|
| `tailwind.config.js` | Renk ve font token'ları |
| `src/index.css` | CSS değişkenleri, bileşen sınıfları, Lenis stilleri, maske ve nabız animasyonu |
| `index.html` | Google Fonts bağlantısı, `theme-color` |
| `src/lib/motion.js` | GSAP kayıtları, Lenis, `scrollToId`, `lockScroll`, açılış kapısı |
| `src/lib/preview.js` | Site URL'sinden ekran görüntüsü yolu ve alan adı |
| `src/components/Intro.jsx` | Açılış perdesi |
| `src/components/Navbar.jsx`, `Footer.jsx` | Menü ve alt bilgi |
| `src/Pages/Home.jsx`, `About.jsx`, `Portofolio.jsx`, `Contact.jsx` | Bölümler |
| `src/components/CardProject.jsx`, `WebsitePreview.jsx`, `TechStackIcon.jsx`, `SocialLinks.jsx`, `Commentar.jsx` | Bölüm içi bileşenler |

**Henüz yeni temaya geçmeyenler:** `/project/:id` detay sayfası (`ProjectDetail.jsx`) ve 404 sayfası (`NotFound.jsx`). Yeni fontları alıyorlar ama eski mor stilleri duruyor.
