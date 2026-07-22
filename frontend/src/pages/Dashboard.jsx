import { useState, useEffect } from 'react'

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8081'
const BILLING_SERVICE_URL = import.meta.env.VITE_BILLING_SERVICE_URL || 'http://localhost:8080'

export default function Dashboard({ keycloak }) {
  const [subscription, setSubscription] = useState(null)
  const [user, setUser] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        await keycloak.updateToken(30)
        const headers = {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json'
        }
        
        const userRes = await fetch(`${USER_SERVICE_URL}/user-service/users/me`, { headers })
        if (!userRes.ok) throw new Error('Failed to fetch user')
        const userData = await userRes.json()
        setUser(userData)
        
        const subRes = await fetch(`${BILLING_SERVICE_URL}/subscriptions/user/${userData.id}`, { headers })
        if (!subRes.ok) throw new Error('Failed to fetch subscriptions')
        const subs = await subRes.json()
        const active = subs.find(sub => sub.status === 'ACTIVE')
        setSubscription(active)
      } catch (err) {
        console.error(err)
        setError(err.message)
      }
    }
    
    fetchData()
  }, [keycloak])

  const handleTestService = async () => {
    setLoading(true)
    setTestResult(null)
    try {
      await keycloak.updateToken(30)
      const response = await fetch('/api/test-service/execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      })
      if (!response.ok) throw new Error('Service call failed')
      const result = await response.json()
      setTestResult(result)
    } catch (err) {
      setTestResult({ error: err.message })
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Dashboard</h1>

      {error && (
        <div style={{
          background: '#400',
          border: '1px solid #f44',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem',
          color: '#f44'
        }}>
          Error: {error}
        </div>
      )}

      {/* Subscription Status */}
      <div style={{
        background: '#111',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Subscription Status</h2>
        {subscription ? (
          <div>
            <div style={{ color: '#0f0', marginBottom: '0.5rem' }}>● Active</div>
            <div style={{ color: '#999' }}>
              Valid until: {new Date(subscription.endDate).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div style={{ color: '#f44' }}>No active subscription</div>
        )}
      </div>

      {/* Test Service */}
      {subscription && (
        <div style={{
          background: '#111',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '2rem'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Test Microservice</h2>
          <p style={{ color: '#999', marginBottom: '1rem' }}>
            Use your subscription to access the test service
          </p>
          
          <button
            onClick={handleTestService}
            disabled={loading}
            style={{
              background: loading ? '#666' : '#fff',
              color: '#000',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}
          >
            {loading ? 'Processing...' : 'Execute Test Service'}
          </button>

          {testResult && (
            <div style={{
              background: '#000',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <pre style={{ color: '#0f0', fontFamily: 'monospace' }}>
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
