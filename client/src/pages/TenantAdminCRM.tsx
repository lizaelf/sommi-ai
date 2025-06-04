import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Edit, Trash2, Eye, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface WineData {
  id: number;
  name: string;
  year?: number;
  bottles: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  buyAgainLink: string;
  qrCode: string;
  qrLink: string;
  location?: string;
  description?: string;
  foodPairing?: string[];
}

interface WineFormData {
  name: string;
  year: string;
  bottles: string;
  image: string;
  vn: string;
  jd: string;
  ws: string;
  abv: string;
  buyAgainLink: string;
  qrCode: string;
  qrLink: string;
  location: string;
  description: string;
  foodPairing: string;
}

const TenantAdminCRM: React.FC = () => {
  const { tenantSlug } = useParams();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedWine, setSelectedWine] = useState<WineData | null>(null);
  const [formData, setFormData] = useState<WineFormData>({
    name: '',
    year: '',
    bottles: '',
    image: '',
    vn: '',
    jd: '',
    ws: '',
    abv: '',
    buyAgainLink: '',
    qrCode: '',
    qrLink: '',
    location: '',
    description: '',
    foodPairing: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get tenant info
  const tenant = React.useMemo(() => {
    const stored = localStorage.getItem('tenants');
    const tenants = stored ? JSON.parse(stored) : [];
    return tenants.find((t: any) => t.slug === tenantSlug);
  }, [tenantSlug]);

  // Tenant-specific storage key
  const storageKey = `wine-data-tenant-${tenant?.id || 'unknown'}`;

  // Fetch wines for this tenant
  const { data: wines = [], isLoading } = useQuery({
    queryKey: ['wines', tenant?.id],
    queryFn: () => {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: !!tenant,
  });

  // Create wine mutation
  const createWineMutation = useMutation({
    mutationFn: async (wine: Omit<WineData, 'id'>) => {
      const newWine: WineData = {
        ...wine,
        id: Date.now(),
      };
      
      const currentWines = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedWines = [...currentWines, newWine];
      localStorage.setItem(storageKey, JSON.stringify(updatedWines));
      
      return newWine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wines', tenant?.id] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        description: 'Wine created successfully',
      });
    },
  });

  // Update wine mutation
  const updateWineMutation = useMutation({
    mutationFn: async (updatedWine: WineData) => {
      const currentWines = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedWines = currentWines.map((w: WineData) =>
        w.id === updatedWine.id ? updatedWine : w
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedWines));
      return updatedWine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wines', tenant?.id] });
      setIsEditDialogOpen(false);
      setSelectedWine(null);
      resetForm();
      toast({
        description: 'Wine updated successfully',
      });
    },
  });

  // Delete wine mutation
  const deleteWineMutation = useMutation({
    mutationFn: async (wineId: number) => {
      const currentWines = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedWines = currentWines.filter((w: WineData) => w.id !== wineId);
      localStorage.setItem(storageKey, JSON.stringify(updatedWines));
      return wineId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wines', tenant?.id] });
      setDeleteConfirmOpen(false);
      setSelectedWine(null);
      toast({
        description: 'Wine deleted successfully',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      year: '',
      bottles: '',
      image: '',
      vn: '',
      jd: '',
      ws: '',
      abv: '',
      buyAgainLink: '',
      qrCode: '',
      qrLink: '',
      location: '',
      description: '',
      foodPairing: '',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        description: 'Wine name is required',
        variant: 'destructive',
      });
      return;
    }

    const wineData: Omit<WineData, 'id'> = {
      name: formData.name,
      year: formData.year ? parseInt(formData.year) : undefined,
      bottles: parseInt(formData.bottles) || 0,
      image: formData.image,
      ratings: {
        vn: parseFloat(formData.vn) || 0,
        jd: parseFloat(formData.jd) || 0,
        ws: parseFloat(formData.ws) || 0,
        abv: parseFloat(formData.abv) || 0,
      },
      buyAgainLink: formData.buyAgainLink,
      qrCode: formData.qrCode,
      qrLink: formData.qrLink,
      location: formData.location,
      description: formData.description,
      foodPairing: formData.foodPairing ? formData.foodPairing.split(',').map(s => s.trim()) : [],
    };

    createWineMutation.mutate(wineData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWine) return;

    const updatedWine: WineData = {
      ...selectedWine,
      name: formData.name,
      year: formData.year ? parseInt(formData.year) : undefined,
      bottles: parseInt(formData.bottles) || 0,
      image: formData.image,
      ratings: {
        vn: parseFloat(formData.vn) || 0,
        jd: parseFloat(formData.jd) || 0,
        ws: parseFloat(formData.ws) || 0,
        abv: parseFloat(formData.abv) || 0,
      },
      buyAgainLink: formData.buyAgainLink,
      qrCode: formData.qrCode,
      qrLink: formData.qrLink,
      location: formData.location,
      description: formData.description,
      foodPairing: formData.foodPairing ? formData.foodPairing.split(',').map(s => s.trim()) : [],
    };

    updateWineMutation.mutate(updatedWine);
  };

  const handleEdit = (wine: WineData) => {
    setSelectedWine(wine);
    setFormData({
      name: wine.name,
      year: wine.year?.toString() || '',
      bottles: wine.bottles.toString(),
      image: wine.image,
      vn: wine.ratings.vn.toString(),
      jd: wine.ratings.jd.toString(),
      ws: wine.ratings.ws.toString(),
      abv: wine.ratings.abv.toString(),
      buyAgainLink: wine.buyAgainLink,
      qrCode: wine.qrCode,
      qrLink: wine.qrLink,
      location: wine.location || '',
      description: wine.description || '',
      foodPairing: wine.foodPairing?.join(', ') || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (wine: WineData) => {
    setSelectedWine(wine);
    setDeleteConfirmOpen(true);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(wines, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${tenant?.slug || 'wines'}-data.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          localStorage.setItem(storageKey, JSON.stringify(importedData));
          queryClient.invalidateQueries({ queryKey: ['wines', tenant?.id] });
          toast({
            description: 'Data imported successfully',
          });
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        toast({
          description: 'Failed to import data. Please check the file format.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Winery Not Found</h1>
          <p className="text-gray-600 mb-6">The winery "{tenantSlug}" does not exist.</p>
          <Link href="/tenants">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Wineries
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading wines...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/tenants">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              {tenant.logo && (
                <img
                  src={tenant.logo}
                  alt={`${tenant.name} logo`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
                <p className="text-gray-600">Wine Collection Management</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
              id="import-file"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-file')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Wine
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Wine</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Wine Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter wine name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                        placeholder="2020"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bottles">Bottles</Label>
                      <Input
                        id="bottles"
                        type="number"
                        value={formData.bottles}
                        onChange={(e) => setFormData(prev => ({ ...prev, bottles: e.target.value }))}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Cellar location"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="https://example.com/wine-image.jpg"
                    />
                  </div>

                  <div>
                    <Label>Ratings</Label>
                    <div className="grid grid-cols-4 gap-4 mt-2">
                      <div>
                        <Label htmlFor="vn" className="text-sm">VN</Label>
                        <Input
                          id="vn"
                          type="number"
                          step="0.1"
                          value={formData.vn}
                          onChange={(e) => setFormData(prev => ({ ...prev, vn: e.target.value }))}
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="jd" className="text-sm">JD</Label>
                        <Input
                          id="jd"
                          type="number"
                          step="0.1"
                          value={formData.jd}
                          onChange={(e) => setFormData(prev => ({ ...prev, jd: e.target.value }))}
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ws" className="text-sm">WS</Label>
                        <Input
                          id="ws"
                          type="number"
                          step="0.1"
                          value={formData.ws}
                          onChange={(e) => setFormData(prev => ({ ...prev, ws: e.target.value }))}
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="abv" className="text-sm">ABV</Label>
                        <Input
                          id="abv"
                          type="number"
                          step="0.1"
                          value={formData.abv}
                          onChange={(e) => setFormData(prev => ({ ...prev, abv: e.target.value }))}
                          placeholder="0.0"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="buyAgainLink">Buy Again Link</Label>
                    <Input
                      id="buyAgainLink"
                      value={formData.buyAgainLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, buyAgainLink: e.target.value }))}
                      placeholder="https://example.com/buy"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="qrCode">QR Code</Label>
                      <Input
                        id="qrCode"
                        value={formData.qrCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, qrCode: e.target.value }))}
                        placeholder="QR code data"
                      />
                    </div>
                    <div>
                      <Label htmlFor="qrLink">QR Link</Label>
                      <Input
                        id="qrLink"
                        value={formData.qrLink}
                        onChange={(e) => setFormData(prev => ({ ...prev, qrLink: e.target.value }))}
                        placeholder="https://example.com/qr"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Wine description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="foodPairing">Food Pairing (comma-separated)</Label>
                    <Input
                      id="foodPairing"
                      value={formData.foodPairing}
                      onChange={(e) => setFormData(prev => ({ ...prev, foodPairing: e.target.value }))}
                      placeholder="beef, cheese, chocolate"
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
                    <Button type="submit" disabled={createWineMutation.isPending}>
                      {createWineMutation.isPending ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Wines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wines.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bottles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {wines.reduce((sum: number, wine: WineData) => sum + wine.bottles, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {wines.length > 0
                  ? (wines.reduce((sum: number, wine: WineData) => 
                      sum + (wine.ratings.vn + wine.ratings.jd + wine.ratings.ws) / 3, 0) / wines.length).toFixed(1)
                  : '0.0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wines Table */}
        {wines.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No wines yet</h3>
              <p className="text-gray-600 mb-6">Add your first wine to get started</p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Wine
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Wine Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Image</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Year</th>
                      <th className="text-left p-2">Bottles</th>
                      <th className="text-left p-2">VN/JD/WS</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wines.map((wine: WineData) => (
                      <tr key={wine.id} className="border-b">
                        <td className="p-2">
                          {wine.image ? (
                            <img
                              src={wine.image}
                              alt={wine.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-500">No img</span>
                            </div>
                          )}
                        </td>
                        <td className="p-2 font-medium">{wine.name}</td>
                        <td className="p-2">{wine.year || '-'}</td>
                        <td className="p-2">{wine.bottles}</td>
                        <td className="p-2">
                          {wine.ratings.vn}/{wine.ratings.jd}/{wine.ratings.ws}
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(wine)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(wine)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Wine</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Same form fields as create dialog */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Wine Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter wine name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-year">Year</Label>
                  <Input
                    id="edit-year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="2020"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-bottles">Bottles</Label>
                  <Input
                    id="edit-bottles"
                    type="number"
                    value={formData.bottles}
                    onChange={(e) => setFormData(prev => ({ ...prev, bottles: e.target.value }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Cellar location"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-image">Image URL</Label>
                <Input
                  id="edit-image"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/wine-image.jpg"
                />
              </div>

              <div>
                <Label>Ratings</Label>
                <div className="grid grid-cols-4 gap-4 mt-2">
                  <div>
                    <Label htmlFor="edit-vn" className="text-sm">VN</Label>
                    <Input
                      id="edit-vn"
                      type="number"
                      step="0.1"
                      value={formData.vn}
                      onChange={(e) => setFormData(prev => ({ ...prev, vn: e.target.value }))}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-jd" className="text-sm">JD</Label>
                    <Input
                      id="edit-jd"
                      type="number"
                      step="0.1"
                      value={formData.jd}
                      onChange={(e) => setFormData(prev => ({ ...prev, jd: e.target.value }))}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-ws" className="text-sm">WS</Label>
                    <Input
                      id="edit-ws"
                      type="number"
                      step="0.1"
                      value={formData.ws}
                      onChange={(e) => setFormData(prev => ({ ...prev, ws: e.target.value }))}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-abv" className="text-sm">ABV</Label>
                    <Input
                      id="edit-abv"
                      type="number"
                      step="0.1"
                      value={formData.abv}
                      onChange={(e) => setFormData(prev => ({ ...prev, abv: e.target.value }))}
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-buyAgainLink">Buy Again Link</Label>
                <Input
                  id="edit-buyAgainLink"
                  value={formData.buyAgainLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyAgainLink: e.target.value }))}
                  placeholder="https://example.com/buy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-qrCode">QR Code</Label>
                  <Input
                    id="edit-qrCode"
                    value={formData.qrCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, qrCode: e.target.value }))}
                    placeholder="QR code data"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-qrLink">QR Link</Label>
                  <Input
                    id="edit-qrLink"
                    value={formData.qrLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, qrLink: e.target.value }))}
                    placeholder="https://example.com/qr"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Wine description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-foodPairing">Food Pairing (comma-separated)</Label>
                <Input
                  id="edit-foodPairing"
                  value={formData.foodPairing}
                  onChange={(e) => setFormData(prev => ({ ...prev, foodPairing: e.target.value }))}
                  placeholder="beef, cheese, chocolate"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedWine(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateWineMutation.isPending}>
                  {updateWineMutation.isPending ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Wine</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedWine?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedWine(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedWine && deleteWineMutation.mutate(selectedWine.id)}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteWineMutation.isPending}
              >
                {deleteWineMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default TenantAdminCRM;