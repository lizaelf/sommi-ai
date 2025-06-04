import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreVertical, Edit, Trash2, Building2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
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

const Tenants: React.FC = () => {
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tenants from localStorage for now (will be API later)
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
      toast({
        description: 'Winery created successfully',
      });
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
      toast({
        description: 'Winery updated successfully',
      });
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
      toast({
        description: 'Winery deleted successfully',
      });
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
      toast({
        description: 'Name and slug are required',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate slug
    const existingTenant = tenants.find((t: Tenant) => t.slug === formData.slug);
    if (existingTenant) {
      toast({
        description: 'Slug already exists',
        variant: 'destructive',
      });
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Winery
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Winery</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Winery Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter winery name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="url-friendly-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    value={formData.logo}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the winery"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="aiTone">AI Personality/Tone</Label>
                  <Textarea
                    id="aiTone"
                    value={formData.aiTone}
                    onChange={(e) => setFormData(prev => ({ ...prev, aiTone: e.target.value }))}
                    placeholder="Describe how the AI should respond for this winery (e.g., formal, friendly, technical)"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTenantMutation.isPending}>
                    {createTenantMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tenants Grid */}
        {tenants.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No wineries yet</h3>
            <p className="text-gray-600 mb-6">Create your first winery to get started</p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Winery
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant: Tenant) => (
              <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(tenant)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Winery
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(tenant)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  {tenant.description && (
                    <p className="text-gray-600 text-sm mb-4">{tenant.description}</p>
                  )}
                  <Link href={`/tenants/${tenant.slug}/admin`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Manage Wines
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Winery</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Winery Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter winery name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-slug">URL Slug *</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-logo">Logo URL</Label>
                <Input
                  id="edit-logo"
                  value={formData.logo}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the winery"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-aiTone">AI Personality/Tone</Label>
                <Textarea
                  id="edit-aiTone"
                  value={formData.aiTone}
                  onChange={(e) => setFormData(prev => ({ ...prev, aiTone: e.target.value }))}
                  placeholder="Describe how the AI should respond for this winery"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedTenant(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTenantMutation.isPending}>
                  {updateTenantMutation.isPending ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Winery</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedTenant?.name}"? This will permanently
                remove the winery and all associated wine data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedTenant(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedTenant && deleteTenantMutation.mutate(selectedTenant.id)}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteTenantMutation.isPending}
              >
                {deleteTenantMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Tenants;