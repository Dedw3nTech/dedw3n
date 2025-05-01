import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Code, FileUp, CheckCircle } from 'lucide-react';

interface ApiResponse {
  status: number;
  data: any;
  time: number;
}

export function ApiTesterSimple() {
  const { toast } = useToast();
  const [apiDocs, setApiDocs] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState('{"imageType": "product"}');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch API documentation on mount
  useEffect(() => {
    fetch('/api/image')
      .then(res => res.json())
      .then(data => {
        setApiDocs(data);
        console.log('API docs loaded:', data);
      })
      .catch(err => {
        console.error('Failed to load API docs:', err);
        toast({
          title: 'Failed to load API documentation',
          description: 'Could not fetch API endpoints information',
          variant: 'destructive'
        });
      });
  }, [toast]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImagePreview(e.target.result as string);
            
            // Update the payload with image data
            try {
              const payloadObj = JSON.parse(payload);
              payloadObj.imageData = e.target.result;
              setPayload(JSON.stringify(payloadObj, null, 2));
            } catch (err) {
              setPayload(JSON.stringify({
                imageData: e.target.result,
                imageType: "product"
              }, null, 2));
            }
          }
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
        toast({
          title: 'Not an image file',
          description: 'Please select an image file',
          variant: 'destructive'
        });
      }
    }
  };

  // Send the API request
  const sendRequest = async () => {
    try {
      setLoading(true);
      let payloadObj;
      
      try {
        payloadObj = payload ? JSON.parse(payload) : undefined;
      } catch (err) {
        toast({
          title: 'Invalid JSON',
          description: 'Please check your payload format',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }
      
      const startTime = performance.now();
      const response = await fetch('/api/image/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadObj)
      });
      const endTime = performance.now();
      
      const data = await response.json();
      
      setResponse({
        status: response.status,
        data,
        time: endTime - startTime
      });
      
      if (response.ok) {
        toast({
          title: 'Upload Successful',
          description: `Status: ${response.status}`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Upload Failed',
          description: `Status: ${response.status}`,
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('API request failed:', err);
      toast({
        title: 'Request Error',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" /> JSON Image Upload API
        </CardTitle>
        <CardDescription>
          Upload images through pure JSON API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="docs">Documentation</TabsTrigger>
            <TabsTrigger value="upload">Image Upload</TabsTrigger>
          </TabsList>
          
          {/* API Documentation Tab */}
          <TabsContent value="docs" className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <h3 className="text-lg font-semibold mb-2">Available Image API Endpoints</h3>
              {apiDocs ? (
                <div className="space-y-3">
                  {apiDocs.endpoints.map((endpoint: any, i: number) => (
                    <div key={i} className="bg-card rounded-md p-3 border">
                      <div className="flex items-center gap-2">
                        <Badge variant={endpoint.method === 'GET' ? 'outline' : 'default'}>
                          {endpoint.method}
                        </Badge>
                        <span className="font-mono text-sm">{endpoint.path}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{endpoint.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Image Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col items-center text-center">
                  <h3 className="text-lg font-semibold">Select an image to upload</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload images using JSON API
                  </p>
                </div>
                
                <label className="cursor-pointer">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />
                  <div className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center gap-2">
                    <FileUp className="h-4 w-4" />
                    Choose Image
                  </div>
                </label>
                
                {imagePreview && (
                  <div className="mt-4 border rounded-md overflow-hidden w-full max-w-xs">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="payload">JSON Payload</Label>
                <Textarea
                  id="payload"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  className="font-mono text-xs h-[120px]"
                />
              </div>
              
              <Button 
                onClick={sendRequest} 
                disabled={loading || !selectedFile}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4 mr-2" />
                    Upload Image
                  </>
                )}
              </Button>
            </div>
            
            {response && (
              <div className="rounded-md border">
                <div className="bg-muted p-3 flex items-center justify-between">
                  <Badge variant={response.status < 400 ? "default" : "destructive"}>
                    Status: {response.status}
                  </Badge>
                </div>
                <div className="p-3 bg-muted/40 relative">
                  <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-60">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
                
                {response.data.success && response.data.imageUrl && (
                  <div className="p-3 border-t">
                    <h4 className="text-sm font-semibold flex items-center gap-1 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Upload Successful
                    </h4>
                    <div className="flex items-start gap-3">
                      <img 
                        src={response.data.imageUrl}
                        alt="Uploaded"
                        className="w-16 h-16 object-cover border rounded"
                      />
                      <p className="font-mono text-muted-foreground break-all text-xs">
                        {response.data.imageUrl}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4 text-xs text-muted-foreground">
        <div>
          API Version: {apiDocs?.version || 'Loading...'}
        </div>
        <div>
          Endpoints: {apiDocs?.endpoints?.length || 0} available
        </div>
      </CardFooter>
    </Card>
  );
}