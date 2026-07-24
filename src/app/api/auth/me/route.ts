import { getUser } from '@/lib/session'
import { jsonResponse, errorResponse } from '@/lib/api-utils'

export async function GET() {
  const user = await getUser()
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }
  return jsonResponse(user)
}
