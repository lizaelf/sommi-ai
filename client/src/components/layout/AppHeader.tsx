import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'wouter'
import Logo from '@/components/layout/Logo'
import { IconButton } from '@/components/ui/buttons/IconButton'
import { Button } from '@/components/ui/buttons/Button'

interface AppHeaderProps {
  title?: string
  onBack?: () => void
  rightContent?: React.ReactNode
  className?: string
  showBackButton?: boolean
  showMyCellarLink?: boolean
}

export function AppHeader({ title, onBack, rightContent, className = '', showBackButton = false, showMyCellarLink = false }: AppHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const { tenantName } = useParams()
  // Initialize header component
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
      const isScrolled = scrollPosition > 10

      // Force a re-render by updating state even if the scrolled value hasn't changed
      setScrolled(prev => {
        if (prev !== isScrolled) {
          console.log('Header scroll state changed:', scrollPosition, 'isScrolled:', isScrolled)
        }
        return isScrolled
      })
    }

    // Check initial scroll position
    handleScroll()

    // Use multiple event listeners for maximum compatibility
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('scroll', handleScroll, { passive: true })

    // Also listen on document body and root element
    if (document.body) {
      document.body.addEventListener('scroll', handleScroll, { passive: true })
    }
    if (document.documentElement) {
      document.documentElement.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('scroll', handleScroll)
      if (document.body) {
        document.body.removeEventListener('scroll', handleScroll)
      }
      if (document.documentElement) {
        document.documentElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  const headerStyles = {
    backgroundColor: scrolled ? 'rgba(10, 10, 10, 0.85)' : 'transparent',
    backdropFilter: scrolled ? 'blur(8px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(8px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
    transition: 'background-color 0.3s ease, border-bottom 0.3s ease, backdrop-filter 0.3s ease',
    willChange: 'background-color, border-bottom, backdrop-filter',
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`} style={headerStyles}>
      <div className='mx-auto max-w-[1200px] h-[75px] px-4 py-4'>
        <div className='relative flex items-center justify-between h-full'>
          {/* Left side - Back button or Logo + Title */}
          <div className='flex items-center gap-3 flex-1 min-w-0'>
            {showBackButton && onBack ? <IconButton icon={ArrowLeft} onClick={onBack} variant='headerIcon' size='md' title='Go back' /> : <Logo />}
            {title && <h1 className='absolute left-1/2 transform -translate-x-1/2 text-white text-[18px] font-medium truncate whitespace-nowrap text-center'>{title}</h1>}
          </div>

          {/* Right side - Custom content */}
          <div className='flex items-center gap-3'>
            {rightContent}
            {showMyCellarLink && tenantName && (
              <Link href={`/${tenantName}/cellar`}>
                <Button variant='secondary' size='md'>
                  My Cellar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Header spacer component to offset content for fixed header
export const HeaderSpacer = () => <div style={{ height: '75px' }} />

export default AppHeader
