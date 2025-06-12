import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { AppHeader } from "@/components/AppHeader";

const QRCodes: React.FC = () => {
  // The deployed domain will be automatically provided by Replit Deployments
  const deployedDomain = "your-app.replit.app"; // This will be replaced with actual domain after deployment

  const pages = [
    {
      title: "Main Wine Page",
      description: "QR scan landing with voice/text interaction",
      path: "/",
      url: `https://${deployedDomain}/`
    },
    {
      title: "Wine Cellar",
      description: "Browse wine collection and manage cellar",
      path: "/cellar", 
      url: `https://${deployedDomain}/cellar`
    },
    {
      title: "Scanned Wine",
      description: "Direct access to scanned wine interaction",
      path: "/scanned",
      url: `https://${deployedDomain}/scanned`
    },
    {
      title: "Specific Wine (Ridge Zinfandel)",
      description: "Direct link to Ridge wine details",
      path: "/wine-details/1",
      url: `https://${deployedDomain}/wine-details/1`
    },
    {
      title: "Global Home",
      description: "Global home page view",
      path: "/home-global",
      url: `https://${deployedDomain}/home-global`
    },
    {
      title: "Wine Conversation",
      description: "Chat interface for wine discussions",
      path: "/wine/conversation",
      url: `https://${deployedDomain}/wine/conversation`
    }
  ];

  return (
    <div className="min-h-screen" style={{ 
      background: "linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 100%)" 
    }}>
      <AppHeader 
        title="QR Codes for Deployment"
        showBackButton={true}
        onBack={() => window.history.back()}
      />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Deployment QR Codes
            </h1>
            <p className="text-gray-300 text-lg">
              QR codes for the main pages of your wine application
            </p>
            <p className="text-gray-400 text-sm mt-2">
              After deployment, update the domain in the code to generate working QR codes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page, index) => (
              <div 
                key={index}
                className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center"
              >
                <h3 className="text-xl font-semibold text-white mb-2">
                  {page.title}
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  {page.description}
                </p>
                
                <div className="bg-white p-4 rounded-lg mb-4 inline-block">
                  <QRCodeSVG 
                    value={page.url}
                    size={150}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                
                <div className="text-xs text-gray-400 break-all">
                  <p className="font-mono mb-1">{page.path}</p>
                  <p className="text-gray-500">{page.url}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Deployment Instructions
            </h2>
            <div className="text-gray-300 space-y-2">
              <p>1. Deploy your application using Replit Deployments</p>
              <p>2. Note the deployed domain (will be *.replit.app)</p>
              <p>3. Update the `deployedDomain` variable in this component</p>
              <p>4. The QR codes will automatically point to your live application</p>
            </div>
          </div>

          <div className="mt-8 bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              QR Code Usage
            </h2>
            <div className="text-gray-300 space-y-2">
              <p><strong>Main Wine Page:</strong> Primary QR for wine bottles - triggers QR scan modal</p>
              <p><strong>Wine Cellar:</strong> Direct access to user's wine collection</p>
              <p><strong>Scanned Wine:</strong> Alternative entry point for scanned wines</p>
              <p><strong>Specific Wine:</strong> Direct link to a particular wine's details</p>
              <p><strong>Global Home:</strong> General landing page</p>
              <p><strong>Wine Conversation:</strong> Direct access to chat interface</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodes;