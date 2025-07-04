import React from 'react';
import { Link } from 'wouter';
import ActionDropdown from '@/components/admin/ActionDropdown';
import { Trash2 } from 'lucide-react';
import { Tenant } from '@/types/tenant';

interface TenantCardProps {
  tenant: Tenant;
  onDelete: (tenantId: string) => void;
}

const TenantCard: React.FC<TenantCardProps> = ({ tenant, onDelete }) => (
  <div
    className='rounded-xl p-4 transition-colors cursor-pointer hover:bg-white/5 mb-2'
    style={{
      border: '1px solid #494949',
      width: '100%',
    }}
  >
    <div className='flex items-center justify-between' style={{ gap: '16px' }}>
      <Link href={`/tenant-edit/${tenant.id}`} style={{ flexGrow: 1 }}>
        <h3
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px',
            lineHeight: '28px',
            fontWeight: 500,
            color: 'white',
            width: '100%',
            margin: 0,
            padding: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {tenant.profile?.wineryName || `Tenant ${tenant.id}`}
          {tenant.id ? (
            <span style={{ color: '#aaa', fontSize: '14px', marginLeft: 8 }}>
              (id: {tenant.id})
            </span>
          ) : null}
          <span style={{ color: '#aaa', fontSize: '14px', marginLeft: 8 }}>{tenant.profile?.tenantName ? `(${tenant.profile.tenantName})` : ''}</span>
        </h3>
      </Link>
      <ActionDropdown
        actions={[
          {
            label: 'Delete',
            icon: <Trash2 size={16} />, 
            onClick: () => onDelete(tenant.id.toString()),
            colorClass: 'text-red-400',
          },
        ]}
      />
    </div>
  </div>
);

export default TenantCard; 