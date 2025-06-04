import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreVertical, Edit, Trash2, Building2 } from 'lucide-react';
import { Link } from 'wouter';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  aiTone?: string;
  createdAt: string;
}

interface TenantFormData {
  name: string;
  slug: string;
  logo: string;
  description: string;
  aiTone: string;
}

const TenantsSimple: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    slug: '',
    logo: '',
    description: '',
    aiTone: '',
  });

  const queryClient = useQueryClient();

  // Fetch tenants from localStorage
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => {
      const stored = localStorage.getItem('tenants');
      return stored ? JSON.parse(stored) : [];
    },
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (tenant: Omit<Tenant, 'id' | 'createdAt'>) => {
      const newTenant: Tenant = {
        ...tenant,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      
      const currentTenants = JSON.parse(localStorage.getItem('tenants') || '[]');
      const updatedTenants = [...currentTenants, newTenant];
      localStorage.setItem('tenants', JSON.stringify(updatedTenants));
      
      return newTenant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsCreateDialogOpen(false);
      resetForm();
      alert('Winery created successfully');
    },
  });

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: async (updatedTenant: Tenant) => {
      const currentTenants = JSON.parse(localStorage.getItem('tenants') || '[]');
      const updatedTenants = currentTenants.map((t: Tenant) =>
        t.id === updatedTenant.id ? updatedTenant : t
      );
      localStorage.setItem('tenants', JSON.stringify(updatedTenants));
      return updatedTenant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsEditDialogOpen(false);
      setSelectedTenant(null);
      resetForm();
      alert('Winery updated successfully');
    },
  });

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      const currentTenants = JSON.parse(localStorage.getItem('tenants') || '[]');
      const updatedTenants = currentTenants.filter((t: Tenant) => t.id !== tenantId);
      localStorage.setItem('tenants', JSON.stringify(updatedTenants));
      
      // Also remove tenant-specific wine data
      localStorage.removeItem(`wine-data-tenant-${tenantId}`);
      
      return tenantId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setDeleteConfirmOpen(false);
      setSelectedTenant(null);
      alert('Winery deleted successfully');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      logo: '',
      description: '',
      aiTone: '',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      alert('Name and slug are required');
      return;
    }

    // Check for duplicate slug
    const existingTenant = tenants.find((t: Tenant) => t.slug === formData.slug);
    if (existingTenant) {
      alert('Slug already exists');
      return;
    }

    createTenantMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    const updatedTenant: Tenant = {
      ...selectedTenant,
      ...formData,
    };

    updateTenantMutation.mutate(updatedTenant);
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      logo: tenant.logo || '',
      description: tenant.description || '',
      aiTone: tenant.aiTone || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDeleteConfirmOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.slug === '' ? generateSlug(value) : prev.slug,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading tenants...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Winery Management</h1>
            <p className="text-gray-600 mt-2">Manage multiple wineries and their wine collections</p>
          </div>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Winery
          </button>
        </div>

        {/* Tenants Grid */}
        {tenants.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No wineries yet</h3>
            <p className="text-gray-600 mb-6">Create your first winery to get started</p>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Winery
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant: Tenant) => (
              <div key={tenant.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {tenant.logo ? (
                      <img
                        src={tenant.logo}
                        alt={`${tenant.name} logo`}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{tenant.name}</h3>
                      <p className="text-sm text-gray-500">/{tenant.slug}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block">
                      <button
                        onClick={() => handleEdit(tenant)}
                        className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 w-full text-left"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Winery
                      </button>
                      <button
                        onClick={() => handleDelete(tenant)}
                        className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 w-full text-left text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                {tenant.description && (
                  <p className="text-gray-600 text-sm mb-4">{tenant.description}</p>
                )}
                <Link href={`/tenants/${tenant.slug}/admin`}>
                  <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    Manage Wines
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        {isCreateDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Winery</h2>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Winery Name *</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter winery name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium mb-1">URL Slug *</label>
                  <input
                    id="slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="url-friendly-name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="logo" className="block text-sm font-medium mb-1">Logo URL</label>
                  <input
                    id="logo"
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the winery"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="aiTone" className="block text-sm font-medium mb-1">AI Personality/Tone</label>
                  <textarea
                    id="aiTone"
                    value={formData.aiTone}
                    onChange={(e) => setFormData(prev => ({ ...prev, aiTone: e.target.value }))}
                    placeholder="Describe how the AI should respond for this winery"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTenantMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createTenantMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        {isEditDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Winery</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium mb-1">Winery Name *</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter winery name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-slug" className="block text-sm font-medium mb-1">URL Slug *</label>
                  <input
                    id="edit-slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="url-friendly-name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-logo" className="block text-sm font-medium mb-1">Logo URL</label>
                  <input
                    id="edit-logo"
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the winery"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-aiTone" className="block text-sm font-medium mb-1">AI Personality/Tone</label>
                  <textarea
                    id="edit-aiTone"
                    value={formData.aiTone}
                    onChange={(e) => setFormData(prev => ({ ...prev, aiTone: e.target.value }))}
                    placeholder="Describe how the AI should respond for this winery"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedTenant(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateTenantMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateTenantMutation.isPending ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Delete Winery</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedTenant?.name}"? This will permanently
                remove the winery and all associated wine data. This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setSelectedTenant(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedTenant && deleteTenantMutation.mutate(selectedTenant.id)}
                  disabled={deleteTenantMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteTenantMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantsSimple;