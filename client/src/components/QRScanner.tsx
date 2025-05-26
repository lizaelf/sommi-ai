import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera for QR scanning
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setScanning(true);
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Simple QR detection placeholder - in a real app you'd use a QR library like jsQR
  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        // This is a placeholder - you would use a QR code library here
        // For demo purposes, we'll simulate a successful scan after 3 seconds
        setTimeout(() => {
          onScan('https://example.com/wine/12345');
          handleClose();
        }, 3000);
      }
    }
  };

  if (!isOpen) return null;

  const scannerContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 10001
      }}>
        <h2 style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: '600',
          fontFamily: 'Inter, sans-serif',
          margin: 0
        }}>
          Scan QR Code
        </h2>
        <button
          onClick={handleClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      {/* Camera View */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {error ? (
          <div style={{
            color: 'white',
            textAlign: 'center',
            padding: '20px',
            fontFamily: 'Inter, sans-serif'
          }}>
            <p>{error}</p>
            <button
              onClick={startCamera}
              style={{
                backgroundColor: 'white',
                color: 'black',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            
            {/* QR Scanner Overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '250px',
              height: '250px',
              border: '2px solid white',
              borderRadius: '12px',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Corner brackets */}
              <div style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                width: '30px',
                height: '30px',
                borderTop: '4px solid #00ff00',
                borderLeft: '4px solid #00ff00',
                borderRadius: '4px 0 0 0'
              }} />
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '30px',
                height: '30px',
                borderTop: '4px solid #00ff00',
                borderRight: '4px solid #00ff00',
                borderRadius: '0 4px 0 0'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                left: '-2px',
                width: '30px',
                height: '30px',
                borderBottom: '4px solid #00ff00',
                borderLeft: '4px solid #00ff00',
                borderRadius: '0 0 0 4px'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '30px',
                height: '30px',
                borderBottom: '4px solid #00ff00',
                borderRight: '4px solid #00ff00',
                borderRadius: '0 0 4px 0'
              }} />
            </div>
          </>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '120px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 10001
      }}>
        <p style={{
          color: 'white',
          fontSize: '16px',
          textAlign: 'center',
          margin: '0 0 16px 0',
          fontFamily: 'Inter, sans-serif'
        }}>
          Point your camera at a QR code
        </p>
        {scanning && (
          <button
            onClick={captureFrame}
            style={{
              backgroundColor: 'white',
              color: 'black',
              border: 'none',
              borderRadius: '24px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Capture
          </button>
        )}
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );

  const portalElement = document.getElementById('portal-root') || document.body;
  return createPortal(scannerContent, portalElement);
}

export default QRScanner;