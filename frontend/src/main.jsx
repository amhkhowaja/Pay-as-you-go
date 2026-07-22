import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import keycloak from './keycloak'

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8081'

keycloak.init({ 
  onLoad: 'login-required',
  checkLoginIframe: false,
  pkceMethod: 'S256'
}).then((authenticated) => {
  if (authenticated) {
    // Render immediately
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App keycloak={keycloak} />
      </React.StrictMode>
    )

    // Sync user in background (fire-and-forget)
    keycloak.updateToken(30).then(() => {
      fetch(`${USER_SERVICE_URL}/user-service/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      }).catch((err) => {
        console.log('User sync skipped:', err.message)
      })
    }).catch((err) => {
      console.log('Token refresh failed:', err.message)
    })
  }
}).catch(console.error)
