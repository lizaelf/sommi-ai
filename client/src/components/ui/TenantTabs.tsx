import React from "react";

interface Tab {
  key: string;
  label: string;
}

interface TenantTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

const TenantTabs: React.FC<TenantTabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide mb-6">
      <div className="relative inline-flex rounded-full p-1 min-w-max" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.10)' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`react-button min-w-max px-8 py-2 rounded-full font-medium transition-all duration-200
              ${activeTab === tab.key
                ? 'segmented-picker-active'
                : 'bg-transparent text-white hover:bg-white/10'}
            `}
            style={{
              transition: 'background 0.25s, color 0.25s',
              margin: 2,
            }}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TenantTabs; 