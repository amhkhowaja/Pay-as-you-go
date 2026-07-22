import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'payasyougo',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'frontend'
})

export default keycloak
