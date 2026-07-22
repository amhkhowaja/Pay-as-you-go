import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import keycloak from './keycloak'

keycloak.init({ 
  onLoad: 'login-required',
  checkLoginIframe: false,
  pkceMethod: 'S256'
}).then(async (authenticated) => {
  if (authenticated) {
    // Create user in backend if not exists
    try {
      await keycloak.updateToken(30)
      await fetch('http://localhost:8081/user-service/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keycloakUserId: keycloak.subject,
          username: keycloak.tokenParsed.preferred_username || keycloak.subject,
          email: keycloak.tokenParsed.email || `${keycloak.subject}@example.com`,
          createdAt: new Date().toISOString()
        })
      })
    } catch (err) {
      // User might already exist, ignore error
      console.log('User creation skipped:', err.message)
    }
    
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App keycloak={keycloak} />
      </React.StrictMode>
    )
  }
}).catch(console.error)

