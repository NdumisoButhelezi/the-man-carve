declare module 'react-qr-scanner' {
  import * as React from 'react';

  export interface QrScannerProps {
    delay?: number;
    onError?: (error: any) => void;
    onScan?: (data: string | null) => void;
    style?: React.CSSProperties;
    facingMode?: 'user' | 'environment';
    className?: string;
  }

  const QrScanner: React.FC<QrScannerProps>;

  export default QrScanner;
}
