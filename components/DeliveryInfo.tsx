'use client'

import { useId, useState } from 'react'
import { ChevronDown, Clock, CreditCard, Package, Truck, type LucideIcon } from 'lucide-react'
import { CITY_DELIVERY } from '@/lib/deliveryZone'

type SectionId = 'delivery' | 'pickup' | 'payment' | 'preorder'

type AccordionItem = {
  id: SectionId
  icon: LucideIcon
  title: string
}

const SECTIONS: AccordionItem[] = [
  { id: 'delivery', icon: Truck, title: 'Доставка' },
  { id: 'pickup', icon: Package, title: 'Самовывоз' },
  { id: 'payment', icon: CreditCard, title: 'Оплата' },
  { id: 'preorder', icon: Clock, title: 'Предзаказ' },
]

export function DeliveryInfo() {
  const [openId, setOpenId] = useState<SectionId | null>('delivery')
  const headingId = useId()

  function toggle(id: SectionId) {
    setOpenId((current) => (current === id ? null : id))
  }

  return (
    <section
      id="delivery"
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
      aria-labelledby={headingId}
    >
      <div className="mb-8 flex flex-col gap-2">
        <h2
          id={headingId}
          className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
        >
          Доставка и оплата
        </h2>
        <p className="text-muted-foreground">Условия, самовывоз, оплата и предзаказ</p>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        {SECTIONS.map((section) => {
          const isOpen = openId === section.id
          const panelId = `${headingId}-${section.id}-panel`
          const buttonId = `${headingId}-${section.id}-button`

          return (
            <article
              key={section.id}
              className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border/60"
            >
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(section.id)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <section.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-base font-extrabold tracking-tight text-card-foreground">
                    {section.title}
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="px-4 pb-5 sm:px-5"
              >
                <SectionBody id={section.id} />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function SectionBody({ id }: { id: SectionId }) {
  if (id === 'delivery') {
    return (
      <ul className="flex flex-col gap-3">
        <InfoRow label="Доставка по городу">
          Минимальный заказ {CITY_DELIVERY.minOrder} ₽. Стоимость доставки {CITY_DELIVERY.fee} ₽.
        </InfoRow>
        <InfoRow label="Акция" tone="promo">
          Пн-Чт с 12:00 до 15:00 доставка бесплатная (кроме отдаленных зон).
        </InfoRow>
      </ul>
    )
  }

  if (id === 'pickup') {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        <span className="font-bold text-card-foreground">Самовывоз: </span>
        ул. Руставели, 24. Готовим с пылу жару. Можно написать удобное время, но не раньше чем через
        30 минут — это время на готовку. Заказы принимаем до 21:00.
      </p>
    )
  }

  if (id === 'payment') {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        <span className="font-bold text-card-foreground">Оплата: </span>
        Наличный и безналичный расчет.
      </p>
    )
  }

  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      <span className="font-bold text-card-foreground">Предзаказ: </span>
      «Побыстрее» для доставки — примерно в течение 2 часов: час на готовку и час на дорогу.
      Или слот по часам. Слот блокируется за 2 часа до начала: с 10:00 можно заказать только на
      12:00. Заказы до 21:00, кухня с 8:00 до 22:00.
    </p>
  )
}

function InfoRow({
  label,
  children,
  tone = 'default',
}: {
  label: string
  children: string
  tone?: 'default' | 'promo'
}) {
  const toneClass =
    tone === 'promo' ? 'bg-primary/8 ring-primary/15' : 'bg-muted/70 ring-transparent'

  const labelClass = tone === 'promo' ? 'text-primary' : 'text-card-foreground'

  return (
    <li className={`rounded-2xl px-3.5 py-3 ring-1 ${toneClass}`}>
      <p className={`text-sm font-extrabold ${labelClass}`}>{label}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </li>
  )
}
