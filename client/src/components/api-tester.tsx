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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, Code, Clipboard, FileUp, CheckCircle, ImageIcon } from 'lucide-react';

interface ApiEndpoint {
  name: string;
  url: string;
  method: string;
  description: string;
  samplePayload?: string;
}

interface ApiResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  time: number;
}

export function ApiTester() {
  const { toast } = useToast();
  const [apiDocs, setApiDocs] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('/api/image');
  const [method, setMethod] = useState('GET');
  const [payload, setPayload] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<'direct' | 'chunked'>('direct');
  const [imageType, setImageType] = useState('product');

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
            
            // If direct upload selected, update the payload
            if (processingMode === 'direct') {
              setPayload(JSON.stringify({
                imageData: e.target.result,
                imageType
              }, null, 2));
            } else {
              // For chunked upload, we'll process this when sending
              setPayload(JSON.stringify({
                fileId: `file-${Date.now()}`,
                imageType,
                // Other data will be added when sending
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

  // Handle the mode selection
  const handleModeChange = (value: 'direct' | 'chunked') => {
    setProcessingMode(value);
    
    // Update the endpoint URL and payload sample based on the mode
    if (value === 'direct') {
      setUrl('/api/image/upload');
      setMethod('POST');
      if (imagePreview) {
        setPayload(JSON.stringify({
          imageData: imagePreview,
          imageType
        }, null, 2));
      } else {
        setPayload(JSON.stringify({
          imageData: 'data:image/png;base64,...',
          imageType
        }, null, 2));
      }
    } else {
      setUrl('/api/image/chunked-upload');
      setMethod('POST');
      setPayload(JSON.stringify({
        fileId: `file-${Date.now()}`,
        chunkIndex: 0,
        totalChunks: 1,
        chunk: 'base64data...',
        imageType
      }, null, 2));
    }
  };

  // Process chunked upload
  const processChunkedUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const fileId = `file-${Date.now()}`;
    const chunkSize = 500 * 1024; // 500KB chunks
    const fileSize = selectedFile.size;
    const totalChunks = Math.ceil(fileSize / chunkSize);
    let successfulChunks = 0;
    
    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, fileSize);
        const chunk = selectedFile.slice(start, end);
        
        // Convert chunk to base64
        const base64Chunk = await readFileChunkAsBase64(chunk);
        
        // Prepare payload
        const chunkPayload = {
          fileId,
          chunkIndex,
          totalChunks,
          chunk: base64Chunk,
          imageType
        };
        
        // Send chunk
        const startTime = performance.now();
        const response = await fetch('/api/image/chunked-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(chunkPayload)
        });
        const endTime = performance.now();
        
        const data = await response.json();
        
        // Update response state with the latest response
        setResponse({
          status: response.status,
          data,
          headers: Object.fromEntries(response.headers.entries()),
          time: endTime - startTime
        });
        
        if (!response.ok) {
          throw new Error(`Chunk ${chunkIndex} upload failed: ${data.message || 'Unknown error'}`);
        }
        
        successfulChunks++;
        
        // If this is not the final chunk, update progress notification
        if (chunkIndex < totalChunks - 1) {
          toast({
            title: `Uploading: ${Math.round((successfulChunks / totalChunks) * 100)}%`,
            description: `Chunk ${successfulChunks} of ${totalChunks} uploaded`,
          });
        }
      }
      
      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded all ${totalChunks} chunks`,
        variant: 'default'
      });
      
    } catch (error) {
      console.error('Chunked upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Convert file chunk to base64
  const readFileChunkAsBase64 = (chunk: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix if present
        const base64 = result.includes('base64,') 
          ? result.split('base64,')[1] 
          : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(chunk);
    });
  };

  // Send the API request
  const sendRequest = async () => {
    if (processingMode === 'chunked' && selectedFile) {
      return processChunkedUpload();
    }
    
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
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: method !== 'GET' ? JSON.stringify(payloadObj) : undefined
      });
      const endTime = performance.now();
      
      const data = await response.json();
      
      setResponse({
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries()),
        time: endTime - startTime
      });
      
      if (response.ok) {
        toast({
          title: 'Request Successful',
          description: `${method} ${url} - Status: ${response.status}`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Request Failed',
          description: `${method} ${url} - Status: ${response.status}`,
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to clipboard',
        variant: 'default'
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" /> API Tester
        </CardTitle>
        <CardDescription>
          Test the JSON-based image upload API endpoints
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="docs">Documentation</TabsTrigger>
            <TabsTrigger value="upload">Image Upload</TabsTrigger>
            <TabsTrigger value="advanced">Custom Request</TabsTrigger>
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
                      {endpoint.parameters && endpoint.parameters.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-sm font-semibold">Parameters:</h4>
                          <ul className="list-disc list-inside text-sm pl-2">
                            {endpoint.parameters.map((param: any, j: number) => (
                              <li key={j} className="text-muted-foreground">
                                <span className="font-mono">{param.name}</span>
                                {param.required && <span className="text-red-500">*</span>}
                                : {param.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Examples</h3>
                    
                    <div className="bg-card rounded-md p-3 border">
                      <h4 className="font-semibold">Single Image Upload</h4>
                      <div className="mt-2 bg-muted rounded-md p-2 relative">
                        <pre className="text-xs overflow-auto language-json">
                          {JSON.stringify(apiDocs.examples.singleUpload.request.body, null, 2)}
                        </pre>
                        <button 
                          className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted-foreground/10"
                          onClick={() => copyToClipboard(JSON.stringify(apiDocs.examples.singleUpload.request.body, null, 2))}
                        >
                          <Clipboard className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-card rounded-md p-3 border mt-2">
                      <h4 className="font-semibold">Chunked Upload</h4>
                      <p className="text-sm text-muted-foreground">{apiDocs.examples.chunkedUpload.note}</p>
                      <div className="mt-2 bg-muted rounded-md p-2 relative">
                        <pre className="text-xs overflow-auto language-json">
                          {JSON.stringify(apiDocs.examples.chunkedUpload.firstChunkRequest.body, null, 2)}
                        </pre>
                        <button 
                          className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted-foreground/10"
                          onClick={() => copyToClipboard(JSON.stringify(apiDocs.examples.chunkedUpload.firstChunkRequest.body, null, 2))}
                        >
                          <Clipboard className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="processing-mode">Processing Mode</Label>
                  <Select 
                    value={processingMode} 
                    onValueChange={(value) => handleModeChange(value as 'direct' | 'chunked')}
                  >
                    <SelectTrigger id="processing-mode">
                      <SelectValue placeholder="Select upload mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct Upload (Small Files)</SelectItem>
                      <SelectItem value="chunked">Chunked Upload (Large Files)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="image-type">Image Type</Label>
                  <Select 
                    value={imageType} 
                    onValueChange={setImageType}
                  >
                    <SelectTrigger id="image-type">
                      <SelectValue placeholder="Select image type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="profile">Profile</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col items-center text-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-semibold">Select an image to upload</h3>
                  <p className="text-sm text-muted-foreground">
                    {processingMode === 'direct' 
                      ? 'Direct upload is best for smaller images (under 1MB)' 
                      : 'Chunked upload splits large files for more reliable transfers'}
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
                    <div className="bg-background p-2 border-t flex items-center justify-between">
                      <span className="text-xs truncate max-w-[180px]">
                        {selectedFile?.name || 'Uploaded image'}
                      </span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : ''}
                      </Badge>
                    </div>
                  </div>
                )}
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
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={response.status < 400 ? "default" : "destructive"}
                    >
                      Status: {response.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Response time: {response.time.toFixed(0)}ms
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Separator />
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
                      <div className="text-sm space-y-1">
                        <p className="font-mono text-muted-foreground break-all text-xs">
                          {response.data.imageUrl}
                        </p>
                        {response.data.mimeType && (
                          <Badge variant="outline" className="text-xs">
                            {response.data.mimeType}
                          </Badge>
                        )}
                        {response.data.imageType && (
                          <Badge variant="secondary" className="text-xs ml-1">
                            {response.data.imageType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Advanced/Custom Request Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div>
                    <Label htmlFor="url" className="text-sm">Endpoint URL</Label>
                    <div className="flex">
                      <input
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="method" className="text-sm">Method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger id="method" className="w-[100px]">
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="payload" className="text-sm">Request Body (JSON)</Label>
                  <Textarea
                    id="payload"
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder="Enter JSON payload"
                    className="font-mono text-xs h-[200px]"
                  />
                </div>
                
                <Button onClick={sendRequest} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4 mr-2" />
                      Send Request
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-center h-full">
                <div className="bg-border w-px h-[300px]"></div>
              </div>
              
              <div>
                <Label className="text-sm">Response</Label>
                {response ? (
                  <div className="rounded-md border overflow-hidden">
                    <div className="bg-muted p-2 flex items-center justify-between">
                      <Badge 
                        variant={response.status < 400 ? "default" : "destructive"}
                      >
                        Status: {response.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {response.time.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="p-2 bg-muted/40 h-[250px] overflow-auto">
                      <pre className="text-xs">{JSON.stringify(response.data, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[304px] border rounded-md bg-muted/40">
                    <p className="text-muted-foreground text-sm">No response yet</p>
                  </div>
                )}
              </div>
            </div>
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