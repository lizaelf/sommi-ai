import React from 'react'
import typography from '@/styles/typography'
import TechnicalDetailItem from './TechnicalDetailItem'
import { Wine } from '@/types/wine'
import WineRating from './WineRating'

interface WineTechnicalDetailsSectionProps {
  wine: Wine
}

const WineTechnicalDetailsSection: React.FC<WineTechnicalDetailsSectionProps> = ({ wine }) => {
  // Helper function to extract varietal information dynamically from wine name

  // Helper function to get aging recommendations
  const getAgingRecommendations = (wineName: string, year?: number) => {
    const name = wineName.toLowerCase()
    const age = year ? new Date().getFullYear() - year : 0

    if (name.includes('zinfandel')) {
      return {
        drinkNow: true,
        ageUpTo: age < 5 ? '2030' : '2028',
      }
    } else if (name.includes('cabernet')) {
      return {
        drinkNow: age > 3,
        ageUpTo: '2035',
      }
    } else if (name.includes('chardonnay')) {
      return {
        drinkNow: true,
        ageUpTo: age < 3 ? '2027' : '2026',
      }
    }

    return {
      drinkNow: true,
      ageUpTo: '2028',
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 16px',
      }}
    >
      <div style={{ flex: 1, minHeight: '140px' }}>
        <TechnicalDetailItem
          label='Varietal'
          value={
            wine?.technicalDetails?.varietal ? (
              <>
                {wine.technicalDetails.varietal.primary} {wine.technicalDetails.varietal.primaryPercentage}%
                {wine.technicalDetails.varietal.secondary && (
                  <>
                    <br />
                    {wine.technicalDetails.varietal.secondary} {wine.technicalDetails.varietal.secondaryPercentage}%
                  </>
                )}
              </>
            ) : (
              '–'
            )
          }
        />

        <TechnicalDetailItem label='Appellation' value={wine?.location ? wine.location : '–'} />

        <TechnicalDetailItem label='Aging' value={wine?.technicalDetails?.aging ? (wine.technicalDetails.aging.ageUpTo ? `Age up to ${wine.technicalDetails.aging.ageUpTo} years` : 'Drink now') : wine?.name ? (getAgingRecommendations(wine?.name || '', wine?.year).drinkNow && getAgingRecommendations(wine?.name || '', wine?.year).ageUpTo ? `Drink now or age up to ${getAgingRecommendations(wine?.name || '', wine?.year).ageUpTo}` : 'Drink now') : '–'} />

        <TechnicalDetailItem label='ABV' value={wine?.ratings?.abv ? `${wine.ratings.abv}%` : '–'} />

        {/* Wine Ratings below Technical Details Section */}
        <WineRating ratings={wine.ratings} align='left' hideAbv={true} />
      </div>

      {/* Wine Image */}
      <div
        style={{
          width: '100px',
          minHeight: 0,
          flexShrink: 0,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* Blurred circle background */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '240px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            zIndex: 0,
          }}
        />
        <img
          src={wine?.image}
          alt={wine?.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: '8px',
            position: 'relative',
            zIndex: 1,
          }}
          onLoad={() => console.log(`Wine bottle image loaded: ${wine?.name}`)}
        />
      </div>
    </div>
  )
}

export default WineTechnicalDetailsSection
