import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Link } from 'wouter'
import AppHeader, { HeaderSpacer } from '@/components/layout/AppHeader'
import { IconButton } from '@/components/ui/buttons/IconButton'
import { Tenant } from '@/types/tenant'
import ActionDropdown from '@/components/admin/ActionDropdown'
import { Wine } from '@/types/wine'
import TenantCard from '@/components/admin/TenantCard'

const Admin: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [showMenuDropdown, setShowMenuDropdown] = useState(false)
  const [wineCards, setWineCards] = useState<Wine[]>([])

  const menuDropdownRef = useRef<HTMLDivElement>(null)

  // Завантаження tenants з API
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch('/api/tenants')
        if (!res.ok) throw new Error('Failed to fetch tenants')
        const data = await res.json()
        setTenants(data)
      } catch (error) {
        setTenants([])
        // Можна додати toast або індикатор помилки
        console.error('Error loading tenants:', error)
      }
    }
    fetchTenants()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target as Node)) {
        setShowMenuDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle global search
  const handleGlobalSearch = () => {
    console.log('Opening global search...')
    setShowMenuDropdown(false)
    // Add global search functionality here
  }

  // Handle profile management
  const handleProfileManagement = () => {
    console.log('Opening profile management...')
    setShowMenuDropdown(false)
    // Add profile management functionality here
  }

  // Обработчик удаления tenant
  const handleDeleteTenant = async (tenantId: string) => {
    if (!window.confirm('Are you sure you want to delete this tenant?')) return
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete tenant')
      setTenants(prev => prev.filter(t => String(t.id) !== String(tenantId)))
    } catch (error) {
      alert('Error deleting tenant')
      console.error(error)
    }
  }

  if (!tenants || tenants.length === 0) {
    // Show loading state if tenants are not loaded yet
    return (
      <div className='min-h-screen bg-black text-white'>
        <AppHeader title='Somm tenant admin' />
        <div className='pt-[75px] p-6'>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#fff', opacity: 0.7 }}>Loading tenant data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen mobile-fullscreen' style={{ backgroundColor: '#3a3a3a' }}>
      <AppHeader title='Somm tenant admin' rightContent={<IconButton icon={Plus} onClick={() => (window.location.href = '/tenant-create')} variant='headerIcon' size='md' title='Create new tenant' />} />
      <div
        style={{
          paddingTop: '75px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        {/* Tenants Cards */}
        <div className='flex flex-col w-full'>
          {tenants.map(tenant => (
            <TenantCard key={tenant.id} tenant={tenant} onDelete={handleDeleteTenant} showId={false} />
          ))}
        </div>

        {/* Empty State */}
        {tenants.length === 0 && (
          <div className='text-center py-12'>
            <div className='text-gray-400 mb-4'>No tenants available.</div>
            <IconButton icon={Plus} onClick={() => (window.location.href = '/tenant-create')} variant='headerIcon' size='lg' className='px-4 py-2'>
              Create Your First Tenant
            </IconButton>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
