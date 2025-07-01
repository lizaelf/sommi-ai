import React, { useEffect, useState } from 'react'
import { useRoute, useParams } from 'wouter'
import { CellarManager } from '@/utils/cellarManager'
import { DataSyncManager } from '@/utils/dataSync'
import typography from '@/styles/typography'
import { ChevronLeft } from 'lucide-react'
import { Wine } from '@/types/wine'

export default function WineScan() {
  const [match, params] = useRoute('/scan-wine/:id')
  const [isAdding, setIsAdding] = useState(false)
  const [addedTocellar, setAddedToCellar] = useState(false)

  const wineId = params?.id ? parseInt(params.id, 10) : null

  const [wine, setWine] = useState<Wine | null>(null)

  const { tenantName } = useParams()

  useEffect(() => {
    if (!wineId) return
    DataSyncManager.getUnifiedWineData().then(wines => {
      const found = wines.find((w: Wine) => w.id === wineId)
      setWine(found || null)
    })
  }, [wineId])

  useEffect(() => {
    // Check if wine is already in cellar
    if (wineId && CellarManager.isWineInCellar(wineId)) {
      setAddedToCellar(true)
    }
  }, [wineId])

  const handleAddToCellar = async () => {
    if (!wine) return

    setIsAdding(true)
    try {
      CellarManager.addWineToCellar({
        id: wine.id,
        name: wine.name,
        year: wine.year,
        image: wine.image,
      })

      setAddedToCellar(true)
    } catch (error) {
    } finally {
      setIsAdding(false)
    }
  }

  const handleGoToCellar = () => {
    window.location.href = `/${tenantName}/cellar`
  }

  const handleGoHome = () => {
    window.location.href = `/${tenantName}`
  }

  if (!match || !wine) {
    return (
      <div
        style={{
          minHeight: '100vh',
          overflowX: 'hidden',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          color: 'white',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h1 style={{ ...typography.h1, marginBottom: '16px' }}>Wine Not Found</h1>
        <p style={{ ...typography.body1R, marginBottom: '24px', textAlign: 'center' }}>The scanned QR code doesn't match any wines in our collection.</p>
        <button
          onClick={handleGoHome}
          style={{
            background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Go Home
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        overflowX: 'hidden',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: 'white',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
        }}
      >
        <button
          onClick={handleGoHome}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            position: 'absolute',
            left: '20px',
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <h1
          style={{
            ...typography.h1,
            margin: 0,
          }}
        >
          Wine Scanned
        </h1>
      </div>

      {/* Wine Details */}
      <div
        style={{
          padding: '32px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Wine Image */}
        <div
          style={{
            width: '170px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
          }}
        >
          {wine.image ? (
            <img
              src={wine.image}
              alt={wine.name}
              style={{
                width: '100%',
                maxWidth: '170px',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Wine Image</div>
          )}
        </div>

        {/* Wine Name */}
        <h2
          style={{
            ...typography.h1,
            marginBottom: '8px',
            fontSize: '24px',
            lineHeight: '32px',
          }}
        >
          {wine.year} {wine.name}
        </h2>

        <p
          style={{
            ...typography.body1R,
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '32px',
          }}
        >
          Scanned successfully! Add this wine to your cellar to track it and access detailed information.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            maxWidth: '300px',
          }}
        >
          {!addedTocellar ? (
            <button
              onClick={handleAddToCellar}
              disabled={isAdding}
              style={{
                background: isAdding ? 'rgba(139, 69, 19, 0.5)' : 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 24px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isAdding ? 'not-allowed' : 'pointer',
                width: '100%',
              }}
            >
              {isAdding ? 'Adding...' : 'Add to My Cellar'}
            </button>
          ) : (
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                padding: '16px 24px',
                color: '#22c55e',
                fontSize: '16px',
                fontWeight: '500',
                width: '100%',
              }}
            >
              ✓ Already in your cellar
            </div>
          )}

          <button
            onClick={handleGoToCellar}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '16px 24px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            View My Cellar
          </button>
        </div>
      </div>
    </div>
  )
}
