import { Switch, Route } from 'wouter'
import { queryClient } from './lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/feedback/Toaster'
import { TooltipProvider } from '@/components/ui/overlays/Tooltip'
import NotFound from '@/pages/NotFound'
import WineDetails from '@/pages/end-user/WineDetails'
import Cellar from '@/pages/end-user/Cellar'
import FoodPairingSuggestionsPage from '@/pages/end-user/FoodPairingSuggestionsPage'

import HomeGlobal from '@/pages/end-user/HomeGlobal'
import WineScan from '@/pages/end-user/WineScan'
import SimpleWineEdit from '@/pages/admin/SimpleWineEdit'

import Admin from '@/pages/admin/Admin'
import TenantCreate from '@/pages/admin/TenantCreate'
import QRDemo from '@/pages/end-user/QRDemo'
import { useEffect } from 'react'
import TenantEdit from './pages/admin/TenantEdit'

// Scroll restoration for deployed versions
function useScrollRestoration() {
  useEffect(() => {
    // Ensure scroll position is at top on route changes
    const handleRouteChange = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    // Fix iOS Safari scroll issues
    const handleTouchMove = (e: TouchEvent) => {
      // Prevent elastic scrolling on iOS
      if (window.scrollY === 0 && e.touches[0].pageY > e.touches[0].clientY) {
        e.preventDefault()
      }
    }

    // Add scroll restoration on page navigation
    window.addEventListener('popstate', handleRouteChange)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })

    // Ensure proper viewport height calculation
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setViewportHeight()
    window.addEventListener('resize', setViewportHeight)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      document.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('resize', setViewportHeight)
    }
  }, [])
}

// Обгортка для SimpleWineEdit щоб він працював як роут-компонент
const SimpleWineEditRoute = () => <SimpleWineEdit />

function Router() {
  return (
    <Switch>
      ////////////// admin routes
      <Route path='/admin' component={Admin} />
      <Route path='/tenant-create' component={TenantCreate} />
      <Route path='/tenant-edit/:id' component={TenantEdit} />
      <Route path='/wine-edit/:id' component={SimpleWineEditRoute} />
      ////////////// end-user routes
      <Route path='/:tenantName' component={HomeGlobal} />
      <Route path='/:tenantName/wine-details/:id' component={WineDetails} />
      <Route path='/:tenantName/cellar' component={Cellar} />
      <Route path='/:tenantName/food-pairings-ai' component={FoodPairingSuggestionsPage} />
      {/* <Route path="/tmp" component={WineManagement} /> */}
      <Route path='/scan-wine/:id' component={WineScan} />
      <Route path='/qr-demo' component={QRDemo} />
      <Route component={NotFound} />
    </Switch>
  )
}

// Global welcome message cache initialization
// Welcome message caching is now handled entirely by VoiceAssistant component

function App() {
  useScrollRestoration()

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className='mobile-fullscreen'>
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
