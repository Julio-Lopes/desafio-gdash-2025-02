import { Alert, AlertDescription } from '../ui/alert';
import type { WeatherAlert } from '../../types/weather.types';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

interface AlertCardProps {
  alert: WeatherAlert;
}

export default function AlertCard({ alert }: AlertCardProps) {
  const getAlertStyles = () => {
    switch (alert.type) {
      case 'success':
        return {
          className: 'border-green-500 bg-green-50 text-green-900',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        };
      case 'info':
        return {
          className: 'border-blue-500 bg-blue-50 text-blue-900',
          icon: <Info className="h-5 w-5 text-blue-600" />,
        };
      case 'warning':
        return {
          className: 'border-yellow-500 bg-yellow-50 text-yellow-900',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        };
      case 'danger':
        return {
          className: 'border-red-500 bg-red-50 text-red-900',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
        };
      default:
        return {
          className: 'border-gray-500 bg-gray-50 text-gray-900',
          icon: <Info className="h-5 w-5 text-gray-600" />,
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <Alert className={`${styles.className} border-2`}>
      <AlertDescription className="flex items-start space-x-3">
        <div className="mt-0.5">{styles.icon}</div>
        <div className="flex-1">
          <p className="font-semibold text-sm mb-1">{alert.title}</p>
          <p className="text-sm">{alert.message}</p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
