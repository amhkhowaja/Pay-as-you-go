import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
const PAYMENT_SERVICE_URL = import.meta.env.VITE_PAYMENT_SERVICE_URL || 'http://localhost:8082'

function CheckoutForm({ clientSecret, subscriptionId }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)
        }
      })

      if (stripeError) {
        setError(stripeError.message)
        setProcessing(false)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{
        background: '#111',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '2rem'
      }}>
        <h2 style={{ marginBottom: '2rem' }}>Complete Payment</h2>
        
        <div style={{
          background: '#000',
          border: '1px solid #333',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <CardElement options={{
            style: {
              base: {
                color: '#fff',
                fontSize: '16px',
                '::placeholder': { color: '#999' }
              }
            }
          }} />
        </div>

        {error && (
          <div style={{ color: '#f44', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || processing}
          style={{
            width: '100%',
            background: processing ? '#666' : '#fff',
            color: '#000',
            border: 'none',
            padding: '1rem',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {processing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </form>
  )
}

export default function Payment({ keycloak }) {
  const { subscriptionId } = useParams()
  const [clientSecret, setClientSecret] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        await keycloak.updateToken(30)
        const res = await fetch(`${PAYMENT_SERVICE_URL}/payments/${subscriptionId}`, {
          headers: {
            'Authorization': `Bearer ${keycloak.token}`,
            'Content-Type': 'application/json'
          }
        })
        if (!res.ok) throw new Error('Failed to fetch payment')
        const data = await res.json()
        setClientSecret(data.clientSecret)
        setLoading(false)
      } catch (err) {
        console.error(err)
        setError(err.message)
        setLoading(false)
      }
    }
    
    fetchPayment()
  }, [subscriptionId, keycloak])

  if (loading) return <div style={{ textAlign: 'center' }}>Loading payment...</div>
  if (error) return <div style={{ textAlign: 'center', color: '#f44' }}>Error: {error}</div>

  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Payment</h1>
      {clientSecret && (
        <Elements stripe={stripePromise}>
          <CheckoutForm clientSecret={clientSecret} subscriptionId={subscriptionId} />
        </Elements>
      )}
    </div>
  )
}
