import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface FinancialFormData {
  bankName: string;
  bankAccountHolderName: string;
  bankAccountNumber: string;
  bankRoutingNumber: string;
  paypalEmail: string;
  cardProofUrl: string;
  cardLast4Digits: string;
  cardHolderName: string;
  bankStatementUrl: string;
}

const initialFinancialState: FinancialFormData = {
  bankName: '',
  bankAccountHolderName: '',
  bankAccountNumber: '',
  bankRoutingNumber: '',
  paypalEmail: '',
  cardProofUrl: '',
  cardLast4Digits: '',
  cardHolderName: '',
  bankStatementUrl: '',
};

interface FinancialSectionProps {
  onBack: () => void;
  translatedLabels: any;
}

export default function FinancialSection({ onBack, translatedLabels }: FinancialSectionProps) {
  const { toast } = useToast();
  const [financialData, setFinancialData] = useState<FinancialFormData>(initialFinancialState);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingCardProof, setIsUploadingCardProof] = useState(false);
  const [isUploadingBankStatement, setIsUploadingBankStatement] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);

  // Fetch financial data
  const { data, isLoading } = useQuery<FinancialFormData>({
    queryKey: ['/api/users/financial'],
  });

  // Update state when data is fetched
  useEffect(() => {
    if (data) {
      setFinancialData(data);
      // If financial data exists (user has saved before), start in view mode
      if (data.cardProofUrl || data.bankStatementUrl || data.bankName || data.paypalEmail) {
        setIsEditMode(false);
      }
    }
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFinancialData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFinancialUpdate = async () => {
    // Validate required fields
    if (!financialData.cardProofUrl) {
      toast({
        title: 'Required Field Missing',
        description: 'Please upload your payment card proof before saving',
        variant: 'destructive',
      });
      return;
    }

    if (!financialData.bankStatementUrl) {
      toast({
        title: 'Required Field Missing',
        description: 'Please upload your bank statement before saving',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);
      await apiRequest('PATCH', '/api/users/financial', financialData);
      
      await queryClient.invalidateQueries({ queryKey: ['/api/users/financial'] });
      
      toast({
        title: 'Success',
        description: 'Financial information updated successfully',
      });
      
      // Switch to view mode after successful save
      setIsEditMode(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update financial information',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCardProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCardProof(true);
      
      const formData = new FormData();
      formData.append('cardProof', file);

      const response = await fetch('/api/users/financial/card-proof', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload card proof');
      }

      const data = await response.json();
      
      setFinancialData(prev => ({
        ...prev,
        cardProofUrl: data.cardProofUrl,
      }));

      await queryClient.invalidateQueries({ queryKey: ['/api/users/financial'] });
      
      toast({
        title: 'Success',
        description: 'Card proof uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload card proof',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCardProof(false);
    }
  };

  const handleBankStatementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingBankStatement(true);
      
      const formData = new FormData();
      formData.append('bankStatement', file);

      const response = await fetch('/api/users/financial/bank-statement', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload bank statement');
      }

      const data = await response.json();
      
      setFinancialData(prev => ({
        ...prev,
        bankStatementUrl: data.bankStatementUrl,
      }));

      await queryClient.invalidateQueries({ queryKey: ['/api/users/financial'] });
      
      toast({
        title: 'Success',
        description: 'Bank statement uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload bank statement',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingBankStatement(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
        data-testid="button-back-to-profile"
      >
        <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
        {translatedLabels.backToProfile || 'Back to Profile'}
      </Button>
      
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-black">Financial Information</CardTitle>
          <CardDescription className="text-black">
            Manage your banking details, PayPal account, and payment card proof
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Banking Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black">Banking Details</h3>
            
            <div>
              <Label htmlFor="bankName" className="text-black">Bank Name</Label>
              <Input
                id="bankName"
                name="bankName"
                value={financialData.bankName}
                onChange={handleInputChange}
                placeholder="Enter your bank name"
                className="bg-white text-black disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                data-testid="input-bank-name"
                disabled={!isEditMode}
              />
            </div>

            <div>
              <Label htmlFor="bankAccountHolderName" className="text-black">Account Holder Name</Label>
              <Input
                id="bankAccountHolderName"
                name="bankAccountHolderName"
                value={financialData.bankAccountHolderName}
                onChange={handleInputChange}
                placeholder="Enter account holder name"
                className="bg-white text-black disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                data-testid="input-account-holder-name"
                disabled={!isEditMode}
              />
            </div>

            <div>
              <Label htmlFor="bankAccountNumber" className="text-black">Account Number/ IBAN</Label>
              <div className="relative">
                <Input
                  id="bankAccountNumber"
                  name="bankAccountNumber"
                  type={showAccountNumber ? "text" : "password"}
                  value={financialData.bankAccountNumber}
                  onChange={handleInputChange}
                  placeholder="Enter account number"
                  className="bg-white text-black pr-20 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                  data-testid="input-account-number"
                  disabled={!isEditMode}
                />
                <button
                  type="button"
                  onClick={() => setShowAccountNumber(!showAccountNumber)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-black underline"
                  data-testid="button-toggle-account-visibility"
                >
                  {showAccountNumber ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="bankRoutingNumber" className="text-black">Routing/SWIFT Code</Label>
              <Input
                id="bankRoutingNumber"
                name="bankRoutingNumber"
                value={financialData.bankRoutingNumber}
                onChange={handleInputChange}
                placeholder="Enter routing or SWIFT code"
                className="bg-white text-black disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                data-testid="input-routing-number"
                disabled={!isEditMode}
              />
            </div>
          </div>

          {/* PayPal Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-black">PayPal Account</h3>
            
            <div>
              <Label htmlFor="paypalEmail" className="text-black">PayPal Email</Label>
              <Input
                id="paypalEmail"
                name="paypalEmail"
                type="email"
                value={financialData.paypalEmail}
                onChange={handleInputChange}
                placeholder="Enter your PayPal email"
                className="bg-white text-black disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                data-testid="input-paypal-email"
                disabled={!isEditMode}
              />
            </div>
          </div>

          {/* Card Proof Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-black">Compliance <span className="text-red-600">*</span></h3>
            <p className="text-sm text-gray-600">
              <strong>Required:</strong> Please upload a clear photo of the card used for payments. Ensure the cardholder's name and the last 4 digits are fully visible.
              For digital cards, upload a screenshot of the card and a bank statement showing the funds were removed. Please also include your bank statement, which should be no older than three months.
            </p>

            <div>
              <Label htmlFor="cardProof" className="text-black">
                Upload Card Proof <span className="text-red-600">*</span>
              </Label>
              <Input
                id="cardProof"
                type="file"
                accept="image/*,.pdf"
                onChange={handleCardProofUpload}
                disabled={isUploadingCardProof || !isEditMode}
                className="bg-white text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                data-testid="input-card-proof"
                required
              />
              {isUploadingCardProof && (
                <p className="text-sm text-gray-600 mt-2 flex items-center">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Uploading...
                </p>
              )}
              {financialData.cardProofUrl && !isUploadingCardProof && (
                <p className="text-sm text-green-600 mt-2">✓ Card proof uploaded successfully</p>
              )}
            </div>

            <div>
              <Label htmlFor="bankStatement" className="text-black">
                Upload Bank Statement (not older than 3 months) <span className="text-red-600">*</span>
              </Label>
              <Input
                id="bankStatement"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleBankStatementUpload}
                disabled={isUploadingBankStatement || !isEditMode}
                className="bg-white text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                data-testid="input-bank-statement"
                required
              />
              {isUploadingBankStatement && (
                <p className="text-sm text-gray-600 mt-2 flex items-center">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Uploading...
                </p>
              )}
              {financialData.bankStatementUrl && !isUploadingBankStatement && (
                <p className="text-sm text-green-600 mt-2">✓ Bank statement uploaded successfully</p>
              )}
            </div>
          </div>

          {isEditMode ? (
            <Button 
              onClick={handleFinancialUpdate}
              disabled={isUpdating}
              className="w-full bg-black text-white hover:bg-gray-800"
              data-testid="button-save-financial"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleEdit}
              className="w-full bg-black text-white hover:bg-gray-800"
              data-testid="button-edit-financial"
            >
              Edit
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
