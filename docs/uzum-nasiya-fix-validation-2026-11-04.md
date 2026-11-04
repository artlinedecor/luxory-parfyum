# Uzum Nasiya checkout tuzatishlari va tekshiruvlari

## Amalga oshirilgan o'zgarishlar

- Tasdiqlangan mijoz uchun umumiy balance maydoni yo'qligi kalkulyatorni to'xtatmaydi. Qaysi muddat mavjudligini Uzum calculate javobi hal qiladi.
- Registratsiya havolasi faqat aniq tugallanmagan registratsiya statuslari uchun beriladi. Hisoblash/tarmoq xatolari bunday havola chiqarmaydi. Telefon almashtirilganda eski havola va eski asinxron javoblar bekor qilinadi.
- Verifikatsiyaga ketishdan oldingi kontaktlar sessionStorage'da saqlanadi; qaytishda forma tiklanib tekshiruv davom etadi.
- Tariflarda depozit va birinchi to'lov sanasi ko'rsatiladi. Kalkulyatordan oldingi "0 so'm hozir" va "karta shart emas" kafolatlari olib tashlandi.
- Server narxni bazadan olib, tanlangan tarifni yana hisoblaydi. Mijoz ko'rgan jami summa o'zgarsa yangi shartlarni tasdiqlash talab qilinadi. Shartnoma jami va oyligi kalkulyator javobiga mos kelmasa imzolash havolasi berilmaydi.
- Bank orders so'rovidan oldin orders jadvalida kutilayotgan yozuv saqlanadi. Uning UUID kaliti parallel so'rovlar uchun atomik qulf bo'lib xizmat qiladi. Bir xil so'rov qayta yuborilganda yangi shartnoma yaratilmaydi.
- Mavjud items JSONB maydonida integratsiya metama'lumotlari saqlanadi; mahsulot qatorlari massivi formati saqlangan. Yangi jadval, SQL migratsiya yoki kengaytirilgan baza ruxsati talab qilinmaydi. Payment status qiymatlari mavjud CHECK cheklovlariga mos: unpaid/waiting/pending/paid/cancelled.
- Bank javobi orders va uzum_contracts'ga alohida saqlanadi. Qisman saqlash xatosida server imzolagan recovery receipt brauzerga beriladi; u keyingi urinishda natijani o'zgartirmasdan tiklaydi. Receipt tekshirilmasdan brauzerdan bank ID yoki narx qabul qilinmaydi.
- Xususiy HttpOnly cookie localStorage bo'lmasa ham aynan o'sha buyurtmaga kirish beradi. Tiklash tokenining SHA-256 xeshi bazada saqlanadi; boshqa token bilan murojaat 403 qaytaradi.
- Webhook raqamli tashqi ID yoki oldindan bog'langan contract_id orqali buyurtmani topadi. Body ichidagi PAID holatiga ishonmaydi; bankdan imzo va holat tekshiriladi.
- Faqat is_signed=true va ruxsat etilgan holat xaridni yakunlaydi. Imzosiz moderatsiya muvaffaqiyat emas. Bekor qilish parallel imzolash/aktivlashtirish so'rovi bilan qayta paid holatiga o'tib ketmaydi.
- Yakunlash va bank javobini tiklash JSON va holat solishtiruvi bilan atomik bajariladi; kechikkan yozuv tasdiqlangan yoki bekor qilingan natijani bosib ketmaydi.
- Admin panel ochilganda javob yuborilgandan keyin cheklangan partiya serverda tekshiriladi. last_checked_at navbati eski buyurtmalarni ham qamrab oladi. Webhook va admin tekshiruvi mijoz qaytishiga bog'liq emas.
- Bildirishnomalar serverdagi buyurtma ma'lumotidan tuziladi. Yuborish qulfi muddatli; uzilgan ish keyin qayta olinadi. Imzolangan, lekin bildirishnomasi yetmagan buyurtmalar ham navbatga kiradi.

## Tekshiruv dalillari

- Unit/regression: 164 test o'tdi, jumladan buyer routing, shartnoma imzosi, parallel create, bank timeout, tarif o'zgarishi, receipt imzosi/egalik, qisman baza xatosi, cancellation race, notification lease va navbat adolatliligi.
- Haqiqiy baza: vaqtinchalik nol summali yozuv bilan JSON tashqi ID qidiruvi, to'liq JSON compare-and-set, takroriy yakunlashni rad etish va anon o'qish izolyatsiyasi tekshirildi. Sinov yozuvi o'chirildi.
- Haqiqiy mahalliy finalize route: localStorage'siz cookie bilan tiklash 200/signed; noto'g'ri token 403. Bank yoki Telegram chaqiruviga o'tilmagan. Vaqtinchalik sinov yozuvi tozalandi.
- Brauzer, mock bank javoblari: status=4 va faqat muddat limiti bilan kalkulyator ochildi; hisoblash xatosida verifikatsiya havolasi chiqmadi; registratsiya sahifasidan qaytganda ism/telefon/manzil tiklandi va kalkulyator avtomatik ochildi; 200000 depozit va 04.12.2026 sanasi to'g'ri ko'rsatildi.
- TypeScript tekshiruvi, production build va o'zgargan fayllar lint tekshiruvi o'tdi; lint xatolari 0.

## Amaliy chegaralar

Haqiqiy mijoz nomidan qarz shartnomasi yaratilmagan, SMS/OTP tasdiqlanmagan. Uzumning real limit, qarzdorlik, karta va verifikatsiya talablari saqlanadi.

Eski, serverga hech qachon bog'lanmagan brauzer-only pending shartnomalar avtomatik ravishda yangi buyurtma qilib olinmaydi; ular do'kon orqali tekshiriladi. Bank natijasi noaniq bo'lsa avtomatik ikkinchi shartnoma yaratilmaydi.

Ikkala saqlash yozuvi ham, javobdagi receipt yetkazilishi ham bir paytda uzilsa, serverdagi dastlabki draft tekshiruvga qoladi. Yetishmagan bank metama'lumoti yoki summasi mos bo'lmagan shartnoma xulosasiz muvaffaqiyatga aylantirilmaydi. Bunday holatda bank bilan qo'lda tekshirish talab qilinadi.

Webhook jo'natilishi bank tomonidagi sozlamaga bog'liq. Koddagi alternativ tekshiruv admin panel ochilganda ishlaydi; bu alohida doimiy cron xizmati emas.
