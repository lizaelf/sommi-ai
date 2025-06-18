import React, { useState, useEffect, useRef } from "react";
import { Plus, Save, X, Menu, Search, User, Settings } from "lucide-react";
import { Link } from "wouter";
import AppHeader from "@/components/pages/shared/AppHeader";
import { IconButton } from "@/components/pages/ui/IconButton";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
  wineCount: number;
}

const SommTenantAdmin: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  const menuDropdownRef = useRef<HTMLDivElement>(null);

  // Load tenants from localStorage
  useEffect(() => {
    // Force refresh to ensure only "Test winery" exists
    const singleTestWinery: Tenant[] = [
      {
        id: 1,
        name: "Test winery",
        slug: "test-winery",
        description:
          "Premium Napa Valley wine collection specializing in Cabernet Sauvignon",
        status: "active",
        createdAt: "2024-01-15",
        wineCount: 12,
      },
    ];
    setTenants(singleTestWinery);
    localStorage.setItem("sommelier-tenants", JSON.stringify(singleTestWinery));
    
    // Legacy code for fallback (not needed now)
    const storedTenants = localStorage.getItem("sommelier-tenants");
    if (false && storedTenants) {
      setTenants(JSON.parse(storedTenants || "[]"));
    } else {
      // Initialize with single test winery
      const sampleTenants: Tenant[] = [
        {
          id: 1,
          name: "Test winery",
          slug: "test-winery",
          description:
            "Premium Napa Valley wine collection specializing in Cabernet Sauvignon",
          status: "active",
          createdAt: "2024-01-15",
          wineCount: 12,
        },
      ];
      setTenants(sampleTenants);
      localStorage.setItem("sommelier-tenants", JSON.stringify(sampleTenants));
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuDropdownRef.current &&
        !menuDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMenuDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle global search
  const handleGlobalSearch = () => {
    console.log("Opening global search...");
    setShowMenuDropdown(false);
    // Add global search functionality here
  };

  // Handle profile management
  const handleProfileManagement = () => {
    console.log("Opening profile management...");
    setShowMenuDropdown(false);
    // Add profile management functionality here
  };

  return (
    <div className="min-h-screen mobile-fullscreen" style={{ backgroundColor: "#3a3a3a" }}>
      <AppHeader 
        title="Somm tenant admin"
        rightContent={
          <IconButton
            icon={Plus}
            onClick={() => (window.location.href = "/tenant-create")}
            variant="headerIcon"
            size="md"
            title="Create new tenant"
          />
        }
      />
      <div
        style={{
          paddingTop: "75px",
          paddingLeft: "24px",
          paddingRight: "24px",
        }}
      >
        {/* Tenants Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {tenants.map((tenant) => (
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
                      color: "white",
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
        {tenants.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No tenants available.</div>
            <IconButton
              icon={Plus}
              onClick={() => (window.location.href = "/tenant-create")}
              variant="primary"
              size="lg"
              className="px-4 py-2"
            >
              Create Your First Tenant
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default SommTenantAdmin;
