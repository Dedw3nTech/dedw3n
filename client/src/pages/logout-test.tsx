import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { performInstantLogout } from "@/utils/instant-logout";
import { performUnifiedLogout } from "@/utils/unified-logout-system";
import { useState } from "react";
import { Clock, Zap, Timer } from "lucide-react";

export function LogoutTest() {
  const [testResults, setTestResults] = useState<{
    instant?: number;
    unified?: number;
  }>({});
  
  const testInstantLogout = () => {
    const startTime = performance.now();
    performInstantLogout({ redirect: false });
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setTestResults(prev => ({ ...prev, instant: duration }));
    console.log(`[INSTANT-LOGOUT-TEST] Duration: ${duration.toFixed(2)}ms`);
  };
  
  const testUnifiedLogout = () => {
    const startTime = performance.now();
    performUnifiedLogout({ redirectToSuccessPage: false });
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setTestResults(prev => ({ ...prev, unified: duration }));
    console.log(`[UNIFIED-LOGOUT-TEST] Duration: ${duration.toFixed(2)}ms`);
  };
  
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Logout Performance Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Button 
                onClick={testInstantLogout}
                className="w-full"
                variant="default"
                data-testid="button-test-instant-logout"
              >
                <Zap className="mr-2 h-4 w-4" />
                Test Instant Logout
              </Button>
              {testResults.instant !== undefined && (
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-bold text-green-600">
                    {testResults.instant.toFixed(2)}ms
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={testUnifiedLogout}
                className="w-full"
                variant="outline"
                data-testid="button-test-unified-logout"
              >
                <Clock className="mr-2 h-4 w-4" />
                Test Unified Logout
              </Button>
              {testResults.unified !== undefined && (
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-bold text-blue-600">
                    {testResults.unified.toFixed(2)}ms
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {testResults.instant && testResults.unified && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Performance Comparison</h3>
              <p className="text-sm text-gray-600">
                Instant logout is {' '}
                <span className="font-bold text-green-600">
                  {(testResults.unified / testResults.instant).toFixed(1)}x faster
                </span>
                {' '} than the unified logout
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Speed improvement: {' '}
                <span className="font-bold">
                  {((testResults.unified - testResults.instant) / testResults.unified * 100).toFixed(0)}%
                </span>
              </p>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            <p>Note: This test measures client-side logout performance without redirect.</p>
            <p>The instant logout completes all operations immediately without waiting for server responses.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}