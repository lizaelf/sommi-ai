import React from 'react'
import WineTechnicalDetailsSection from './WineTechnicalDetailsSection'
import typography from '@/styles/typography'
import { Wine } from '@/types/wine'

const WineDetailsHero: React.FC<Wine> = wine => {
  if (!wine) return null

  return (
    <div className='bg-transparent text-white' style={{ overflowY: 'auto', overflowX: 'hidden' }}>
      {/* Wine Title */}
      <div
        style={{
          marginBottom: '24px',
          textAlign: 'left',
          padding: '0 16px',
        }}
      >
        <h1
          style={{
            ...typography.h1,
            marginBottom: '8px',
          }}
        >
          {wine.year} {wine.name}
        </h1>
      </div>
      {/* Technical Details Section */}
      <WineTechnicalDetailsSection wine={wine} />
    </div>
  )
}

export default WineDetailsHero
