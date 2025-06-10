import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/UseToast';
import { Loader2, Zap, Database, AudioLines } from 'lucide-react';

interface WineDescription {
  id: number;
  name: string;
  description: string;
  cached: boolean;
  audioPregenerated: boolean;
  cacheTimestamp?: string;
}

export function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedWine, setSelectedWine] = useState<WineDescription | null>(null);
  const [newDescription, setNewDescription] = useState('');

  // Fetch all wines with their cache status
  const { data: wines, isLoading } = useQuery({
    queryKey: ['/api/admin/wines'],
    queryFn: async () => {
      const response = await fetch('/api/admin/wines');
      if (!response.ok) throw new Error('Failed to fetch wines');
      return response.json();
    }
  });

  // Pre-generate descriptions for all wines
  const pregenerateDescriptions = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/pregenerate-descriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to pregenerate descriptions');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Wine descriptions pre-generated and cached",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/wines'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Pre-generate audio for all cached descriptions
  const pregenerateAudio = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/pregenerate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to pregenerate audio');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Audio files pre-generated for all descriptions",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/wines'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update wine description
  const updateDescription = useMutation({
    mutationFn: async ({ wineId, description }: { wineId: number; description: string }) => {
      const response = await fetch(`/api/admin/wines/${wineId}/description`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      if (!response.ok) throw new Error('Failed to update description');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Wine description updated and cached",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/wines'] });
      setSelectedWine(null);
      setNewDescription('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleUpdateDescription = () => {
    if (selectedWine && newDescription.trim()) {
      updateDescription.mutate({ 
        wineId: selectedWine.id, 
        description: newDescription.trim() 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto p-6 space-y-6" style={{ maxWidth: "1200px" }}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Wine Management Admin</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => pregenerateDescriptions.mutate()}
            disabled={pregenerateDescriptions.isPending}
            className="flex items-center gap-2"
          >
            {pregenerateDescriptions.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Pre-generate Descriptions
          </Button>
          <Button
            onClick={() => pregenerateAudio.mutate()}
            disabled={pregenerateAudio.isPending}
            className="flex items-center gap-2"
          >
            {pregenerateAudio.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AudioLines className="h-4 w-4" />
            )}
            Pre-generate Audio
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wine List */}
        <Card>
          <CardHeader>
            <CardTitle>Wine Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wines?.map((wine: WineDescription) => (
                <div
                  key={wine.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedWine?.id === wine.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => {
                    setSelectedWine(wine);
                    setNewDescription(wine.description || '');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{wine.name}</h3>
                    <div className="flex gap-2">
                      {wine.cached && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          Cached
                        </Badge>
                      )}
                      {wine.audioPregenerated && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <AudioLines className="h-3 w-3" />
                          Audio Ready
                        </Badge>
                      )}
                    </div>
                  </div>
                  {wine.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {wine.description.substring(0, 100)}...
                    </p>
                  )}
                  {wine.cacheTimestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cached: {new Date(wine.cacheTimestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Description Editor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedWine ? `Edit ${selectedWine.name}` : 'Select a wine to edit'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedWine ? (
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter wine description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={10}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateDescription}
                    disabled={updateDescription.isPending || !newDescription.trim()}
                    className="flex items-center gap-2"
                  >
                    {updateDescription.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Update & Cache
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedWine(null);
                      setNewDescription('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Select a wine from the list to edit its description and manage caching.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {wines?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Wines</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {wines?.filter((w: WineDescription) => w.cached).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Cached Descriptions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {wines?.filter((w: WineDescription) => w.audioPregenerated).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Pre-generated Audio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {Math.round(((wines?.filter((w: WineDescription) => w.cached).length || 0) / (wines?.length || 1)) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Cache Coverage</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}