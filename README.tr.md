# Halfway

[English](README.md) · **Türkçe**

Küçük ekipler için multi-tenant bir görev yöneticisi. Organizasyonlar, projeler, görevler, atamalar, etiketler ve yorumlar var; roller iki seviyede çalışıyor.

**Canlı demo: [halfway-mert.vercel.app](https://halfway-mert.vercel.app)**. **Try the demo** butonuna bas, kayıt olmadan sana özel bir örnek ekip açılsın. API ücretsiz bir planda çalışıyor ve boşta kalınca uyuyor, bu yüzden ilk istek bir dakikaya kadar sürebilir.

![Proje board'u](docs/screenshots/board.png)

İsim, durum ikonlarından geliyor: boş halka *yapılacak*, yarısı dolu halka *devam ediyor*, dolu halka *bitti* demek. İşlerin çoğu da zaten yarı yolda (halfway) durur.

## İçindekiler

- [Neler yapabiliyor](#neler-yapabiliyor)
- [Ekran görüntüleri](#ekran-görüntüleri)
- [Teknolojiler](#teknolojiler)
- [Mimari](#mimari)
- [Kararlar ve nedenleri](#kararlar-ve-nedenleri)
- [Testler](#testler)
- [Yerelde çalıştırma](#yerelde-çalıştırma)
- [Deploy](#deploy)
- [Bilinen sınırlamalar](#bilinen-sınırlamalar)

## Neler yapabiliyor

- **Organizasyonlar.** Kayıt olunca bir organizasyon kurulur ve sen onun sahibi (owner) olursun. Gördüğün her şey sadece kendi organizasyonuna aittir.
- **Kişiler.** Owner yeni kişileri bir başlangıç şifresiyle ekler; onları devre dışı bırakabilir ve yeniden aktif edebilir.
- **Proje ekipleri.** Her projenin kendi ekibi vardır. Ekipteki her kişi ya *manager* ya da *contributor*'dır.
- **Görevler.** Her projede üç sütunlu bir board, son tarihler (geciken görevler göze çarpar), birden fazla atanan kişi, renkli etiketler ve yorumlar.
- **My tasks.** Bütün projelerde sana atanmış görevler, duruma göre gruplanmış halde.
- **Hesap.** Şifreni değiştirebilirsin; bu işlem diğer tüm cihazlardaki oturumlarını da kapatır.
- **Demo.** Her ziyaretçiye özel, içi dolu bir sandbox. 24 saat sonra silinir.

## Ekran görüntüleri

| Görev sayfası | Proje ekibi |
|---|---|
| ![Yorumlar, atananlar ve etiketlerle görev sayfası](docs/screenshots/task.png) | ![Rolleriyle proje ekibi](docs/screenshots/team.png) |

| Kişiler | Ana sayfa |
|---|---|
| ![Devre dışı bir üyeyle kişiler sayfası](docs/screenshots/people.png) | ![Ana sayfa](docs/screenshots/home.png) |

Telefonda menü bir açılır listeye taşınır, board sütunları alt alta dizilir:

<p>
  <img src="docs/screenshots/phone-board.png" alt="Telefonda board" width="280">
  &nbsp;&nbsp;
  <img src="docs/screenshots/phone-task.png" alt="Telefonda görev sayfası" width="280">
</p>

## Teknolojiler

| | |
|---|---|
| **API** | Node.js 22, Express 5, TypeScript, Prisma 7, PostgreSQL 17, Zod 4, bcrypt |
| **Web** | Next.js 16 (App Router), React 19, TanStack Query 5, Tailwind CSS 4, Base UI (shadcn) |
| **Testler** | Gerçek bir PostgreSQL veritabanına karşı Vitest ve Supertest |
| **CI** | GitHub Actions: her pull request'te typecheck, lint, testler ve build |
| **Hosting** | Vercel (web), Render (API), Neon (veritabanı); hepsi ücretsiz planda |

## Mimari

```mermaid
flowchart LR
  B[Tarayıcı] -->|"halfway-mert.vercel.app/api/*"| V["Vercel'de Next.js"]
  V -->|rewrite| R["Render'da Express API"]
  R --> N[("Neon'da PostgreSQL")]
```

Tarayıcı sadece web uygulamasıyla konuşur. `/api/*` istekleri Next.js tarafından API'ye iletilir. Bunun neden önemli olduğunu aşağıdaki 8. karar anlatıyor.

```
api/
  prisma/              şema ve migration'lar
  src/modules/         her özellik için bir klasör: routes → controller → service
    auth/              kayıt, giriş, oturumlar, şifre değiştirme, demo girişi
    users/ projects/ tasks/ tags/ comments/ demo/
  src/shared/          ayarlar, veritabanı istemcisi, hatalar, middleware, test yardımcıları
web/
  src/app/             sayfalar (App Router)
  src/components/      arayüz bileşenleri, özelliklere göre gruplanmış
  src/lib/             API istemcisi, query key'ler, hata mesajları, biçimlendirme
```

Her API modülü aynı düzeni izler. **Controller** gelen veriyi Zod ile doğrular ve cevabı biçimlendirir. **Service** kuralları taşır: önce kaydı bulur (404), sonra yetkiyi kontrol eder (403), sonra işi yapar. Veritabanına sadece service üzerinden erişilir.

## Kararlar ve nedenleri

Aşağıdaki her kararın bir alternatifi vardı. Her birinde neyin seçildiği, neden seçildiği ve bedelinin ne olduğu yazıyor.

### 1. Oturumlar veritabanında, JWT değil

Girişte API rastgele 32 baytlık bir token üretir, onu cookie ile gönderir ve `sessions` tablosuna sadece **SHA-256 hash'ini** yazar. Her istekte oturum veritabanından okunur.

- **Neden:** Bir oturum anında sonlandırılabilir. Çıkış yapmak, şifre değiştirmek ya da devre dışı bırakılmak bir sonraki istekte etkisini gösterir. JWT ise süresi dolana kadar geçerli kalır; iptal listesi kurarsan da elinde yine bir oturum tablosu olur.
- **Neden hash:** Veritabanı sızsa bile hash'ler cookie olarak kullanılamaz.
- **Cookie ayarları:** `HttpOnly` (JavaScript okuyamaz, yani bir XSS açığı onu çalamaz), `Secure`, `SameSite=Lax`, 30 günlük ömür. `/auth` altındaki cevaplar `Cache-Control: no-store` ile gönderilir.
- **Bedeli:** Her istekte bir veritabanı sorgusu daha. Bu ölçekte hissedilmiyor.

### 2. Giriş kötüye kullanılmaya karşı korumalı

- Kayıtlı olmayan bir e-posta ile yanlış şifre **aynı hatayı** döndürür. Böylece login formu "kimin hesabı var" diye yoklamak için kullanılamaz.
- E-posta yoksa bile şifre sahte bir hash ile karşılaştırılır. Bu yapılmasaydı "böyle bir kullanıcı yok" cevabı "şifre yanlış" cevabından ölçülebilir şekilde daha hızlı gelirdi.
- Şifreler bcrypt (cost 12) ile hash'lenir. 72 karakterlik üst sınır bcrypt'in kendi sınırı.
- Rate limit'ler: IP başına 15 dakikada 10 başarısız login, IP başına saatte 5 kayıt, IP başına saatte 5 demo ve **kullanıcı başına** 15 dakikada 10 başarısız şifre değiştirme denemesi.

### 3. Şifre değişince diğer bütün oturumlar kapanır

Şifre değiştirme önce mevcut şifreyi kontrol eder. Sonra tek bir transaction içinde senin **bütün** oturumlarını siler ve kullandığın tarayıcı için yeni bir oturum açar. Şifreni bilen başka biri giriş yapmış durumdaysa dışarıda kalır.

`INVALID_CURRENT_PASSWORD` ve `SAME_PASSWORD` olarak iki ayrı hata var; böylece formdaki mesajlar ne olduğunu net söyleyebiliyor.

### 4. Tenant izolasyonunu veritabanı sağlıyor

Bir organizasyona ait her tabloda `organization_id` var. Alt kayıtlar üst kayda `(organization_id, id)` üzerinden **composite foreign key** ile bağlanır. Pratikte bir görev sadece **kendi organizasyonundaki** bir projeye, kullanıcıya ya da etikete bağlanabilir.

- **Neden:** Multi-tenant sistemlerdeki veri sızıntılarının çoğu unutulmuş tek bir `WHERE` koşulundan çıkar. Burada uygulama kodunda böyle bir hata olsa bile PostgreSQL iki organizasyonun verisini birbirine bağlamayı reddeder.
- **Aramalar** da bu ikiliyle yapılır (`organizationId_id`). Başka bir organizasyonun id'si, hiç var olmayan bir id ile birebir aynı davranır.
- Başka organizasyonun kayıtları için **403 değil 404** dönülür. 403 dönmek, kaydın var olduğunu doğrulamak olurdu.

### 5. İki seviyeli roller

- **Organizasyon rolleri:** `owner` ya da `member`.
- **Proje rolleri:** her proje için ayrı ayrı `manager` ya da `contributor`.

| İşlem | Kim yapabilir |
|---|---|
| Projeleri, görevleri ve yorumları okumak | Organizasyondaki herkes |
| Proje oluşturmak, adını değiştirmek, silmek | Owner |
| Projenin ekibini yönetmek | Owner, proje manager'ı |
| Görev oluşturmak ve düzenlemek, durum değiştirmek, göreve etiket eklemek | Owner, proje ekibi |
| Görev atamak, görev silmek | Owner, proje manager'ı |
| Yorum yazmak | Owner, proje ekibi |
| Yorumu düzenlemek | Sadece yazarı |
| Yorumu silmek | Yazarı, owner, proje manager'ı |
| Etiket oluşturmak ve adını değiştirmek | Herkes |
| Etiket silmek | Owner |
| Kişi eklemek, devre dışı bırakmak, yeniden aktif etmek | Owner |

Owner otomatik olarak her projenin ekibine girmez; organizasyon rolü sayesinde zaten her şeyi yapabilir. Böylece ekip üyeliği anlamını korur: görevlere sadece ekipteki kişiler atanabilir.

### 6. Kişiler silinmez, devre dışı bırakılır

Görev oluşturmuş ya da yorum yazmış bir kullanıcı silinemez. Bu foreign key'ler bilerek `RESTRICT`: yer yer delikleri olan bir yorum akışı, yanında "devre dışı" yazan bir isimden daha kötüdür.

Devre dışı bırakmak:

- kişinin oturumlarını siler ve girişini net bir `USER_DEACTIVATED` hatasıyla engeller;
- her istekte tekrar kontrol edilir, yani bir şekilde hayatta kalmış bir oturum da çalışmaz;
- atamalarını ve yorumlarını korur; bunlar soluk bir avatar ve "(deactivated)" etiketiyle gösterilir;
- kişinin ekiplere eklenmesini ve ona yeni görev atanmasını engeller;
- kişinin kendisine uygulanamaz, bu da bir organizasyonun her zaman bir owner'ı olmasını garanti eder.

### 7. Tek hata biçimi, sabit kodlar

Her hata `{ "error": { "code": "EMAIL_TAKEN", "message": "..." } }` biçimindedir. Doğrulama hatalarında hatalı alanlar da eklenir. Beklenmeyen hatalar genel bir 500 döner ve sunucuda loglanır; ayrıntıları dışarı sızmaz.

Web uygulaması bu kodları tek bir dosyada (`web/src/lib/errors.ts`) kendi mesajlarına çevirir. API'nin cümleleri değişse de arayüz bozulmaz, arayüz de mesajı kullanıcının bağlamına göre söyleyebilir.

### 8. Tarayıcı API ile hiç doğrudan konuşmaz

Oturum cookie'si `SameSite=Lax`. Canlıda web uygulaması `vercel.app` üzerinde, API ise `onrender.com` üzerinde; bunlar farklı siteler, bu yüzden tarayıcı cookie'yi API'ye göndermez. Tarayıcılar zaten üçüncü taraf cookie'leri genel olarak engellemeye başladı.

Cookie'yi `SameSite=None` yapıp gevşetmek yerine Next.js `/api/*` isteklerini API'ye iletiyor (`web/next.config.ts`). Tarayıcının gözünde her şey tek bir site.

- **Bedeli:** Her istekte bir ara durak daha.
- **Getirisi:** Canlıda CORS'a gerek kalmıyor ve API'nin adresi tarayıcıda hiç görünmüyor.

### 9. Proxy ayarı tahmin edilmedi, ölçüldü

Rate limit için ziyaretçinin gerçek IP'si gerekiyor, ama API dört proxy'nin arkasında. Her biri `X-Forwarded-For` header'ına ekleme yapıyor:

```
ziyaretçi → Vercel → Cloudflare → Render'ın load balancer'ı → Render'ın yerel proxy'si → API
```

Express'teki `trust proxy` ayarı bu durak sayısına eşit olmalı:

- **Az olursa** bütün ziyaretçiler aynı proxy'den geliyormuş gibi görünür ve tek bir rate limit kovasını paylaşır.
- **Fazla olursa** ziyaretçi kendi header'ını göndererek IP'sini taklit edebilir.

Doğru sayı (4), canlıda yönlendirme zincirini ekrana basan geçici bir endpoint ile bulundu. Değer bir environment variable'da (`TRUST_PROXY`) duruyor, yerelde 0.

### 10. Demo, her ziyaretçiye özel bir sandbox

**Try the demo** **her ziyaretçi için yeni bir organizasyon** oluşturur, içini gerçekçi bir ekiple doldurur (biri devre dışı olmak üzere altı kişi, iki proje, on görev, etiketler ve yorumlar) ve ziyaretçiyi owner olarak içeri alır.

- **Neden tek ortak demo hesabı değil:** Ziyaretçiler birbirlerinin değişikliklerini görürdü, biri her şeyi silip herkesin deneyimini bozabilirdi ve özel kurallar (şifre değiştirme yok, devre dışı bırakma yok) ile her gece çalışan bir sıfırlama işi gerekirdi. Herkesin kendi sandbox'ı olunca ziyaretçi her şeyi yapabiliyor ve korunması gereken hiçbir şey kalmıyor.
- **Cron olmadan temizlik:** Her yeni demo önce 24 saatten eski demoları siler. Organizasyonlarda bir `is_demo` bayrağı var ve **varsayılan değeri `false`**: bu bayrağı sadece demo endpoint'i `true` yapar, böylece gerçek bir organizasyon yanlışlıkla silinemez. Temizlik tek bir transaction içinde ve `RESTRICT` anahtarlarının gerektirdiği sırayla çalışır (önce projeler, sonra etiketler, sonra kullanıcılar, en son organizasyon). Geri kalan her şey `CASCADE` ile kendiliğinden silinir.
- **Güvenlik:** Demo e-postaları rastgele bir ek ile `example.com` alan adını kullanır (bu alan adı ayrılmış, kimseye ait olamaz). Şifre rastgeledir ve hiçbir yerde gösterilmez. Demo oluşturma IP başına sınırlıdır.

### 11. Arayüzde veri: TanStack Query

- Sunucudan gelen bütün veri TanStack Query üzerinden geçer. Query key'ler tek bir dosyada (`web/src/lib/query-keys.ts`) durur, böylece ilişkili ekranlar birlikte yenilenir.
- Bir değişiklikten sonra etkilenen sorgular invalidate edilir ve yeniden çekilir. Tek optimistic update board'daki durum değişikliğinde var; orada sunucuyu beklemek yavaş hissettirirdi.
- Korumalı sayfalar, cookie'yi Next.js'te okumak yerine giriş yapılıp yapılmadığını API'ye (`/auth/me`) sorar. Bir oturumun hâlâ geçerli olup olmadığını bilen tek yer API.
- Herkese açık sayfalar butonlarını `/auth/me` cevabını beklemeden hemen gösterir. Sunucu uyuyorsa bu bekleme bir dakika sürebiliyordu.

### 12. Tasarım: durum şekille, renk ekibe ait

Arayüz neredeyse tek renkli; yeşil bir accent rengi ve tehlike için bir kırmızı var. Görevin durumu renkle değil, halkanın **şekliyle** (boş, yarım, dolu) gösterilir. Böylece gri tonlamada da, renk körü kullanıcılar için de okunabilir. Parlak renkler sadece ekibin kendi etiketleri için seçtiği renkler ve onlar da yalnızca küçük birer nokta olarak görünür.

## Testler

**106 entegrasyon testi**, mock'lara değil gerçek bir PostgreSQL veritabanına karşı ve HTTP üzerinden (Supertest) çalışıyor.

- **Neden gerçek veritabanı:** Bu projede en önemli kurallar veritabanında duruyor: composite foreign key'ler, unique constraint'ler, `RESTRICT` ve `CASCADE`. Mock'lanmış bir veritabanı, kodun ne varsaydıysa ona hak verirdi.
- **İzolasyon:** Her test boş tablolarla başlar. Test çalıştırıcı, veritabanı adı `_test` ile bitmiyorsa başlamayı reddeder.
- **Testler nasıl yazıldı:** Her özellik bir senaryo tablosuyla başladı: başarılı yol, giriş yapmamış kullanıcı, başka organizasyon (404), yetkisi olmaması gereken her rol (403), geçersiz veri, çakışmalar ve "hata olduğunda hiçbir şey yazılmadı" kontrolü. Sonra testler, en son kod yazıldı. Testler sadece cevaba değil veritabanının durumuna da bakar: tek başına 401 almak oturumların silindiğini kanıtlamaz, bu yüzden testler oturumları sayar.
- **Testleri test etmek:** Bazı testler, kod bilerek bozulup doğru testin düştüğü görülerek doğrulandı.

CI her pull request'te iki uygulamayı da kontrol eder. `main` korumalıdır ve sadece kontrolleri yeşil olan değişiklikleri kabul eder.

| Job | Adımlar |
|---|---|
| `api` | Typecheck ve bir PostgreSQL servis container'ına karşı bütün testler |
| `web` | Typecheck, sıfır uyarıya izin veren lint, production build |

## Yerelde çalıştırma

Gerekenler: Node.js 22 ve Docker.

```bash
# 1. Veritabanı (5433 portunda PostgreSQL)
docker compose up -d

# 2. API, http://localhost:4001
cd api
cp .env.example .env
#   PORT=4001
#   NODE_ENV=development
#   DATABASE_URL=postgresql://taskapp:taskapp@localhost:5433/taskapp
#   TEST_DATABASE_URL=postgresql://taskapp:taskapp@localhost:5433/taskapp_test
#   TRUST_PROXY=0
#   CORS_ORIGIN=http://localhost:3001
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev

# 3. Web, http://localhost:3001 (ikinci bir terminalde)
cd web
cp .env.example .env.local     # API_URL=http://localhost:4001
npm install
npm run dev
```

Testleri çalıştırmak için `api/` içinde `npm test` yeterli. Test veritabanı otomatik olarak oluşturulur ve migration'ları uygulanır.

## Deploy

| | Servis | Notlar |
|---|---|---|
| Web | Vercel | Root directory: `web`. `API_URL` API'yi gösterir ve build sırasında okunur. |
| API | Render | Root directory: `api`. Build: `npm ci --include=dev && npm run build`. Migration'lar her deploy'dan önce `npm run db:deploy` (`prisma migrate deploy`) ile çalışır. |
| Veritabanı | Neon | Doğrudan (pooling olmadan) bağlantı. |

`main`'e merge edilen her değişiklik iki uygulamayı da yayına alır. Canlı veritabanına hiçbir zaman elle migration uygulanmaz.

## Bilinen sınırlamalar

Bunlar ücretsiz bir portfolyo projesi için bilerek kabul edilmiş ödünler:

- **Cold start.** Ücretsiz API 15 dakika istek almazsa uyur, ilk istek bir dakikaya kadar sürebilir.
- **E-posta yok.** Owner'lar yeni kişilere davet göndermek yerine başlangıç şifresi belirler.
- **Gerçek zamanlı güncelleme yok.** Başkalarının yaptığı değişiklikler sayfayı yenileyince ya da sayfaya geri dönünce görünür.
- **Pagination yok.** Listeler tamamen yüklenir; küçük bir ekip için bu sorun değil.
- **E2E (uçtan uca) test yok.** API entegrasyon testleriyle kapsanıyor. Arayüz elle ve masaüstü ile telefon boyutlarında ekran görüntüleriyle kontrol edildi.
- **API adresi herkese açık.** Vercel'i atlayıp doğrudan `onrender.com` adresine istek atan biri, IP'sini taklit ederek IP bazlı rate limit'leri aşabilir. Çözümü, web uygulamasının eklediği ve API'nin zorunlu tuttuğu gizli bir header olurdu.

## İletişim

**Mert Kaya**

- LinkedIn: [linkedin.com/in/merttkaya20](https://www.linkedin.com/in/merttkaya20/)
- GitHub: [github.com/mertkaya20](https://github.com/mertkaya20)
