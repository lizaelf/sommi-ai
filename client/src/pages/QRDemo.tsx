import React, { useState } from 'react';
import QRScanModal from '../components/QRScanModal';
import Button from '../components/ui/Button';
import VoiceAssistant from '../components/VoiceAssistant';

export default function QRDemo() {
  const [showQRModal, setShowQRModal] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTextChoice = () => {
    console.log("User chose Text option");
    setShowQRModal(false);
    // Navigate to text-based wine details
  };

  const handleVoiceChoice = () => {
    console.log("User chose Voice option");
    setShowQRModal(false);
    setShowVoiceAssistant(true);
  };

  const handleSendMessage = async (message: string) => {
    console.log("QR Demo: Message sent:", message);
    setIsProcessing(true);
    
    try {
      // Send message to chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversationId: null, // QR demo doesn't need conversation persistence
          wineData: {
            id: 1,
            name: "Ridge Lytton Springs Dry Creek Zinfandel",
            year: 2021,
            image: "/wine-1-ridge-lytton-springs-dry-creek-zinfandel-1749209989253.png"
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store the assistant's response for unmute button
        (window as any).lastAssistantMessageText = data.content;
        console.log("QR Demo: Assistant response stored for unmute:", data.content?.substring(0, 50) + "...");
      }
    } catch (error) {
      console.error("QR Demo: Chat API error:", error);
      // Store fallback message
      (window as any).lastAssistantMessageText = "I'd be happy to tell you about this wine. This is a premium Zinfandel with rich, complex flavors.";
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-center">QR Scan Demo</h1>
        
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-4">
            This demonstrates what happens after scanning a wine QR code.
          </p>
          
          <Button
            onClick={() => setShowQRModal(true)}
            variant="primary"
            className="px-8 py-3"
          >
            Simulate QR Scan
          </Button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">How it works:</h2>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. User scans QR code on wine bottle</li>
            <li>2. Modal appears with Text/Voice choice</li>
            <li>3. Text: Opens wine details page</li>
            <li>4. Voice: Activates AI sommelier with speech</li>
          </ol>
        </div>
      </div>

      {/* QR Scan Modal */}
      <QRScanModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        onTextChoice={handleTextChoice}
        onVoiceChoice={handleVoiceChoice}
      />

      {/* Voice Assistant */}
      {showVoiceAssistant && (
        <VoiceAssistant
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}