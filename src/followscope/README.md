# FollowScope

Instagram resmi ZIP arşiviyle yerel takip analizi. Rota: `/instagram`.

## Güvenlik

- Instagram şifresi / çerez istenmez
- Instagram’a otomatik giriş yok
- ZIP tarayıcıda açılır; sunucuya yüklenmez
- Geçmiş IndexedDB’de tutulur ve silinebilir

## Çalıştırma

```bash
npm install
npm run dev:only
```

Aç: http://localhost:5173/instagram

Test:

```bash
npm test
```

## Özellikler

- ZIP yükleme (sürükle-bırak)
- `followers_*.json` / `following.json` bulma ve birleştirme
- Geri takip etmeyenler, takip etmediklerim, karşılıklı takip
- Arama, sıralama, sayfalama, CSV
- İki analiz arası değişim geçmişi
- Yerel geçmiş silme

Ayrıntılar: kök `PROJECT_SPEC.md`.
