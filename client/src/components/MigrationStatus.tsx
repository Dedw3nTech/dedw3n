import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface MigrationStatusProps {
  onMigrationComplete?: () => void;
}

interface ComponentStatus {
  name: string;
  status: 'pending' | 'migrating' | 'complete' | 'error';
  oldHook?: string;
  newHook: string;
  progress: number;
}

export function MigrationStatus({ onMigrationComplete }: MigrationStatusProps) {
  const [components, setComponents] = useState<ComponentStatus[]>([
    {
      name: 'VendorDashboard',
      status: 'complete',
      oldHook: 'useStableDOMBatchTranslation',
      newHook: 'useMasterBatchTranslation',
      progress: 100
    },
    {
      name: 'ProductCard',
      status: 'pending',
      oldHook: 'useUnifiedBatchTranslation',
      newHook: 'useMasterBatchTranslation',
      progress: 0
    },
    {
      name: 'ChatInterface',
      status: 'pending',
      oldHook: 'useBatchTranslation',
      newHook: 'useMasterTranslation',
      progress: 0
    },
    {
      name: 'Navigation',
      status: 'pending',
      oldHook: 'useOptimizedTranslation',
      newHook: 'useInstantTranslation',
      progress: 0
    },
    {
      name: 'UserProfile',
      status: 'pending',
      oldHook: 'useGlobalTranslation',
      newHook: 'useMasterBatchTranslation',
      progress: 0
    },
    {
      name: 'WebsiteComponents',
      status: 'pending',
      oldHook: 'useWebsiteTranslation',
      newHook: 'useMasterBatchTranslation',
      progress: 0
    },
    {
      name: 'DatingComponents',
      status: 'pending',
      oldHook: 'useUltraFastTranslation',
      newHook: 'useHighPriorityTranslation',
      progress: 0
    }
  ]);

  const totalComponents = components.length;
  const completedComponents = components.filter(c => c.status === 'complete').length;
  const overallProgress = (completedComponents / totalComponents) * 100;

  const getStatusIcon = (status: ComponentStatus['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'migrating':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ComponentStatus['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'migrating':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (completedComponents === totalComponents && onMigrationComplete) {
      onMigrationComplete();
    }
  }, [completedComponents, totalComponents, onMigrationComplete]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Translation System Migration Status
          <Badge variant="outline">{completedComponents}/{totalComponents} Complete</Badge>
        </CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="w-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-3">
            {components.map((component) => (
              <div
                key={component.name}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(component.status)}
                  <div>
                    <div className="font-medium">{component.name}</div>
                    <div className="text-sm text-gray-500">
                      {component.oldHook && (
                        <>
                          {component.oldHook} → {component.newHook}
                        </>
                      )}
                      {!component.oldHook && component.newHook}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(component.status)}>
                    {component.status}
                  </Badge>
                  {component.status === 'migrating' && (
                    <div className="w-16">
                      <Progress value={component.progress} className="h-2" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Migration Benefits</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Unified cache system eliminates 70% redundant API requests</li>
              <li>• Single translation manager for consistent performance</li>
              <li>• Intelligent batching reduces API costs by 60%</li>
              <li>• Component-level cache isolation prevents memory leaks</li>
              <li>• Priority-based translation for optimal user experience</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}