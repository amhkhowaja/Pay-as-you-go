import { useState, useEffect } from 'react'

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8081'
const BILLING_SERVICE_URL = import.meta.env.VITE_BILLING_SERVICE_URL || 'http://localhost:8080'
const CRON_SERVICE_URL = import.meta.env.VITE_CRON_SERVICE_URL || 'http://localhost:8083'

const PRESETS = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every 15 min', expr: '*/15 * * * *' },
  { label: 'Hourly', expr: '0 * * * *' },
  { label: 'Daily 9am', expr: '0 9 * * *' },
  { label: 'Weekdays 9:30', expr: '30 9 * * MON-FRI' },
  { label: 'Monthly', expr: '0 0 1 * *' },
  { label: 'Sunday midnight', expr: '0 0 * * SUN' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Dashboard({ keycloak }) {
  const [subscription, setSubscription] = useState(null)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

  // Cron state
  const [cronExpr, setCronExpr] = useState('*/15 * * * *')
  const [cronResult, setCronResult] = useState(null)
  const [cronLoading, setCronLoading] = useState(false)
  const [cronError, setCronError] = useState(null)

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

  // Auto-parse on load
  useEffect(() => { parseCron() }, [])

  const parseCron = async () => {
    setCronLoading(true)
    setCronError(null)
    try {
      const res = await fetch(`${CRON_SERVICE_URL}/cron/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: cronExpr })
      })
      const data = await res.json()
      if (data.valid) {
        setCronResult(data)
        setCronError(null)
      } else {
        setCronResult(null)
        setCronError(data.error)
      }
    } catch (err) {
      setCronError('Service unavailable')
      setCronResult(null)
    }
    setCronLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') parseCron()
  }

  // Calculate which days have executions for the timeline
  const getDayActivity = () => {
    if (!cronResult) return DAYS.map(() => 0)
    const activity = DAYS.map(() => 0)
    cronResult.next_executions.forEach(exec => {
      const dayStr = exec.match(/\((\w+)\)/)?.[1]
      const dayMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
      if (dayStr && dayMap[dayStr] !== undefined) {
        activity[dayMap[dayStr]]++
      }
    })
    return activity
  }

  const cardStyle = {
    background: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '2rem',
    marginBottom: '2rem'
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Dashboard</h1>

      {error && (
        <div style={{ background: '#400', border: '1px solid #f44', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', color: '#f44' }}>
          {error}
        </div>
      )}

      {/* Subscription Status */}
      <div style={cardStyle}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Subscription Status</h2>
        {subscription ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#0f0', fontSize: '1.5rem' }}>●</span>
            <div>
              <div style={{ fontWeight: 'bold' }}>Active</div>
              <div style={{ color: '#999', fontSize: '0.9rem' }}>
                Valid until {new Date(subscription.endDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#999' }}>No active subscription — <a href="/plans" style={{ color: '#6cf' }}>browse plans</a></div>
        )}
      </div>

      {/* Cron Playground */}
      <div style={cardStyle}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.3rem' }}>⏰ Cron Playground</h2>
        <p style={{ color: '#999', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Parse and visualize cron expressions. See when your jobs will run.
        </p>

        {/* Input */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={cronExpr}
            onChange={(e) => setCronExpr(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="*/15 * * * *"
            style={{
              flex: 1,
              background: '#000',
              border: '1px solid #444',
              borderRadius: '4px',
              padding: '0.8rem 1rem',
              color: '#0f0',
              fontFamily: 'monospace',
              fontSize: '1.1rem'
            }}
          />
          <button
            onClick={parseCron}
            disabled={cronLoading}
            style={{
              background: cronLoading ? '#333' : '#6cf',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              padding: '0.8rem 1.5rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {cronLoading ? '...' : 'Parse'}
          </button>
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {PRESETS.map(p => (
            <button
              key={p.expr}
              onClick={() => { setCronExpr(p.expr); setTimeout(parseCron, 100) }}
              style={{
                background: cronExpr === p.expr ? '#333' : '#1a1a1a',
                border: `1px solid ${cronExpr === p.expr ? '#6cf' : '#333'}`,
                borderRadius: '20px',
                padding: '0.4rem 0.8rem',
                color: cronExpr === p.expr ? '#6cf' : '#999',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {cronError && (
          <div style={{ background: '#300', border: '1px solid #f44', borderRadius: '4px', padding: '0.8rem', color: '#f66', marginBottom: '1rem' }}>
            ❌ {cronError}
          </div>
        )}

        {/* Results */}
        {cronResult && (
          <div>
            {/* Human readable */}
            <div style={{
              background: '#0a1a0a',
              border: '1px solid #0f03',
              borderRadius: '4px',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ color: '#0f0', fontSize: '1.3rem', fontWeight: 'bold' }}>
                "{cronResult.human_readable}"
              </div>
              <div style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                {cronResult.frequency}
              </div>
            </div>

            {/* Two columns: next runs + timeline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Next executions */}
              <div>
                <h3 style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.8rem' }}>Next 10 Executions</h3>
                <div style={{ background: '#000', borderRadius: '4px', padding: '0.8rem' }}>
                  {cronResult.next_executions.map((exec, i) => (
                    <div key={i} style={{
                      padding: '0.3rem 0',
                      borderBottom: i < 9 ? '1px solid #1a1a1a' : 'none',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      color: i === 0 ? '#6cf' : '#ccc'
                    }}>
                      {i === 0 && '→ '}{exec}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly timeline */}
              <div>
                <h3 style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.8rem' }}>Weekly Activity</h3>
                <div style={{ background: '#000', borderRadius: '4px', padding: '0.8rem' }}>
                  {DAYS.map((day, i) => {
                    const activity = getDayActivity()
                    const maxActivity = Math.max(...activity, 1)
                    const width = (activity[i] / maxActivity) * 100
                    return (
                      <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0' }}>
                        <span style={{ color: '#999', fontSize: '0.8rem', width: '30px' }}>{day}</span>
                        <div style={{ flex: 1, background: '#1a1a1a', borderRadius: '2px', height: '16px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${width}%`,
                            height: '100%',
                            background: activity[i] > 0 ? '#6cf' : 'transparent',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ color: '#666', fontSize: '0.75rem', width: '20px', textAlign: 'right' }}>
                          {activity[i] || '-'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Fields breakdown */}
                <h3 style={{ color: '#999', fontSize: '0.9rem', marginTop: '1.2rem', marginBottom: '0.5rem' }}>Fields</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                  {Object.entries(cronResult.fields).map(([key, val]) => (
                    <div key={key} style={{ fontSize: '0.8rem' }}>
                      <span style={{ color: '#666' }}>{key}: </span>
                      <span style={{ color: '#6cf', fontFamily: 'monospace' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
