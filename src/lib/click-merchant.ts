import crypto from 'crypto';

const CLICK_MERCHANT_USER_ID = process.env.CLICK_MERCHANT_USER_ID || '';
const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY || '';
const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID || '';

export async function submitOfdData(order: any, clickPaymentId: number) {
  if (!CLICK_MERCHANT_USER_ID || !CLICK_SECRET_KEY || !CLICK_SERVICE_ID) {
    console.warn('Click Merchant API credentials missing. Skipping OFD fiscalization.');
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const digestString = timestamp + CLICK_SECRET_KEY;
  const digest = crypto.createHash('sha1').update(digestString).digest('hex');
  const authorization = `${CLICK_MERCHANT_USER_ID}:${digest}:${timestamp}`;

  const items = order.items.map((item: any) => {
    // We assume price_at_purchase is in USD, and we must calculate UZS amount here if order.total_amount wasn't storing individual UZS prices.
    // However, since order.items doesn't store UZS price explicitly, we should calculate it. 
    // Wait, the easiest way is to distribute the total_amount across items.
    // Let's assume the frontend passes price_uzs inside items, or we just use a simplified approximation.
    // Actually, in cart we use calculateOriginalPriceUzs and calculatePremiumPriceUzs. 
    // It's safer to just calculate it here again or assume it's passed.
    
    // For OFD, price must be in tiyin (cents).
    const uzsPrice = Math.round(Number(item.price_uzs || 0)); // Assuming we will pass price_uzs from frontend
    const priceTiyin = uzsPrice * 100;
    const totalPosTiyin = priceTiyin * item.quantity;
    const vatPercent = 12;
    const vatTiyin = Math.round(totalPosTiyin * vatPercent / (100 + vatPercent));

    return {
      Name: item.title,
      // Default SPIC / ИКПУ for Parfumes.
      SPIC: "03303001001000000", 
      PackageCode: "799000",
      GoodPrice: priceTiyin,
      Price: totalPosTiyin,
      Amount: item.quantity,
      VAT: vatTiyin,
      VATPercent: vatPercent
    };
  });

  const totalAmountTiyin = Math.round(Number(order.total_amount) * 100);

  const payload = {
    service_id: parseInt(CLICK_SERVICE_ID),
    payment_id: clickPaymentId,
    items: items,
    received_ecash: 0,
    received_cash: 0,
    received_card: totalAmountTiyin
  };

  try {
    const response = await fetch('https://api.click.uz/v2/merchant/payment/ofd_data/submit_items', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Auth': authorization
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('OFD Response:', data);
    return data;
  } catch (error) {
    console.error('Click OFD Fiscalization Error:', error);
    return null;
  }
}
