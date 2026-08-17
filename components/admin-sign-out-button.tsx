'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export function AdminSignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleSignOut() {
    if (busy) return
    setBusy(true)

    try {
      const supabase = getSupabase()
      await supabase?.auth.signOut()
    } finally {
      router.replace('/admin/login')
      router.refresh()
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={busy}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-60"
    >
      <LogOut className="size-4.5" aria-hidden="true" />
      {busy ? 'Выходим…' : 'Выйти'}
    </button>
  )
}
