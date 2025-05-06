# Özel Oda Yönetimi Discord Botu ve Web Paneli

Bu proje, Discord sunucunuzda özel oda (private room) yönetimini kolaylaştıran bir bot ve modern bir web paneli içerir. Kullanıcılar için otomatik oda oluşturma, oda yönetimi ve canlı istatistikler sunar.

## Özellikler

- 🎤 **Otomatik Özel Oda Oluşturma:** Belirli bir ses kanalına giren kullanıcıya otomatik özel oda açılır.
- 🗑️ **Oda ve Kanal Silme:** Web panelinden veya Discord'dan oda ve ilişkili kanalları güvenli şekilde silebilirsiniz.
- 👤 **Kullanıcı Yetkilendirme:** Odaya kimlerin girebileceğini belirleyin, kullanıcı ekleyip çıkarın.
- 📊 **Canlı Sunucu İstatistikleri:** Toplam üye, sesli/metin kanal sayısı ve özel oda sayısı web panelinde anlık görüntülenir.
- 🔒 **Güvenli Giriş:** Web paneline sadece admin kullanıcı adı ve şifresiyle giriş yapılabilir.
- 🌙 **Discord Temalı Modern Arayüz:** Mobil uyumlu, animasyonlu ve koyu temalı web paneli.
- ⚡ **Gerçek Zamanlı Güncelleme:** Socket.IO ile anlık oda ve istatistik güncellemeleri.

---

## Botun Çalışma Mantığı

### Genel Bakış

Bu bot, Discord sunucunuzda kullanıcıların kolayca özel oda (private room) oluşturmasını ve yönetmesini sağlar. Ayrıca, web paneli üzerinden odaları ve kanalları yönetebilirsiniz.

### Temel İşleyiş

1. **Otomatik Oda Oluşturma**
   - Kullanıcı, sunucuda belirlenen "ozelodaolustur" adlı ses kanalına girer.
   - Bot, bu kullanıcı için otomatik olarak yeni bir sesli kanal ve ona özel bir metin kanalı oluşturur.
   - Kullanıcı, otomatik olarak bu yeni sesli kanala taşınır.
   - Oda sahibi, odasının ismini ve kullanıcı limitini değiştirebilir, kullanıcı ekleyip çıkarabilir.

2. **Oda Yönetimi**
   - Oda sahibi, Disc'daki butonlar veya web paneli üzerinden odasını yönetebilir.
   - Odaya kullanıcı ekleyebilir, çıkarabilir, herkese açıp kapatabilir.
   - Oda boş kaldığında (kimse yoksa) bot, hem sesli hem metin kanalını ve veritabanındaki oda kaydını otomatik olarak siler.

3. **Web Paneli ile Yönetim**
   - Admin, web paneline giriş yapar.
   - Panelde tüm aktif özel odalar, oda sahipleri ve kanal bilgileri listelenir.
   - Admin, panelden odaları silebilir. Silinen odanın hem sesli hem metin kanalı Discord'dan kaldırılır ve veritabanından silinir.
   - Panelde ayrıca sunucuya ait toplam üye, kanal ve oda istatistikleri canlı olarak gösterilir.

4. **Güvenlik**
   - Web paneline sadece admin kullanıcı adı ve şifresiyle giriş yapılabilir.
   - Oda yönetimi sadece oda sahibi veya admin tarafından yapılabilir.

### Kısaca Akış

- Kullanıcı → "ozelodaolustur" kanalına girer → Bot yeni oda açar → Kullanıcıyı yeni odaya taşır.
- Oda sahibi veya admin → Panelden veya Discord'dan odasını yönetir/siler.
- Oda boş kalırsa → Bot otomatik olarak odayı ve kanalları siler.

---

## Kurulum

### 1. Depoyu İndir

```bash
git clone https://github.com/kullanici/ozeloda.git
cd ozeloda
```

### 2. Gerekli Paketleri Kur

```bash
npm install
```

### 3. Yapılandırma Dosyasını Düzenle

`config.json` dosyasını açıp kendi bilgilerinize göre doldurun:

```json
{
  "prefix": "!",
  "token": "BOT_TOKENINIZ",
  "owners": ["SAHIP_ID"],
  "mongoURI": "mongodb://localhost:27017/ozeloda",
  "BOTSESLA": "BOTUN_GIRECEGI_SES_KANALI_ID",
  "erkekrol": "ERKEK_ROL_ID",
  "kizrol": "KIZ_ROL_ID",
  "karantina": "KARANTINA_ROL_ID",
  "webPort": 3000,
  "admin": {
    "username": "ramal",
    "password": "ramal123"
  },
  "guildId": "SUNUCU_ID"
}
```

- **BOT_TOKENINIZ:** Discord bot tokeniniz.
- **SAHIP_ID:** Bot sahibi Discord kullanıcı ID'si.
- **guildId:** Botun çalışacağı sunucunun ID'si.
- Diğer ID'leri sunucunuzdan kopyalayabilirsiniz.

### 4. MongoDB'yi Başlat

Botun oda kayıtlarını tutabilmesi için MongoDB çalışıyor olmalı. Lokal kurulum için:

```bash
mongod
```

### 5. Botu ve Web Panelini Başlat

```bash
node ramalsikimsonikoda.js
```

Başarıyla başlatıldığında konsolda `hazır!` mesajı göreceksiniz.

---

## Kullanım

### Web Paneline Giriş

1. Tarayıcınızda `http://localhost:3000` adresine gidin.
2. Admin kullanıcı adı ve şifrenizle giriş yapın (varsayılan: ramal / ramal123).
3. Sunucu istatistiklerini ve özel odaları görüntüleyin.
4. Oda silme, kullanıcı ekleme/çıkarma gibi işlemleri panelden yapabilirsiniz.

### Discord Üzerinden

- Kullanıcılar belirlenen ses kanalına girince otomatik olarak kendilerine özel oda açılır.
- Oda sahibi, panelden veya Discord'dan odasını yönetebilir.

---

## Sıkça Sorulan Sorular

**Oda silindiğinde kanallar da siliniyor mu?**  
Evet, hem sesli hem metin kanalı otomatik olarak silinir.

**Panelde undefined görünüyor, ne yapmalıyım?**  
Bozuk oda kayıtları otomatik temizlenir. Yine de sorun devam ederse botu yeniden başlatın.

**Birden fazla admin ekleyebilir miyim?**  
Şu an için tek admin destekleniyor. Geliştirme için kodu güncelleyebilirsiniz.

---

## Katkı ve Lisans

- Katkıda bulunmak için PR gönderebilirsiniz.
- MIT Lisansı ile lisanslanmıştır.


![image](https://cdn.discordapp.com/attachments/1334158569246822453/1369405879262380082/image.png?ex=681bbe1b&is=681a6c9b&hm=15d87e68dc7524f202911023f2413179bd30512b5b88369f5f67bcc5649180fd&)
![image](https://cdn.discordapp.com/attachments/1352324106548150496/1369407947355979909/Ekran_goruntusu_2025-05-07_001801.png?ex=681bc009&is=681a6e89&hm=1f0042afa089648f1653a929a4049f19373195b977ffc490fc62f8acf3774904&)
