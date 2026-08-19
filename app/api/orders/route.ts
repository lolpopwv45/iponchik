import { NextResponse } from 'next/server'
import { createOrder, type CreateOrderInput } from '@/lib/orders'

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as CreateOrderInput
    const result = await createOrder(input)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось оформить заказ'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
