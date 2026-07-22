const API_BASE_URL = 'http://localhost:8080'

export const apiClient = (keycloak) => {
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${keycloak.token}`
  })

  return {
    get: async (url) => {
      await keycloak.updateToken(30)
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: getHeaders()
      })
      return response.json()
    },
    post: async (url, data) => {
      await keycloak.updateToken(30)
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      })
      return response.json()
    }
  }
}
