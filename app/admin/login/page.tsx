import type { Metadata } from 'next'
import { AdminLoginForm } from '@/components/admin-login-form'

export const metadata: Metadata = {
  title: 'Вход в панель — Я-пончик',
}

export default function AdminLoginPage() {
  return <AdminLoginForm />
}
