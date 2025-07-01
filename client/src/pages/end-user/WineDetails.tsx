import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useParams } from 'wouter'
import QRScanModal from '@/components/qr/QRScanModal'
import AppHeader, { HeaderSpacer } from '@/components/layout/AppHeader'
import typography from '@/styles/typography'
import { WineDetailsHero, WineHistorySection, FoodPairingSection, BuyAgainSection, WineRecommendationsSection } from '@/components/wine-details'
import { WineChatSection } from '@/components/chat'
import { Wine } from '@/types/wine'

export default function WineDetails() {
  const [location] = useLocation()
  const { id, tenantName } = useParams()
  const [wine, setWine] = useState<Wine | null>(null)
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error' | 'notfound'>('loading')
  const [showQRModal, setShowQRModal] = useState(false)
  const [interactionChoiceMade, setInteractionChoiceMade] = useState(false)
  const isScannedPage = location === '/scanned'

  useEffect(() => {
    const loadWineData = async () => {
      setLoadingState('loading')
      if (!id) {
        setLoadingState('notfound')
        setWine(null)
        return
      }
      try {
        const response = await fetch(`/api/wines/${id}`)
        if (response.ok) {
          const wineData = await response.json()
          const transformedWine: Wine = {
            id: wineData.id,
            name: wineData.name,
            year: wineData.year,
            bottles: wineData.bottles,
            image: wineData.image,
            ratings: wineData.ratings,
            buyAgainLink: wineData.buyAgainLink,
            qrCode: wineData.qrCode,
            qrLink: wineData.qrLink,
            description: wineData.description,
          }
          setWine(transformedWine)
          setLoadingState('loaded')
        } else if (response.status === 404) {
          setWine(null)
          setLoadingState('notfound')
        } else {
          setWine(null)
          setLoadingState('error')
        }
      } catch (error) {
        setWine(null)
        setLoadingState('error')
      }
    }
    loadWineData()
  }, [id, location])

  // Detect QR code access and show interaction choice
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isQRAccess = urlParams.get('qr') === 'true' || urlParams.get('source') === 'qr' || document.referrer === '' || !document.referrer.includes(window.location.hostname)

    // Check if user hasn't made interaction choice yet and this appears to be QR access
    if (isQRAccess && !interactionChoiceMade && wine) {
      // Small delay to ensure page is fully loaded before showing modal
      setTimeout(() => {
        setShowQRModal(true)
      }, 500)
    }
  }, [wine, interactionChoiceMade])

  const handleQRReset = (event: Event) => {
    const detail = (event as CustomEvent).detail
    if (detail?.action === 'voice') {
      console.log('🎤 Voice interaction selected')
      setInteractionChoiceMade(true)
      setShowQRModal(false)
    } else if (detail?.action === 'text') {
      console.log('💬 Text interaction selected')
      setInteractionChoiceMade(true)
      setShowQRModal(false)
    }
  }

  useEffect(() => {
    window.addEventListener('qr-reset', handleQRReset)
    return () => {
      window.removeEventListener('qr-reset', handleQRReset)
    }
  }, [])

  // Optimized scrolling initialization
  useEffect(() => {
    // Streamlined scroll setup
    window.scrollTo(0, 0)
  }, [])

  if (loadingState === 'loading') {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-100px)]'>
        <div className='text-center'>
          <div className='typing-indicator'>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p
            style={{
              marginTop: '16px',
              color: '#999999',
              ...typography.body,
            }}
          >
            Loading wine details...
          </p>
        </div>
      </div>
    )
  }
  if (loadingState === 'notfound') {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-100px)]'>
        <div className='text-center'>
          <h2 style={{ color: '#FF6B6B', marginBottom: '16px', ...typography.h1 }}>Wine Not Found</h2>
          <p style={{ ...typography.body, color: '#CECECE' }}>The wine you're trying to view doesn't exist or couldn't be loaded.</p>
        </div>
      </div>
    )
  }
  if (loadingState === 'error') {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-100px)]'>
        <div className='text-center'>
          <h2 style={{ color: '#FF6B6B', marginBottom: '16px', ...typography.h1 }}>Error</h2>
          <p style={{ ...typography.body, color: '#CECECE' }}>Failed to load wine details. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-red-500 min-h-screen'>
      {/* Header - Same as HomeGlobal */}
      <AppHeader showMyCellarLink={true} />
      <HeaderSpacer />

      {/* Wine Details Hero Section */}
      {wine && <WineDetailsHero {...wine} />}

      {/* Tasting Notes */}
      <WineHistorySection description={wine?.description} />

      {/* Food Pairing Section */}
      <FoodPairingSection foodPairing={wine?.foodPairing} wineId={wine?.id} wineName={wine?.name} />

      {/* Buy Again Section */}
      <BuyAgainSection buyAgainLink={wine?.buyAgainLink} />

      {/* Wine Recommendations Section */}
      <WineRecommendationsSection currentWineId={wine?.id || 1} />

      {/* Wine Chat Section */}
      <WineChatSection wine={wine} isScannedPage={isScannedPage} />

      {/* QR Modal */}
      <QRScanModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        onTextChoice={() => {
          setInteractionChoiceMade(true)
          setShowQRModal(false)
        }}
        onVoiceChoice={() => {
          setInteractionChoiceMade(true)
          setShowQRModal(false)
        }}
      />
    </div>
  )
}
