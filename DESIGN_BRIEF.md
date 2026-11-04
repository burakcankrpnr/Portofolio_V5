# Portfolyo yeniden tasarım brief'i (prompt)

> Bu metin, yeniden tasarımı yaptırmak için hazırlanan prompt'tur. Başka bir AI'a ya da tasarımcıya aynen verilebilir.

## Konu
Burak Can Körpınar — ajanslarda (StylingPark, Acc Studio, Creamake) markalar için
e-ticaret siteleri, kurumsal siteler ve mobil uygulamalar geliştiren full-stack geliştirici.

- **Kitle:** iş veren ajanslar, marka sahipleri, teknik işe alımcılar.
- **Sayfanın asıl işi:** yayında olan gerçek işleri göstermek ve iletişime geçirmek.
- **En karakteristik malzeme:** canlı sitelerin tam sayfa ekran görüntüleri (`/public/previews/*.jpg`).
  Bunlar dekor değil, kanıt. Tasarımın kahramanı onlar.

## Renk (token'lar)
| Ad | Hex | Rol |
|---|---|---|
| Gece | `#0D0B1F` | Sayfa zemini — mevcut markanın indigo'sunu koruyan, renkli koyu zemin (siyah değil) |
| Mürekkep | `#17142F` | Yüzeyler, kartlar |
| Çizgi | `#2A2650` | Kenarlıklar, ayraçlar |
| Lila | `#C9BEFF` | Başlık metni, ikincil vurgu |
| Kayısı | `#FFB27A` | Tek sıcak vurgu: CTA, aktif durum, odak halkası |
| Sis | `#9C97C4` | Gövde metni (ikincil) |

Gradyan metin, blur'lu parlama lekeleri ve mor→mavi geçişler kaldırılır.

## Tipografi
- **Başlık:** Bricolage Grotesque (değişken, opsz + wdth). Çok büyük, sıkı satır aralığı, negatif harf aralığı.
  İsim, hero'da tipografik bir nesne olarak kullanılır.
- **Gövde:** Instrument Sans, 16–18px, satır uzunluğu ≤ 70 karakter.
- Etiketlerde BÜYÜK HARF yok, tek kelimeyi renklendirme yok, mono font yok.

## Yerleşim
```
NAV   bck.                               Hakkımda  İşler  İletişim  [Projeni konuşalım]

HERO  Burak Can                                   (dev, ~13vw, sola yaslı)
      Körpınar
      Markalar için satış yapan web siteleri       [İşleri gör] [İletişime geç]
      ve uygulamalar geliştiriyorum.
      ● Şu an StylingPark'ta çalışıyorum

      ┌────┐┌────┐┌────┐┌────┐┌────┐  ← gerçek site ekran görüntüleri,
      └────┘└────┘└────┘└────┘└────┘    scroll ile yatay kayan şerit (scrub)

HAKKIMDA  [portre, yuvarlak köşeli dikey]   Kısa paragraflar + çalıştığım yerler
          9 proje   4 sertifika   6 yıl     ← kart değil, tek satır büyük rakamlar

İŞLER   Öne çıkan proje (geniş) + 2 sütunlu ızgara. Her kartta ekran görüntüsü
        (hover'da sayfa kayar), başlık, şirket, kısa açıklama, linkler.
        Araçlar: ikonlu sade bir liste (sekme/slider yok).

İLETİŞİM  "Bir projeniz mi var?"  büyük e-posta linki, form, sosyal linkler, ziyaretçi defteri
```
Hizalama: her şey sola yaslı, 12 sütunluk ızgara, 1280px maksimum genişlik.

## Hareket (GSAP + ScrollTrigger + Lenis)
- **Lenis** ile yumuşak kaydırma; GSAP ticker'a bağlı, ScrollTrigger ile senkron.
- **Tek bir orkestre an:** açılışta isim harf harf maskeden yükselir (~1.2 sn). 6 saniyelik karşılama ekranı kaldırılır.
- **Hero şeridi:** ekran görüntüleri scroll ile yatay kayar (scrub).
- **Rakamlar:** Hakkımda'daki sayılar görünür olduğunda sayarak artar.
- Diğer bölümlerde her öğeye ayrı fade-up yok. AOS kaldırılır.
- `prefers-reduced-motion` açıksa tüm hareketler kapatılır, Lenis devre dışı.

## Kalite tabanı
Mobilde 16px kenar boşluğu, yatay taşma yok, klavye odağı görünür (kayısı halka),
kontrast AA, mevcut SEO/route yapısı korunur.
