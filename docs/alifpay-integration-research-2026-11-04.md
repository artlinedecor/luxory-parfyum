# Alifpay integratsiyasini o'rganish

Tekshirilgan sana: 2026-11-04. Bu hujjat tadqiqot natijasi; Alif integratsiyasi hali kodga qo'shilmagan.

## Sayt uchun tanlangan yo'l

Tavsiya: dastlab Alif'ning tayyor onlayn kassasidan foydalanish. Server buyurtmani saqlaydi, `POST /invoice` bilan hisob yaratadi va qaytgan identifikatorni buyurtmaga bog'laydi. Mijoz `https://checkout.alifpay.uz/?invoice=<id>` sahifasiga o'tadi. `meta` ichida ichki buyurtma ID'sini berish mumkin. Qaytish va bekor qilish uchun alohida HTTPS URL'lar belgilanadi. Hisobni qayta olish metodi — `POST /getInvoice`.

Manba: [Onlayn kassa](https://docs.alifpay.uz/checkout/).

## Protokol va webhook

Production API: `https://api.alifpay.uz/v2`. Metodlar POST/JSON bilan chaqiriladi. Merchant avtorizatsiyasi `Token` sarlavhasida; filiallar uchun beta `Store-Token` mavjud. Test va production tokenlari alohida.

HTTP 200 javobi ichida ham `error` bo'lishi mumkin. Webhook `Signature` sarlavhasi raw so'rov baytlaridan HMAC-SHA256 hisoblab, Base64 shaklida solishtiriladi. JSON'ni qayta serialize qilish imzoni o'zgartirishi mumkin.

Hujjatga ko'ra, webhook odatda bir soat davomida 200 javobigacha takrorlanadi; yetkazib berilmasa to'lov bekor qilinib, mablag' qaytishi mumkin. Shu sabab tasdiqlash bazaga ishonchli yozilgandan keyin ACK berish kerak.

Manba: [Kirish, xatolar va webhook](https://docs.alifpay.uz/).

## Pul va to'lov holatlari

Summalar tiyinlarda: 800000 so'm = 80000000 tiyin. `SUCCEEDED` — muvaffaqiyat; `PENDING`, `OTP_REQUIRED`, `HELD` esa yakuniy to'langan holat emas. `REVERTED` qaytarishni anglatadi. Bevosita karta to'lovi `/pay` va `/confirmPayment`, holatni olish `/getPayment` orqali ishlaydi. Javob noaniq bo'lsa avval mavjud ID holatini olish, yangi yechib olish so'rovini avtomatik yubormaslik kerak.

Manba: [To'lovlar](https://docs.alifpay.uz/payments/).

## Karta, hold va fiskal ma'lumotlar

Uzcard/Humo kartalarini bog'lash tokenizatsiya va OTP tasdig'idan o'tadi. Hosted checkout tanlansa, dastlab o'z saytimizda karta rekvizitlarini qabul qiladigan forma qurish talab etilmaydi.

[Kartalar](https://docs.alifpay.uz/cards/).

Hold mablag'ni vaqtincha band qiladi; u o'z-o'zidan yakuniy hisob-kitob emas. Bu oqimni alohida holat sifatida yuritish kerak.

[Hold](https://docs.alifpay.uz/hold/).

Chek yoqilganda mahsulot IKPU/SPIC, kerakli soliq va markirovka ma'lumotlari to'ldiriladi. Bizning Click modulida parfyumeriya konstantalari mavjud; Alif uchun merchant ma'lumotlari bilan mosligi tekshirilishi kerak.

## Nasiya bo'yicha aniq va noaniq jihatlar

Checkout hujjatida nasiya uchun hold, sandbox'da esa `/_payInvoiceWithMobi` va `installment:true` misoli bor. Bu imitatsiya metodi faqat test muhiti uchun. Uni production nasiya yaratish metodi deb ishlatib bo'lmaydi.

Ko'rilgan v2 bo'limlarda Uzum'dagi kabi alohida telefon-limit tekshirish va oylik tarif kalkulyatori aniqlanmadi. Bu bunday xizmat umuman yo'q degani emas. Bizning merchant uchun nasiya ochilishi, muddatlar, ustama/komissiya va sayt ichidagi kalkulyator uchun alohida API zarurligini Alif integratsiya jamoasidan tasdiqlash kerak. Shartlar tasdiqlanmasdan 3/6/12 oy yoki 0% deb ko'rsatilmaydi.

Kartani baholashdagi `/getSummary` karta kirim-chiqim statistikasi beradi; uni tasdiqlangan nasiya limiti sifatida talqin qilmaymiz.

[Kassa va test imitatsiyasi](https://docs.alifpay.uz/checkout/), [karta statistikasi](https://docs.alifpay.uz/summary/).

## Amaldagi versiya

Hozirgi hujjatdagi `payment`, `/pay`, `/confirmPayment` nomlari asos qilib olinadi. Eski v1 misollaridagi `charge`, `/purchase` va `ref` nomlarini yangi integratsiyaga aralashtirmaslik kerak.

[O'zgarishlar](https://docs.alifpay.uz/changelog/).

## Bizning loyihaga moslashtirish

Narx `src/lib/pricing-server.ts` dagi `computeOrderTotal` orqali bazadan olinadi. Alif invoice/payment ID'si tashqi va ichki buyurtmani bog'laydi. Yaratishdan oldin pending buyurtma serverda saqlanadi; parallel qayta bosishlar bitta urinishga bog'lanadi. Brauzerning success URL'ga kelishi o'zi to'lov isboti bo'lmaydi.

Click imzo formulasi yoki Uzum shartnoma statuslari ko'chirilmaydi. Alif uchun mustaqil status adapteri, serverda imzo tekshiruvi va idempotent yakunlash kerak. Redirect, noto'g'ri imzo, takroriy webhook, summa mos kelmasligi, timeout, bekor qilish va refund holatlari sandbox'da tekshiriladi.

## Ulanishdan oldin kerak bo'ladigan ma'lumotlar

- Sandbox va production merchant tokenlari, webhook secret; kalitlar server sozlamalariga kiritiladi.
- Sandbox API va kassa manzillarining Alif bergan konfiguratsiyasi.
- Do'kon uchun nasiya yoqilganligi, ruxsat etilgan muddatlar va hisoblash usuli.
- Fiskal chek kim tomonidan yuborilishi va mahsulot/merchant rekvizitlari.
- Nasiya uchun yetkazishdan keyin hold capture yoki `skip_payouts` kabi alohida jarayon kerakligi.

Bu tadqiqotda hisob, real to'lov yoki SMS yaratilmagan, saytning to'lov funksiyalari o'zgartirilmagan.
