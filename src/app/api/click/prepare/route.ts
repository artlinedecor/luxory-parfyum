import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

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
    const amount = formData.get('amount') as string;
    const action = formData.get('action') as string;
    const error = formData.get('error') as string;
    const error_note = formData.get('error_note') as string;
    const sign_time = formData.get('sign_time') as string;
    const sign_string = formData.get('sign_string') as string;

    // 1. Check signature
    const checkString = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`;
    const expectedSign = crypto.createHash('md5').update(checkString).digest('hex');

    if (sign_string !== expectedSign) {
      return NextResponse.json({
        error: -1,
        error_note: 'SIGN CHECK FAILED'
      });
    }

    if (action !== '0') {
      return NextResponse.json({
        error: -3,
        error_note: 'Action not found'
      });
    }

    // 2. Find order in database
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

    // 3. Check if already paid
    if (order.payment_status === 'paid') {
      return NextResponse.json({
        error: -4,
        error_note: 'Already paid'
      });
    }

    // 4. Check if cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json({
        error: -9,
        error_note: 'Transaction cancelled'
      });
    }

    // 5. Check amount
    const orderTotal = Number(order.total_amount || 0);
    const requestedAmount = Number(amount);
    
    // We allow a small float precision difference if any, but they should match
    if (orderTotal > 0 && Math.abs(orderTotal - requestedAmount) > 1) {
      return NextResponse.json({
        error: -2,
        error_note: 'Incorrect parameter amount'
      });
    }

    // 6. Update order status to waiting
    await supabase
      .from('orders')
      .update({
        payment_status: 'waiting',
        click_trans_id: parseInt(click_trans_id),
        click_paydoc_id: parseInt(click_paydoc_id)
      })
      .eq('id', merchant_trans_id);

    return NextResponse.json({
      click_trans_id: click_trans_id,
      merchant_trans_id: merchant_trans_id,
      merchant_prepare_id: click_trans_id,
      error: 0,
      error_note: 'Success'
    });
    
  } catch (err) {
    console.error('Click Prepare Error:', err);
    return NextResponse.json({ error: -8, error_note: 'Error in request from click' });
  }
}
