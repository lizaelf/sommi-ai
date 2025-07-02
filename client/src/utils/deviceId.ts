// Генерація унікального ідентифікатора девайсу
export function generateDeviceId(): string {
  // Спробуємо отримати існуючий ID з localStorage
  let deviceId = localStorage.getItem('device_id')

  if (!deviceId) {
    // Генеруємо новий ID на основі характеристик браузера
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('device-fingerprint', 10, 10)

    const fingerprint = [navigator.userAgent, navigator.language, screen.width + 'x' + screen.height, new Date().getTimezoneOffset(), canvas.toDataURL()].join('|')

    // Створюємо хеш
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }

    deviceId = 'device_' + Math.abs(hash).toString(36)
    localStorage.setItem('device_id', deviceId)
  }

  return deviceId
}

// Генерація ключа розмови
export function generateConversationKey(tenantName: string, wineId: number): string {
  const deviceId = generateDeviceId()
  return `${tenantName}_wine_${wineId}_${deviceId}`
}
