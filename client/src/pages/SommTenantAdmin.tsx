import React, { useState, useEffect } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { Link } from 'wouter';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  wineCount: number;
}

interface TenantFormData {
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'inactive';
}

const SommTenantAdmin: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    slug: '',
    description: '',
    status: 'active'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Load tenants from localStorage
  useEffect(() => {
    const storedTenants = localStorage.getItem('sommelier-tenants');
    if (storedTenants) {
      setTenants(JSON.parse(storedTenants));
    } else {
      // Initialize with sample data
      const sampleTenants: Tenant[] = [
        {
          id: 1,
          name: 'Napa Valley Vineyards',
          slug: 'napa-valley-vineyards',
          description: 'Premium Napa Valley wine collection specializing in Cabernet Sauvignon',
          status: 'active',
          createdAt: '2024-01-15',
          wineCount: 12
        },
        {
          id: 2,
          name: 'Sonoma Coast Wines',
          slug: 'sonoma-coast-wines',
          description: 'Boutique winery focusing on Pinot Noir and Chardonnay',
          status: 'active',
          createdAt: '2024-02-20',
          wineCount: 8
        },
        {
          id: 3,
          name: 'Ridge Vineyards',
          slug: 'ridge-vineyards',
          description: 'Historic winery known for exceptional Zinfandel and Cabernet blends',
          status: 'inactive',
          createdAt: '2024-03-10',
          wineCount: 15
        }
      ];
      setTenants(sampleTenants);
      localStorage.setItem('sommelier-tenants', JSON.stringify(sampleTenants));
    }
  }, []);



  // Save tenants to localStorage
  const saveTenants = (updatedTenants: Tenant[]) => {
    setTenants(updatedTenants);
    localStorage.setItem('sommelier-tenants', JSON.stringify(updatedTenants));
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle form input changes
  const handleInputChange = (field: keyof TenantFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && { slug: generateSlug(value) })
    }));
  };

  // Create new tenant
  const handleCreateTenant = () => {
    if (!formData.name.trim()) return;

    const newTenant: Tenant = {
      id: Date.now(),
      name: formData.name,
      slug: formData.slug || generateSlug(formData.name),
      description: formData.description,
      status: formData.status,
      createdAt: new Date().toISOString().split('T')[0],
      wineCount: 0
    };

    const updatedTenants = [...tenants, newTenant];
    saveTenants(updatedTenants);
    
    setIsCreateModalOpen(false);
    setFormData({ name: '', slug: '', description: '', status: 'active' });
  };

  // Update tenant
  const handleUpdateTenant = () => {
    if (!editingTenant || !formData.name.trim()) return;

    const updatedTenants = tenants.map(tenant =>
      tenant.id === editingTenant.id
        ? {
            ...tenant,
            name: formData.name,
            slug: formData.slug || generateSlug(formData.name),
            description: formData.description,
            status: formData.status
          }
        : tenant
    );

    saveTenants(updatedTenants);
    setEditingTenant(null);
    setFormData({ name: '', slug: '', description: '', status: 'active' });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTenant(null);
    setIsCreateModalOpen(false);
    setFormData({ name: '', slug: '', description: '', status: 'active' });
  };

  // Filter tenants based on search term
  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#3a3a3a' }}>
      {/* Fixed Header with same design as cellar page */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <Link href="/">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="text-white"
          >
            <path
              fill="currentColor"
              d="M15.707 4.293a1 1 0 0 1 0 1.414L9.414 12l6.293 6.293a1 1 0 0 1-1.414 1.414l-7-7a1 1 0 0 1 0-1.414l7-7a1 1 0 0 1 1.414 0"
            />
          </svg>
        </Link>
        <h1 
          className="text-lg font-medium"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            color: "white"
          }}
        >Somm tenant admin</h1>
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setIsCreateModalOpen(true)}
            className="cursor-pointer text-white/80 hover:text-white transition-all duration-200"
          >
            <Plus className="w-6 h-6" />
          </div>
        </div>
      </div>
      <div style={{ paddingTop: "100px", paddingLeft: "24px", paddingRight: "24px" }}>
        {/* Search Input */}
        <div style={{ marginBottom: "24px" }}>
          <input
            type="text"
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "transparent !important",
              backgroundColor: "transparent !important",
              border: "1px solid #494949",
              borderRadius: "12px",
              color: "white",
              fontSize: "16px",
              outline: "none",
              boxShadow: "none !important",
              WebkitAppearance: "none",
              appearance: "none"
            }}
            className="placeholder-white/60"
          />
        </div>





        {/* Tenants Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredTenants.map((tenant) => (
            <Link key={tenant.id} href={`/tenants/${tenant.slug}/admin`}>
              <div
                className="rounded-xl p-4 transition-colors cursor-pointer hover:bg-white/5"
                style={{
                  border: "1px solid #494949",
                }}
              >
                <div className="flex items-center justify-between">
                  <h3
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "20px",
                      lineHeight: "28px",
                      fontWeight: 500,
                      color: "white"
                    }}
                  >
                    {tenant.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {searchTerm ? 'No tenants found matching your search.' : 'No tenants available.'}
            </div>
            {!searchTerm && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Tenant
              </button>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(isCreateModalOpen || editingTenant) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">
                {editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tenant Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tenant name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tenant-slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the tenant..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={editingTenant ? handleUpdateTenant : handleCreateTenant}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingTenant ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SommTenantAdmin;