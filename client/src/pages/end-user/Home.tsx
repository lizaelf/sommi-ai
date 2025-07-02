import { useState, useEffect } from 'react'
import { useLocation, useParams } from 'wouter'
import AppHeader, { HeaderSpacer } from '@/components/layout/AppHeader'
import { WelcomeSection } from '@/components/home-global/WelcomeSection'
import { WineCollection } from '@/components/home-global/WineCollection'
import { Wine } from '@/types/wine'

const Home = () => {
  const [location, setLocation] = useLocation()
  const { tenantName } = useParams()
  const [wines, setWines] = useState<Wine[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleWineClick = (wineId: number) => {
    setLocation(`/${tenantName}/wine-details/${wineId}`)
  }

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    fetch('/api/wines')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch wines')
        return res.json()
      })
      .then((data: Wine[]) => {
        setWines(data)
        setIsLoading(false)
      })
      .catch(err => {
        setError('Wines could not be loaded. Try again later.')
        setIsLoading(false)
      })
  }, [])

  return (
    <div className='min-h-screen bg-black text-white mx-auto' style={{ maxWidth: '1200px' }}>
      <AppHeader showMyCellarLink={true} />
      <HeaderSpacer />
      <WelcomeSection />
      {error && <div style={{ color: '#FF6B6B', textAlign: 'center', margin: '24px 0' }}>{error}</div>}
      <WineCollection wines={wines} onWineClick={handleWineClick} isLoading={isLoading} />
    </div>
  )
}

export default Home
