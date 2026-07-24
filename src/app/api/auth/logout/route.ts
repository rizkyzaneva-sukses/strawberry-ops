import { getSession } from '@/lib/session'
import { jsonResponse } from '@/lib/api-utils'

export async function POST() {
  const session = await getSession()
  session.destroy()
  return jsonResponse({ message: 'Berhasil logout' })
}
