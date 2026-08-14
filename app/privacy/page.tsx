import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Политика персональных данных — Я-пончик',
  description:
    'Политика в области обработки и обеспечения безопасности персональных данных пекарни «Я-пончик».',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="w-fit text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          ← На главную
        </Link>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Политика в области обработки и обеспечения безопасности персональных данных
          </h1>
          <p className="text-sm text-muted-foreground">ООО / ИП «Я-пончик», г. Челябинск</p>
        </div>

        <div className="flex flex-col gap-5 text-pretty text-base leading-relaxed text-muted-foreground">
          <p>
            Настоящая политика определяет порядок обработки и защиты персональных данных посетителей
            сайта и покупателей пекарни «Я-пончик» в соответствии с Федеральным законом от 27.07.2006
            г. № 152-ФЗ «О персональных данных».
          </p>
          <p>
            Оформляя заказ, вы предоставляете имя, номер телефона, а при доставке — адрес и сведения,
            необходимые для выполнения заказа. Эти данные используются только для связи, приготовления
            и выдачи или доставки заказа.
          </p>
          <p>
            Данные не передаются третьим лицам, кроме случаев, когда это необходимо для исполнения
            заказа (например, службе доставки) или требуется законом. Срок хранения — до исполнения
            заказа и в течение срока, установленного законодательством.
          </p>
          <p>
            Вы можете отозвать согласие, направив обращение по телефону{' '}
            <a href="tel:+79084945053" className="font-semibold text-foreground hover:text-primary">
              +7 (908) 494-50-53
            </a>{' '}
            или по адресу: ул. Руставели, 24, Челябинск.
          </p>
        </div>
      </div>
    </main>
  )
}
