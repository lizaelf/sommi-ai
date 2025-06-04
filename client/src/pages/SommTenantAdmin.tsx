import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ExternalLink } from 'lucide-react';
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

  // Edit tenant
  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description || '',
      status: tenant.status
    });
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

  // Delete tenant
  const handleDeleteTenant = (tenantId: number) => {
    if (window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      const updatedTenants = tenants.filter(tenant => tenant.id !== tenantId);
      saveTenants(updatedTenants);
    }
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Sommelier Tenant Administration</h1>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Tenant
          </button>
        </div>



        {/* Tenants Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((tenant) => (
            <div key={tenant.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              {/* Clickable Card Content */}
              <Link href={`/tenants/${tenant.slug}/admin`}>
                <div className="p-6 cursor-pointer hover:bg-gray-50 rounded-t-lg">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{tenant.name}</h3>
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tenant.description}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tenant.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tenant.status}
                    </span>
                    <span className="text-sm text-gray-500">{tenant.wineCount} wines</span>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    <div>Slug: {tenant.slug}</div>
                    <div>Created: {tenant.createdAt}</div>
                  </div>
                </div>
              </Link>
              
              {/* Action Buttons */}
              <div className="px-6 py-3 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleEditTenant(tenant);
                  }}
                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit tenant"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteTenant(tenant.id);
                  }}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete tenant"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
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