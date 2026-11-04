# Uzum Nasiya xarid oqimi auditi — 2026-11-04

## Tekshiruv doirasi

Production deploy GitHub SHA: `efd7cc26b59027169eae20832fcaa3f9d21adf89`; mahalliy kod shu versiyaga mos. Rasmiy hujjat va uning `redocusaurus/ru_nasiya.yaml` spetsifikatsiyasi tekshirildi. Mahsulot yoki qarz shartnomasi yaratilmagan, SMS yuborilmagan, production kod o'zgartirilmagan.

Manbalar:
- https://developer.uzumbank.uz/nasiya/#tag/API-MFO/operation/checkBuyerStatus
- https://developer.uzumbank.uz/nasiya/#tag/API-MFO/operation/calculateOrder
- https://developer.uzumbank.uz/nasiya/#tag/API-MFO/operation/createOrder
- https://developer.uzumbank.uz/redocusaurus/ru_nasiya.yaml

## Hozirgi oqim

Savatdagi ism, telefon, hudud va manzil to'ldiriladi. Nasiya oynasi ochilganda telefon avtomatik tekshiriladi.

`status=4` va musbat buyer_id bo'lsa, sayt has_limit va umumiy balance orqali oldindan cheklaydi. Shu tekshiruvlardan o'tsa calculate chaqiriladi; mavjud tariflar ko'rsatiladi. Mijoz tarifni tanlab rasmiylashtirishni bosgandan keyin orders chaqiriladi va javobdagi webview_path OTP imzolash uchun ochiladi.

Ro'yxatdan o'tishni tugatish kerak bo'lgan mijoz uchun check-status qaytargan webview alohida vazifaga ega. Bu havolani orders qaytargan imzolash havolasi bilan almashtirib bo'lmaydi.

## Tasdiqlangan muammolar

### 1. Kalkulyator oldidagi umumiy balance tekshiruvi xaridni erta to'xtatadi

`src/components/UzumCheckout.tsx:128–146`.

`Number(j.data?.balance ?? 0)` yo'q qiymatni nol deb oladi. Rasmiy BuyerStatusDataMFO sxemasida balance required emas, available_periods esa required; uning elementlarida muddat bo'yicha available_balance mavjud. Kod bu muddat limitlarini ishlatmaydi.

Amaldagi handlePhone funksiyasi mock javob bilan bajarildi: status=4, buyer_id mavjud, has_limit=true, available_periods ichida 800000 limit, umumiy balance yo'q. Natija: faqat check-status chaqirildi; calculate chaqirilmadi va mijozga limit hali ochilmagan degan xabar berildi.

Tavsiya: yo'q balance ni nol bilan tenglashtirmaslik; tasdiqlangan mijozning tarifga mosligini calculate javobi bilan aniqlash. Umumiy limitni yagona xarid ruxsati mezoni qilmaslik.

### 2. Kalkulyator xatosi ham verifikatsiya tugmasini chiqaradi

`src/components/UzumCheckout.tsx:122, 203–221, 298–307`.

webview har qanday check-status javobidan saqlanadi. Tugma `webviewUrl && (info || error) && step === 'phone'` sharti bilan chiqadi. Demak tarif rad etilishi yoki hisoblash tarmoq xatosi ham ro'yxatdan o'tish havolasini taklif qiladi. Bu verifikatsiya zarurligining dalili emas.

Telefon almashtirilganda va yangi urinishda eski webviewUrl tozalanmaydi. Yangi javobda webview bo'lmasa oldingi havola qoladi. Status=4 bo'lib buyer_id topilmasa ham umumiy fallback ro'yxatdan o'tish webview'iga avtomatik yuboradi.

Tavsiya: verifikatsiya zarurligini alohida holat bilan belgilash; havolani telefon/urinishga bog'lash va tozalash; buyer_id yo'qligini API javobi xatosi sifatida ko'rsatish.

### 3. Verifikatsiyadan qaytishda xarid konteksti tiklanmaydi

`src/app/cart/page.tsx:40–45`, `src/components/UzumCheckout.tsx:159`.

Ism, telefon, manzil, hudud faqat React holatida. Registratsiyaga ketishdan avval ularni saqlash yoki qaytishda avtomatik check-status/calculate davom ettirish mavjud emas. To'liq navigatsiyadan keyin mijoz formani yana to'ldirishiga to'g'ri keladi.

### 4. Kalkulyator depozit va birinchi to'lov sanasini ko'rsatmaydi

`src/components/UzumCheckout.tsx:8–21, 370–390`.

Ekranda oylar, jami va oyiga summa bor. API qaytaradigan deposit va first_payment_date ko'rsatilmaydi. Bu qiymatlar nol bo'lmagan yoki xarid sanasidan farqlangan tarifda mijoz to'lov shartlarini oldindan to'liq ko'rmaydi.

calculate va orders narxi serverda bir xil computeOrderTotal orqali hisoblanishi to'g'ri. Oylik summa ham API javobidan olinadi.

### 5. Imzolashdan avval serverda shartnoma va savat bog'lanishi yo'q

`src/app/api/uzumnasiya/create-order/route.ts:53–72`, `src/lib/uzum-pending.ts:18–35`.

orders javobidagi shartnoma mijoz brauzerining localStorage'iga yoziladi. Serverdagi uzum_contracts yozuvi faqat keyinchalik finalize'da yaratiladi. Mijoz qaytmasa, boshqa brauzer ochsa, storage ishlamasa yoki yozuv 24 soatdan oshsa, avtomatik yakunlash uchun ma'lumot yo'qoladi. savePending storage yozish xatosini ham yutadi va redirect davom etadi.

Takroriy create-order so'rovi uchun serverda saqlangan barqaror idempotency bog'lanishi ham yo'q; odatda yangi vaqtga bog'liq ext_order_id yaratiladi.

### 6. Webhook buyurtmani noto'g'ri identifikator bilan izlaydi

`src/app/api/uzumnasiya/webhook/route.ts:12–32`.

create-order raqamli ext_order_id yuboradi; webhook esa uni orders.id bilan solishtiradi. orders.id UUID. Faqat contract_id kelganda uzum_contracts orqali qidirish o'rniga orders bo'yicha filtrsiz maybeSingle bajariladi. Hali finalize bo'lmagan shartnoma uchun buyurtma ham mavjud emas. Webhook mijoz qaytishini almashtiradigan ishonchli tiklash mexanizmi bo'lib ishlamaydi.

### 7. Imzo va yakuniy saqlashning tekshiruvi yetarli emas

`src/lib/uzum-pending.ts:97–98`, `src/app/api/uzumnasiya/finalize/route.ts:58–62, 97–110`.

Imzolangan deb faqat contract_status 1 yoki 2 orqali qaror qilinadi; alohida is_signed maydoni tekshirilmaydi. Hujjatda status=2 moderatsiya deb ko'rsatilgan. Bu holatni imzo yo'q deb yoki albatta imzolangan deb umumlashtirish yetarli emas.

finalize ichida orders insert va uzum_contracts upsert alohida bajariladi. Ikkinchi yozuv xatosi faqat logga yoziladi, javob esa muvaffaqiyatli qaytadi. Keyingi takroriy urinishda idempotentlik bog'lanishi yo'qolishi mumkin.

Pending topilmasa payment-success sahifasi generic muvaffaqiyat holatini ko'rsatadi (`src/components/UzumPaymentResult.tsx:23–28`), Uzum buyurtmasini server orqali aniqlamaydi.

## Sinovlar va chegaralar

Haqiqiy komponent funksiyasi lokal mock muhitda 4 holatda bajarildi:
1. Tasdiqlangan, muddat limiti bor, balance yo'q: calculate chaqirilmadi.
2. Tasdiqlangan, balance=800000, tarif rad etilgan: calculate chaqirildi, umumiy limit xabari berildi; UI sharti verifikatsiya havolasini ko'rsatadi.
3. Tasdiqlangan, buyer_id va balance bor, tarif mavjud: calculate chaqirildi, tarif bosqichiga o'tildi.
4. Status=4, buyer_id yo'q, webview bor: ro'yxatdan o'tish havolasiga avtomatik redirect bo'ldi.

Sinov natijalari: `scratch/uzum-flow-reproduction-2026-11-04.json`.

Bazani faqat count bilan o'qish: uzum_contracts jadvali mavjud, 9 yozuv; nasiya turidagi orders 8 yozuv. Bu sonlar orasidagi farqning o'zi yo'qolgan buyurtmani isbotlamaydi. Jadval yo'q degan to'siq aniqlanmadi.

Production kod SHA tekshirildi. Vercel diagnostika loglarini o'qish mavjud avtorizatsiya bilan Not authorized qaytardi. Shu sabab aynan rasmdagi mijozning check-status va calculate javoblari ko'rilmadi. Uning holatiga qat'iy sabab qo'yish uchun aynan o'sha urinishdagi status, buyer_id bor-yo'qligi, has_limit, balance, muddat limitlari va calculate error_message kerak; telefon/tokenlarni oshkor qilish kerak emas.

## Tavsiya etilgan tuzatish tartibi

1. Kalkulyatorgacha noto'g'ri bloklashni va xato paytidagi verifikatsiya tugmasini tuzatish.
2. Registratsiyadan qaytish va kalkulyator shartlarini to'liq ko'rsatishni tiklash.
3. OTP redirect'dan oldin serverda pending shartnoma/savat bog'lanishini saqlash, webhook qidiruvini shu bog'lanishga o'tkazish.
4. Imzo holati, atomik/idempotent yakunlash va muvaffaqiyat sahifasini server ma'lumoti bilan tekshirish.

800000 so'mlik ko'rsatilgan limit va 800000 so'mlik savatning tengligi barcha muddatlar mavjudligini kafolatlamaydi. Aynan qaysi tarif ochiqligini kalkulyator qaytarishi kerak. Karta qo'shish haqiqatan kerakmi yoki sayt mijozni ortiqcha verifikatsiyaga yubordimi — mazkur mijozning API javobisiz ajratib bo'lmaydi.
