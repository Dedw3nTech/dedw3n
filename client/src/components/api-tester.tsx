import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ImageUploader } from './ui/image-uploader';
import { Check, Clock, AlertCircle } from 'lucide-react';

export function ApiTester() {
  const [endpoint, setEndpoint] = useState('/api/image/test');
  const [method, setMethod] = useState('POST');
  const [requestBody, setRequestBody] = useState('{}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  
  const handleApiCall = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      let body: any | undefined = undefined;
      try {
        body = JSON.parse(requestBody);
      } catch (e) {
        setError('Invalid JSON in request body');
        return;
      }
      
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (method !== 'GET' && body) {
        options.body = JSON.stringify(body);
      }
      
      const res = await fetch(endpoint, options);
      let data;
      
      try {
        data = await res.json();
      } catch (e) {
        data = { message: 'No JSON response body' };
      }
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data
      });
      
      // Auto update image URL if it's an image upload response
      if (data.success && data.imageUrl) {
        setUploadedImageUrl(data.imageUrl);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    setResponse({
      status: 200,
      statusText: 'OK',
      data: {
        success: true,
        imageUrl,
        message: 'Image uploaded successfully using the component'
      }
    });
  };
  
  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Tester</CardTitle>
          <CardDescription>Test API endpoints directly</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual API Call</TabsTrigger>
              <TabsTrigger value="image">Image Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <Input
                      placeholder="API Endpoint"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Textarea
                    placeholder="Request body (JSON)"
                    className="min-h-[100px] font-mono text-sm"
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                  />
                </div>
                
                <Button onClick={handleApiCall} disabled={loading}>
                  {loading ? 'Sending Request...' : 'Send Request'}
                </Button>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-500 text-sm">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span>Error: {error}</span>
                    </div>
                  </div>
                )}
                
                {response && (
                  <div className="border rounded-md p-4">
                    <div className="flex items-center mb-2">
                      <div className={`h-3 w-3 rounded-full mr-2 ${
                        response.status >= 200 && response.status < 300 
                          ? 'bg-green-500' 
                          : response.status >= 400 ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className="font-semibold">
                        Status: {response.status} {response.statusText}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3 overflow-auto max-h-[300px]">
                      <pre className="text-sm">{JSON.stringify(response.data, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="image">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <ImageUploader onImageUploaded={handleImageUploaded} />
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Image Preview</CardTitle>
                      <CardDescription>Uploaded image will appear here</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {uploadedImageUrl ? (
                        <div className="border rounded-md overflow-hidden">
                          <img 
                            src={uploadedImageUrl} 
                            alt="Uploaded"
                            className="w-full object-contain"
                            style={{ maxHeight: '300px' }}
                          />
                        </div>
                      ) : (
                        <div className="border border-dashed rounded-md p-12 text-center">
                          <p className="text-gray-500">No image uploaded yet</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      {uploadedImageUrl && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          Image successfully uploaded
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                  
                  {response && (
                    <div className="border rounded-md p-4">
                      <div className="flex items-center mb-2">
                        <span className="font-semibold">Response Data</span>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 overflow-auto max-h-[300px]">
                        <pre className="text-sm">{JSON.stringify(response.data, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}