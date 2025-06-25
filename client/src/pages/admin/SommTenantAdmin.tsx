import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import AppHeader, { HeaderSpacer } from "@/components/layout/AppHeader";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { Tenant } from "@/types/tenant";
import ActionDropdown from "@/components/admin/ActionDropdown";


const SommTenantAdmin: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  const menuDropdownRef = useRef<HTMLDivElement>(null);

  // Завантаження tenants з API
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch("/api/tenants");
        if (!res.ok) throw new Error("Failed to fetch tenants");
        const data = await res.json();
        setTenants(data);
      } catch (error) {
        setTenants([]);
        // Можна додати toast або індикатор помилки
        console.error("Error loading tenants:", error);
      }
    };
    fetchTenants();
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

  // Обработчик удаления tenant
  const handleDeleteTenant = async (tenantId: string) => {
    if (!window.confirm("Are you sure you want to delete this tenant?")) return;
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete tenant");
      setTenants((prev) => prev.filter((t) => String(t.id) !== String(tenantId)));
    } catch (error) {
      alert("Error deleting tenant");
      console.error(error);
    }
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
        <div style={{ display: "block", width: "100%" }}>
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="rounded-xl p-4 transition-colors cursor-pointer hover:bg-white/5"
              style={{
                border: "1px solid #494949",
                width: "100%",
              }}
            >
              <div className="flex items-center justify-between" style={{ gap: "16px" }}>
                <Link href={`/tenant-edit/${tenant.id}`} style={{ flexGrow: 1 }}>
                  <h3
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "20px",
                      lineHeight: "28px",
                      fontWeight: 500,
                      color: "white",
                      width: "100%",
                      margin: 0,
                      padding: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {tenant.profile?.wineryName || `Tenant ${tenant.id}`}
                  </h3>
                </Link>
                <ActionDropdown
                  actions={[
                    {
                      label: "Delete",
                      icon: <Trash2 size={16} />, 
                      onClick: () => handleDeleteTenant(tenant.id.toString()),
                      colorClass: "text-red-400",
                    },
                  ]}
                />
              </div>
            </div>
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
