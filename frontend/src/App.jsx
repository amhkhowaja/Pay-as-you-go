import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Plans from './pages/Plans'
import Payment from './pages/Payment'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'

function App({ keycloak }) {
  return (
    <BrowserRouter>
      <Layout authenticated={keycloak.authenticated} keycloak={keycloak}>
        <Routes>
          <Route path="/" element={<Navigate to="/plans" />} />
          <Route path="/plans" element={<Plans keycloak={keycloak} />} />
          <Route path="/payment/:subscriptionId" element={<Payment keycloak={keycloak} />} />
          <Route path="/dashboard" element={<Dashboard keycloak={keycloak} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
