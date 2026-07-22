import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8081'
const BILLING_SERVICE_URL = import.meta.env.VITE_BILLING_SERVICE_URL || 'http://localhost:8080'

export default function Plans({ keycloak }) {
  const [plans, setPlans] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPlan, setNewPlan] = useState({ name: '', price: '', billingCycle: 'MONTHLY' })
  const navigate = useNavigate()

  const isAdmin = keycloak.hasRealmRole('admin')

  useEffect(() => {
    const fetchData = async () => {
      try {
        await keycloak.updateToken(30)
        const headers = {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json'
        }
        
        const userRes = await fetch(`${USER_SERVICE_URL}/user-service/users/me`, { headers })
        if (!userRes.ok) {
          const errorText = await userRes.text()
          console.error('User fetch failed:', userRes.status, errorText)
          throw new Error(`Failed to fetch user: ${userRes.status}`)
        }
        const userData = await userRes.json()
        const userId = typeof userData.id === 'string' ? userData.id : userData.id.$oid || userData.id.toString()
        setUser({ id: userId })
        
        const plansRes = await fetch(`${BILLING_SERVICE_URL}/plans`, { headers })
        if (!plansRes.ok) throw new Error('Failed to fetch plans')
        const data = await plansRes.json()
        setPlans(Array.isArray(data) ? data : [])
        setLoading(false)
      } catch (err) {
        console.error(err)
        setError(err.message)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [keycloak])

  const handleCreatePlan = async (e) => {
    e.preventDefault()
    try {
      await keycloak.updateToken(30)
      const response = await fetch(`${BILLING_SERVICE_URL}/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newPlan.name,
          price: parseFloat(newPlan.price),
          billingCycle: newPlan.billingCycle
        })
      })
      if (!response.ok) throw new Error('Failed to create plan')
      
      setShowCreateForm(false)
      setNewPlan({ name: '', price: '', billingCycle: 'MONTHLY' })
      
      const plansRes = await fetch(`${BILLING_SERVICE_URL}/plans`, {
        headers: { 'Authorization': `Bearer ${keycloak.token}` }
      })
      const data = await plansRes.json()
      setPlans(data)
    } catch (err) {
      console.error('Failed to create plan:', err)
      alert(`Failed to create plan: ${err.message}`)
    }
  }

  const handleSubscribe = async (planId) => {
    try {
      await keycloak.updateToken(30)
      const response = await fetch(`${BILLING_SERVICE_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          serviceId: 'service123',
          planId: planId
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Subscription failed')
      }
      
      const subscriptionId = await response.text()
      navigate(`/payment/${subscriptionId}`)
    } catch (err) {
      console.error('Subscription failed:', err)
      alert(`Failed to create subscription: ${err.message}`)
    }
  }

  if (loading) return <div style={{ textAlign: 'center' }}>Loading plans...</div>
  if (error) return <div style={{ textAlign: 'center', color: '#f44' }}>Error: {error}</div>

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Choose Your Plan</h1>
          <p style={{ color: '#999' }}>Select a subscription plan to get started</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              background: '#fff',
              color: '#000',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {showCreateForm ? 'Cancel' : '+ Create Plan'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreatePlan} style={{
          background: '#111',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Create New Plan</h2>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Plan Name"
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
              required
              style={{
                background: '#000',
                border: '1px solid #333',
                color: '#fff',
                padding: '0.75rem',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <input
              type="number"
              placeholder="Price"
              value={newPlan.price}
              onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
              required
              step="0.01"
              style={{
                background: '#000',
                border: '1px solid #333',
                color: '#fff',
                padding: '0.75rem',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <select
              value={newPlan.billingCycle}
              onChange={(e) => setNewPlan({ ...newPlan, billingCycle: e.target.value })}
              style={{
                background: '#000',
                border: '1px solid #333',
                color: '#fff',
                padding: '0.75rem',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <button
            type="submit"
            style={{
              background: '#fff',
              color: '#000',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Create Plan
          </button>
        </form>
      )}
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        {plans.map(plan => (
          <div
            key={plan.id}
            style={{
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '2rem',
              background: '#111',
              transition: 'transform 0.2s, border-color 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = '#333'
            }}
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{plan.name}</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ${plan.price}
            </div>
            <div style={{ color: '#999', marginBottom: '2rem' }}>
              per {plan.billingCycle.toLowerCase()}
            </div>
            <button
              onClick={() => handleSubscribe(plan.id)}
              style={{
                width: '100%',
                background: '#fff',
                color: '#000',
                border: 'none',
                padding: '1rem',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'background 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#ddd'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
