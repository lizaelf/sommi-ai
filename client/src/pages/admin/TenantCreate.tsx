import React from 'react'
import TenantForm from './TenantForm'
import { useParams } from 'wouter'

export default function TenantCreate() {
  const { tenantName } = useParams()
  return <TenantForm mode='create' />
}
