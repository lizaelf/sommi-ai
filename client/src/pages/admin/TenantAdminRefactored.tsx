import React, { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useToast } from "@/hooks/UseToast";
import AppHeader, { HeaderSpacer } from "@/components/AppHeader";
import { DataSyncManager, type UnifiedWineData } from "@/utils/dataSync";

// Refactored components
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TabNavigation } from "@/components/admin/TabNavigation";
import { WineManagement } from "@/components/admin/WineManagement";

// Use unified wine data interface
type WineCardData = UnifiedWineData;

interface TenantData {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  aiTone?: string;
  profile: {
    wineryName: string;
    wineryDescription: string;
    yearEstablished: string;
    wineryLogo: string;
    contactEmail: string;
    contactPhone: string;
    websiteURL: string;
    address: string;
    hoursOfOperation: string;
    socialMediaLinks: string;
  };
  cms: {
    wineEntries: Array<{
      wineName: string;
      vintageYear: string;
      sku: string;
      varietal: string;
      tastingNotes: string;
      foodPairings: string;
      productionNotes: string;
      imageUpload: string;
      criticReviews: string;
      releaseDate: string;
      price: string;
      inventoryCount: string;
    }>;
    wineClub: {
      clubName: string;
      description: string;
      membershipTiers: string;
      pricing: string;
      clubBenefits: string;
    };
  };
  aiModel: {
    knowledgeScope: "winery-only" | "winery-plus-global";
    personalityStyle:
      | "educator"
      | "sommelier"
      | "tasting-room-host"
      | "luxury-concierge"
      | "casual-friendly";
    brandGuide: string;
    tonePreferences: string;
    knowledgeDocuments: string;
  };
}

const TenantAdminRefactored: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "cms" | "ai-model">(() => {
    // Restore tab from localStorage if available
    const savedTab = localStorage.getItem('tenantAdminActiveTab');
    return (savedTab as "profile" | "cms" | "ai-model") || "profile";
  });
  const { toast } = useToast();
  const params = useParams();
  
  // Get tenant information
  const [currentTenant, setCurrentTenant] = useState<{name: string, slug: string} | null>(null);
  
  // Wine management state
  const [isEditMode, setIsEditMode] = useState(false);
  const [wineCards, setWineCards] = useState<WineCardData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [showDataSync, setShowDataSync] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<TenantData>({
    id: 1,
    name: "Sample Winery",
    slug: "sample-winery",
    profile: {
      wineryName: "",
      wineryDescription: "",
      yearEstablished: "",
      wineryLogo: "",
      contactEmail: "",
      contactPhone: "",
      websiteURL: "",
      address: "",
      hoursOfOperation: "",
      socialMediaLinks: "",
    },
    cms: {
      wineEntries: [],
      wineClub: {
        clubName: "",
        description: "",
        membershipTiers: "",
        pricing: "",
        clubBenefits: "",
      },
    },
    aiModel: {
      knowledgeScope: "winery-only",
      personalityStyle: "sommelier",
      brandGuide: "",
      tonePreferences: "",
      knowledgeDocuments: "",
    },
  });

  useEffect(() => {
    // Extract tenant from URL or get stored tenants
    const storedTenants = localStorage.getItem('sommelier-tenants');
    if (storedTenants && params.tenantSlug) {
      const tenants = JSON.parse(storedTenants);
      const tenant = tenants.find((t: any) => t.slug === params.tenantSlug);
      if (tenant) {
        setCurrentTenant({ name: tenant.name, slug: tenant.slug });
      }
    }
  }, [params.tenantSlug]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tenantAdminActiveTab', activeTab);
  }, [activeTab]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load wine data
  useEffect(() => {
    const loadWineData = async () => {
      try {
        await DataSyncManager.initialize();
        const allWines = DataSyncManager.getUnifiedWineData();
        setWineCards(allWines);
      } catch (error) {
        console.error("Error loading wine data:", error);
        toast({
          title: "Error",
          description: "Failed to load wine data",
          variant: "destructive",
        });
      }
    };

    loadWineData();
  }, [toast]);

  // Handle logout
  const handleLogout = () => {
    // Clear any stored user data
    localStorage.removeItem('userToken');
    localStorage.removeItem('tenantAdminActiveTab');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    // Navigate to login page or home
    window.location.href = '/';
  };

  // Handle edit profile
  const handleEditProfile = () => {
    setActiveTab('profile');
    setShowUserDropdown(false);
  };

  // Wine management handlers
  const handleToggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const handleToggleDataSync = () => {
    setShowDataSync(!showDataSync);
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(wineCards, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wine-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div style={{ padding: "20px" }}>
            <h2>Profile Settings</h2>
            <p>Configure your winery profile information here.</p>
          </div>
        );
      case "cms":
        return (
          <WineManagement
            wineCards={wineCards}
            searchTerm={searchTerm}
            showSearch={showSearch}
            showDataSync={showDataSync}
            isEditMode={isEditMode}
            onSearchChange={setSearchTerm}
            onToggleSearch={handleToggleSearch}
            onToggleDataSync={handleToggleDataSync}
            onToggleEditMode={handleToggleEditMode}
            onImportData={handleImportData}
            onExportData={handleExportData}
            fileInputRef={fileInputRef}
          />
        );
      case "ai-model":
        return (
          <div style={{ padding: "20px" }}>
            <h2>AI Model Configuration</h2>
            <p>Configure your AI sommelier settings here.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white mx-auto" style={{ maxWidth: "1200px" }}>
      <AdminHeader
        currentTenant={currentTenant}
        showUserDropdown={showUserDropdown}
        onToggleDropdown={() => setShowUserDropdown(!showUserDropdown)}
        onEditProfile={handleEditProfile}
        onLogout={handleLogout}
        dropdownRef={dropdownRef}
      />
      <HeaderSpacer />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {renderTabContent()}
    </div>
  );
};

export default TenantAdminRefactored;