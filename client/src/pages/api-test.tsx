import { ApiTester } from '@/components/api-tester';

export default function ApiTestPage() {
  return (
    <div className="container py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API Test Page</h1>
          <p className="text-gray-500">Test API endpoints including image uploads</p>
        </div>
        
        <ApiTester />
      </div>
    </div>
  );
}