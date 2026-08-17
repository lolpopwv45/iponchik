'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Croissant, Loader2, Lock } from 'lucide-react'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

function loginErrorMessage(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Неверный email или пароль'
  }
  if (lower.includes('email not confirmed')) {
    return 'Email ещё не подтверждён. Подтвердите его в письме или отключите confirmation в Auth.'
  }
  if (lower.includes('too many requests')) {
    return 'Слишком много попыток. Подождите минуту и попробуйте снова.'
  }
  return message || 'Не удалось войти'
}

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const configured = isSupabaseConfigured()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!configured || submitting) return

    const supabase = getSupabase()
    if (!supabase) {
      setError('Не заданы переменные NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return
    }

    setSubmitting(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError(loginErrorMessage(signInError.message))
      setSubmitting(false)
      return
    }

    router.replace('/admin')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
              <Croissant className="size-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Вход в панель</h1>
            <p className="mt-1.5 text-sm text-gray-500">Только для сотрудников «Я-пончик»</p>
          </div>

          {!configured ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Добавьте URL и anon-ключ Supabase в <code>.env.local</code>, затем перезапустите сервер.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="admin-email" className="text-sm font-semibold text-gray-800">
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="staff@example.com"
                  className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900 outline-none transition-shadow placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="admin-password" className="text-sm font-semibold text-gray-800">
                  Пароль
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900 outline-none transition-shadow placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-bold text-white shadow-sm transition-shadow hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
                {submitting ? 'Входим…' : 'Войти'}
              </button>
            </form>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">Заказы клиентов на этой странице не отображаются.</p>
      </div>
    </main>
  )
}
