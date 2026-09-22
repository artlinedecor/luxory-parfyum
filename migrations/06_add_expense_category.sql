-- 2026-09-22: rasxodni "tovar xaridi (aktiv)" / "operatsion xarajat" deb
-- ANIQ belgilash uchun. Ilgari bu description matnidan regex bilan
-- taxmin qilinardi ("tavar", "tovar", "cargo" kabi so'zlar) — ishonchsiz,
-- noto'g'ri so'z ishlatilsa xato tasniflanardi.

alter table transactions add column expense_category text;

-- Bir martalik backfill: eski regex bilan bir xil mantiqda eski
-- yozuvlarni to'ldiramiz (0-vazifadagi audit bilan solishtirib
-- tekshiriladi). Buni keyinroq admin panel orqali qo'lda tuzatish
-- mumkin — bu faqat boshlang'ich nuqta.
update transactions
set expense_category = case
  when type = 'expense' and description ~* '(tavar|tovar|mahsulot|xarid|oldik|yulkira|cargo|kargo|turkiya|prixod)'
    then 'inventory'
  when type = 'expense'
    then 'operating'
  else null
end;
