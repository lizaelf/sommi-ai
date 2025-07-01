import { Wine } from '@/types/wine'
export interface Tenant {
  id: number
  profile: {
    tenantName: string
    wineryName: string
    wineryDescription: string
    yearEstablished: string
    wineryLogo: string
    contactEmail: string
    contactPhone: string
    websiteURL: string
    address: string
    hoursOfOperation: string
    socialMediaLinks: string
  }
  wineEntries: Wine[]
  wineClub: {
    clubName: string
    description: string
    membershipTiers: string
    pricing: string
    clubBenefits: string
  }
  aiModel: {
    knowledgeScope: 'winery-only' | 'winery-plus-global'
    personalityStyle: 'educator' | 'sommelier' | 'tasting-room-host' | 'luxury-concierge' | 'casual-friendly'
    brandGuide: string
    tonePreferences: string
    knowledgeDocuments: string
  }
}
