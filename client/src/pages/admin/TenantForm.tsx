import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useLocation } from 'wouter'
import { useStandardToast } from '@/components/ui/feedback/StandardToast'
import { FormInput } from '@/components/ui/forms/FormInput'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Tenant } from '@/types/tenant'
import Button from '@/components/ui/buttons/Button'
import AppHeader, { HeaderSpacer } from '@/components/layout/AppHeader'
import typography from '@/styles/typography'
import ActionDropdown, { ActionDropdownItem } from '@/components/admin/ActionDropdown'
import TenantTabs from '../../components/ui/TenantTabs'
import DropdownInput from '@/components/ui/forms/DropdownInput'
import SimpleWineEdit from './SimpleWineEdit'
import { Wine } from '@/types/wine'
import CustomTextarea from '@/components/ui/forms/Textarea'

// API helpers
const fetchTenantById = async (id: number) => {
  const res = await fetch(`/api/tenants/${id}`)
  if (!res.ok) throw new Error('Failed to fetch tenant')
  return res.json()
}

const createTenant = async (data: Omit<Tenant, 'id'>) => {
  const res = await fetch('/api/tenants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile: data.profile,
      wineEntries: data.wineEntries,
      wineClub: data.wineClub,
      aiModel: data.aiModel,
    }),
  })
  if (!res.ok) throw new Error('Failed to create tenant')
  return res.json()
}

const updateTenant = async (id: number, data: Partial<Tenant>) => {
  const res = await fetch(`/api/tenants/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile: data.profile,
      wineEntries: data.wineEntries,
      wineClub: data.wineClub,
      aiModel: data.aiModel,
    }),
  })
  if (!res.ok) throw new Error('Failed to update tenant')
  return res.json()
}

const deleteTenant = async (id: number) => {
  const res = await fetch(`/api/tenants/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete tenant')
  return true
}

const defaultTenant: Omit<Tenant, 'id'> = {
  profile: {
    tenantName: '',
    wineryName: '',
    wineryDescription: '',
    yearEstablished: '',
    wineryLogo: '',
    contactEmail: '',
    contactPhone: '',
    websiteURL: '',
    address: '',
    hoursOfOperation: '',
    socialMediaLinks: '',
  },
  wineEntries: [],
  wineClub: {
    clubName: '',
    description: '',
    membershipTiers: '',
    pricing: '',
    clubBenefits: '',
  },
  aiModel: {
    knowledgeScope: 'winery-only',
    personalityStyle: 'sommelier',
    brandGuide: '',
    tonePreferences: '',
    knowledgeDocuments: '',
  },
}

const defaultTenantWithData: Omit<Tenant, 'id'> = {
  profile: {
    tenantName: '',
    wineryName: 'Test Winery & Vineyards',
    wineryDescription: 'Family-owned winery producing exceptional wines since 1995',
    yearEstablished: '1995',
    wineryLogo: 'https://example.com/winery-logo.png',
    contactEmail: 'info@testwinery.com',
    contactPhone: '+1-555-123-4567',
    websiteURL: 'https://testwinery.com',
    address: '123 Wine Valley Road, Napa, CA 94558',
    hoursOfOperation: 'Mon-Fri: 10AM-6PM, Sat-Sun: 11AM-7PM',
    socialMediaLinks: 'Instagram: @testwinery, Facebook: /testwinery',
  },
  wineEntries: [],
  wineClub: {
    clubName: 'Test Winery Club',
    description: 'Exclusive wine club for connoisseurs',
    membershipTiers: 'Bronze, Silver, Gold, Platinum',
    pricing: 'Bronze: $99/year, Silver: $199/year, Gold: $299/year, Platinum: $499/year',
    clubBenefits: 'Monthly wine shipments, exclusive tastings, member discounts',
  },
  aiModel: {
    knowledgeScope: 'winery-only',
    personalityStyle: 'educator',
    brandGuide: 'Professional, knowledgeable, approachable',
    tonePreferences: 'Educational but friendly, not overly formal',
    knowledgeDocuments: 'Wine production guides, tasting notes, food pairing recommendations',
  },
}

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'cms', label: 'CMS' },
  { key: 'wineclub', label: 'Wine club' },
  { key: 'ai', label: 'AI Model' },
]

interface TenantFormProps {
  mode: 'create' | 'edit'
}

// Helper to get query param
function getQueryParam(search: string, key: string): string | null {
  const params = new URLSearchParams(search)
  return params.get(key)
}

// Додаю валідацію tenantName
const validateTenantName = (name: string) => /^[a-zA-Z0-9_-]+$/.test(name)

const TenantForm: React.FC<TenantFormProps> = ({ mode }) => {
  const { id, tenantName } = useParams()
  const [{}, setLocation] = useLocation()
  const { toastSuccess, toastError } = useStandardToast()
  const [tenant, setTenant] = useState<(Omit<Tenant, 'id'> & { wineEntries: Wine[]; wineClub: any }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNewTenant, setIsNewTenant] = useState(false)
  const searchParams = typeof window !== 'undefined' ? window.location.search : ''
  const initialTab = getQueryParam(searchParams, 'tab') || 'profile'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [search, setSearch] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [editingWineIndex, setEditingWineIndex] = useState<number | null>(null)
  const [showWineEditor, setShowWineEditor] = useState(false)

  const isCreateMode = mode === 'create'

  // Мемоізуємо tenantId для запобігання зайвих ре-рендерів
  const tenantId = useMemo(() => {
    if (!id || id === 'new') return null
    const parsed = parseInt(id)
    return isNaN(parsed) ? null : parsed
  }, [id])

  // Використовуємо useCallback для стабільних функцій
  const handleCancel = useCallback(() => {
    setLocation(`/admin`)
  }, [setLocation])
  const handleAddWine = useCallback(() => {
    console.log('handleAddWine - creating new wine')
    setEditingWineIndex(null)
    setShowWineEditor(true)
  }, [])
  const handleEditWine = useCallback((wineIndex: number) => {
    setEditingWineIndex(wineIndex)
    setShowWineEditor(true)
  }, [])
  const handleSaveSuccess = useCallback(() => {
    setLocation(`/admin`)
  }, [setLocation])

  useEffect(() => {
    const loadTenant = async () => {
      if (isCreateMode) {
        setIsNewTenant(true)
        setTenant({ ...defaultTenantWithData })
        setLoading(false)
        return
      }
      if (id === 'new') {
        setIsNewTenant(true)
        setTenant({ ...defaultTenant })
        setLoading(false)
        return
      }
      if (!tenantId) {
        setLoading(false)
        return
      }
      try {
        const data = await fetchTenantById(tenantId)
        setTenant(data)
      } catch (error) {
        toastError('Failed to load tenant')
      } finally {
        setLoading(false)
      }
    }
    loadTenant()
  }, [tenantId, isCreateMode])

  useEffect(() => {
    if (isCreateMode) {
      const handleScroll = () => setScrolled(window.scrollY > 0)
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [isCreateMode])

  // Handlers for all fields
  const handleProfileChange = (field: string, value: string) => {
    setTenant(prev => (prev ? { ...prev, profile: { ...prev.profile, [field]: value } } : prev))
  }

  const handleWineClubChange = (field: string, value: string) => {
    setTenant(prev => (prev ? { ...prev, wineClub: { ...prev.wineClub, [field]: value } } : prev))
  }

  const handleAiModelChange = (field: string, value: string) => {
    setTenant(prev => (prev ? { ...prev, aiModel: { ...prev.aiModel, [field]: value } } : prev))
  }

  // Save/Delete
  const handleSave = async () => {
    if (!tenant || !tenant.profile?.wineryName?.trim()) {
      toastError('Winery name is required')
      return
    }
    if (!tenant.profile?.tenantName || !validateTenantName(tenant.profile.tenantName)) {
      toastError('Tenant Name (URL key) is required and must contain only a-z, A-Z, 0-9, -, _')
      return
    }
    try {
      if (isNewTenant) {
        await createTenant(tenant)
        toastSuccess('Tenant created successfully')
      } else {
        if (!tenantId) {
          toastError('Invalid tenant ID')
          return
        }
        // Видаляємо createdAt/updatedAt перед оновленням
        const { createdAt, updatedAt, ...dataToUpdate } = tenant as any
        await updateTenant(tenantId, dataToUpdate)
        toastSuccess('Tenant updated successfully')
      }
      handleSaveSuccess()
    } catch (error) {
      toastError(isNewTenant ? 'Failed to create tenant' : 'Failed to update tenant')
    }
  }

  const handleDelete = async () => {
    if (isNewTenant || !tenantId) return
    if (!window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return
    try {
      await deleteTenant(tenantId)
      toastSuccess('Tenant deleted successfully')
      handleSaveSuccess()
    } catch (error) {
      toastError('Failed to delete tenant')
    }
  }

  // Dropdown actions
  const actions: ActionDropdownItem[] = [
    {
      label: 'Delete Tenant',
      icon: <Trash2 size={16} />,
      onClick: handleDelete,
      colorClass: 'text-red-400',
      disabled: false,
    },
  ]

  const pageTitle = isNewTenant ? 'Add New Tenant' : 'Edit Tenant'

  // Filtered wines for CMS tab
  const filteredWines = tenant?.wineEntries || [] //.filter(wine => wine.name.toLowerCase().includes(search.toLowerCase())) || []
  console.log('tenant', tenant)
  // Tab change handler that updates the query param
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    const base = window.location.pathname
    setLocation(`${base}?tab=${key}`)
  }

  // --- Додаю функції для роботи з масивом вин ---
  const handleSaveWine = async (wine: Wine) => {
    console.log('handleSaveWine', wine)

    // Якщо це не новий tenant (тобто він вже існує в базі), зберігаємо зміни одразу
    if (!isNewTenant && tenantId) {
      try {
        // Якщо це нове вино (id === 0), отримуємо унікальний ID з сервера
        let wineWithId = wine
        if (editingWineIndex === null && wine.id === 0) {
          const response = await fetch(`/api/tenants/${tenantId}/generate-wine-id`)
          if (response.ok) {
            const { nextWineId } = await response.json()
            wineWithId = { ...wine, id: nextWineId }
          }
        }

        // Отримуємо поточний стан tenant з оновленими винами
        const updatedTenant = {
          ...tenant,
          wineEntries: editingWineIndex === null ? [...(tenant?.wineEntries || []), wineWithId] : tenant?.wineEntries?.map((w, idx) => (idx === editingWineIndex ? wineWithId : w)) || [],
        }

        // Видаляємо createdAt/updatedAt перед оновленням
        const { createdAt, updatedAt, ...dataToUpdate } = updatedTenant as any

        await updateTenant(tenantId, dataToUpdate)
        toastSuccess(editingWineIndex === null ? 'Wine added successfully' : 'Wine updated successfully')

        // Оновлюємо локальний стан після успішного збереження
        setTenant(prev => {
          if (!prev) return prev
          const wines = prev.wineEntries ? [...prev.wineEntries] : []
          if (editingWineIndex === null) {
            wines.push(wineWithId)
          } else {
            wines[editingWineIndex] = wineWithId
          }
          return { ...prev, wineEntries: wines }
        })
      } catch (error) {
        console.error('Failed to save wine to database:', error)
        toastError('Failed to save wine to database')
      }
    } else {
      // Для нових tenant просто оновлюємо локальний стан
      setTenant(prev => {
        if (!prev) return prev
        const wines = prev.wineEntries ? [...prev.wineEntries] : []
        if (editingWineIndex === null) {
          wines.push(wine)
        } else {
          wines[editingWineIndex] = wine
        }
        return { ...prev, wineEntries: wines }
      })
    }

    setShowWineEditor(false)
    setEditingWineIndex(null)
  }

  const handleDeleteWine = async (wineIndex: number) => {
    // Оновлюємо локальний стан
    setTenant(prev => {
      if (!prev) return prev
      const wines = prev.wineEntries ? [...prev.wineEntries] : []
      wines.splice(wineIndex, 1)
      return { ...prev, wineEntries: wines }
    })

    // Якщо це не новий tenant, зберігаємо зміни одразу
    if (!isNewTenant && tenantId) {
      try {
        const updatedTenant = {
          ...tenant,
          wineEntries: tenant?.wineEntries?.filter((_, idx) => idx !== wineIndex) || [],
        }

        // Видаляємо createdAt/updatedAt перед оновленням
        const { createdAt, updatedAt, ...dataToUpdate } = updatedTenant as any

        await updateTenant(tenantId, dataToUpdate)
        toastSuccess('Wine deleted successfully')
      } catch (error) {
        console.error('Failed to delete wine from database:', error)
        toastError('Failed to delete wine from database')
      }
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-black text-white'>
        <AppHeader title={pageTitle} showBackButton onBack={handleCancel} />
        <div className='pt-[75px] p-6'>
          <div style={typography.body}>Loading tenant data...</div>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className='min-h-screen bg-black text-white'>
        <AppHeader title={pageTitle} showBackButton onBack={handleCancel} />
        <div className='pt-[75px] p-6'>
          <div style={typography.body}>Tenant not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen mobile-fullscreen text-gray-600' style={{ backgroundColor: '#3a3a3a' }}>
      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AppHeader
          title={pageTitle}
          showBackButton
          onBack={handleCancel}
          rightContent={!isNewTenant && tenantId ? <ActionDropdown actions={actions} /> : null}
        />
      </div>

      {/* Content */}
      <div className={'p-6 pb-32 pt-[75px]'}>
        {/* Tabs */}
        <TenantTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Tab content */}
        {activeTab === 'profile' && (
          <div className='space-y-6'>
            <>
              <FormInput label='Winery Name' type='text' value={tenant.profile?.wineryName || ''} onChange={(value: string) => handleProfileChange('wineryName', value)} placeholder='Winery name' required />
              <FormInput label='URL key' type='text' value={tenant.profile.tenantName || ''} onChange={(value: string) => setTenant(prev => (prev ? { ...prev, profile: { ...prev.profile, tenantName: value } } : prev))} placeholder='example-tenant' required error={tenant.profile.tenantName && !validateTenantName(tenant.profile.tenantName) ? 'Only a-z, A-Z, 0-9, -, _ allowed' : undefined} />
              <FormInput label='Website' type='url' value={tenant.profile?.websiteURL || ''} onChange={(value: string) => handleProfileChange('websiteURL', value)} placeholder='https://example.com' />
              <FormInput label='Address' type='text' value={tenant.profile?.address || ''} onChange={(value: string) => handleProfileChange('address', value)} placeholder='Address' />
              <FormInput label='Phone' type='tel' value={tenant.profile?.contactPhone || ''} onChange={(value: string) => handleProfileChange('contactPhone', value)} placeholder='Phone' />
              <FormInput label='Email' type='email' value={tenant.profile?.contactEmail || ''} onChange={(value: string) => handleProfileChange('contactEmail', value)} placeholder='Email' />
              <FormInput label='Year Established' type='text' value={tenant.profile?.yearEstablished || ''} onChange={(value: string) => handleProfileChange('yearEstablished', value)} placeholder='Year established' />
              <FormInput label='Winery Logo URL' type='url' value={tenant.profile?.wineryLogo || ''} onChange={(value: string) => handleProfileChange('wineryLogo', value)} placeholder='https://example.com/winery-logo.png' />
              <FormInput label='Hours of Operation' type='text' value={tenant.profile?.hoursOfOperation || ''} onChange={(value: string) => handleProfileChange('hoursOfOperation', value)} placeholder='Hours of operation' />
              <FormInput label='Social Media Links' type='text' value={tenant.profile?.socialMediaLinks || ''} onChange={(value: string) => handleProfileChange('socialMediaLinks', value)} placeholder='Social media links' />
              <CustomTextarea
                label='Winery Description'
                value={tenant.profile?.wineryDescription || ''}
                onChange={e => handleProfileChange('wineryDescription', e.target.value)}
                placeholder='Winery description'
              />
            </>
          </div>
        )}

        {activeTab === 'cms' && (
          <div>
            <div className='flex items-center mb-4'>
              <input type='text' placeholder='Search wines...' value={search} onChange={e => setSearch(e.target.value)} className='flex-1 p-2 rounded bg-black/20 text-white border border-white/20' />
              <div style={{ width: 12 }} />
              <Button onClick={handleAddWine} variant='secondary' className='w-auto min-w-0 px-4'>
                + Add wine
              </Button>
            </div>
            {/* Wine list */}
            <div>
              {filteredWines.map((wine, idx) => (
                <div key={idx} className='flex items-center p-2 border-b border-white/10'>
                  <span className='text-white flex-1 cursor-pointer' onClick={() => handleEditWine(idx)}>
                    {wine.name}
                  </span>
                  <span className='text-xs text-gray-400 ml-2'>ID: {idx + 1}</span>
                  <div style={{ marginLeft: 12 }}>
                    <ActionDropdown
                      actions={[
                        {
                          label: 'Delete Wine',
                          icon: <Trash2 size={16} />,
                          onClick: () => handleDeleteWine(idx),
                          colorClass: 'text-red-400',
                          disabled: false,
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
              {filteredWines.length === 0 && (
                <div className='text-center py-8 text-gray-400'>
                  <p>No wines found</p>
                  <p className='text-sm mt-2'>Click "Add wine" to get started</p>
                </div>
              )}
            </div>
            {/* SimpleWineEdit modal */}
            {showWineEditor && (
              <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70'>
                <div className='bg-white rounded-lg p-6 w-full max-w-lg'>
                  <div className='mb-4'>
                    <h2 className='text-lg font-semibold text-gray-800'>{editingWineIndex !== null ? 'Edit Wine' : 'Add New Wine'}</h2>
                  </div>
                  <SimpleWineEdit
                    wine={editingWineIndex !== null ? filteredWines[editingWineIndex] : null}
                    onSave={handleSaveWine}
                    onCancel={() => {
                      setShowWineEditor(false)
                      setEditingWineIndex(null)
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'wineclub' && (
          <div className='space-y-6'>
            {isCreateMode ? (
              <>
                <FormInput label='Club Name' type='text' value={tenant.wineClub?.clubName || ''} onChange={(value: string) => handleWineClubChange('clubName', value)} placeholder='Club name' />
                <FormInput label='Club Description' type='text' value={tenant.wineClub?.description || ''} onChange={(value: string) => handleWineClubChange('description', value)} placeholder='Club description' />
                <FormInput label='Membership Tiers' type='text' value={tenant.wineClub?.membershipTiers || ''} onChange={(value: string) => handleWineClubChange('membershipTiers', value)} placeholder='Membership tiers' />
                <FormInput label='Pricing' type='text' value={tenant.wineClub?.pricing || ''} onChange={(value: string) => handleWineClubChange('pricing', value)} placeholder='Pricing' />
                <FormInput label='Club Benefits' type='text' value={tenant.wineClub?.clubBenefits || ''} onChange={(value: string) => handleWineClubChange('clubBenefits', value)} placeholder='Club benefits' />
              </>
            ) : (
              <>
                {Object.entries(tenant.wineClub).map(([key, value]) => (
                  <div key={key} className='mb-2'>
                    <label style={typography.body1R} className='block mb-1'>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                    <input type='text' value={value !== undefined && value !== null ? String(value) : ''} onChange={e => handleWineClubChange(key, e.target.value)} className='w-full p-3 bg-white/5 border border-white/20 rounded-lg' placeholder={key} />
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className='space-y-6'>
            {isCreateMode ? (
              // DropdownInput components for create mode
              <>
                <DropdownInput
                  label='Knowledge Scope'
                  value={tenant.aiModel?.knowledgeScope || ''}
                  onChange={(value: string) => handleAiModelChange('knowledgeScope', value)}
                  options={[
                    { value: 'winery-only', label: 'winery-only' },
                    { value: 'winery-plus-global', label: 'winery-plus-global' },
                  ]}
                  placeholder='Knowledge Scope'
                />
                <DropdownInput
                  label='Personality Style'
                  value={tenant.aiModel?.personalityStyle || ''}
                  onChange={(value: string) => handleAiModelChange('personalityStyle', value)}
                  options={[
                    { value: 'educator', label: 'educator' },
                    { value: 'sommelier', label: 'sommelier' },
                    { value: 'tasting-room-host', label: 'tasting-room-host' },
                    { value: 'luxury-concierge', label: 'luxury-concierge' },
                    { value: 'casual-friendly', label: 'casual-friendly' },
                  ]}
                  placeholder='Personality Style'
                />
                <FormInput label='Brand Guide' type='text' value={tenant.aiModel?.brandGuide || ''} onChange={(value: string) => handleAiModelChange('brandGuide', value)} placeholder='Brand Guide' />
                <FormInput label='Tone Preferences' type='text' value={tenant.aiModel?.tonePreferences || ''} onChange={(value: string) => handleAiModelChange('tonePreferences', value)} placeholder='Tone Preferences' />
                <FormInput label='Knowledge Documents' type='text' value={tenant.aiModel?.knowledgeDocuments || ''} onChange={(value: string) => handleAiModelChange('knowledgeDocuments', value)} placeholder='Knowledge Documents' />
              </>
            ) : (
              // Regular inputs with selects for edit mode
              <>
                <div className='mb-2'>
                  <label className='block text-white mb-1'>Knowledge Scope</label>
                  <select className='w-full p-2 rounded bg-black/20 text-white' value={tenant.aiModel.knowledgeScope} onChange={e => handleAiModelChange('knowledgeScope', e.target.value)}>
                    <option value='winery-only'>winery-only</option>
                    <option value='winery-plus-global'>winery-plus-global</option>
                  </select>
                </div>
                <div className='mb-2'>
                  <label className='block text-white mb-1'>Personality Style</label>
                  <select className='w-full p-2 rounded bg-black/20 text-white' onChange={e => handleAiModelChange('personalityStyle', e.target.value)}>
                    <option value='educator'>educator</option>
                    <option value='sommelier'>sommelier</option>
                    <option value='tasting-room-host'>tasting-room-host</option>
                    <option value='luxury-concierge'>luxury-concierge</option>
                    <option value='casual-friendly'>casual-friendly</option>
                  </select>
                </div>
                <div>
                  <label style={typography.body1R} className='block mb-2'>
                    Brand Guide
                  </label>
                  <input type='text' value={tenant.aiModel.brandGuide} onChange={e => handleAiModelChange('brandGuide', e.target.value)} className='w-full p-3 bg-white/5 border border-white/20 rounded-lg' placeholder='Brand Guide' />
                </div>
                <div>
                  <label style={typography.body1R} className='block mb-2'>
                    Tone Preferences
                  </label>
                  <input type='text' value={tenant.aiModel.tonePreferences} onChange={e => handleAiModelChange('tonePreferences', e.target.value)} className='w-full p-3 bg-white/5 border border-white/20 rounded-lg' placeholder='Tone Preferences' />
                </div>
                <div>
                  <label style={typography.body1R} className='block mb-2'>
                    Knowledge Documents
                  </label>
                  <input type='text' value={tenant.aiModel.knowledgeDocuments} onChange={e => handleAiModelChange('knowledgeDocuments', e.target.value)} className='w-full p-3 bg-white/5 border border-white/20 rounded-lg' placeholder='Knowledge Documents' />
                </div>
              </>
            )}
          </div>
        )}

        {/* Save Button */}
        {!showWineEditor && (
          <div className='fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-sm border-t border-white/10 z-50'>
            <Button variant='primary' onClick={handleSave} className='w-full text-lg font-medium py-4'>
              {isCreateMode ? 'Create' : isNewTenant ? 'Add Tenant' : 'Save'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TenantForm
