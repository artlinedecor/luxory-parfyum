import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { submitOfdData } from '@/lib/click-merchant';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const click_trans_id = formData.get('click_trans_id') as string;
    const service_id = formData.get('service_id') as string;
    const click_paydoc_id = formData.get('click_paydoc_id') as string;
    const merchant_trans_id = formData.get('merchant_trans_id') as string;
    const merchant_prepare_id = formData.get('merchant_prepare_id') as string;
    const amount = formData.get('amount') as string;
    const action = formData.get('action') as string;
    const error = formData.get('error') as string;
    const error_note = formData.get('error_note') as string;
    const sign_time = formData.get('sign_time') as string;
    const sign_string = formData.get('sign_string') as string;

    // 1. Check signature
    const checkString = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`;
    const expectedSign = crypto.createHash('md5').update(checkString).digest('hex');

    if (sign_string !== expectedSign) {
      return NextResponse.json({
        error: -1,
        error_note: 'SIGN CHECK FAILED'
      });
    }

    if (action !== '1') {
      return NextResponse.json({
        error: -3,
        error_note: 'Action not found'
      });
    }

    // 2. Find order
    const { data: order, error: dbError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', merchant_trans_id)
      .single();

    if (dbError || !order) {
      return NextResponse.json({
        error: -5,
        error_note: 'Order not found'
      });
    }

    // Check if error from Click is not 0 (e.g. payment reversed or failed)
    if (error !== '0') {
      // If error < 0, payment failed or cancelled. We should cancel order payment status.
      if (parseInt(error) < 0) {
        await supabase
          .from('orders')
          .update({ payment_status: 'cancelled' })
          .eq('id', merchant_trans_id);
        
        return NextResponse.json({
          error: -9,
          error_note: 'Transaction cancelled'
        });
      }
    }

    // 3. Check if already paid
    if (order.payment_status === 'paid') {
      return NextResponse.json({
        error: -4,
        error_note: 'Already paid'
      });
    }

    // 4. Update order status to paid
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'accepted' // Automatically accept order if paid via Click
      })
      .eq('id', merchant_trans_id);

    // Send Telegram Notification ONLY on successful payment
    try {
      await fetch(new URL("/api/telegram-notify", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: order.client_name,
          clientPhone: order.client_phone,
          region: order.region, // In DB we store "Region - Address", wait no, we store regionDisplay in region, and nothing in address if it was combined. Let's just pass what we have.
          address: order.client_address || "",
          items: order.items,
          totalAmount: order.total_amount,
          orderType: order.order_type,
        }),
      });
    } catch (e) {
      console.warn("Telegram Bot notification failed in webhook:", e);
    }

    // 5. Trigger OFD Fiscalization
    if (order.items && order.items.length > 0) {
      await submitOfdData(order, parseInt(click_paydoc_id));
    }

    return NextResponse.json({
      click_trans_id: click_trans_id,
      merchant_trans_id: merchant_trans_id,
      merchant_confirm_id: click_trans_id, // Or order.id
      error: 0,
      error_note: 'Success'
    });
    
  } catch (err) {
    console.error('Click Complete Error:', err);
    return NextResponse.json({ error: -8, error_note: 'Error in request from click' });
  }
}
