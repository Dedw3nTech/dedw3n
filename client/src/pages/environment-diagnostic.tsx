import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EnvironmentData {
  environment?: {
    nodeEnv?: string;
    isProduction?: boolean;
    isDevelopment?: boolean;
    replitDomain?: string;
    customDomain?: string;
    serverHost?: string;
    requestOrigin?: string;
    corsEnabled?: boolean;
  };
  database?: {
    connected?: boolean;
    host?: string;
    database?: string;
    dataSnapshot?: {
      users?: number;
      products?: number;
      orders?: number;
    };
  };
  api?: {
    baseUrl?: string;
    endpoints?: Record<string, string>;
  };
  cors?: {
    allowedOrigins?: string[];
    credentialsEnabled?: boolean;
  };
}

interface DataCheckResult {
  database?: {
    url?: string;
    host?: string;
  };
  sampleData?: {
    recentUserIds?: number[];
    recentProductIds?: number[];
    totalSampled?: number;
  };
  consistency?: {
    status?: string;
    note?: string;
  };
}

export default function EnvironmentDiagnostic() {
  const { data: envData, isLoading: envLoading, refetch: refetchEnv } = useQuery<EnvironmentData>({
    queryKey: ['/api/diagnostic/environment'],
    retry: false,
  });

  const { data: dataCheck, isLoading: dataLoading, refetch: refetchData } = useQuery<DataCheckResult>({
    queryKey: ['/api/diagnostic/data-check'],
    retry: false,
  });

  const handleRefresh = () => {
    refetchEnv();
    refetchData();
  };

  const getStatusIcon = (status: string | boolean) => {
    if (status === 'active' || status === true) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (status === 'warning') {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Environment Diagnostic</h1>
          <p className="text-muted-foreground mt-2">
            Compare API endpoints and data sources across environments
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={envLoading || dataLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Environment Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
            <CardDescription>Current environment settings</CardDescription>
          </CardHeader>
          <CardContent>
            {envLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : envData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Environment:</span>
                  <span className="bg-primary/10 px-3 py-1 rounded-full text-sm">
                    {envData.environment?.nodeEnv || 'unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Server Host:</span>
                  <span className="text-sm text-muted-foreground">
                    {envData.environment?.serverHost || 'unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Request Origin:</span>
                  <span className="text-sm text-muted-foreground break-all">
                    {envData.environment?.requestOrigin || 'unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">CORS Enabled:</span>
                  {getStatusIcon(envData.environment?.corsEnabled)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-destructive">
                Failed to load environment data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Database Configuration</CardTitle>
            <CardDescription>Database connection status</CardDescription>
          </CardHeader>
          <CardContent>
            {envLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : envData?.database ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  {getStatusIcon(envData.database.connected)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Host:</span>
                  <span className="text-sm text-muted-foreground">
                    {envData.database.host}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Database:</span>
                  <span className="text-sm text-muted-foreground">
                    {envData.database.database}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-destructive">
                Failed to load database data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle>Data Snapshot</CardTitle>
            <CardDescription>Current database statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {envLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : envData?.database?.dataSnapshot ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Users:</span>
                  <span className="text-2xl font-bold">
                    {envData.database.dataSnapshot.users}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Products:</span>
                  <span className="text-2xl font-bold">
                    {envData.database.dataSnapshot.products}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Orders:</span>
                  <span className="text-2xl font-bold">
                    {envData.database.dataSnapshot.orders}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-destructive">
                Failed to load data snapshot
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Consistency Check */}
        <Card>
          <CardHeader>
            <CardTitle>Data Consistency</CardTitle>
            <CardDescription>Cross-environment verification</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : dataCheck ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  {getStatusIcon(dataCheck.consistency?.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">DB Host:</span>
                  <span className="text-sm text-muted-foreground">
                    {dataCheck.database?.host || 'unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Recent User IDs:</span>
                  <span className="text-sm text-muted-foreground">
                    {dataCheck.sampleData?.recentUserIds?.slice(0, 3).join(', ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Recent Product IDs:</span>
                  <span className="text-sm text-muted-foreground">
                    {dataCheck.sampleData?.recentProductIds?.slice(0, 3).join(', ')}
                  </span>
                </div>
                {dataCheck.consistency?.note && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-md">
                    <p className="text-sm">{dataCheck.consistency.note}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-destructive">
                Failed to load consistency check
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CORS Configuration */}
      {envData?.cors && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>CORS Configuration</CardTitle>
            <CardDescription>Allowed origins for cross-domain requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Credentials Enabled:</span>
                {getStatusIcon(envData.cors.credentialsEnabled)}
              </div>
              <div className="mt-4">
                <p className="font-medium mb-2">Allowed Origins:</p>
                <div className="space-y-1">
                  {envData.cors.allowedOrigins?.map((origin: string, index: number) => (
                    <div key={index} className="text-sm bg-secondary/50 px-3 py-2 rounded">
                      {origin}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Endpoints */}
      {envData?.api && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Available API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="mb-4">
                <p className="font-medium">Base URL:</p>
                <p className="text-sm bg-secondary/50 px-3 py-2 rounded mt-1">
                  {envData.api.baseUrl}
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Key Endpoints:</p>
                <div className="grid gap-2">
                  {Object.entries(envData.api.endpoints || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between bg-secondary/30 px-3 py-2 rounded">
                      <span className="text-sm font-medium capitalize">{key}:</span>
                      <code className="text-xs bg-secondary px-2 py-1 rounded">{value as string}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Instructions */}
      <Card className="mt-6 border-primary/50">
        <CardHeader>
          <CardTitle>Cross-Environment Configuration</CardTitle>
          <CardDescription>
            Ensure data consistency across development, staging, and production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">✅ Required Configuration:</h3>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li><strong>DATABASE_URL</strong>: Must be the same across all environments for data consistency</li>
                <li><strong>VITE_API_BASE_URL</strong>: Leave empty for development, set to production API URL for prod</li>
                <li><strong>ALLOWED_ORIGINS</strong>: Comma-separated list of allowed frontend domains</li>
                <li><strong>CUSTOM_DOMAINS</strong>: Your production domain(s) for CORS</li>
              </ol>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">🔍 How to Compare Environments:</h3>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Open this page in each environment (dev, staging, production)</li>
                <li>Compare the "DB Host" values - they should match for consistent data</li>
                <li>Verify "Recent User IDs" and "Recent Product IDs" match across environments</li>
                <li>Check CORS allowed origins include your deployment domains</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
