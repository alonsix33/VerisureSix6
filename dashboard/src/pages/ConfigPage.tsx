import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function ConfigPage() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/settings', { replace: true }) }, [navigate])
  return null
}
