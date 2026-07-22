import { Link } from 'react-router-dom'

export default function Layout({ children, authenticated, keycloak }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        borderBottom: '1px solid #333',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Pay As You Go
        </Link>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/plans" style={{ color: '#fff', textDecoration: 'none' }}>Plans</Link>
          <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
          {authenticated && keycloak && (
            <button
              onClick={() => keycloak.logout()}
              style={{
                background: '#fff',
                color: '#000',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px'
              }}
            >
              Logout
            </button>
          )}
        </div>
      </nav>
      <main style={{ flex: 1, padding: '2rem' }}>
        {children}
      </main>
    </div>
  )
}
