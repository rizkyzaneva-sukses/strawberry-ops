const WAHA_API_URL = process.env.WAHA_API_URL || 'http://localhost:3000'

export async function sendWhatsApp(phone: string, message: string) {
  try {
    let cleaned = phone.replace(/[^0-9]/g, '')
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1)
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned
    }
    const chatId = `${cleaned}@c.us`

    const res = await fetch(`${WAHA_API_URL}/api/sendText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, text: message }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Waha API error:', res.status, text)
      return { success: false, error: `Waha API error: ${res.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error('sendWhatsApp error:', error)
    return { success: false, error: 'Gagal mengirim pesan WhatsApp' }
  }
}
