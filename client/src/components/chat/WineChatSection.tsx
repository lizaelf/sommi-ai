import React from 'react'
import EnhancedChatInterface from './EnhancedChatInterface'
import { Wine } from '@/types/wine'

interface WineChatSectionProps {
  wine: Wine | null
  isScannedPage: boolean
  tenantName?: string
}

const WineChatSection: React.FC<WineChatSectionProps> = ({ wine, isScannedPage, tenantName }) => {
  return (
    <div
      style={{
        width: '100%',
        paddingTop: '40px',
        marginTop: '-20px',
      }}
    >
      <EnhancedChatInterface selectedWine={wine || null} isScannedPage={isScannedPage} tenantName={tenantName} />
    </div>
  )
}

export default WineChatSection
