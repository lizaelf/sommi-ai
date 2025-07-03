import { useLocation, useParams } from 'wouter'
import AppHeader, { HeaderSpacer } from '@/components/layout/AppHeader'
import { WelcomeSection } from '@/components/home-global/WelcomeSection'
import { WineCollection } from '@/components/home-global/WineCollection'
import { useWines } from '@/hooks/useWines'

const Home = () => {
  const [location, setLocation] = useLocation()
  const { tenantName } = useParams()
  const { wines, isLoading, error } = useWines(tenantName)

  const handleWineClick = (wineId: number) => {
    setLocation(`/${tenantName}/wine-details/${wineId}`)
  }

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
