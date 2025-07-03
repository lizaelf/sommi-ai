import { useLocation, useParams } from 'wouter'
import { useState } from 'react'

import AppHeader from '@/components/layout/AppHeader'
import { useWines } from '@/hooks/useWines'

const Cellar = () => {
  const { tenantName } = useParams()
  const { wines, isLoading, error } = useWines(tenantName)
  console.log('wines', wines)
  const cellarWines = wines.slice(0, 2)
  const [, setLocation] = useLocation()

  const [showWineSearch, setShowWineSearch] = useState(false)
  const [wineSearchQuery, setWineSearchQuery] = useState('')
  const [isSearchActive, setIsSearchActive] = useState(false)

  const handleWineClick = (wineId: number) => {
    setLocation(`/${tenantName}/wine-details/${wineId}`)
  }

  return (
    <div className='min-h-screen bg-black text-white relative mobile-fullscreen'>
      <AppHeader
        title='Cellar'
        showBackButton={true}
        onBack={() => setLocation(`/${tenantName}`)}
        rightContent={
          <>
            {/* Search Icon */}
            <div
              onClick={() => {
                setShowWineSearch(!showWineSearch)
                setIsSearchActive(!showWineSearch)
              }}
              className={`cursor-pointer transition-all duration-200 ${showWineSearch ? 'text-white scale-110' : 'text-white/80 hover:text-white'}`}
            >
              <img src='/icons/search.svg' alt='Search' width='24' height='24' className='transition-all duration-200' style={{ filter: 'invert(1)' }} />
            </div>
          </>
        }
        showMyCellarLink={false}
      />

      {/* Wine Search Interface */}
      {showWineSearch && (
        <div
          style={{
            position: 'fixed',
            top: '91px',
            left: '16px',
            right: '16px',
            backgroundColor: '#2A2A29',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '16px',
            zIndex: 1000,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
              }}
            >
              <img src='/icons/search.svg' alt='Search' width='18' height='18' style={{ filter: 'brightness(0) saturate(100%) invert(59%) sepia(0%) saturate(1547%) hue-rotate(146deg) brightness(97%) contrast(91%)' }} />
            </div>
            <input
              type='text'
              placeholder='Search wines in cellar...'
              value={wineSearchQuery}
              onChange={e => setWineSearchQuery(e.target.value)}
              className=''
              style={{
                width: '100%',
                height: '48px',
                padding: '0 16px 0 48px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'transparent',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                e.target.style.background = 'transparent'
                e.target.style.boxShadow = 'none'
                setIsSearchActive(true)
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                e.target.style.background = 'transparent'
                e.target.style.boxShadow = 'none'
                setIsSearchActive(false)
              }}
              autoFocus
            />
          </div>

          {/* Search Results */}
          {wineSearchQuery && (
            <div style={{ marginTop: '12px' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
                onClick={() => {
                  setShowWineSearch(false)
                  setWineSearchQuery('')
                  handleWineClick(1)
                }}
              >
                <div
                  style={{
                    color: 'white',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Sassicaia 2018
                </div>
                <div
                  style={{
                    color: '#CECECE',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    marginTop: '4px',
                  }}
                >
                  Tuscany, Italy • Cabernet Sauvignon
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content with top padding to account for fixed header */}
      <div style={{ paddingTop: '91px' }}>
        {/* Cellar Container */}
        <div
          style={{
            margin: '0 16px 0 16px',
          }}
        >
          {/* First Wine Rack Container */}
          <div
            className='bg-cover bg-center bg-no-repeat relative'
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.00) 61.11%, rgba(255, 255, 255, 0.20) 95.67%, rgba(255, 255, 255, 0.30) 98.56%)',
              height: '236px',
            }}
          >
            {/* Wine bottles display */}
            <div className='absolute inset-0 grid grid-cols-3 gap-1 h-full'>
              {cellarWines.map((wine, index) => {
                return (
                  <div key={index} className='cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors flex items-end justify-center' onClick={() => wine && handleWineClick(wine.id)}>
                    {wine && wine.image && (
                      <img
                        src={wine.image}
                        alt={wine.name}
                        style={{
                          height: '186px',
                          width: '100%',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          marginBottom: '2px',
                        }}
                        onError={e => {
                          // Hide image if it fails to load
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cellar
