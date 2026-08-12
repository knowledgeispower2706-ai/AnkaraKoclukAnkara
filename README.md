# Öğrenci Koçluk Takip — Web Uygulaması

Gerçek, çok kullanıcılı bir web sitesi: sen (koç) öğrenci ekliyorsun, her öğrenci
kendi e-posta/şifresiyle giriş yapıp kendi çalışma/deneme/hedef/not verisini giriyor,
sen de hepsini tek panelden görüyorsun.

Maliyet: **Supabase ve Vercel'in ücretsiz planları bu ölçek (birkaç-birkaç on öğrenci) için yeterli.**
Kendi alan adını bağlamak istersen sadece alan adının maliyeti olur (yıllık ~$10-15).

---

## 1) Supabase kurulumu (veritabanı + kullanıcı girişi)

1. https://supabase.com adresinden ücretsiz hesap aç, **New Project** oluştur.
2. Proje açıldıktan sonra sol menüden **SQL Editor**'e git.
3. Bu projedeki `supabase/schema.sql` dosyasının tüm içeriğini kopyala, SQL Editor'e
   yapıştır ve **Run** butonuna bas. Bu, tüm tabloları, güvenlik kurallarını (RLS) ve
   davet-kodu fonksiyonunu oluşturur.
4. Sol menüden **Authentication > Providers > Email**'e git. Test aşamasında hızlı
   ilerlemek istiyorsan **Confirm email** seçeneğini kapatabilirsin (sonra tekrar
   açabilirsin). Kapalıyken kullanıcılar kayıt olur olmaz giriş yapabilir.
5. Sol menüden **Project Settings > API**'ye git. Şu iki değeri not al:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** anahtarı → `VITE_SUPABASE_ANON_KEY`
   (Bunlar herkese açık/istemci tarafında kullanılan anahtarlardır, güvenlik `service_role`
   anahtarında değil RLS kurallarındadır — service_role anahtarını asla paylaşma/kullanma.)

## 2) Projeyi yerelde çalıştırma (opsiyonel, test için)

```bash
cd kocluk-web
npm install
cp .env.example .env
# .env dosyasını açıp yukarıda not aldığın URL ve anon key ile doldur
npm run dev
```
Tarayıcıda `http://localhost:5173` açılır.

## 3) Yayına alma (Vercel ile, ücretsiz)

1. Bu proje klasörünü kendi GitHub hesabına bir repo olarak yükle
   (GitHub Desktop kullanabilirsin ya da `git init && git add . && git commit -m "ilk"
   && git remote add origin <repo-url> && git push -u origin main`).
2. https://vercel.com adresinden GitHub hesabınla giriş yap, **New Project** ile bu
   repo'yu seç.
3. **Environment Variables** kısmına şunları ekle:
   - `VITE_SUPABASE_URL` → Supabase'ten aldığın URL
   - `VITE_SUPABASE_ANON_KEY` → Supabase'ten aldığın anon key
4. **Deploy** butonuna bas. Birkaç dakika içinde `xxx.vercel.app` adresinde canlı olur.

## 4) Kendi alan adını bağlama (opsiyonel)

Vercel projende **Settings > Domains** kısmından bir alan adı ekleyebilirsin
(GoDaddy, Google Domains vb. bir yerden satın aldığın). Vercel sana DNS ayarlarını
(bir CNAME/A kaydı) gösterir, alan adı sağlayıcında bu kaydı eklemen yeterli.

## 5) Kullanım akışı

- **Koç olarak** `/koc-kayit` sayfasından kayıt ol, giriş yap.
- Panelde **"+ Öğrenci Ekle"** ile bir öğrenci adı gir → sistem 6 haneli bir
  **davet kodu** üretir (sol menüde "Bekleyen davetler" altında görünür, kopyalayabilirsin).
- Bu kodu öğrenciye ilet (WhatsApp, mesaj vb.).
- **Öğrenci** `/ogrenci-kayit` sayfasına gidip kodu + kendi e-posta/şifresini girerek
  kendi hesabını açar. Bundan sonra öğrenci kendi paneline (`/panelim`) giriş yapıp
  kendi çalışma saatlerini, deneme sonuçlarını, hedeflerini ve notlarını kendisi girer.
- Sen koç panelinden tüm öğrencilerin verilerini **görüntülersin** (düzenleme yetkisi
  öğrencide, senin panelin salt-okunur — istersen bunu değiştirebiliriz).

## Güvenlik notu

Her öğrenci sadece kendi verisini görüp düzenleyebilir; koç sadece kendi öğrencilerinin
verisini görebilir (başka koçların öğrencilerini göremez). Bu kurallar veritabanı
seviyesinde (Postgres Row Level Security) uygulanıyor, yani sadece arayüzde değil,
veritabanı seviyesinde de korunuyor.

## Bir sonraki adımlar (istersen ben yapabilirim)

- Koçun öğrenci verisine not/geri bildirim ekleyebilmesi (şu an sadece görüntülüyor)
- E-posta bildirimleri (örn. öğrenci yeni deneme sonucu girince koça mail gitmesi)
- Öğrenci silme / pasif etme
- Şifremi unuttum akışı (Supabase bunu hazır sağlıyor, arayüze eklenmesi gerekiyor)
