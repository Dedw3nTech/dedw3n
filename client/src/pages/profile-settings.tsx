import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ProfilePictureUploader } from '@/components/user/ProfilePictureUploader';
import RegionSelector from '@/components/RegionSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { updateUserData } from '@/lib/userStorage';
import { Loader2, ChevronRight } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { useMasterTranslation } from '@/hooks/use-master-translation';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { useTranslation } from 'react-i18next';
import VendorSettings from '@/components/vendor/VendorSettings';
import VendorCommissionDashboard from '@/components/vendor/VendorCommissionDashboard';
import VendorProductManagement from '@/components/vendor/VendorProductManagement';
import VendorOrderManagement from '@/components/vendor/VendorOrderManagement';
import FinancialSection from '@/components/profile/FinancialSection';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertProxyAccountSchema } from '@shared/schema';
import { languages, changeLanguage } from '@/lib/i18n';
import { useUsernameVerification } from '@/hooks/use-username-verification';
import { useEmailValidation } from '@/hooks/use-email-validation';
import { usePasswordStrength } from '@/hooks/use-password-strength';
import { CheckCircle, AlertTriangle, Loader2 as Loader2Icon } from 'lucide-react';

// Calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Proxy Accounts Manager Component
function ProxyAccountsManager({ userId, currentUser, translatedLabels }: { userId: number; currentUser: any; translatedLabels: any }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [accountType, setAccountType] = useState<'kids' | 'organization' | 'company'>('kids');
  const [selectedSection, setSelectedSection] = useState<'kids' | 'organization' | 'company' | 'government' | ''>('');
  const [formData, setFormData] = useState<any>({});
  const [originalFormData, setOriginalFormData] = useState<any>({});
  const [kidsVerificationFile, setKidsVerificationFile] = useState<File | null>(null);
  const [uploadingKidsDoc, setUploadingKidsDoc] = useState(false);
  const [isFieldsEditable, setIsFieldsEditable] = useState(false);
  const [companyProofOfIncorporationFile, setCompanyProofOfIncorporationFile] = useState<File | null>(null);
  const [uploadingCompanyDoc, setUploadingCompanyDoc] = useState(false);

  // Kids Account validation hooks
  const {
    verifyUsername,
    isVerifying: isVerifyingUsername,
    isAvailable: isUsernameAvailable,
    message: usernameMessage,
    error: usernameError
  } = useUsernameVerification();

  const {
    validateEmail,
    isValidating: isValidatingEmail,
    isValid: isEmailValid,
    getValidationMessage
  } = useEmailValidation();

  const { result: passwordStrength } = usePasswordStrength(
    selectedSection === 'kids' ? (formData.kidsPassword || '') : (formData.companyPassword || '')
  );
  
  const [companyEmailError, setCompanyEmailError] = useState('');

  // Proxy Account Validation Schemas - defined inside component to access translatedLabels
  const kidsAccountSchema = insertProxyAccountSchema.extend({
    accountType: z.literal('kids'),
    accountName: z.string().min(2, translatedLabels.errorChildNameRequired),
    childFirstName: z.string().min(1, 'First name is required'),
    childLastName: z.string().min(1, 'Last name is required'),
    dateOfBirth: z.string().min(1, translatedLabels.errorDateOfBirthRequired),
    kidsUsername: z.string().min(3, 'Username must be at least 3 characters'),
    kidsEmail: z.string().email('Valid email address is required'),
    kidsPassword: z.string().optional(),
    guardianFullName: z.string().min(2, translatedLabels.errorGuardianNameRequired),
    guardianRelationship: z.string().min(1, translatedLabels.errorRelationshipRequired),
    guardianIdNumber: z.string().min(1, translatedLabels.errorGuardianIdRequired),
    guardianEmail: z.string().email(translatedLabels.errorValidEmailRequired),
    guardianPhone: z.string().min(1, translatedLabels.errorGuardianPhoneRequired),
  });

  const organizationAccountSchema = insertProxyAccountSchema.extend({
    accountType: z.literal('organization'),
    accountName: z.string().min(2, translatedLabels.errorOrganizationNameRequired),
    legalEntityName: z.string().min(2, translatedLabels.errorLegalEntityNameRequired),
    businessRegistrationNumber: z.string().min(1, translatedLabels.errorRegistrationNumberRequired),
    registeredAddress: z.string().min(1, translatedLabels.errorAddressRequired),
    registeredCity: z.string().min(1, translatedLabels.errorCityRequired),
    registeredCountry: z.string().min(1, translatedLabels.errorCountryRequired),
    email: z.string().email(translatedLabels.errorValidEmailRequired),
    phoneNumber: z.string().min(1, translatedLabels.errorPhoneNumberRequired),
  });

  const companyAccountSchema = insertProxyAccountSchema.extend({
    accountType: z.literal('company'),
    accountName: z.string().min(2, translatedLabels.errorCompanyNameRequired),
    legalEntityName: z.string().min(2, translatedLabels.errorLegalEntityNameRequired),
    businessRegistrationNumber: z.string().min(1, translatedLabels.errorBusinessRegistrationNumberRequired),
    incorporationDate: z.string().min(1, translatedLabels.errorIncorporationDateRequired),
    businessType: z.string().min(1, translatedLabels.errorBusinessTypeRequired),
    industryType: z.string().min(1, translatedLabels.errorIndustryTypeRequired),
    registeredAddress: z.string().min(1, translatedLabels.errorRegisteredAddressRequired),
    registeredHouseNumber: z.string().min(1, 'House number is required'),
    registeredCity: z.string().min(1, translatedLabels.errorCityRequired),
    registeredState: z.string().min(1, translatedLabels.errorStateRequired),
    registeredCountry: z.string().min(1, translatedLabels.errorCountryRequired),
    registeredPostalCode: z.string().min(1, translatedLabels.errorPostalCodeRequired),
    companyUsername: z.string().min(3, 'Username must be at least 3 characters'),
    companyEmail: z.string().email('Valid company email is required').refine((email) => {
      const publicDomains = ['gmail.com', 'hotmail.com', 'live.com', 'outlook.com', 'yahoo.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com'];
      const domain = email.split('@')[1]?.toLowerCase();
      return !domain || !publicDomains.includes(domain);
    }, 'Please use a company domain email, not a public email provider'),
    email: z.string().email(translatedLabels.errorValidEmailRequired).optional(),
    phoneNumber: z.string().min(1, translatedLabels.errorPhoneNumberRequired),
    expectedTransactionVolume: z.string().min(1, translatedLabels.errorExpectedTransactionVolumeRequired),
  }).refine(
    (data) => {
      if (data.isPoliticallyExposed) {
        return !!data.politicalExposureDetails && data.politicalExposureDetails.length >= 10;
      }
      return true;
    },
    {
      message: translatedLabels.errorPepDetailsRequired,
      path: ['politicalExposureDetails'],
    }
  ).refine(
    (data) => {
      if (!editingAccount && (!data.companyPassword || data.companyPassword.length < 8)) {
        return false;
      }
      return true;
    },
    {
      message: 'Password must be at least 8 characters for new accounts',
      path: ['companyPassword'],
    }
  );

  // Fetch proxy accounts
  const { data: proxyAccounts, isLoading, refetch } = useQuery({
    queryKey: ['/api/proxy-accounts'],
  });

  // Helper function to translate account type and status dynamically
  const translateAccountField = useMemo(() => (field: string): string => {
    const fieldLower = field?.toLowerCase();
    return (translatedLabels as any)[fieldLower] || field;
  }, [translatedLabels]);

  // Check if user profile is complete for guardian auto-fill
  const isProfileComplete = useMemo(() => {
    if (!currentUser) return false;
    
    const hasName = currentUser.name || (currentUser.firstName && currentUser.surname);
    const hasEmail = !!currentUser.email;
    const hasPhone = !!currentUser.phone;
    const hasIdNumber = !!currentUser.idDocumentNumber;
    
    return hasName && hasEmail && hasPhone && hasIdNumber;
  }, [currentUser]);

  // Auto-fetch guardian information when creating a new Kids Account
  useEffect(() => {
    if (selectedSection === 'kids' && !editingAccount && currentUser && isProfileComplete) {
      const guardianName = currentUser.name || 
                          (currentUser.firstName && currentUser.surname 
                            ? `${currentUser.firstName} ${currentUser.surname}` 
                            : '');
      
      setFormData((prev: any) => ({
        ...prev,
        guardianFullName: guardianName,
        guardianEmail: currentUser.email || '',
        guardianPhone: currentUser.phone || '',
        guardianIdNumber: currentUser.idDocumentNumber || '',
        guardianAutoFilled: true,
      }));
    }
    
    // Auto-fill Company Account UBO member 1 with current user's data
    if (selectedSection === 'company' && currentUser) {
      const userName = currentUser.name || 
                      (currentUser.firstName && currentUser.surname 
                        ? `${currentUser.firstName} ${currentUser.surname}` 
                        : currentUser.username || '');
      
      setFormData((prev: any) => ({
        ...prev,
        uboMembers: prev.uboMembers && prev.uboMembers.length > 0 ? prev.uboMembers : [userName],
        uboPepStatus: prev.uboPepStatus && prev.uboPepStatus.length > 0 ? prev.uboPepStatus : [false],
      }));
    }
  }, [selectedSection, editingAccount, currentUser, isProfileComplete]);

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreate = () => {
    setEditingAccount(null);
    setFormData({ accountType });
    setShowForm(true);
    setIsFieldsEditable(true);
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setAccountType(account.accountType);
    setSelectedSection(account.accountType);
    setFormData(account);
    setOriginalFormData(account);
    setShowForm(true);
    setIsFieldsEditable(false);
  };

  const hasFormChanged = () => {
    if (!editingAccount) return false;
    
    const keysToCompare = Object.keys(originalFormData).filter(key => 
      key !== 'updatedAt' && key !== 'createdAt'
    );
    
    return keysToCompare.some(key => {
      const originalValue = originalFormData[key];
      const currentValue = formData[key];
      return originalValue !== currentValue;
    });
  };

  const handleDelete = async (accountId: number) => {
    if (!confirm(translatedLabels.confirmDeleteProxy)) return;
    
    try {
      await apiRequest('DELETE', `/api/proxy-accounts/${accountId}`);
      toast({ title: translatedLabels.success, description: translatedLabels.proxyAccountDeleted });
      refetch();
    } catch (error) {
      toast({ title: translatedLabels.error, description: translatedLabels.failedToDeleteProxy, variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    try {
      // Additional validation for Kids Account password when creating new account
      if (accountType === 'kids' && !editingAccount) {
        if (!formData.kidsPassword || formData.kidsPassword.length < 8) {
          toast({ 
            title: translatedLabels.validationError, 
            description: 'Password is required and must be at least 8 characters',
            variant: 'destructive',
            errorType: 'Kids Account Validation - Password',
            errorMessage: 'Password validation failed: Must be at least 8 characters'
          });
          return;
        }
      }
      
      // Additional validation for Company Account password when creating new account
      if (accountType === 'company' && !editingAccount) {
        if (!formData.companyPassword || formData.companyPassword.length < 8) {
          toast({ 
            title: translatedLabels.validationError, 
            description: 'Password is required and must be at least 8 characters',
            variant: 'destructive',
            errorType: 'Company Account Validation - Password',
            errorMessage: 'Password validation failed: Must be at least 8 characters'
          });
          return;
        }
        
        if (companyEmailError) {
          toast({ 
            title: translatedLabels.validationError, 
            description: companyEmailError,
            variant: 'destructive',
            errorType: 'Company Account Validation - Email',
            errorMessage: companyEmailError
          });
          return;
        }
      }
      
      // Auto-derive accountName for Kids Account (combines first/last name or uses username)
      let dataToSubmit = { ...formData };
      if (accountType === 'kids') {
        const firstName = formData.childFirstName?.trim() || '';
        const lastName = formData.childLastName?.trim() || '';
        const username = formData.kidsUsername?.trim() || '';
        
        // Derive accountName: "FirstName LastName" or fallback to username
        if (firstName && lastName) {
          dataToSubmit.accountName = `${firstName} ${lastName}`;
        } else if (firstName) {
          dataToSubmit.accountName = firstName;
        } else {
          dataToSubmit.accountName = username || 'Kids Account';
        }
      }
      
      // Select the appropriate schema based on account type
      const schema = accountType === 'kids' ? kidsAccountSchema :
                     accountType === 'organization' ? organizationAccountSchema :
                     companyAccountSchema;
      
      // Validate the form data against the schema
      const validatedData = schema.parse({
        ...dataToSubmit,
        accountType,
        parentUserId: userId
      });

      if (editingAccount) {
        await apiRequest('PUT', `/api/proxy-accounts/${editingAccount.id}`, validatedData);
        toast({ title: translatedLabels.success, description: translatedLabels.proxyAccountUpdated });
      } else {
        const response = await apiRequest('POST', '/api/proxy-accounts', validatedData) as any;
        toast({ title: translatedLabels.success, description: translatedLabels.proxyAccountCreated });
        
        // Auto-upload verification document if one was selected during Kids Account creation
        if (accountType === 'kids' && kidsVerificationFile && response?.id) {
          await handleKidsVerificationUpload(response.id, kidsVerificationFile);
        }
        
        // Auto-upload company proof document if one was selected during Company Account creation
        if (accountType === 'company' && companyProofOfIncorporationFile && response?.id) {
          await handleCompanyProofUpload(response.id, companyProofOfIncorporationFile);
        }
      }
      
      setShowForm(false);
      setFormData({});
      setKidsVerificationFile(null);
      setCompanyProofOfIncorporationFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/proxy-accounts'] });
      refetch();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        const fieldPath = firstError.path.join('.');
        toast({ 
          title: translatedLabels.validationError, 
          description: firstError.message,
          variant: 'destructive',
          errorType: `${accountType === 'kids' ? 'Kids' : accountType === 'organization' ? 'Organization' : 'Company'} Account Validation - ${fieldPath}`,
          errorMessage: `Validation failed for field "${fieldPath}": ${firstError.message}`
        });
      } else {
        const errorMessage = (error as any)?.message || translatedLabels.failedToSaveProxy;
        toast({ 
          title: translatedLabels.error, 
          description: errorMessage, 
          variant: 'destructive',
          errorType: `${accountType === 'kids' ? 'Kids' : accountType === 'organization' ? 'Organization' : 'Company'} Account Error`,
          errorMessage: `Failed to save proxy account: ${errorMessage}`
        });
      }
    }
  };

  // Name validation states
  const [isFirstNameValid, setIsFirstNameValid] = useState<boolean | null>(null);
  const [firstNameMessage, setFirstNameMessage] = useState<string>('');
  const [isLastNameValid, setIsLastNameValid] = useState<boolean | null>(null);
  const [lastNameMessage, setLastNameMessage] = useState<string>('');
  const [isAgeValid, setIsAgeValid] = useState<boolean | null>(null);
  const [ageMessage, setAgeMessage] = useState<string>('');

  // Validate first name (real name pattern)
  const validateFirstName = (name: string) => {
    if (!name || name.trim().length === 0) {
      setIsFirstNameValid(null);
      setFirstNameMessage('');
      return;
    }

    const namePattern = /^[a-zA-ZÀ-ÿ\s'-]{2,}$/;
    const hasNumbers = /\d/.test(name);
    const hasSpecialChars = /[^a-zA-ZÀ-ÿ\s'-]/.test(name);

    if (hasNumbers) {
      setIsFirstNameValid(false);
      setFirstNameMessage('First name cannot contain numbers');
    } else if (hasSpecialChars) {
      setIsFirstNameValid(false);
      setFirstNameMessage('First name contains invalid characters');
    } else if (name.trim().length < 2) {
      setIsFirstNameValid(false);
      setFirstNameMessage('First name must be at least 2 characters');
    } else if (!namePattern.test(name)) {
      setIsFirstNameValid(false);
      setFirstNameMessage('Please enter a valid first name');
    } else {
      setIsFirstNameValid(true);
      setFirstNameMessage('First name is valid');
    }
  };

  // Validate last name (real name pattern)
  const validateLastName = (name: string) => {
    if (!name || name.trim().length === 0) {
      setIsLastNameValid(null);
      setLastNameMessage('');
      return;
    }

    const namePattern = /^[a-zA-ZÀ-ÿ\s'-]{2,}$/;
    const hasNumbers = /\d/.test(name);
    const hasSpecialChars = /[^a-zA-ZÀ-ÿ\s'-]/.test(name);

    if (hasNumbers) {
      setIsLastNameValid(false);
      setLastNameMessage('Last name cannot contain numbers');
    } else if (hasSpecialChars) {
      setIsLastNameValid(false);
      setLastNameMessage('Last name contains invalid characters');
    } else if (name.trim().length < 2) {
      setIsLastNameValid(false);
      setLastNameMessage('Last name must be at least 2 characters');
    } else if (!namePattern.test(name)) {
      setIsLastNameValid(false);
      setLastNameMessage('Please enter a valid last name');
    } else {
      setIsLastNameValid(true);
      setLastNameMessage('Last name is valid');
    }
  };

  // Validate age (must be under 18)
  const validateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) {
      setIsAgeValid(null);
      setAgeMessage('');
      return;
    }

    const age = calculateAge(dateOfBirth);
    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    if (birthDate > today) {
      setIsAgeValid(false);
      setAgeMessage('Date of birth cannot be in the future');
    } else if (age >= 18) {
      setIsAgeValid(false);
      setAgeMessage('Child must be under 18 years old');
    } else if (age < 0) {
      setIsAgeValid(false);
      setAgeMessage('Invalid date of birth');
    } else {
      setIsAgeValid(true);
      setAgeMessage(`Valid age: ${age} years old (under 18)`);
    }
  };

  // Real-time first name validation
  useEffect(() => {
    if (formData.childFirstName) {
      validateFirstName(formData.childFirstName);
    }
  }, [formData.childFirstName]);

  // Real-time last name validation
  useEffect(() => {
    if (formData.childLastName) {
      validateLastName(formData.childLastName);
    }
  }, [formData.childLastName]);

  // Real-time username verification with debouncing
  useEffect(() => {
    if (formData.kidsUsername && formData.kidsUsername.length >= 3) {
      const timeoutId = setTimeout(() => {
        verifyUsername(formData.kidsUsername);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.kidsUsername, verifyUsername]);

  // Real-time email validation with debouncing
  useEffect(() => {
    if (formData.kidsEmail && formData.kidsEmail.includes('@')) {
      const timeoutId = setTimeout(() => {
        validateEmail(formData.kidsEmail);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.kidsEmail, validateEmail]);

  // Auto-calculate age from date of birth
  useEffect(() => {
    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      setFormData((prev: any) => ({
        ...prev,
        childAge: age
      }));
      validateAge(formData.dateOfBirth);
    }
  }, [formData.dateOfBirth]);

  const handleKidsVerificationUpload = async (accountId: number, file: File) => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a verification document to upload.",
        variant: "destructive",
        errorType: "Kids Account Document Upload - No File",
        errorMessage: "File selection validation failed: No file selected for upload"
      });
      return;
    }

    setUploadingKidsDoc(true);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await apiRequest('POST', `/api/proxy-accounts/${accountId}/kids-verification-document`, {
        documentData: base64Data,
        filename: file.name,
        mimeType: file.type,
      });

      // Auto-activate Kids Account by updating status to 'verified'
      await apiRequest('PUT', `/api/proxy-accounts/${accountId}`, {
        status: 'verified'
      });

      toast({
        title: "Upload successful",
        description: "Kids verification document uploaded successfully. Kids Account is now active!",
      });

      setKidsVerificationFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/proxy-accounts'] });
      refetch();
    } catch (error) {
      console.error('Kids document upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload verification document';
      toast({
        title: "Upload failed",
        description: `${errorMsg}. Please try again.`,
        variant: "destructive",
        errorType: "Kids Account Document Upload - Upload Failed",
        errorMessage: `Document upload failed for account ID ${accountId}: ${errorMsg} (File: ${file.name}, Type: ${file.type})`
      });
    } finally {
      setUploadingKidsDoc(false);
    }
  };

  const handleCompanyProofUpload = async (accountId: number, file: File) => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a proof of incorporation document to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploadingCompanyDoc(true);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await apiRequest('POST', `/api/proxy-accounts/${accountId}/company-proof-document`, {
        documentData: base64Data,
        filename: file.name,
        mimeType: file.type,
      });

      toast({
        title: "Upload successful",
        description: "Proof of incorporation uploaded successfully!",
      });

      setCompanyProofOfIncorporationFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/proxy-accounts'] });
      refetch();
    } catch (error) {
      console.error('Company document upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload document';
      toast({
        title: "Upload failed",
        description: `${errorMsg}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setUploadingCompanyDoc(false);
    }
  };

  if (showForm) {
    return (
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black">
            {editingAccount ? translatedLabels.edit : translatedLabels.create} {translatedLabels.proxyAccount}
          </h2>
          {editingAccount && !isFieldsEditable && (
            <Button 
              onClick={() => setIsFieldsEditable(true)} 
              variant="outline"
              data-testid="button-enable-edit"
            >
              Edit
            </Button>
          )}
        </div>

        {selectedSection === '' ? (
          <Card className="border-0">
            <CardContent className="p-0">
              <div className="divide-y">
                <button
                  onClick={() => { setAccountType('kids'); setSelectedSection('kids'); }}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  data-testid="menu-kids"
                >
                  <span className="text-sm font-medium text-gray-900">{translatedLabels.kidsAccount}</span>
                </button>
                <button
                  onClick={() => { setAccountType('company'); setSelectedSection('company'); }}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  data-testid="menu-company"
                >
                  <span className="text-sm font-medium text-gray-900">{translatedLabels.companyAccount}</span>
                </button>
                <button
                  onClick={() => { setSelectedSection('government'); }}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  data-testid="menu-government"
                >
                  <span className="text-sm font-medium text-gray-900">{translatedLabels.governmentAccount}</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ) : selectedSection === 'government' ? (
          <div data-testid="content-government">
            <Button variant="ghost" onClick={() => { setShowForm(false); setSelectedSection(''); }} className="mb-4" data-testid="button-back-government">
              {translatedLabels.backToMenu}
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>{translatedLabels.governmentAccount}</CardTitle>
                <CardDescription>{translatedLabels.governmentAccountDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/contact">
                    <Button
                      className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto"
                      data-testid="button-contact-us"
                    >
                      {translatedLabels.contactUs}
                    </Button>
                  </Link>
                  <Button
                    asChild
                    variant="outline"
                    className="border-black text-black hover:bg-gray-50"
                    data-testid="button-send-email"
                  >
                    <a href="mailto:support@dedw3n.com">
                      {translatedLabels.sendEmail}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : selectedSection === 'kids' ? (
          <div data-testid="content-kids">
            <Button variant="ghost" onClick={() => { setShowForm(false); setSelectedSection(''); setEditingAccount(null); }} className="mb-4" data-testid="button-back-kids">
              {translatedLabels.backToMenu}
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>{translatedLabels.kidsAccountTitle}</CardTitle>
                <CardDescription>{translatedLabels.kidsAccountDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!editingAccount && !isProfileComplete && (
                  <div className="bg-white p-4 mb-6">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-black mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-black">
                          Complete Your Profile First
                        </h3>
                        <div className="mt-2 text-sm text-black">
                          <p className="mb-2">
                            To create a Kids Account, please complete the following required information in your profile:
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {!currentUser?.name && !(currentUser?.firstName && currentUser?.surname) && (
                              <li>Full Name (Profile → Personal Information)</li>
                            )}
                            {!currentUser?.email && (
                              <li>Email Address (Profile → Personal Information)</li>
                            )}
                            {!currentUser?.phone && (
                              <li>Phone Number (Profile → Personal Information)</li>
                            )}
                            {!currentUser?.idDocumentNumber && (
                              <li>ID Document Number (Profile → Compliance)</li>
                            )}
                          </ul>
                          <p className="mt-3 font-medium">
                            This information will be automatically used as guardian information for the Kids Account.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="childFirstName">{translatedLabels.firstName || 'First Name'}</Label>
                    <div className="relative">
                      <Input 
                        id="childFirstName" 
                        name="childFirstName" 
                        value={formData.childFirstName || ''} 
                        onChange={handleInputChange} 
                        placeholder="First name" 
                        data-testid="input-child-first-name"
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={`${
                          editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''
                        } ${formData.childFirstName ? (
                          isFirstNameValid === true ? "border-green-500 focus:ring-green-500" :
                          isFirstNameValid === false ? "border-red-500 focus:ring-red-500" :
                          ""
                        ) : ""}`}
                      />
                      {formData.childFirstName && isFirstNameValid === true && (
                        <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                      )}
                      {formData.childFirstName && isFirstNameValid === false && (
                        <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-red-600" />
                      )}
                    </div>
                    {formData.childFirstName && firstNameMessage && (
                      <p className={`text-xs mt-1 ${
                        isFirstNameValid === true ? "text-green-600" :
                        isFirstNameValid === false ? "text-red-600" :
                        "text-gray-500"
                      }`}>
                        {firstNameMessage}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="childLastName">{translatedLabels.lastName || 'Last Name'}</Label>
                    <div className="relative">
                      <Input 
                        id="childLastName" 
                        name="childLastName" 
                        value={formData.childLastName || ''} 
                        onChange={handleInputChange} 
                        placeholder="Last name" 
                        data-testid="input-child-last-name"
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={`${
                          editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''
                        } ${formData.childLastName ? (
                          isLastNameValid === true ? "border-green-500 focus:ring-green-500" :
                          isLastNameValid === false ? "border-red-500 focus:ring-red-500" :
                          ""
                        ) : ""}`}
                      />
                      {formData.childLastName && isLastNameValid === true && (
                        <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                      )}
                      {formData.childLastName && isLastNameValid === false && (
                        <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-red-600" />
                      )}
                    </div>
                    {formData.childLastName && lastNameMessage && (
                      <p className={`text-xs mt-1 ${
                        isLastNameValid === true ? "text-green-600" :
                        isLastNameValid === false ? "text-red-600" :
                        "text-gray-500"
                      }`}>
                        {lastNameMessage}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">{translatedLabels.dateOfBirthLabel} *</Label>
                    <div className="relative">
                      <Input 
                        type="date" 
                        id="dateOfBirth" 
                        name="dateOfBirth" 
                        value={formData.dateOfBirth || ''} 
                        onChange={handleInputChange} 
                        data-testid="input-date-of-birth"
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={`${
                          editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''
                        } ${formData.dateOfBirth ? (
                          isAgeValid === true ? "border-green-500 focus:ring-green-500" :
                          isAgeValid === false ? "border-red-500 focus:ring-red-500" :
                          ""
                        ) : ""}`}
                      />
                      {formData.dateOfBirth && isAgeValid === true && (
                        <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                      )}
                      {formData.dateOfBirth && isAgeValid === false && (
                        <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-red-600" />
                      )}
                    </div>
                    {formData.dateOfBirth && ageMessage && (
                      <p className={`text-xs mt-1 ${
                        isAgeValid === true ? "text-green-600" :
                        isAgeValid === false ? "text-red-600" :
                        "text-gray-500"
                      }`}>
                        {ageMessage}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="childAge">{translatedLabels.ageLabel}</Label>
                    <Input type="number" id="childAge" name="childAge" value={formData.childAge || ''} readOnly disabled className="bg-gray-50 cursor-not-allowed" placeholder={translatedLabels.childAge} data-testid="input-child-age" />
                    {formData.childAge && (
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-calculated from date of birth
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">Account Credentials</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create login credentials for the child's account (Guardian is responsible for account security)
                  </p>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="kidsUsername">Username *</Label>
                      <div className="relative">
                        <Input 
                          id="kidsUsername" 
                          name="kidsUsername" 
                          value={formData.kidsUsername || ''} 
                          onChange={handleInputChange} 
                          placeholder="Choose a unique username" 
                          data-testid="input-kids-username"
                          readOnly={editingAccount && !isFieldsEditable}
                          disabled={editingAccount && !isFieldsEditable}
                          className={`${
                            editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''
                          } ${formData.kidsUsername && formData.kidsUsername.length >= 3 ? (
                            isUsernameAvailable === true ? "border-green-500 focus:ring-green-500" :
                            isUsernameAvailable === false ? "border-red-500 focus:ring-red-500" :
                            ""
                          ) : ""}`}
                        />
                        {isVerifyingUsername && (
                          <Loader2Icon className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {!isVerifyingUsername && isUsernameAvailable === true && (
                          <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                        )}
                        {!isVerifyingUsername && isUsernameAvailable === false && (
                          <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-red-600" />
                        )}
                      </div>
                      {formData.kidsUsername && formData.kidsUsername.length >= 3 && (
                        <p className={`text-xs mt-1 ${
                          isUsernameAvailable === true ? "text-green-600" :
                          isUsernameAvailable === false ? "text-red-600" :
                          "text-gray-500"
                        }`}>
                          {usernameMessage || usernameError || "Checking availability..."}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="kidsEmail">Email Address *</Label>
                      <div className="relative">
                        <Input 
                          type="email" 
                          id="kidsEmail" 
                          name="kidsEmail" 
                          value={formData.kidsEmail || ''} 
                          onChange={handleInputChange} 
                          placeholder="email@example.com" 
                          data-testid="input-kids-email"
                          readOnly={editingAccount && !isFieldsEditable}
                          disabled={editingAccount && !isFieldsEditable}
                          className={`${
                            editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''
                          } ${formData.kidsEmail ? (
                            isEmailValid === true ? "border-green-500 focus:ring-green-500" :
                            isEmailValid === false ? "border-red-500 focus:ring-red-500" :
                            ""
                          ) : ""}`}
                        />
                        {isValidatingEmail && (
                          <Loader2Icon className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {!isValidatingEmail && isEmailValid === true && (
                          <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                        )}
                        {!isValidatingEmail && isEmailValid === false && (
                          <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-red-600" />
                        )}
                      </div>
                      {formData.kidsEmail && getValidationMessage() && (
                        <p className={`text-xs mt-1 ${
                          isEmailValid === true ? "text-green-600" :
                          isEmailValid === false ? "text-red-600" :
                          "text-gray-500"
                        }`}>
                          {getValidationMessage()}
                        </p>
                      )}
                    </div>
                    {!editingAccount && (
                      <div>
                        <Label htmlFor="kidsPassword">Password *</Label>
                        <Input 
                          type="password" 
                          id="kidsPassword" 
                          name="kidsPassword" 
                          value={formData.kidsPassword || ''} 
                          onChange={handleInputChange} 
                          placeholder="Create a strong password" 
                          data-testid="input-kids-password"
                          className={formData.kidsPassword && passwordStrength ? (
                            passwordStrength.isSecure ? "border-green-500 focus:ring-green-500" :
                            passwordStrength.isWeak ? "border-red-500 focus:ring-red-500" :
                            "border-orange-500 focus:ring-orange-500"
                          ) : ""}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum 8 characters. Guardian is responsible for account security.
                        </p>
                        {formData.kidsPassword && passwordStrength && (
                          <div className="space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Password Strength:</span>
                              <span className={`text-sm font-semibold ${passwordStrength.color}`}>
                                {passwordStrength.strengthLabel}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  passwordStrength.score <= 1 ? 'bg-red-500' :
                                  passwordStrength.score <= 2 ? 'bg-orange-500' :
                                  passwordStrength.score <= 3 ? 'bg-yellow-500' :
                                  passwordStrength.score <= 4 ? 'bg-green-500' :
                                  'bg-green-600'
                                }`}
                                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                              ></div>
                            </div>
                            <div className="text-xs space-y-1">
                              {passwordStrength.feedback.slice(0, 2).map((message, index) => (
                                <div key={index} className={`flex items-start ${passwordStrength.color}`}>
                                  {passwordStrength.isSecure ? (
                                    <CheckCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                  )}
                                  <span>{message}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">Verification Documents</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please provide the following documents to confirm Kids identity. (ID or Government issued document)
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="kidsVerificationDocument">Child Identity Document</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="file"
                          id="kidsVerificationDocument"
                          accept="image/*,.pdf"
                          onChange={(e) => setKidsVerificationFile(e.target.files?.[0] || null)}
                          disabled={uploadingKidsDoc}
                          className="flex-1"
                          data-testid="input-kids-verification-document"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (editingAccount?.id && kidsVerificationFile) {
                              handleKidsVerificationUpload(editingAccount.id, kidsVerificationFile);
                            }
                          }}
                          disabled={!kidsVerificationFile || uploadingKidsDoc || !editingAccount}
                          className="bg-black text-white hover:bg-gray-800 min-w-[100px]"
                          data-testid="button-upload-kids-verification"
                        >
                          {uploadingKidsDoc ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            'Upload'
                          )}
                        </Button>
                      </div>
                      {!editingAccount && kidsVerificationFile && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Document selected. It will be uploaded automatically when you create the account.
                        </p>
                      )}
                      {!editingAccount && !kidsVerificationFile && (
                        <p className="text-xs text-gray-500 mt-1">
                          Select a verification document. It will be uploaded automatically after account creation.
                        </p>
                      )}
                      {editingAccount && !kidsVerificationFile && (
                        <p className="text-xs text-gray-500 mt-1">
                          Accepted formats: Images (PNG, JPG, JPEG, GIF, WebP) or PDF. Max size: 5MB
                        </p>
                      )}
                      {editingAccount && kidsVerificationFile && (
                        <p className="text-xs text-blue-600 mt-1">
                          Click Upload to save the selected document
                        </p>
                      )}
                      
                      {editingAccount?.kidsVerificationDocumentUrl ? (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">Document uploaded successfully</p>
                            <p className="text-xs text-green-600 mt-1">
                              Verification document has been received. You can upload a new document to replace it.
                            </p>
                          </div>
                        </div>
                      ) : editingAccount ? (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-white border border-black rounded-md">
                          <AlertTriangle className="h-5 w-5 text-black flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-black">Document upload required</p>
                            <p className="text-xs text-black mt-1">
                              Please upload a child identity document (ID or Government issued document) to complete verification.
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="mb-4">
                    <h3 className="font-semibold">{translatedLabels.guardianInformation}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Guardian/Parent information for account verification and security
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="guardianFullName">{translatedLabels.guardianFullName}</Label>
                      <Input 
                        id="guardianFullName" 
                        name="guardianFullName" 
                        value={formData.guardianFullName || ''} 
                        onChange={handleInputChange} 
                        placeholder={translatedLabels.enterGuardianName || "Enter guardian's full name"} 
                        data-testid="input-guardian-full-name"
                        readOnly={formData.guardianAutoFilled || (editingAccount && !isFieldsEditable)}
                        disabled={editingAccount && !isFieldsEditable}
                        className={formData.guardianAutoFilled || (editingAccount && !isFieldsEditable) ? "bg-gray-100 cursor-not-allowed text-gray-700" : ""}
                      />
                      {formData.guardianAutoFilled && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Auto-filled from your profile
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="guardianRelationship">{translatedLabels.relationshipLabel}</Label>
                      <Select 
                        value={formData.guardianRelationship || ''} 
                        onValueChange={(v) => handleSelectChange('guardianRelationship', v)}
                        disabled={editingAccount && !isFieldsEditable}
                      >
                        <SelectTrigger data-testid="select-guardian-relationship" className={editingAccount && !isFieldsEditable ? "bg-gray-100 text-gray-700 cursor-not-allowed" : ""}>
                          <SelectValue placeholder={translatedLabels.selectRelationship || "Select relationship"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">{translatedLabels.parent || "Parent"}</SelectItem>
                          <SelectItem value="legal_guardian">{translatedLabels.legalGuardian || "Legal Guardian"}</SelectItem>
                          <SelectItem value="grandparent">{translatedLabels.grandparent || "Grandparent"}</SelectItem>
                          <SelectItem value="other">{translatedLabels.otherRelation || "Other"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="guardianIdNumber">{translatedLabels.guardianIdNumber}</Label>
                      <Input 
                        id="guardianIdNumber" 
                        name="guardianIdNumber" 
                        value={formData.guardianIdNumber || ''} 
                        onChange={handleInputChange} 
                        placeholder={translatedLabels.idPassportNumber || "ID/Passport number"} 
                        data-testid="input-guardian-id-number"
                        readOnly={formData.guardianAutoFilled || (editingAccount && !isFieldsEditable)}
                        disabled={editingAccount && !isFieldsEditable}
                        className={formData.guardianAutoFilled || (editingAccount && !isFieldsEditable) ? "bg-gray-100 cursor-not-allowed text-gray-700" : ""}
                      />
                      {formData.guardianAutoFilled && formData.guardianIdNumber && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Auto-filled from your compliance data
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guardianEmail">{translatedLabels.guardianEmailLabel}</Label>
                        <Input 
                          type="email" 
                          id="guardianEmail" 
                          name="guardianEmail" 
                          value={formData.guardianEmail || ''} 
                          onChange={handleInputChange} 
                          placeholder="guardian@example.com" 
                          data-testid="input-guardian-email"
                          readOnly={formData.guardianAutoFilled || (editingAccount && !isFieldsEditable)}
                          disabled={editingAccount && !isFieldsEditable}
                          className={formData.guardianAutoFilled || (editingAccount && !isFieldsEditable) ? "bg-gray-100 cursor-not-allowed text-gray-700" : ""}
                        />
                        {formData.guardianAutoFilled && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Auto-filled from your profile
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="guardianPhone">{translatedLabels.guardianPhoneLabel}</Label>
                        <Input 
                          type="tel" 
                          id="guardianPhone" 
                          name="guardianPhone" 
                          value={formData.guardianPhone || ''} 
                          onChange={handleInputChange} 
                          placeholder={translatedLabels.phoneExample || "+1 (555) 000-0000"} 
                          data-testid="input-guardian-phone"
                          readOnly={formData.guardianAutoFilled || (editingAccount && !isFieldsEditable)}
                          disabled={editingAccount && !isFieldsEditable}
                          className={formData.guardianAutoFilled || (editingAccount && !isFieldsEditable) ? "bg-gray-100 cursor-not-allowed text-gray-700" : ""}
                        />
                        {formData.guardianAutoFilled && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Auto-filled from your profile
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSubmit} 
                  className={`w-full ${editingAccount && !hasFormChanged() ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
                  data-testid="button-submit-kids"
                  disabled={(editingAccount && !hasFormChanged()) || (!editingAccount && !isProfileComplete)}
                >
                  {editingAccount ? translatedLabels.update : translatedLabels.create} {translatedLabels.kidsAccount}
                </Button>
                {!editingAccount && !isProfileComplete && (
                  <p className="text-sm text-center text-yellow-700 -mt-2">
                    Complete your profile information to enable account creation
                  </p>
                )}
                {editingAccount && !hasFormChanged() && (
                  <p className="text-sm text-center text-gray-500 -mt-2">
                    No changes detected. Modify the form to enable the update button.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : selectedSection === 'organization' ? (
          <div data-testid="content-organization">
            <Button variant="ghost" onClick={() => { setShowForm(false); setSelectedSection(''); setEditingAccount(null); }} className="mb-4" data-testid="button-back-organization">
              {translatedLabels.backToMenu}
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>{translatedLabels.organizationAccount}</CardTitle>
                <CardDescription>{translatedLabels.organizationAccountDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="accountName">{translatedLabels.organizationName}</Label>
                  <Input id="accountName" name="accountName" value={formData.accountName || ''} onChange={handleInputChange} placeholder={translatedLabels.enterOrgName} data-testid="input-org-name" />
                </div>
                <div>
                  <Label htmlFor="legalEntityName">{translatedLabels.legalEntityName}</Label>
                  <Input id="legalEntityName" name="legalEntityName" value={formData.legalEntityName || ''} onChange={handleInputChange} placeholder={translatedLabels.legalRegisteredName} data-testid="input-legal-name" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessRegistrationNumber">{translatedLabels.registrationNumber}</Label>
                    <Input id="businessRegistrationNumber" name="businessRegistrationNumber" value={formData.businessRegistrationNumber || ''} onChange={handleInputChange} placeholder={translatedLabels.orgRegistrationNumber} data-testid="input-registration-number" />
                  </div>
                  <div>
                    <Label htmlFor="taxIdNumber">{translatedLabels.taxIdNumber}</Label>
                    <Input id="taxIdNumber" name="taxIdNumber" value={formData.taxIdNumber || ''} onChange={handleInputChange} placeholder={translatedLabels.taxIdNumber} data-testid="input-tax-id" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="incorporationDate">{translatedLabels.incorporationDate}</Label>
                    <Input type="date" id="incorporationDate" name="incorporationDate" value={formData.incorporationDate || ''} onChange={handleInputChange} data-testid="input-incorporation-date" />
                  </div>
                  <div>
                    <Label htmlFor="industryType">{translatedLabels.industry}</Label>
                    <Input id="industryType" name="industryType" value={formData.industryType || ''} onChange={handleInputChange} placeholder={translatedLabels.industryExample} data-testid="input-industry" />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">{translatedLabels.registeredAddress}</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="registeredAddress">{translatedLabels.streetAddressLabel}</Label>
                      <Input id="registeredAddress" name="registeredAddress" value={formData.registeredAddress || ''} onChange={handleInputChange} placeholder={translatedLabels.streetAddress} data-testid="input-registered-address" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="registeredCity">{translatedLabels.cityLabel}</Label>
                        <Input id="registeredCity" name="registeredCity" value={formData.registeredCity || ''} onChange={handleInputChange} placeholder={translatedLabels.city} data-testid="input-registered-city" />
                      </div>
                      <div>
                        <Label htmlFor="registeredState">{translatedLabels.stateProvinceLabel}</Label>
                        <Input id="registeredState" name="registeredState" value={formData.registeredState || ''} onChange={handleInputChange} placeholder={translatedLabels.state} data-testid="input-registered-state" />
                      </div>
                      <div>
                        <Label htmlFor="registeredPostalCode">{translatedLabels.postalCodeLabel}</Label>
                        <Input id="registeredPostalCode" name="registeredPostalCode" value={formData.registeredPostalCode || ''} onChange={handleInputChange} placeholder={translatedLabels.postalCode} data-testid="input-registered-postal" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="registeredCountry">{translatedLabels.countryLabel}</Label>
                      <Input id="registeredCountry" name="registeredCountry" value={formData.registeredCountry || ''} onChange={handleInputChange} placeholder={translatedLabels.country} data-testid="input-registered-country" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">{translatedLabels.contactInformation}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">{translatedLabels.organizationEmail}</Label>
                      <Input type="email" id="email" name="email" value={formData.email || ''} onChange={handleInputChange} placeholder={translatedLabels.orgEmailExample} data-testid="input-org-email" />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">{translatedLabels.phoneNumber}</Label>
                      <Input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleInputChange} placeholder={translatedLabels.phoneExample} data-testid="input-org-phone" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">{translatedLabels.amlCompliance}</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="purposeOfAccount">{translatedLabels.purposeOfAccountLabel}</Label>
                      <Textarea id="purposeOfAccount" name="purposeOfAccount" value={formData.purposeOfAccount || ''} onChange={handleInputChange} placeholder={translatedLabels.describePurposeAccount} rows={3} data-testid="textarea-purpose-org" />
                    </div>
                    <div>
                      <Label htmlFor="expectedTransactionVolume">{translatedLabels.expectedTransactionVolume}</Label>
                      <Select value={formData.expectedTransactionVolume || ''} onValueChange={(v) => handleSelectChange('expectedTransactionVolume', v)}>
                        <SelectTrigger data-testid="select-transaction-volume">
                          <SelectValue placeholder={translatedLabels.selectExpectedVolume} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{translatedLabels.lowVolume}</SelectItem>
                          <SelectItem value="medium">{translatedLabels.mediumVolume}</SelectItem>
                          <SelectItem value="high">{translatedLabels.highVolume}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full bg-black text-white hover:bg-gray-800" data-testid="button-submit-organization">
                  {editingAccount ? translatedLabels.update : translatedLabels.create} {translatedLabels.organizationAccount}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : selectedSection === 'company' ? (
          <div data-testid="content-company">
            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" onClick={() => { setShowForm(false); setSelectedSection(''); setEditingAccount(null); setIsFieldsEditable(false); }} data-testid="button-back-company">
                {translatedLabels.backToMenu}
              </Button>
              {editingAccount && !isFieldsEditable && (
                <Button 
                  onClick={() => setIsFieldsEditable(true)} 
                  variant="outline"
                  className="bg-black text-white hover:bg-gray-800"
                  data-testid="button-enable-edit-company"
                >
                  Edit
                </Button>
              )}
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{translatedLabels.companyAccount}</CardTitle>
                <CardDescription>{translatedLabels.companyAccountDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="accountName">{translatedLabels.companyName}</Label>
                  <Input 
                    id="accountName" 
                    name="accountName" 
                    value={formData.accountName || ''} 
                    onChange={handleInputChange} 
                    placeholder={translatedLabels.enterCompanyName} 
                    data-testid="input-company-name"
                    readOnly={editingAccount && !isFieldsEditable}
                    disabled={editingAccount && !isFieldsEditable}
                    className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="legalEntityName">{translatedLabels.legalEntityName}</Label>
                  <Input 
                    id="legalEntityName" 
                    name="legalEntityName" 
                    value={formData.legalEntityName || ''} 
                    onChange={handleInputChange} 
                    placeholder={translatedLabels.legalCompanyName} 
                    data-testid="input-company-legal-name"
                    readOnly={editingAccount && !isFieldsEditable}
                    disabled={editingAccount && !isFieldsEditable}
                    className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="businessRegistrationNumber">{translatedLabels.businessRegistrationNumber}</Label>
                  <Input 
                    id="businessRegistrationNumber" 
                    name="businessRegistrationNumber" 
                    value={formData.businessRegistrationNumber || ''} 
                    onChange={handleInputChange} 
                    placeholder={translatedLabels.businessRegNumber} 
                    data-testid="input-business-registration"
                    readOnly={editingAccount && !isFieldsEditable}
                    disabled={editingAccount && !isFieldsEditable}
                    className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vatNumber">{translatedLabels.vatNumber}</Label>
                    <Input 
                      id="vatNumber" 
                      name="vatNumber" 
                      value={formData.vatNumber || ''} 
                      onChange={handleInputChange} 
                      placeholder={translatedLabels.vatRegistrationNumber} 
                      data-testid="input-vat-number"
                      readOnly={editingAccount && !isFieldsEditable}
                      disabled={editingAccount && !isFieldsEditable}
                      className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="incorporationDate">{translatedLabels.incorporationDateRequired}</Label>
                    <Input 
                      type="date" 
                      id="incorporationDate" 
                      name="incorporationDate" 
                      value={formData.incorporationDate || ''} 
                      onChange={handleInputChange} 
                      data-testid="input-company-incorporation-date"
                      readOnly={editingAccount && !isFieldsEditable}
                      disabled={editingAccount && !isFieldsEditable}
                      className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">Proof of Incorporation</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please upload official incorporation documents (Certificate of Incorporation, Articles of Association, etc.)
                  </p>
                  
                  <div>
                    <Label htmlFor="companyProofDocument">Incorporation Document</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="file"
                        id="companyProofDocument"
                        accept="image/*,.pdf"
                        onChange={(e) => setCompanyProofOfIncorporationFile(e.target.files?.[0] || null)}
                        disabled={uploadingCompanyDoc}
                        className="flex-1"
                        data-testid="input-company-proof-document"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (editingAccount?.id && companyProofOfIncorporationFile) {
                            handleCompanyProofUpload(editingAccount.id, companyProofOfIncorporationFile);
                          }
                        }}
                        disabled={!companyProofOfIncorporationFile || uploadingCompanyDoc || !editingAccount}
                        className="bg-black text-white hover:bg-gray-800 min-w-[100px]"
                        data-testid="button-upload-company-proof"
                      >
                        {uploadingCompanyDoc ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Upload'
                        )}
                      </Button>
                    </div>
                    {!editingAccount && companyProofOfIncorporationFile && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Document selected. It will be uploaded automatically when you create the account.
                      </p>
                    )}
                    {!editingAccount && !companyProofOfIncorporationFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        Select a proof of incorporation document. It will be uploaded automatically after account creation.
                      </p>
                    )}
                    {editingAccount && !companyProofOfIncorporationFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: Images (PNG, JPG, JPEG, GIF, WebP) or PDF. Max size: 5MB
                      </p>
                    )}
                    {editingAccount && companyProofOfIncorporationFile && (
                      <p className="text-xs text-blue-600 mt-1">
                        Click Upload to save the selected document
                      </p>
                    )}
                    
                    {editingAccount?.companyProofDocumentUrl ? (
                      <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">Document uploaded successfully</p>
                          <p className="text-xs text-green-600 mt-1">
                            Proof of incorporation has been received. You can upload a new document to replace it.
                          </p>
                        </div>
                      </div>
                    ) : editingAccount ? (
                      <div className="flex items-center gap-2 mt-2 p-3 bg-white border border-black rounded-md">
                        <AlertTriangle className="h-5 w-5 text-black flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black">Document upload required</p>
                          <p className="text-xs text-black mt-1">
                            Please upload proof of incorporation to complete verification.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="businessType">{translatedLabels.businessType}</Label>
                    <Select 
                      value={formData.businessType || ''} 
                      onValueChange={(v) => handleSelectChange('businessType', v)}
                      disabled={editingAccount && !isFieldsEditable}
                    >
                      <SelectTrigger data-testid="select-business-type" className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}>
                        <SelectValue placeholder={translatedLabels.selectType} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="for_profit">For Profit</SelectItem>
                        <SelectItem value="non_profit">Non-Profit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="industryType">{translatedLabels.industryLabel}</Label>
                    <Input 
                      id="industryType" 
                      name="industryType" 
                      value={formData.industryType || ''} 
                      onChange={handleInputChange} 
                      placeholder={translatedLabels.techRetailExample} 
                      data-testid="input-company-industry"
                      readOnly={editingAccount && !isFieldsEditable}
                      disabled={editingAccount && !isFieldsEditable}
                      className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberOfEmployees">{translatedLabels.numberOfEmployees}</Label>
                    <Select 
                      value={formData.numberOfEmployees || ''} 
                      onValueChange={(v) => handleSelectChange('numberOfEmployees', v)}
                      disabled={editingAccount && !isFieldsEditable}
                    >
                      <SelectTrigger data-testid="select-employee-count" className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}>
                        <SelectValue placeholder={translatedLabels.employeeCountLabel} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-10">0 - 10</SelectItem>
                        <SelectItem value="10-50">10 - 50</SelectItem>
                        <SelectItem value="50-250">50 - 250</SelectItem>
                        <SelectItem value="250-500">250 - 500</SelectItem>
                        <SelectItem value="500+">500+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="annualRevenue">{translatedLabels.annualRevenue}</Label>
                  <Select 
                    value={formData.annualRevenue || ''} 
                    onValueChange={(v) => handleSelectChange('annualRevenue', v)}
                    disabled={editingAccount && !isFieldsEditable}
                  >
                    <SelectTrigger data-testid="select-annual-revenue" className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}>
                      <SelectValue placeholder={translatedLabels.selectRevenueRangeLabel} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-100k">£0 - £100,000</SelectItem>
                      <SelectItem value="100k-500k">£100,000 - £500,000</SelectItem>
                      <SelectItem value="500k-1m">£500,000 - £1,000,000</SelectItem>
                      <SelectItem value="1m-10m">£1,000,000 - £10,000,000</SelectItem>
                      <SelectItem value="10m+">£10,000,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">{translatedLabels.registeredAddress}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="sm:col-span-3">
                        <Label htmlFor="registeredAddress">{translatedLabels.streetAddressLabel}</Label>
                        <Input 
                          id="registeredAddress" 
                          name="registeredAddress" 
                          value={formData.registeredAddress || ''} 
                          onChange={handleInputChange} 
                          placeholder={translatedLabels.streetAddress} 
                          data-testid="input-company-registered-address"
                          readOnly={editingAccount && !isFieldsEditable}
                          disabled={editingAccount && !isFieldsEditable}
                          className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="registeredHouseNumber">House Number *</Label>
                        <Input 
                          id="registeredHouseNumber" 
                          name="registeredHouseNumber" 
                          value={formData.registeredHouseNumber || ''} 
                          onChange={handleInputChange} 
                          placeholder="12345" 
                          maxLength={5}
                          required
                          data-testid="input-company-house-number"
                          readOnly={editingAccount && !isFieldsEditable}
                          disabled={editingAccount && !isFieldsEditable}
                          className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="registeredCity">{translatedLabels.cityLabel}</Label>
                        <Input 
                          id="registeredCity" 
                          name="registeredCity" 
                          value={formData.registeredCity || ''} 
                          onChange={handleInputChange} 
                          placeholder={translatedLabels.city} 
                          data-testid="input-company-registered-city"
                          readOnly={editingAccount && !isFieldsEditable}
                          disabled={editingAccount && !isFieldsEditable}
                          className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="registeredState">{translatedLabels.stateProvinceLabel}</Label>
                        <Input 
                          id="registeredState" 
                          name="registeredState" 
                          value={formData.registeredState || ''} 
                          onChange={handleInputChange} 
                          placeholder={translatedLabels.state} 
                          data-testid="input-company-registered-state"
                          readOnly={editingAccount && !isFieldsEditable}
                          disabled={editingAccount && !isFieldsEditable}
                          className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="registeredPostalCode">{translatedLabels.postalCodeLabel} *</Label>
                        <Input 
                          id="registeredPostalCode" 
                          name="registeredPostalCode" 
                          value={formData.registeredPostalCode || ''} 
                          onChange={handleInputChange} 
                          placeholder={translatedLabels.postalCode} 
                          required
                          data-testid="input-company-registered-postal"
                          readOnly={editingAccount && !isFieldsEditable}
                          disabled={editingAccount && !isFieldsEditable}
                          className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="registeredCountry">{translatedLabels.countryLabel}</Label>
                      <Input 
                        id="registeredCountry" 
                        name="registeredCountry" 
                        value={formData.registeredCountry || ''} 
                        onChange={handleInputChange} 
                        placeholder={translatedLabels.country} 
                        data-testid="input-company-registered-country"
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">Account Credentials</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyUsername">Username *</Label>
                      <Input 
                        id="companyUsername" 
                        name="companyUsername" 
                        value={formData.companyUsername || ''} 
                        onChange={(e) => {
                          handleInputChange(e);
                          if (e.target.value && !editingAccount) {
                            verifyUsername(e.target.value);
                          }
                        }}
                        placeholder="Enter company username" 
                        data-testid="input-company-username"
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                      />
                      {!editingAccount && formData.companyUsername && (
                        <div className="mt-1">
                          {isVerifyingUsername ? (
                            <p className="text-xs text-gray-500">Checking availability...</p>
                          ) : usernameMessage ? (
                            <p className={`text-xs ${usernameError ? 'text-red-600' : 'text-green-600'}`}>
                              {usernameMessage}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                    
                    {!editingAccount && (
                      <div>
                        <Label htmlFor="companyPassword">Password *</Label>
                        <Input 
                          type="password" 
                          id="companyPassword" 
                          name="companyPassword" 
                          value={formData.companyPassword || ''} 
                          onChange={handleInputChange}
                          placeholder="Enter secure password" 
                          data-testid="input-company-password"
                        />
                        {formData.companyPassword && passwordStrength && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    passwordStrength.score === 0 ? 'bg-red-500 w-1/4' :
                                    passwordStrength.score === 1 ? 'bg-orange-500 w-2/4' :
                                    passwordStrength.score === 2 ? 'bg-yellow-500 w-3/4' :
                                    passwordStrength.score === 3 ? 'bg-green-500 w-full' :
                                    'bg-green-600 w-full'
                                  }`}
                                />
                              </div>
                              <span className={`text-xs font-medium ${
                                passwordStrength.score === 0 ? 'text-red-600' :
                                passwordStrength.score === 1 ? 'text-orange-600' :
                                passwordStrength.score === 2 ? 'text-yellow-600' :
                                passwordStrength.score === 3 ? 'text-green-600' :
                                'text-green-700'
                              }`}>
                                {passwordStrength.strengthLabel}
                              </span>
                            </div>
                            {passwordStrength.feedback && (
                              <p className="text-xs text-gray-600 mt-1">{passwordStrength.feedback}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="companyEmail">Company Email (Private Domain Only) *</Label>
                      <Input 
                        type="email" 
                        id="companyEmail" 
                        name="companyEmail" 
                        value={formData.companyEmail || ''} 
                        onChange={(e) => {
                          handleInputChange(e);
                          const email = e.target.value;
                          if (email) {
                            const publicDomains = ['gmail.com', 'hotmail.com', 'live.com', 'outlook.com', 'yahoo.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com'];
                            const domain = email.split('@')[1]?.toLowerCase();
                            if (domain && publicDomains.includes(domain)) {
                              setCompanyEmailError('Please use a company domain email, not a public email provider');
                            } else {
                              setCompanyEmailError('');
                            }
                          } else {
                            setCompanyEmailError('');
                          }
                        }}
                        placeholder="contact@yourcompany.com" 
                        data-testid="input-company-email"
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                      />
                      {companyEmailError && (
                        <p className="text-xs text-red-600 mt-1">{companyEmailError}</p>
                      )}
                      {!companyEmailError && formData.companyEmail && formData.companyEmail.includes('@') && (
                        <p className="text-xs text-green-600 mt-1">✓ Valid company domain email</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">{translatedLabels.contactInformation}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">{translatedLabels.companyEmail}</Label>
                      <Input 
                        type="email" 
                        id="email" 
                        name="email" 
                        value={formData.email || ''} 
                        onChange={handleInputChange} 
                        placeholder={translatedLabels.companyEmailExample} 
                        data-testid="input-company-contact-email"
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                      />
                      <p className="text-xs text-gray-500 mt-1">Secondary contact email (optional)</p>
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">{translatedLabels.phoneNumber} *</Label>
                      <Input 
                        type="tel" 
                        id="phoneNumber" 
                        name="phoneNumber" 
                        value={formData.phoneNumber || ''} 
                        onChange={handleInputChange} 
                        placeholder={translatedLabels.phoneExample} 
                        data-testid="input-company-phone"
                        required
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">{translatedLabels.bankingInformation}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankName">{translatedLabels.bankNameLabel}</Label>
                      <Input 
                        id="bankName" 
                        name="bankName" 
                        value={formData.bankName || ''} 
                        onChange={handleInputChange} 
                        placeholder={translatedLabels.bankName} 
                        data-testid="input-bank-name"
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankAccountNumber">{translatedLabels.accountNumberLabel}</Label>
                      <Input 
                        id="bankAccountNumber" 
                        name="bankAccountNumber" 
                        value={formData.bankAccountNumber || ''} 
                        onChange={handleInputChange} 
                        placeholder={translatedLabels.accountNumber} 
                        data-testid="input-bank-account"
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="bankSwiftCode">{translatedLabels.swiftCode}</Label>
                      <Input 
                        id="bankSwiftCode" 
                        name="bankSwiftCode" 
                        value={formData.bankSwiftCode || ''} 
                        onChange={handleInputChange} 
                        placeholder={translatedLabels.swiftCode} 
                        data-testid="input-swift-code"
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankIban">{translatedLabels.iban}</Label>
                      <Input 
                        id="bankIban" 
                        name="bankIban" 
                        value={formData.bankIban || ''} 
                        onChange={handleInputChange} 
                        placeholder={translatedLabels.iban} 
                        data-testid="input-iban"
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">Compliance</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="purposeOfAccount">{translatedLabels.purposeOfAccountLabel}</Label>
                      <Textarea 
                        id="purposeOfAccount" 
                        name="purposeOfAccount" 
                        value={formData.purposeOfAccount || ''} 
                        onChange={handleInputChange} 
                        placeholder={translatedLabels.describeBusinessPurpose} 
                        rows={3} 
                        data-testid="textarea-company-purpose"
                        readOnly={editingAccount && !isFieldsEditable}
                        disabled={editingAccount && !isFieldsEditable}
                        className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expectedTransactionVolume">{translatedLabels.expectedTransactionVolume} *</Label>
                      <Select 
                        value={formData.expectedTransactionVolume || ''} 
                        onValueChange={(v) => handleSelectChange('expectedTransactionVolume', v)}
                        disabled={editingAccount && !isFieldsEditable}
                      >
                        <SelectTrigger data-testid="select-company-transaction-volume" className={editingAccount && !isFieldsEditable ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}>
                          <SelectValue placeholder={translatedLabels.selectExpectedVolumeLabel} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{translatedLabels.lowVolumeCompany}</SelectItem>
                          <SelectItem value="medium">{translatedLabels.mediumVolumeCompany}</SelectItem>
                          <SelectItem value="high">{translatedLabels.highVolumeCompany}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-3">Ultimate Beneficial Owners (UBOs)</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Provide information to identify and verify individuals who ultimately own or control the business
                      </p>
                      <div className="space-y-4">
                        {(formData.uboMembers || ['']).map((member: string, index: number) => {
                          const isFirstMember = index === 0;
                          const isDisabled = isFirstMember || (editingAccount && !isFieldsEditable);
                          
                          return (
                          <div key={index} className={`space-y-2 p-3 border rounded-md ${isFirstMember ? 'bg-gray-50' : ''}`}>
                            {isFirstMember && (
                              <p className="text-xs text-gray-600 mb-2 italic">
                                Primary account holder (auto-filled from your profile)
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <Input
                                  value={member}
                                  onChange={(e) => {
                                    if (!isFirstMember) {
                                      const newMembers = [...(formData.uboMembers || [''])];
                                      newMembers[index] = e.target.value;
                                      setFormData({ ...formData, uboMembers: newMembers });
                                    }
                                  }}
                                  placeholder={`UBO Member ${index + 1} Name`}
                                  data-testid={`input-ubo-member-${index}`}
                                  readOnly={isDisabled}
                                  disabled={isDisabled}
                                  className={isDisabled ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}
                                />
                              </div>
                              {(formData.uboMembers || ['']).length > 1 && !isFirstMember && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newMembers = (formData.uboMembers || ['']).filter((_: string, i: number) => i !== index);
                                    setFormData({ ...formData, uboMembers: newMembers });
                                  }}
                                  disabled={editingAccount && !isFieldsEditable}
                                  data-testid={`button-remove-ubo-${index}`}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  if (!isFirstMember) {
                                    const file = e.target.files?.[0] || null;
                                    const newFiles = [...(formData.uboProofFiles || [])];
                                    newFiles[index] = file;
                                    setFormData({ ...formData, uboProofFiles: newFiles });
                                  }
                                }}
                                disabled={isDisabled || uploadingCompanyDoc}
                                className={`flex-1 ${isFirstMember ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                data-testid={`input-ubo-proof-${index}`}
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  const file = formData.uboProofFiles?.[index];
                                  if (editingAccount?.id && file) {
                                    handleCompanyProofUpload(editingAccount.id, file);
                                  }
                                }}
                                disabled={isFirstMember || !formData.uboProofFiles?.[index] || uploadingCompanyDoc || !editingAccount}
                                className="bg-black text-white hover:bg-gray-800 min-w-[100px] disabled:opacity-50"
                                data-testid={`button-upload-ubo-proof-${index}`}
                              >
                                {uploadingCompanyDoc ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  'Upload ID'
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              {isFirstMember 
                                ? 'Upload proof of identity via your main profile KYC section'
                                : `Upload proof of identity for ${member || `UBO Member ${index + 1}`}`
                              }
                            </p>
                            
                            <div className="pt-2">
                              <Label className="text-sm font-medium mb-2 block">
                                Is this director or owner classified as a Politically Exposed Person (PEP)?
                              </Label>
                              <RadioGroup 
                                value={formData.uboPepStatus?.[index] ? 'yes' : 'no'} 
                                onValueChange={(value) => {
                                  if (!isFirstMember) {
                                    const newPepStatus = [...(formData.uboPepStatus || [])];
                                    newPepStatus[index] = value === 'yes';
                                    setFormData({ ...formData, uboPepStatus: newPepStatus });
                                  }
                                }}
                                disabled={isDisabled}
                                className="flex gap-6"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem 
                                    value="yes" 
                                    id={`ubo-pep-yes-${index}`}
                                    data-testid={`radio-ubo-pep-yes-${index}`}
                                    disabled={isDisabled}
                                  />
                                  <Label htmlFor={`ubo-pep-yes-${index}`} className={`font-normal ${isDisabled ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer'}`}>Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem 
                                    value="no" 
                                    id={`ubo-pep-no-${index}`}
                                    data-testid={`radio-ubo-pep-no-${index}`}
                                    disabled={isDisabled}
                                  />
                                  <Label htmlFor={`ubo-pep-no-${index}`} className={`font-normal ${isDisabled ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer'}`}>No</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>
                        );
                        })}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newMembers = [...(formData.uboMembers || ['']), ''];
                            setFormData({ ...formData, uboMembers: newMembers });
                          }}
                          disabled={editingAccount && !isFieldsEditable}
                          data-testid="button-add-ubo-member"
                          className="w-full"
                        >
                          + Add UBO Member
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full bg-black text-white hover:bg-gray-800" data-testid="button-submit-company">
                  {editingAccount ? translatedLabels.update : translatedLabels.create} {translatedLabels.companyAccount}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black">
          {translatedLabels.proxyAccounts}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {translatedLabels.manageProxyAccountsDesc}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : !proxyAccounts || (Array.isArray(proxyAccounts) && proxyAccounts.length === 0) ? (
        <Card className="border-0 shadow-none">
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black mb-2">{translatedLabels.noProxyAccounts}</h3>
              <p className="text-gray-600 mb-4">
                {translatedLabels.noProxyAccountsDesc}
              </p>
              <Button onClick={handleCreate} className="bg-black text-white hover:bg-gray-800" data-testid="button-create-first-account">
                {translatedLabels.createAccount}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="grid gap-4 mb-6">
            {Array.isArray(proxyAccounts) && proxyAccounts.map((account: any) => (
              <Card key={account.id} data-testid={`card-proxy-account-${account.id}`}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={account.profilePicture} alt={account.accountName} />
                          <AvatarFallback className="bg-black text-white">
                            {account.accountName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-black">{account.accountName}</CardTitle>
                      </div>
                      <CardDescription className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
                        <span className="capitalize">
                          {translateAccountField(account.accountType)}
                        </span>
                        <span>•</span>
                        <span className="capitalize">
                          {translateAccountField(account.status)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-row sm:flex-row gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => handleEdit(account)} data-testid={`button-edit-${account.id}`}>
                        {translatedLabels.edit}
                      </Button>
                      <Button size="sm" className="flex-1 sm:flex-none bg-black text-white hover:bg-gray-800" onClick={() => handleDelete(account.id)} data-testid={`button-delete-${account.id}`}>
                        {translatedLabels.deleteButton}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {account.accountType === 'kids' && (
                      <>
                        <div>
                          <span className="font-semibold">{translatedLabels.guardianColon}</span> {account.guardianFullName}
                        </div>
                        <div>
                          <span className="font-semibold">{translatedLabels.relationshipColon}</span> {account.guardianRelationship}
                        </div>
                        <div>
                          <span className="font-semibold">{translatedLabels.ageColon}</span> {account.childAge} {translatedLabels.yearsLabel}
                        </div>
                      </>
                    )}
                    {(account.accountType === 'organization' || account.accountType === 'company') && (
                      <>
                        <div>
                          <span className="font-semibold">{translatedLabels.legalNameColon}</span> {account.legalEntityName}
                        </div>
                        <div>
                          <span className="font-semibold">{translatedLabels.registrationColon}</span> {account.businessRegistrationNumber}
                        </div>
                        <div>
                          <span className="font-semibold">{translatedLabels.emailColon}</span> {account.email}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button onClick={handleCreate} className="w-full bg-black text-white hover:bg-gray-800" data-testid="button-create-another-account">
            {translatedLabels.createAccount}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { translateText } = useMasterTranslation();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [profileSubSection, setProfileSubSection] = useState('');
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [showAffiliationDialog, setShowAffiliationDialog] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCareerEditMode, setIsCareerEditMode] = useState(false);
  const [isComplianceEditMode, setIsComplianceEditMode] = useState(false);
  const [proofOfAddressFile, setProofOfAddressFile] = useState<File | null>(null);
  const [sourceOfIncomeFile, setSourceOfIncomeFile] = useState<File | null>(null);
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idSelfieFile, setIdSelfieFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [kidsVerificationFile, setKidsVerificationFile] = useState<File | null>(null);
  const [uploadingKidsDoc, setUploadingKidsDoc] = useState(false);

  // Define translatable texts for the profile settings page
  const profileTexts = useMemo(() => [
    "Profile Preferences",
    "Profile",
    "Shipping", 
    "Billing",
    "Dating Account",
    "Profile Picture",
    "Update your profile photo",
    "Change Picture",
    "Personal Information",
    "Update your personal details",
    "Profile Handle Name",
    "This is your unique username used to identify you on the platform.",
    "Full Name",
    "Bio",
    "Add Bio",
    "Date of Birth",
    "Gender",
    "Select your gender",
    "Male",
    "Female", 
    "Other",
    "Location",
    "Update your location information",
    "Region",
    "Country",
    "City",
    "Vendor Account",
    "Not Active",
    "Don't have a vendor account yet?",
    "Click here to activate your account",
    "Shipping Information",
    "Update your shipping details",
    "First Name",
    "Last Name", 
    "Phone Number",
    "Address",
    "State/Province",
    "ZIP/Postal Code",
    "Special Instructions",
    "Billing Information",
    "Update your billing details",
    "Use shipping address as billing address",
    "Save Changes",
    "Saving...",
    "Profile updated successfully!",
    "Failed to update profile. Please try again.",
    "Current Position",
    "Industry",
    "Select your industry",
    "Education",
    "Website",
    "Salary Range",
    "Select your salary range",
    "Technology",
    "Healthcare",
    "Finance",
    "Retail",
    "Manufacturing",
    "Real Estate",
    "Legal",
    "Marketing & Advertising",
    "Media & Entertainment",
    "Transportation & Logistics",
    "Hospitality & Tourism",
    "Construction",
    "Agriculture",
    "Energy & Utilities",
    "Other",
    "£0 - £50,000",
    "£50,000 - £100,000",
    "£100,000 - £500,000",
    "More than £500,000",
    "Enter child's full name",
    "Child's age",
    "Child's nationality",
    "Enter guardian's full name",
    "Select relationship",
    "ID/Passport number",
    "Explain the purpose of this account",
    "Enter organization name",
    "Legal registered name",
    "Organization registration number",
    "Tax identification number",
    "Street address",
    "State",
    "Postal code",
    "Describe the source of funds for this organization",
    "Describe the purpose of this account",
    "Select expected volume",
    "Enter company name",
    "Legal registered company name",
    "Business registration number",
    "VAT registration number",
    "Select type",
    "Employee count",
    "Select revenue range",
    "Bank name",
    "Account number",
    "SWIFT code",
    "IBAN",
    "Describe the source of company funds",
    "Describe the business purpose of this account",
    "Provide details about political exposure",
    "Please provide details about your political exposure",
    "Enter first name",
    "Enter last name",
    "Enter phone number",
    "Enter street address",
    "Enter house number",
    "Enter city",
    "Enter postcode",
    "Enter country",
    "Enter delivery instructions",
    "Enter any extra guidelines or landmarks to help find your address",
    "Save Shipping Information",
    "Save Billing Information",
    "Enter your occupation",
    "Enter surname",
    "Select region",
    "Save KYC Information",
    "Missing Required Information",
    "Please fill in all required location fields (Region, Country, and City).",
    "Age Requirement Not Met",
    "You must be at least 18 years old to use this platform.",
    "Username Change Limit Reached",
    "Africa",
    "Central America",
    "Central Asia",
    "East Asia",
    "Europe",
    "Middle East",
    "North America",
    "Oceania",
    "South America",
    "South Asia",
    "Are you sure you want to delete this proxy account?",
    "Success",
    "Proxy account deleted successfully",
    "Error",
    "Failed to delete proxy account",
    "Proxy account updated successfully",
    "Proxy account created successfully",
    "Validation Error",
    "Failed to save proxy account",
    "Edit",
    "Create",
    "Proxy Account",
    "← Back to Menu",
    "Kids Account (Under 18)",
    "Create an account for a child with guardian verification",
    "Guardian Information",
    "KYC Information",
    "Child's Full Name *",
    "Date of Birth *",
    "Age",
    "Nationality",
    "Guardian's Full Name *",
    "Relationship *",
    "Guardian ID Number *",
    "Guardian Email *",
    "Guardian Phone *",
    "Purpose of Account",
    "Update",
    "Kids Account",
    "Organization Name *",
    "Legal Entity Name *",
    "Registration Number *",
    "Incorporation Date",
    "Street Address *",
    "City *",
    "State/Province",
    "Postal Code",
    "Country *",
    "Organization Email *",
    "AML Compliance",
    "Expected Transaction Volume",
    "Parent",
    "Legal Guardian",
    "Grandparent",
    "Other",
    "Low (< $10,000/month)",
    "Medium ($10,000 - $100,000/month)",
    "High (> $100,000/month)",
    "e.g., Healthcare, Education",
    "Company Name *",
    "Business Registration Number *",
    "VAT Number",
    "Incorporation Date *",
    "Business Type *",
    "Industry *",
    "Number of Employees",
    "Annual Revenue (Approximate)",
    "Company Email *",
    "Banking Information",
    "Bank Name",
    "Account Number",
    "Select revenue range",
    "$0 - $100,000",
    "$100,000 - $500,000",
    "$500,000 - $1,000,000",
    "$1,000,000 - $10,000,000",
    "$10,000,000+",
    "company@example.com",
    "Low (< $25,000/month)",
    "Medium ($25,000 - $250,000/month)",
    "High (> $250,000/month)",
    "Select expected volume",
    "LLC",
    "Corporation",
    "Partnership",
    "Sole Proprietorship",
    "e.g., Technology, Retail",
    "Employee count",
    "AML/KYC Compliance",
    "Guardian:",
    "Relationship:",
    "years",
    "Legal Name:",
    "Registration:",
    "Delete",
    "Organization Account",
    "Create an account for a non-profit or organization",
    "Company Account",
    "Create a business account",
    "Registered Address",
    "Contact Information",
    "Source of Funds",
    "Source of Funds *",
    "Any directors/owners are Politically Exposed Persons (PEP)",
    "PEP Details *",
    "Proxy Accounts",
    "Manage kids, organization, and company accounts",
    "No Proxy Accounts",
    "You haven't created any proxy accounts yet. Create one to manage accounts for kids, organizations, or companies.",
    "Create Account",
    "Edit",
    "Email:",
    "KYC Status:",
    "Age:",
    "guardian@example.com",
    "+1 234 567 8900",
    "org@example.com",
    "Enter first name",
    "Enter surname",
    "Select region",
    "e.g., Software Engineer, Product Manager",
    "e.g., Harvard University, MIT, Oxford",
    "https://yourwebsite.com",
    "Enter country",
    "Enter your occupation",
    "e.g., Salary, Business Income",
    "Please provide details about your political exposure",
    "ID Issue Country",
    "Occupation",
    "Source of Funds",
    "I am a Politically Exposed Person (PEP)",
    "Political Exposure Details",
    "Child name is required",
    "Date of birth is required",
    "Guardian name is required",
    "Relationship is required",
    "Guardian ID is required",
    "Valid email required",
    "Guardian phone is required",
    "Organization name is required",
    "Registration number is required",
    "Address is required",
    "City is required",
    "Country is required",
    "Phone number is required",
    "Source of funds description is required",
    "Purpose of account is required",
    "Company name is required",
    "Legal entity name is required",
    "Business registration number is required",
    "Tax ID number is required",
    "Incorporation date is required",
    "Business type is required",
    "Industry type is required",
    "Registered address is required",
    "State is required",
    "Postal code is required",
    "Expected transaction volume is required",
    "PEP details are required when directors/owners are Politically Exposed Persons",
    "Affiliation",
    "Your Affiliate Information",
    "Affiliate Number",
    "Your unique affiliate code",
    "Not enrolled in affiliate program",
    "Apply to become an affiliate partner to start earning commissions",
    "Apply Now",
    "Report Issue",
    "Report a Problem",
    "Issue submitted successfully",
    "Failed to submit issue",
    "Describe the issue you're experiencing",
    "Enter your message here...",
    "Send Report",
    "Cancel",
    "Sending...",
    "Back to Profile",
    "Profile Information",
    "Username",
    "Enter username",
    "changes remaining",
    "change remaining",
    "remaining",
    "Resets in",
    "days",
    "day",
    "Email",
    "Age",
    "Career Information",
    "Update your professional details",
    "Save Career Information",
    "Compliance",
    "Complete your identity verification",
    "ID Document Type",
    "Select document type",
    "Passport",
    "National ID",
    "Driver's License",
    "ID Document Number",
    "Enter document number",
    "ID Expiry Date",
    "Career",
    "Compliance",
    "Affiliate Code",
    "Enter affiliate code",
    "Add Affiliation",
    "Enter your affiliate partner code to link your account",
    "Affiliated With",
    "Submit",
    "Affiliate Code Required",
    "Please enter an affiliate code",
    "Invalid Affiliate Code",
    "The affiliate code you entered is invalid",
    "Successfully Added",
    "Affiliate code added successfully",
    "Failed to Add",
    "Failed to add affiliate code. Please try again.",
    "Remove Affiliation",
    "Are you sure you want to remove this affiliation?",
    "Remove",
    "Keep",
    "Affiliation Removed",
    "Affiliation removed successfully",
    "Vendor Settings",
    "Products",
    "Orders",
    "Analytics",
    "Commissions",
    "Email verification will be required",
    "Yes",
    "No",
    "Are you a Politically Exposed Person (PEP)?",
    "Select answer",
    "kids",
    "company",
    "organization",
    "pending",
    "active",
    "suspended",
    "Government Account",
    "To set up a Government account, please reach out to us through our online form or send us an email.",
    "Contact Us",
    "Send Email",
    "House Number *",
    "Postcode *",
    "Delivery Instructions *",
    "Do we need any extra guidelines to find this address? *",
    "Dating Account Settings",
    "Manage your dating profile and visibility",
    "Dating Profile Status",
    "Your dating account is currently active",
    "Your dating account is currently inactive",
    "Activate Dating Account",
    "Deactivate Dating Account",
    "Create Dating Profile",
    "Activating your dating account will make your profile visible to other users",
    "Deactivating will hide your profile from other users",
    "Dating account activated successfully",
    "Dating account deactivated successfully",
    "Failed to update dating account status",
    "You haven't created any Dating accounts yet. Create one to find love/friendship on our platform.",
    "Go to Dating Profile",
    "You haven't created any Vendor accounts yet. Create one to buy/sell on our platform.",
    "Activate Vendor Account"
  ], []);

  // Use master translation system for consistent auto-translation
  const { translations: translatedTexts } = useMasterBatchTranslation(profileTexts, 'high');

  // Fetch vendor data if user is a vendor
  const { data: vendorData } = useQuery({
    queryKey: ['/api/vendors/me'],
    queryFn: async () => {
      const response = await fetch('/api/vendors/me');
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch vendor profile');
      }
      return response.json();
    },
    enabled: !!user && !!user.isVendor,
    retry: false,
  });

  // Fetch affiliate partner data
  const { data: affiliatePartner } = useQuery({
    queryKey: ['/api/affiliate-partnership/profile'],
    enabled: !!user,
  });

  // Fetch dating profile data (optional - may not exist)
  const { data: datingProfile, refetch: refetchDatingProfile } = useQuery({
    queryKey: ['/api/dating/profile'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dating/profile', {
          credentials: 'include'
        });
        if (response.status === 404) {
          // Dating profile doesn't exist yet - this is normal
          return null;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch dating profile');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching dating profile:', error);
        return null; // Return null on any error to prevent blocking the UI
      }
    },
    enabled: !!user,
    retry: false, // Don't retry on errors
  });

  // Memoize translated labels to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    userSettings: translatedTexts[0] || "Profile Preferences",
    profile: translatedTexts[1] || "Profile",
    shipping: translatedTexts[2] || "Shipping",
    billing: translatedTexts[3] || "Billing",
    datingAccount: translatedTexts[4] || "Dating Account",
    profilePicture: translatedTexts[5] || "Profile Picture",
    updateProfilePhoto: translatedTexts[6] || "Update your profile photo",
    changePicture: translatedTexts[7] || "Change Picture",
    personalInformation: translatedTexts[8] || "Personal Information",
    updatePersonalDetails: translatedTexts[9] || "Update your personal details",
    profileHandleName: translatedTexts[10] || "Profile Handle Name",
    uniqueUsername: translatedTexts[11] || "This is your unique username used to identify you on the platform.",
    fullName: translatedTexts[12] || "Full Name",
    bio: translatedTexts[13] || "Bio",
    addBio: translatedTexts[14] || "Add Bio",
    dateOfBirth: translatedTexts[15] || "Date of Birth",
    gender: translatedTexts[16] || "Gender",
    selectGender: translatedTexts[17] || "Select your gender",
    male: translatedTexts[18] || "Male",
    female: translatedTexts[19] || "Female",
    other: translatedTexts[20] || "Other",
    location: translatedTexts[21] || "Location",
    updateLocationInfo: translatedTexts[22] || "Update your location information",
    region: translatedTexts[23] || "Region",
    country: translatedTexts[24] || "Country",
    city: translatedTexts[25] || "City",
    vendorAccount: translatedTexts[26] || "Vendor Account",
    notActive: translatedTexts[27] || "Not Active",
    noVendorAccount: translatedTexts[28] || "Don't have a vendor account yet?",
    clickToActivate: translatedTexts[29] || "Click here to activate your account",
    shippingInformation: translatedTexts[30] || "Shipping Information",
    updateShippingDetails: translatedTexts[31] || "Update your shipping details",
    firstName: translatedTexts[32] || "First Name",
    lastName: translatedTexts[33] || "Last Name",
    phoneNumber: translatedTexts[34] || "Phone Number",
    address: translatedTexts[35] || "Address",
    stateProvince: translatedTexts[36] || "State/Province",
    zipPostalCode: translatedTexts[37] || "ZIP/Postal Code",
    specialInstructions: translatedTexts[38] || "Special Instructions",
    billingInformation: translatedTexts[39] || "Billing Information",
    updateBillingDetails: translatedTexts[40] || "Update your billing details",
    useShippingAsBilling: translatedTexts[41] || "Use shipping address as billing address",
    saveChanges: translatedTexts[42] || "Save Changes",
    saving: translatedTexts[43] || "Saving...",
    updateSuccess: translatedTexts[44] || "Profile updated successfully!",
    updateError: translatedTexts[45] || "Failed to update profile. Please try again.",
    currentPosition: translatedTexts[46] || "Current Position",
    industry: translatedTexts[47] || "Industry",
    selectIndustry: translatedTexts[48] || "Select your industry",
    education: translatedTexts[49] || "Education",
    website: translatedTexts[50] || "Website",
    salaryRange: translatedTexts[51] || "Salary Range",
    selectSalaryRange: translatedTexts[52] || "Select your salary range",
    industryTech: translatedTexts[53] || "Technology",
    industryHealthcare: translatedTexts[54] || "Healthcare",
    industryFinance: translatedTexts[55] || "Finance",
    industryEducation: translatedTexts[49] || "Education",
    industryRetail: translatedTexts[56] || "Retail",
    industryManufacturing: translatedTexts[57] || "Manufacturing",
    industryRealEstate: translatedTexts[58] || "Real Estate",
    industryLegal: translatedTexts[59] || "Legal",
    industryMarketing: translatedTexts[60] || "Marketing & Advertising",
    industryMedia: translatedTexts[61] || "Media & Entertainment",
    industryTransportation: translatedTexts[62] || "Transportation & Logistics",
    industryHospitality: translatedTexts[63] || "Hospitality & Tourism",
    industryConstruction: translatedTexts[64] || "Construction",
    industryAgriculture: translatedTexts[65] || "Agriculture",
    industryEnergy: translatedTexts[66] || "Energy & Utilities",
    industryOther: translatedTexts[67] || "Other",
    salary0to50k: translatedTexts[68] || "£0 - £50,000",
    salary50kto100k: translatedTexts[69] || "£50,000 - £100,000",
    salary100kto500k: translatedTexts[70] || "£100,000 - £500,000",
    salary500kPlus: translatedTexts[71] || "More than £500,000",
    enterChildName: translatedTexts[72] || "Enter child's full name",
    childAge: translatedTexts[73] || "Child's age",
    childNationality: translatedTexts[74] || "Child's nationality",
    enterGuardianName: translatedTexts[75] || "Enter guardian's full name",
    selectRelationship: translatedTexts[76] || "Select relationship",
    idPassportNumber: translatedTexts[77] || "ID/Passport number",
    explainPurposeAccount: translatedTexts[78] || "Explain the purpose of this account",
    enterOrgName: translatedTexts[79] || "Enter organization name",
    legalRegisteredName: translatedTexts[80] || "Legal registered name",
    orgRegistrationNumber: translatedTexts[81] || "Organization registration number",
    taxIdNumber: translatedTexts[82] || "Tax identification number",
    streetAddress: translatedTexts[83] || "Street address",
    state: translatedTexts[84] || "State",
    postalCode: translatedTexts[85] || "Postal code",
    describeSourceFundsOrg: translatedTexts[86] || "Describe the source of funds for this organization",
    describePurposeAccount: translatedTexts[87] || "Describe the purpose of this account",
    selectExpectedVolume: translatedTexts[88] || "Select expected volume",
    enterCompanyName: translatedTexts[89] || "Enter company name",
    legalCompanyName: translatedTexts[90] || "Legal registered company name",
    businessRegNumber: translatedTexts[91] || "Business registration number",
    vatRegistrationNumber: translatedTexts[92] || "VAT registration number",
    selectType: translatedTexts[93] || "Select type",
    employeeCount: translatedTexts[94] || "Employee count",
    selectRevenueRange: translatedTexts[95] || "Select revenue range",
    bankName: translatedTexts[96] || "Bank name",
    accountNumber: translatedTexts[97] || "Account number",
    swiftCode: translatedTexts[98] || "SWIFT code",
    iban: translatedTexts[99] || "IBAN",
    describeSourceFundsCompany: translatedTexts[100] || "Describe the source of company funds",
    describeBusinessPurpose: translatedTexts[101] || "Describe the business purpose of this account",
    providePepDetails: translatedTexts[102] || "Provide details about political exposure",
    providePepDetailsLong: translatedTexts[103] || "Please provide details about your political exposure",
    enterFirstName: translatedTexts[104] || "Enter first name",
    enterLastName: translatedTexts[105] || "Enter last name",
    enterPhoneNumber: translatedTexts[106] || "Enter phone number",
    enterStreetAddress: translatedTexts[107] || "Enter street address",
    enterHouseNumber: translatedTexts[108] || "Enter house number",
    enterCity: translatedTexts[109] || "Enter city",
    enterPostcode: translatedTexts[110] || "Enter postcode",
    enterCountry: translatedTexts[111] || "Enter country",
    enterDeliveryInstructions: translatedTexts[112] || "Enter delivery instructions",
    enterExtraGuidelines: translatedTexts[113] || "Enter any extra guidelines or landmarks to help find your address",
    saveShippingInfo: translatedTexts[114] || "Save Shipping Information",
    saveBillingInfo: translatedTexts[115] || "Save Billing Information",
    enterOccupation: translatedTexts[116] || "Enter your occupation",
    enterSurname: translatedTexts[117] || "Enter surname",
    selectRegion: translatedTexts[118] || "Select region",
    saveKycInfo: translatedTexts[119] || "Save KYC Information",
    missingRequiredInfo: translatedTexts[120] || "Missing Required Information",
    fillLocationFields: translatedTexts[121] || "Please fill in all required location fields (Region, Country, and City).",
    ageRequirementNotMet: translatedTexts[122] || "Age Requirement Not Met",
    mustBe18: translatedTexts[123] || "You must be at least 18 years old to use this platform.",
    usernameChangeLimitReached: translatedTexts[124] || "Username Change Limit Reached",
    regionAfrica: translatedTexts[125] || "Africa",
    regionCentralAmerica: translatedTexts[126] || "Central America",
    regionCentralAsia: translatedTexts[127] || "Central Asia",
    regionEastAsia: translatedTexts[128] || "East Asia",
    regionEurope: translatedTexts[129] || "Europe",
    regionMiddleEast: translatedTexts[130] || "Middle East",
    regionNorthAmerica: translatedTexts[131] || "North America",
    regionOceania: translatedTexts[132] || "Oceania",
    regionSouthAmerica: translatedTexts[133] || "South America",
    regionSouthAsia: translatedTexts[134] || "South Asia",
    confirmDeleteProxy: translatedTexts[135] || "Are you sure you want to delete this proxy account?",
    success: translatedTexts[136] || "Success",
    proxyAccountDeleted: translatedTexts[137] || "Proxy account deleted successfully",
    error: translatedTexts[138] || "Error",
    failedToDeleteProxy: translatedTexts[139] || "Failed to delete proxy account",
    proxyAccountUpdated: translatedTexts[140] || "Proxy account updated successfully",
    proxyAccountCreated: translatedTexts[141] || "Proxy account created successfully",
    validationError: translatedTexts[142] || "Validation Error",
    failedToSaveProxy: translatedTexts[143] || "Failed to save proxy account",
    edit: translatedTexts[144] || "Edit",
    create: translatedTexts[145] || "Create",
    proxyAccount: translatedTexts[146] || "Proxy Account",
    backToMenu: translatedTexts[147] || "← Back to Menu",
    kidsAccountTitle: translatedTexts[148] || "Kids Account (Under 18)",
    kidsAccountDesc: translatedTexts[149] || "Create an account for a child with guardian verification",
    guardianInformation: translatedTexts[150] || "Guardian Information",
    kycInformation: translatedTexts[151] || "KYC Information",
    childFullName: translatedTexts[152] || "Child's Full Name *",
    dateOfBirthLabel: translatedTexts[153] || "Date of Birth *",
    ageLabel: translatedTexts[154] || "Age",
    nationalityLabel: translatedTexts[155] || "Nationality",
    guardianFullName: translatedTexts[156] || "Guardian's Full Name *",
    relationshipLabel: translatedTexts[157] || "Relationship *",
    guardianIdNumber: translatedTexts[158] || "Guardian ID Number *",
    guardianEmailLabel: translatedTexts[159] || "Guardian Email *",
    guardianPhoneLabel: translatedTexts[160] || "Guardian Phone *",
    purposeOfAccountLabel: translatedTexts[161] || "Purpose of Account",
    update: translatedTexts[162] || "Update",
    kidsAccount: translatedTexts[163] || "Kids Account",
    organizationName: translatedTexts[164] || "Organization Name *",
    legalEntityName: translatedTexts[165] || "Legal Entity Name *",
    registrationNumber: translatedTexts[166] || "Registration Number *",
    incorporationDate: translatedTexts[167] || "Incorporation Date",
    streetAddressLabel: translatedTexts[168] || "Street Address *",
    cityLabel: translatedTexts[169] || "City *",
    stateProvinceLabel: translatedTexts[170] || "State/Province",
    postalCodeLabel: translatedTexts[171] || "Postal Code",
    countryLabel: translatedTexts[172] || "Country *",
    organizationEmail: translatedTexts[173] || "Organization Email *",
    amlCompliance: translatedTexts[174] || "AML Compliance",
    expectedTransactionVolume: translatedTexts[175] || "Expected Transaction Volume",
    parent: translatedTexts[176] || "Parent",
    legalGuardian: translatedTexts[177] || "Legal Guardian",
    grandparent: translatedTexts[178] || "Grandparent",
    otherRelation: translatedTexts[179] || "Other",
    lowVolume: translatedTexts[180] || "Low (< $10,000/month)",
    mediumVolume: translatedTexts[181] || "Medium ($10,000 - $100,000/month)",
    highVolume: translatedTexts[182] || "High (> $100,000/month)",
    industryExample: translatedTexts[183] || "e.g., Healthcare, Education",
    companyName: translatedTexts[184] || "Company Name *",
    businessRegistrationNumber: translatedTexts[185] || "Business Registration Number *",
    vatNumber: translatedTexts[186] || "VAT Number",
    incorporationDateRequired: translatedTexts[187] || "Incorporation Date *",
    businessType: translatedTexts[188] || "Business Type *",
    industryLabel: translatedTexts[189] || "Industry *",
    numberOfEmployees: translatedTexts[190] || "Number of Employees",
    annualRevenue: translatedTexts[191] || "Annual Revenue (Approximate)",
    companyEmail: translatedTexts[192] || "Company Email *",
    bankingInformation: translatedTexts[193] || "Banking Information",
    bankNameLabel: translatedTexts[194] || "Bank Name",
    accountNumberLabel: translatedTexts[195] || "Account Number",
    selectRevenueRangeLabel: translatedTexts[196] || "Select revenue range",
    revenue0to100k: translatedTexts[197] || "$0 - $100,000",
    revenue100kto500k: translatedTexts[198] || "$100,000 - $500,000",
    revenue500kto1m: translatedTexts[199] || "$500,000 - $1,000,000",
    revenue1mto10m: translatedTexts[200] || "$1,000,000 - $10,000,000",
    revenue10mPlus: translatedTexts[201] || "$10,000,000+",
    companyEmailExample: translatedTexts[202] || "company@example.com",
    lowVolumeCompany: translatedTexts[203] || "Low (< $25,000/month)",
    mediumVolumeCompany: translatedTexts[204] || "Medium ($25,000 - $250,000/month)",
    highVolumeCompany: translatedTexts[205] || "High (> $250,000/month)",
    selectExpectedVolumeLabel: translatedTexts[206] || "Select expected volume",
    llc: translatedTexts[207] || "LLC",
    corporation: translatedTexts[208] || "Corporation",
    partnership: translatedTexts[209] || "Partnership",
    soleProprietorship: translatedTexts[210] || "Sole Proprietorship",
    techRetailExample: translatedTexts[211] || "e.g., Technology, Retail",
    employeeCountLabel: translatedTexts[212] || "Employee count",
    amlKycCompliance: translatedTexts[213] || "AML/KYC Compliance",
    guardianColon: translatedTexts[214] || "Guardian:",
    relationshipColon: translatedTexts[215] || "Relationship:",
    yearsLabel: translatedTexts[216] || "years",
    legalNameColon: translatedTexts[217] || "Legal Name:",
    registrationColon: translatedTexts[218] || "Registration:",
    deleteButton: translatedTexts[219] || "Delete",
    organizationAccount: translatedTexts[220] || "Organization Account",
    organizationAccountDesc: translatedTexts[221] || "Create an account for a non-profit or organization",
    companyAccount: translatedTexts[222] || "Company Account",
    companyAccountDesc: translatedTexts[223] || "Create a business account",
    registeredAddress: translatedTexts[224] || "Registered Address",
    contactInformation: translatedTexts[225] || "Contact Information",
    sourceOfFunds: translatedTexts[226] || "Source of Funds",
    sourceOfFundsRequired: translatedTexts[227] || "Source of Funds *",
    pepLabel: translatedTexts[228] || "Any directors/owners are Politically Exposed Persons (PEP)",
    pepDetailsRequired: translatedTexts[229] || "PEP Details *",
    proxyAccounts: translatedTexts[230] || "Proxy Accounts",
    manageProxyAccountsDesc: translatedTexts[231] || "Manage kids, organization, and company accounts",
    noProxyAccounts: translatedTexts[232] || "No Proxy Accounts",
    noProxyAccountsDesc: translatedTexts[233] || "You haven't created any proxy accounts yet. Create one to manage accounts for kids, organizations, or companies.",
    createAccount: translatedTexts[234] || "Create Account",
    emailColon: translatedTexts[236] || "Email:",
    kycStatusColon: translatedTexts[237] || "KYC Status:",
    ageColon: translatedTexts[238] || "Age:",
    guardianEmailExample: translatedTexts[239] || "guardian@example.com",
    phoneExample: translatedTexts[240] || "+1 234 567 8900",
    orgEmailExample: translatedTexts[241] || "org@example.com",
    jobTitleExample: translatedTexts[245] || "e.g., Software Engineer, Product Manager",
    educationExample: translatedTexts[246] || "e.g., Harvard University, MIT, Oxford",
    websiteExample: translatedTexts[247] || "https://yourwebsite.com",
    incomeSourceExample: translatedTexts[250] || "e.g., Salary, Business Income",
    providePoliticalExposureDetails: translatedTexts[251] || "Please provide details about your political exposure",
    idIssueCountry: translatedTexts[252] || "ID Issue Country",
    occupation: translatedTexts[253] || "Occupation",
    sourceOfFundsLabel: translatedTexts[254] || "Source of Funds",
    iAmPep: translatedTexts[255] || "I am a Politically Exposed Person (PEP)",
    politicalExposureDetails: translatedTexts[256] || "Political Exposure Details",
    errorChildNameRequired: translatedTexts[257] || "Child name is required",
    errorDateOfBirthRequired: translatedTexts[258] || "Date of birth is required",
    errorGuardianNameRequired: translatedTexts[259] || "Guardian name is required",
    errorRelationshipRequired: translatedTexts[260] || "Relationship is required",
    errorGuardianIdRequired: translatedTexts[261] || "Guardian ID is required",
    errorValidEmailRequired: translatedTexts[262] || "Valid email required",
    errorGuardianPhoneRequired: translatedTexts[263] || "Guardian phone is required",
    errorOrganizationNameRequired: translatedTexts[264] || "Organization name is required",
    errorRegistrationNumberRequired: translatedTexts[265] || "Registration number is required",
    errorAddressRequired: translatedTexts[266] || "Address is required",
    errorCityRequired: translatedTexts[267] || "City is required",
    errorCountryRequired: translatedTexts[268] || "Country is required",
    errorPhoneNumberRequired: translatedTexts[269] || "Phone number is required",
    errorSourceOfFundsRequired: translatedTexts[270] || "Source of funds description is required",
    errorPurposeOfAccountRequired: translatedTexts[271] || "Purpose of account is required",
    errorCompanyNameRequired: translatedTexts[272] || "Company name is required",
    errorLegalEntityNameRequired: translatedTexts[273] || "Legal entity name is required",
    errorBusinessRegistrationNumberRequired: translatedTexts[274] || "Business registration number is required",
    errorTaxIdNumberRequired: translatedTexts[275] || "Tax ID number is required",
    errorIncorporationDateRequired: translatedTexts[276] || "Incorporation date is required",
    errorBusinessTypeRequired: translatedTexts[277] || "Business type is required",
    errorIndustryTypeRequired: translatedTexts[278] || "Industry type is required",
    errorRegisteredAddressRequired: translatedTexts[279] || "Registered address is required",
    errorStateRequired: translatedTexts[280] || "State is required",
    errorPostalCodeRequired: translatedTexts[281] || "Postal code is required",
    errorExpectedTransactionVolumeRequired: translatedTexts[282] || "Expected transaction volume is required",
    errorPepDetailsRequired: translatedTexts[283] || "PEP details are required when directors/owners are Politically Exposed Persons",
    affiliation: translatedTexts[284] || "Affiliation",
    affiliateInformation: translatedTexts[285] || "Your Affiliate Information",
    affiliateNumber: translatedTexts[286] || "Affiliate Number",
    affiliateCodeDesc: translatedTexts[287] || "Your unique affiliate code",
    notEnrolled: translatedTexts[288] || "Not enrolled in affiliate program",
    applyToAffiliate: translatedTexts[289] || "Apply to become an affiliate partner to start earning commissions",
    applyNow: translatedTexts[290] || "Apply Now",
    reportIssue: translatedTexts[291] || "Report Issue",
    reportProblem: translatedTexts[292] || "Report a Problem",
    issueSubmittedSuccess: translatedTexts[293] || "Issue submitted successfully",
    issueSubmittedFailed: translatedTexts[294] || "Failed to submit issue",
    describeIssue: translatedTexts[295] || "Describe the issue you're experiencing",
    enterMessageHere: translatedTexts[296] || "Enter your message here...",
    sendReport: translatedTexts[297] || "Send Report",
    cancel: translatedTexts[298] || "Cancel",
    sending: translatedTexts[299] || "Sending...",
    backToProfile: translatedTexts[300] || "Back to Profile",
    profileInformation: translatedTexts[301] || "Profile Information",
    username: translatedTexts[302] || "Username",
    enterUsername: translatedTexts[303] || "Enter username",
    usernameChangesRemainingPlural: translatedTexts[304] || "changes remaining",
    usernameChangesRemaining: translatedTexts[305] || "change remaining",
    remaining: translatedTexts[306] || "remaining",
    resetsIn: translatedTexts[307] || "Resets in",
    days: translatedTexts[308] || "days",
    day: translatedTexts[309] || "day",
    email: translatedTexts[310] || "Email",
    age: translatedTexts[311] || "Age",
    careerInformation: translatedTexts[312] || "Career Information",
    updateProfessionalDetails: translatedTexts[313] || "Update your professional details",
    saveCareerInformation: translatedTexts[314] || "Save Career Information",
    kycCompliance: translatedTexts[315] || "Compliance",
    completeIdentityVerification: translatedTexts[316] || "Complete your identity verification",
    idDocumentType: translatedTexts[317] || "ID Document Type",
    selectDocumentType: translatedTexts[318] || "Select document type",
    passport: translatedTexts[319] || "Passport",
    nationalId: translatedTexts[320] || "National ID",
    driversLicense: translatedTexts[321] || "Driver's License",
    idDocumentNumber: translatedTexts[322] || "ID Document Number",
    enterDocumentNumber: translatedTexts[323] || "Enter document number",
    idExpiryDate: translatedTexts[324] || "ID Expiry Date",
    career: translatedTexts[325] || "Career",
    compliance: translatedTexts[326] || "Compliance",
    affiliateCode: translatedTexts[327] || "Affiliate Code",
    enterAffiliateCode: translatedTexts[328] || "Enter affiliate code",
    addAffiliation: translatedTexts[329] || "Add Affiliation",
    enterAffiliatePartnerCode: translatedTexts[330] || "Enter your affiliate partner code to link your account",
    affiliatedWith: translatedTexts[331] || "Affiliated With",
    submit: translatedTexts[332] || "Submit",
    affiliateCodeRequired: translatedTexts[333] || "Affiliate Code Required",
    pleaseEnterAffiliateCode: translatedTexts[334] || "Please enter an affiliate code",
    invalidAffiliateCode: translatedTexts[335] || "Invalid Affiliate Code",
    affiliateCodeInvalid: translatedTexts[336] || "The affiliate code you entered is invalid",
    successfullyAdded: translatedTexts[337] || "Successfully Added",
    affiliateCodeAddedSuccess: translatedTexts[338] || "Affiliate code added successfully",
    failedToAdd: translatedTexts[339] || "Failed to Add",
    failedToAddAffiliateCode: translatedTexts[340] || "Failed to add affiliate code. Please try again.",
    removeAffiliation: translatedTexts[341] || "Remove Affiliation",
    confirmRemoveAffiliation: translatedTexts[342] || "Are you sure you want to remove this affiliation?",
    remove: translatedTexts[343] || "Remove",
    keep: translatedTexts[344] || "Keep",
    affiliationRemoved: translatedTexts[345] || "Affiliation Removed",
    affiliationRemovedSuccess: translatedTexts[346] || "Affiliation removed successfully",
    vendorSettings: translatedTexts[347] || "Vendor Settings",
    products: translatedTexts[348] || "Products",
    orders: translatedTexts[349] || "Orders",
    analytics: translatedTexts[350] || "Analytics",
    commissions: translatedTexts[351] || "Commissions",
    emailVerificationRequired: translatedTexts[352] || "Email verification will be required",
    yes: translatedTexts[353] || "Yes",
    no: translatedTexts[354] || "No",
    pepQuestion: translatedTexts[355] || "Are you a Politically Exposed Person (PEP)?",
    selectAnswer: translatedTexts[356] || "Select answer",
    verificationDocuments: translatedTexts[357] || "Verification Documents",
    uploadDocumentsText: translatedTexts[358] || "Please provide the following documents to confirm your identity:",
    proofOfAddress: translatedTexts[359] || "Proof of Address (Bank statement, Utility Bill, etc.)",
    sourceOfIncomeDoc: translatedTexts[360] || "Source of Income (Pay Slip, Contract, Bank statement showing last salary payment)",
    idBackAndFront: translatedTexts[361] || "ID back and front",
    pictureWithId: translatedTexts[362] || "Picture of you holding your ID",
    uploadDocuments: translatedTexts[363] || "Upload Documents",
    chooseFiles: translatedTexts[364] || "Choose files",
    documentsNotUploaded: translatedTexts[365] || "Documents Not Uploaded",
    pleaseUploadAllDocuments: translatedTexts[366] || "Please upload all 4 required documents to complete your identity verification.",
    documentsUploaded: translatedTexts[367] || "documents uploaded",
    filesSelected: translatedTexts[368] || "file(s) selected",
    uploadDocumentsButton: translatedTexts[369] || "Upload Documents",
    uploading: translatedTexts[370] || "Uploading...",
    documentsUploadedSuccess: translatedTexts[371] || "Verification documents uploaded successfully",
    upload: translatedTexts[372] || "Upload",
    uploaded: translatedTexts[373] || "Uploaded",
    chooseFile: translatedTexts[374] || "Choose file",
    uploadSuccess: translatedTexts[375] || "Document uploaded successfully",
    kids: translatedTexts[376] || "kids",
    company: translatedTexts[377] || "company",
    organization: translatedTexts[378] || "organization",
    pending: translatedTexts[379] || "pending",
    active: translatedTexts[380] || "active",
    suspended: translatedTexts[381] || "suspended",
    governmentAccount: translatedTexts[382] || "Government Account",
    governmentAccountDesc: translatedTexts[383] || "To set up a Government account, please reach out to us through our online form or send us an email.",
    contactUs: translatedTexts[384] || "Contact Us",
    sendEmail: translatedTexts[385] || "Send Email",
    houseNumber: translatedTexts[386] || "House Number *",
    postcode: translatedTexts[387] || "Postcode *",
    deliveryInstructions: translatedTexts[388] || "Delivery Instructions *",
    extraGuidelines: translatedTexts[389] || "Do we need any extra guidelines to find this address? *",
    datingAccountSettings: translatedTexts[390] || "Dating Account Settings",
    manageDatingProfile: translatedTexts[391] || "Manage your dating profile and visibility",
    datingProfileStatus: translatedTexts[392] || "Dating Profile Status",
    datingAccountActive: translatedTexts[393] || "Your dating account is currently active",
    datingAccountInactive: translatedTexts[394] || "Your dating account is currently inactive",
    activateDatingAccount: translatedTexts[395] || "Activate Dating Account",
    deactivateDatingAccount: translatedTexts[396] || "Deactivate Dating Account",
    createDatingProfile: translatedTexts[397] || "Create Dating Profile",
    activatingWillShow: translatedTexts[398] || "Activating your dating account will make your profile visible to other users",
    deactivatingWillHide: translatedTexts[399] || "Deactivating will hide your profile from other users",
    datingAccountActivated: translatedTexts[400] || "Dating account activated successfully",
    datingAccountDeactivated: translatedTexts[401] || "Dating account deactivated successfully",
    failedToUpdateDatingAccount: translatedTexts[402] || "Failed to update dating account status",
    needDatingProfileFirst: translatedTexts[403] || "You haven't created any Dating accounts yet. Create one to find love/friendship on our platform.",
    goToDatingProfile: translatedTexts[404] || "Go to Dating Profile",
    needVendorAccountFirst: translatedTexts[405] || "You haven't created any Vendor accounts yet. Create one to buy/sell on our platform.",
    activateVendorAccount: translatedTexts[406] || "Activate Vendor Account"
  }), [translatedTexts]);

  // Helper function to translate account type and status dynamically
  const translateAccountField = useMemo(() => (field: string): string => {
    const fieldLower = field?.toLowerCase();
    return (translatedLabels as any)[fieldLower] || field;
  }, [translatedLabels]);
  
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    surname: '',
    username: '',
    email: '',
    bio: '',
    avatar: '',
    region: '',
    country: '',
    city: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    preferredLanguage: '',
    // Professional profile fields
    currentPosition: '',
    industry: '',
    education: '',
    website: '',
    salaryRange: '',
    // KYC/AML fields
    idDocumentType: '',
    idDocumentNumber: '',
    idDocumentExpiryDate: '',
    idDocumentIssueCountry: '',
    occupation: '',
    isPoliticallyExposed: false,
    politicalExposureDetails: '',
    // Shipping Information
    shippingFirstName: '',
    shippingLastName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingHouseNumber: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: '',
    shippingSpecialInstructions: '',
    shippingExtraGuidelines: '',
    // Billing Information
    billingFirstName: '',
    billingLastName: '',
    billingPhone: '',
    billingAddress: '',
    billingHouseNumber: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: '',
    billingSpecialInstructions: '',
    billingExtraGuidelines: '',
    useShippingAsBilling: true
  });

  // Set vendor ID when vendor data is loaded
  useEffect(() => {
    if (vendorData?.vendor?.id) {
      setVendorId(vendorData.vendor.id);
    }
  }, [vendorData]);

  // Update form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        firstName: user.firstName || '',
        surname: user.surname || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        region: user.region || '',
        country: user.country || '',
        city: user.city || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        phone: user.phone || '',
        preferredLanguage: (user.preferredLanguage || 'en').toLowerCase(),
        // Professional profile fields
        currentPosition: user.currentPosition || '',
        industry: user.industry || '',
        education: user.education || '',
        website: user.website || '',
        salaryRange: user.salaryRange || '',
        // KYC/AML fields
        idDocumentType: user.idDocumentType || '',
        idDocumentNumber: user.idDocumentNumber || '',
        idDocumentExpiryDate: user.idDocumentExpiryDate || '',
        idDocumentIssueCountry: user.idDocumentIssueCountry || '',
        occupation: user.occupation || '',
        isPoliticallyExposed: user.isPoliticallyExposed || false,
        politicalExposureDetails: user.politicalExposureDetails || '',
        // Shipping Information
        shippingFirstName: user.shippingFirstName || '',
        shippingLastName: user.shippingLastName || '',
        shippingPhone: user.shippingPhone || '',
        shippingAddress: user.shippingAddress || '',
        shippingHouseNumber: user.shippingHouseNumber || '',
        shippingCity: user.shippingCity || '',
        shippingState: user.shippingState || '',
        shippingZipCode: user.shippingZipCode || '',
        shippingCountry: user.shippingCountry || '',
        shippingSpecialInstructions: user.shippingSpecialInstructions || '',
        shippingExtraGuidelines: user.shippingExtraGuidelines || '',
        // Billing Information
        billingFirstName: user.billingFirstName || '',
        billingLastName: user.billingLastName || '',
        billingPhone: user.billingPhone || '',
        billingAddress: user.billingAddress || '',
        billingHouseNumber: user.billingHouseNumber || '',
        billingCity: user.billingCity || '',
        billingState: user.billingState || '',
        billingZipCode: user.billingZipCode || '',
        billingCountry: user.billingCountry || '',
        billingSpecialInstructions: user.billingSpecialInstructions || '',
        billingExtraGuidelines: user.billingExtraGuidelines || '',
        useShippingAsBilling: user.useShippingAsBilling !== false
      });
    }
  }, [user]);

  // Check URL hash on mount to navigate to specific section
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash === 'profile-picture') {
      setActiveSection('profile');
      setProfileSubSection('profile-picture');
      window.history.replaceState(null, '', '/profile-settings');
    }
  }, []);

  // Reset edit mode when navigating away from Personal Information section
  useEffect(() => {
    if (profileSubSection !== 'personal-information') {
      setIsEditMode(false);
    }
  }, [profileSubSection]);

  // Reset career edit mode when navigating away from Career section
  useEffect(() => {
    if (profileSubSection !== 'career') {
      setIsCareerEditMode(false);
    }
  }, [profileSubSection]);

  // Reset compliance edit mode when navigating away from Compliance section
  useEffect(() => {
    if (profileSubSection !== 'compliance') {
      setIsComplianceEditMode(false);
    }
  }, [profileSubSection]);

  if (!user) {
    return (
      <div className="container flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setFormData(prev => ({
      ...prev,
      avatar: newAvatarUrl
    }));
    
    // Invalidate any queries that might use the user avatar
    invalidateUserRelatedQueries();
  };

  // Function to invalidate all user-related queries to ensure data consistency
  const invalidateUserRelatedQueries = () => {
    try {
      // Instead of individual invalidation, use broader patterns to catch all endpoints
      // This ensures all endpoints that might contain user data are refreshed
      
      // Invalidate all user-related endpoints
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Specific user endpoints
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      }
      
      if (user?.username) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.username}`] });
      }
      
      // Social content that might display user information
      queryClient.invalidateQueries({ queryKey: ['/api/social'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/comments'] });
      
      // For username changes - use a more aggressive approach to ensure consistency
      if (user?.username && formData.username && formData.username !== user.username) {
        console.log('Username changed, invalidating all queries for consistency');
        // Invalidate everything on username change as it affects many endpoints
        queryClient.invalidateQueries();
      }
      
      console.log('Invalidated all user-related queries for data consistency');
    } catch (error) {
      console.error('Error during cache invalidation:', error);
    }
  };

  const canChangeUsername = () => {
    if (!user.lastUsernameChange) return true;
    
    const daysSinceLastChange = Math.floor(
      (Date.now() - new Date(user.lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24)
    );
    const changeCount = user.usernameChangeCount || 0;
    
    if (daysSinceLastChange < 14 && changeCount >= 2) {
      return false;
    }
    
    if (daysSinceLastChange >= 14) {
      return true;
    }
    
    return changeCount < 2;
  };

  const getRemainingUsernameChanges = () => {
    if (!user.lastUsernameChange) return 2;
    
    const daysSinceLastChange = Math.floor(
      (Date.now() - new Date(user.lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24)
    );
    const changeCount = user.usernameChangeCount || 0;
    
    if (daysSinceLastChange >= 14) {
      return 2;
    }
    
    return Math.max(0, 2 - changeCount);
  };

  const getDaysUntilNextUsernameChange = () => {
    if (!user.lastUsernameChange) return 0;
    
    const daysSinceLastChange = Math.floor(
      (Date.now() - new Date(user.lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastChange >= 14) return 0;
    
    return 14 - daysSinceLastChange;
  };

  const handleDocumentUpload = async (file: File, docType: string, docName: string) => {
    if (!file) {
      toast({
        title: "No file selected",
        description: `Please select a ${docName} to upload.`,
        variant: "destructive",
      });
      return;
    }

    setUploadingDoc(docType);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const identifier = user?.username || user?.id;
      const response = await apiRequest('POST', `/api/users/${identifier}/verificationDocuments`, {
        documents: [{
          type: docType,
          data: base64Data
        }]
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }

      const data = await response.json();
      
      toast({
        title: translatedLabels.uploadSuccess,
        description: `${docName} uploaded successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });

    } catch (error) {
      console.error(`Error uploading ${docName}:`, error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : `Failed to upload ${docName}`,
        variant: "destructive",
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleKidsVerificationUpload = async (accountId: number, file: File) => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a verification document to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploadingKidsDoc(true);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await apiRequest('POST', `/api/proxy-accounts/${accountId}/kids-verification-document`, {
        documentData: base64Data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload verification document');
      }

      // Auto-activate Kids Account by updating status to 'verified'
      await apiRequest('PUT', `/api/proxy-accounts/${accountId}`, {
        status: 'verified'
      });

      toast({
        title: "Upload Successful",
        description: "Verification document uploaded successfully. Kids Account is now active!",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/proxy-accounts'] });
      setKidsVerificationFile(null);

    } catch (error) {
      console.error('Error uploading Kids verification document:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload verification document',
        variant: "destructive",
      });
    } finally {
      setUploadingKidsDoc(false);
    }
  };

  const handleProfileUpdate = async () => {
    // Validate required fields using formData
    const isRegionMissing = !formData.region;
    const isCountryMissing = !formData.country;
    const isCityMissing = !formData.city?.trim();

    if (isRegionMissing || isCountryMissing || isCityMissing) {
      setShowValidationErrors(true);
      toast({
        title: "Missing Required Information",
        description: "Please fill in all required location fields (Region, Country, and City).",
        variant: "destructive",
      });
      return;
    }

    // Validate username change
    if (formData.username !== user.username && !canChangeUsername()) {
      const daysUntil = getDaysUntilNextUsernameChange();
      toast({
        title: "Username Change Limit Reached",
        description: `You can only change your username twice every 14 days. Please try again in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}.`,
        variant: "destructive",
      });
      return;
    }

    // Validate age requirement
    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        toast({
          title: "Age Requirement Not Met",
          description: "You must be at least 18 years old to use this platform.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check if there are any changes first (before starting update)
    const hasChanges = 
        formData.name !== user.name || 
        formData.firstName !== (user.firstName || '') ||
        formData.surname !== (user.surname || '') ||
        formData.username !== user.username || 
        formData.email !== user.email ||
        formData.bio !== user.bio || 
        formData.avatar !== user.avatar ||
        formData.dateOfBirth !== user.dateOfBirth ||
        formData.gender !== user.gender ||
        formData.region !== user.region ||
        formData.country !== user.country ||
        formData.city !== user.city ||
        formData.phone !== (user.phone || '') ||
        formData.preferredLanguage !== (user.preferredLanguage || 'en').toLowerCase() ||
        // Professional profile fields
        formData.currentPosition !== (user.currentPosition || '') ||
        formData.industry !== (user.industry || '') ||
        formData.education !== (user.education || '') ||
        formData.website !== (user.website || '') ||
        formData.salaryRange !== (user.salaryRange || '') ||
        // KYC/AML fields
        formData.idDocumentType !== (user.idDocumentType || '') ||
        formData.idDocumentNumber !== (user.idDocumentNumber || '') ||
        formData.idDocumentExpiryDate !== (user.idDocumentExpiryDate || '') ||
        formData.idDocumentIssueCountry !== (user.idDocumentIssueCountry || '') ||
        formData.occupation !== (user.occupation || '') ||
        formData.isPoliticallyExposed !== (user.isPoliticallyExposed || false) ||
        formData.politicalExposureDetails !== (user.politicalExposureDetails || '') ||
        // Shipping fields
        formData.shippingFirstName !== (user.shippingFirstName || '') ||
        formData.shippingLastName !== (user.shippingLastName || '') ||
        formData.shippingPhone !== (user.shippingPhone || '') ||
        formData.shippingAddress !== (user.shippingAddress || '') ||
        formData.shippingCity !== (user.shippingCity || '') ||
        formData.shippingState !== (user.shippingState || '') ||
        formData.shippingZipCode !== (user.shippingZipCode || '') ||
        formData.shippingCountry !== (user.shippingCountry || '') ||
        formData.shippingSpecialInstructions !== (user.shippingSpecialInstructions || '') ||
        // Billing fields
        formData.billingFirstName !== (user.billingFirstName || '') ||
        formData.billingLastName !== (user.billingLastName || '') ||
        formData.billingPhone !== (user.billingPhone || '') ||
        formData.billingAddress !== (user.billingAddress || '') ||
        formData.billingCity !== (user.billingCity || '') ||
        formData.billingState !== (user.billingState || '') ||
        formData.billingZipCode !== (user.billingZipCode || '') ||
        formData.billingCountry !== (user.billingCountry || '') ||
        formData.useShippingAsBilling !== (user.useShippingAsBilling || false);
      
    if (!hasChanges) {
      toast({
        title: 'No changes detected',
        description: 'No changes were made to your profile',
      });
      return;
    }

    // Optimistic update: Create updated user data immediately
    const updatedUserData = {
      ...user,
      ...formData,
      id: user.id,
      updatedAt: new Date().toISOString()
    };

    // Immediately update UI - exit edit mode and gray out fields
    setIsEditMode(false);
    setIsCareerEditMode(false);
    setIsComplianceEditMode(false);

    // Optimistically update query cache for instant UI feedback
    queryClient.setQueryData(['/api/user'], updatedUserData);
    queryClient.setQueryData([`/api/users/${user.id}`], updatedUserData);
    if (formData.username && user.username !== formData.username) {
      queryClient.setQueryData([`/api/users/${formData.username}`], updatedUserData);
    }

    // Show instant success feedback
    toast({
      title: translatedLabels.updateSuccess,
      description: translatedLabels.updateSuccess,
    });

    // Update persistent storage
    try {
      updateUserData(updatedUserData as any);
    } catch (e) {
      console.error('Error saving user data to storage:', e);
    }

    // Now perform the actual API update in the background
    try {
      const emailChanged = formData.email !== user.email;
      
      // Handle email change separately
      if (emailChanged && formData.email) {
        try {
          await apiRequest('POST', '/api/auth/change-email/request', {
            newEmail: formData.email
          });
          toast({
            title: 'Email Verification Required',
            description: `A verification link has been sent to ${formData.email}. Please check your inbox and verify your new email address.`,
          });
        } catch (emailError) {
          console.error('Email change error:', emailError);
        }
      }

      // Prepare update data
      const updatedFormData = {
        ...formData,
        userId: user.id,
        ...(emailChanged ? { email: undefined } : {})
      };

      // Perform background update
      const response = await apiRequest('PATCH', '/api/users/profile', updatedFormData);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const errorText = await response.text();
          errorData = { message: errorText || 'Failed to update profile' };
        }
        throw new Error(errorData.message || `Failed to update profile: ${response.status}`);
      }

      // Silently refresh user data from server
      invalidateUserRelatedQueries();
      
    } catch (error) {
      console.error('Background profile update error:', error);
      // Revert optimistic update on error
      queryClient.setQueryData(['/api/user'], user);
      queryClient.setQueryData([`/api/users/${user.id}`], user);
      
      toast({
        title: translatedLabels.updateError,
        description: error instanceof Error ? error.message : 'Failed to sync profile updates',
        variant: 'destructive'
      });
    }
  };

  const handleReportIssue = async () => {
    if (!reportMessage.trim()) {
      toast({
        title: translatedLabels.issueSubmittedFailed,
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await apiRequest('POST', '/api/contact', {
        name: user.name || user.username,
        email: user.email,
        subject: 'Affiliate Issue Report',
        message: `Affiliate Code: ${user?.affiliatePartner || 'N/A'}\n\n${reportMessage}`
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      toast({
        title: translatedLabels.issueSubmittedSuccess,
        description: "We will review your report and get back to you soon."
      });

      setShowReportDialog(false);
      setReportMessage('');
    } catch (error) {
      toast({
        title: translatedLabels.issueSubmittedFailed,
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddAffiliation = async () => {
    if (!affiliateCode.trim()) {
      toast({
        title: translatedLabels.affiliateCodeRequired,
        description: translatedLabels.pleaseEnterAffiliateCode,
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await apiRequest('PUT', '/api/user/profile', {
        affiliatePartner: affiliateCode.trim()
      });

      if (!response.ok) {
        throw new Error(translatedLabels.affiliateCodeInvalid);
      }

      toast({
        title: translatedLabels.successfullyAdded,
        description: translatedLabels.affiliateCodeAddedSuccess
      });

      setShowAffiliationDialog(false);
      setAffiliateCode('');
      
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      toast({
        title: translatedLabels.failedToAdd,
        description: error instanceof Error ? error.message : translatedLabels.failedToAddAffiliateCode,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'profile', label: translatedLabels.profile },
    { id: 'proxy-accounts', label: translatedLabels.proxyAccounts },
    { id: 'shipping', label: translatedLabels.shipping },
    { id: 'billing', label: translatedLabels.billing },
    { id: 'dating-account', label: translatedLabels.datingAccount },
    ...(user.isVendor ? [
      { id: 'vendor-settings', label: translatedLabels.vendorSettings },
      { id: 'vendor-products', label: translatedLabels.products },
      { id: 'vendor-orders', label: translatedLabels.orders },
      { id: 'vendor-analytics', label: translatedLabels.analytics },
      { id: 'vendor-commissions', label: translatedLabels.commissions }
    ] : [
      { id: 'vendor-account', label: translatedLabels.vendorAccount }
    ])
  ];

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'vendor-settings':
        return user.isVendor && vendorId ? (
          <VendorSettings vendorId={vendorId} />
        ) : user.isVendor ? (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-black">Loading Vendor Settings...</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Please wait while we load your vendor information.</p>
              </CardContent>
            </Card>
          </div>
        ) : null;
      case 'vendor-products':
        return user.isVendor && vendorId ? (
          <VendorProductManagement vendorId={vendorId} />
        ) : user.isVendor ? (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-black">Loading Products...</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Please wait while we load your product information.</p>
              </CardContent>
            </Card>
          </div>
        ) : null;
      case 'vendor-orders':
        return user.isVendor && vendorId ? (
          <VendorOrderManagement vendorId={vendorId} />
        ) : user.isVendor ? (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-black">Loading Orders...</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Please wait while we load your order information.</p>
              </CardContent>
            </Card>
          </div>
        ) : null;
      case 'vendor-analytics':
        return user.isVendor ? <div className="p-6"><h2 className="text-2xl font-bold mb-4">Vendor Analytics</h2><p>Analytics content coming soon...</p></div> : null;
      case 'vendor-commissions':
        return user.isVendor && vendorId ? (
          <VendorCommissionDashboard vendorId={vendorId} />
        ) : user.isVendor ? (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-black">Loading Commission Data...</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Please wait while we load your commission information.</p>
              </CardContent>
            </Card>
          </div>
        ) : null;
      case 'dating-account':
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-black">
                  {translatedLabels.datingAccountSettings}
                </CardTitle>
                <CardDescription className="text-black">
                  {translatedLabels.needDatingProfileFirst}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!datingProfile ? (
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setLocation('/dating-profile')}
                      className="w-full bg-black text-white hover:bg-gray-800"
                      data-testid="button-create-dating-profile"
                    >
                      {translatedLabels.createDatingProfile}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-black text-base font-semibold">
                        {translatedLabels.datingProfileStatus}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {(datingProfile as any)?.isActive 
                          ? translatedLabels.datingAccountActive 
                          : translatedLabels.datingAccountInactive}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        {(datingProfile as any)?.isActive 
                          ? translatedLabels.deactivatingWillHide 
                          : translatedLabels.activatingWillShow}
                      </p>
                    </div>

                    <Button 
                      onClick={async () => {
                        try {
                          setIsUpdating(true);
                          const response = await apiRequest('/api/dating/profile/toggle-active', 'POST', {});
                          
                          if (response.ok) {
                            toast({
                              title: translatedLabels.success,
                              description: (datingProfile as any)?.isActive 
                                ? translatedLabels.datingAccountDeactivated 
                                : translatedLabels.datingAccountActivated
                            });
                            await refetchDatingProfile();
                          } else {
                            throw new Error('Failed to toggle dating account');
                          }
                        } catch (error) {
                          toast({
                            title: translatedLabels.error,
                            description: translatedLabels.failedToUpdateDatingAccount,
                            variant: "destructive"
                          });
                        } finally {
                          setIsUpdating(false);
                        }
                      }}
                      disabled={isUpdating}
                      className="w-full bg-black text-white hover:bg-gray-800"
                      data-testid="button-toggle-dating-account"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {translatedLabels.saving}
                        </>
                      ) : (
                        (datingProfile as any)?.isActive 
                          ? translatedLabels.deactivateDatingAccount 
                          : translatedLabels.activateDatingAccount
                      )}
                    </Button>

                    <Button 
                      variant="outline"
                      onClick={() => setLocation('/dating-profile')}
                      className="w-full"
                      data-testid="button-manage-dating-profile"
                    >
                      {translatedLabels.goToDatingProfile}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'vendor-account':
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-black">
                  {translatedLabels.vendorAccount}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-black">
                  {translatedLabels.needVendorAccountFirst}
                </p>
                <Button 
                  onClick={() => setLocation('/become-vendor')}
                  className="w-full bg-black text-white hover:bg-gray-800"
                  data-testid="button-activate-vendor"
                >
                  {translatedLabels.activateVendorAccount}
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'proxy-accounts':
        return <ProxyAccountsManager userId={user.id} currentUser={user} translatedLabels={translatedLabels} />;
      case 'shipping':
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-black">
                  {translatedLabels.shippingInformation}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingFirstName" className="text-black">{translatedLabels.firstName}</Label>
                    <Input
                      id="shippingFirstName"
                      name="shippingFirstName"
                      value={formData.shippingFirstName}
                      onChange={handleInputChange}
                      placeholder={translatedLabels.enterFirstName}
                      className="bg-white text-black"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingLastName" className="text-black">{translatedLabels.lastName}</Label>
                    <Input
                      id="shippingLastName"
                      name="shippingLastName"
                      value={formData.shippingLastName}
                      onChange={handleInputChange}
                      placeholder={translatedLabels.enterLastName}
                      className="bg-white text-black"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="shippingPhone" className="text-black">{translatedLabels.phoneNumber}</Label>
                  <Input
                    id="shippingPhone"
                    name="shippingPhone"
                    type="tel"
                    value={formData.shippingPhone}
                    onChange={handleInputChange}
                    placeholder={translatedLabels.enterPhoneNumber}
                    className="bg-white text-black"
                  />
                </div>

                <div>
                  <Label htmlFor="shippingAddress" className="text-black">{translatedLabels.address}</Label>
                  <Input
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    placeholder={translatedLabels.enterStreetAddress}
                    className="bg-white text-black"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="shippingHouseNumber" className="text-black">{translatedLabels.houseNumber}</Label>
                    <Input
                      id="shippingHouseNumber"
                      name="shippingHouseNumber"
                      value={formData.shippingHouseNumber || ''}
                      onChange={handleInputChange}
                      placeholder={translatedLabels.enterHouseNumber}
                      className="bg-white text-black"
                      required
                      data-testid="input-house-number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingZipCode" className="text-black">{translatedLabels.postcode}</Label>
                    <Input
                      id="shippingZipCode"
                      name="shippingZipCode"
                      value={formData.shippingZipCode || ''}
                      onChange={handleInputChange}
                      placeholder={translatedLabels.enterPostcode}
                      className="bg-white text-black"
                      required
                      data-testid="input-postcode"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingCity" className="text-black">{translatedLabels.cityLabel}</Label>
                    <Input
                      id="shippingCity"
                      name="shippingCity"
                      value={formData.shippingCity || ''}
                      onChange={handleInputChange}
                      placeholder={translatedLabels.enterCity}
                      className="bg-white text-black"
                      required
                      data-testid="input-shipping-city"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="shippingSpecialInstructions" className="text-black">{translatedLabels.deliveryInstructions}</Label>
                  <Textarea
                    id="shippingSpecialInstructions"
                    name="shippingSpecialInstructions"
                    value={formData.shippingSpecialInstructions || ''}
                    onChange={handleInputChange}
                    placeholder={translatedLabels.enterDeliveryInstructions}
                    rows={3}
                    className="bg-white text-black"
                    required
                    data-testid="textarea-delivery-instructions"
                  />
                </div>

                <div>
                  <Label htmlFor="shippingExtraGuidelines" className="text-black">{translatedLabels.extraGuidelines}</Label>
                  <Textarea
                    id="shippingExtraGuidelines"
                    name="shippingExtraGuidelines"
                    value={formData.shippingExtraGuidelines || ''}
                    onChange={handleInputChange}
                    placeholder={translatedLabels.enterExtraGuidelines}
                    rows={3}
                    className="bg-white text-black"
                    required
                    data-testid="textarea-extra-guidelines"
                  />
                </div>

                <Button 
                  onClick={handleProfileUpdate}
                  disabled={isUpdating}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {translatedLabels.saving}
                    </>
                  ) : (
                    translatedLabels.saveShippingInfo
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'billing':
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-black">
                  {translatedLabels.billingInformation}
                </CardTitle>
                <CardDescription className="text-black">
                  {translatedLabels.updateBillingDetails}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useShippingAsBilling"
                    checked={formData.useShippingAsBilling}
                    onChange={(e) => setFormData(prev => ({ ...prev, useShippingAsBilling: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="useShippingAsBilling" className="text-black">
                    {translatedLabels.useShippingAsBilling}
                  </Label>
                </div>

                {!formData.useShippingAsBilling && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingFirstName" className="text-black">{translatedLabels.firstName}</Label>
                        <Input
                          id="billingFirstName"
                          name="billingFirstName"
                          value={formData.billingFirstName}
                          onChange={handleInputChange}
                          placeholder={translatedLabels.enterFirstName}
                          className="bg-white text-black"
                          data-testid="input-billing-firstname"
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingLastName" className="text-black">{translatedLabels.lastName}</Label>
                        <Input
                          id="billingLastName"
                          name="billingLastName"
                          value={formData.billingLastName}
                          onChange={handleInputChange}
                          placeholder={translatedLabels.enterLastName}
                          className="bg-white text-black"
                          data-testid="input-billing-lastname"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="billingPhone" className="text-black">{translatedLabels.phoneNumber}</Label>
                      <Input
                        id="billingPhone"
                        name="billingPhone"
                        type="tel"
                        value={formData.billingPhone}
                        onChange={handleInputChange}
                        placeholder={translatedLabels.enterPhoneNumber}
                        className="bg-white text-black"
                        data-testid="input-billing-phone"
                      />
                    </div>

                    <div>
                      <Label htmlFor="billingAddress" className="text-black">{translatedLabels.address}</Label>
                      <Input
                        id="billingAddress"
                        name="billingAddress"
                        value={formData.billingAddress}
                        onChange={handleInputChange}
                        placeholder={translatedLabels.enterStreetAddress}
                        className="bg-white text-black"
                        data-testid="input-billing-address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="billingHouseNumber" className="text-black">{translatedLabels.houseNumber}</Label>
                        <Input
                          id="billingHouseNumber"
                          name="billingHouseNumber"
                          value={formData.billingHouseNumber || ''}
                          onChange={handleInputChange}
                          placeholder={translatedLabels.enterHouseNumber}
                          className="bg-white text-black"
                          required
                          data-testid="input-billing-house-number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingZipCode" className="text-black">{translatedLabels.postcode}</Label>
                        <Input
                          id="billingZipCode"
                          name="billingZipCode"
                          value={formData.billingZipCode || ''}
                          onChange={handleInputChange}
                          placeholder={translatedLabels.enterPostcode}
                          className="bg-white text-black"
                          required
                          data-testid="input-billing-postcode"
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingCity" className="text-black">{translatedLabels.cityLabel}</Label>
                        <Input
                          id="billingCity"
                          name="billingCity"
                          value={formData.billingCity || ''}
                          onChange={handleInputChange}
                          placeholder={translatedLabels.enterCity}
                          className="bg-white text-black"
                          required
                          data-testid="input-billing-city"
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button 
                  onClick={handleProfileUpdate}
                  disabled={isUpdating}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {translatedLabels.saving}
                    </>
                  ) : (
                    translatedLabels.saveBillingInfo
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'profile':
      default:
        return (
          <div className="p-6">
            {/* Profile Submenu Navigation - Only show when no subsection is selected */}
            {!profileSubSection && (
              <Card className="border-0">
                <CardHeader>
                  <CardTitle className="text-black">{translatedLabels.profileInformation}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    <button
                      onClick={() => setProfileSubSection("profile-picture")}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                      data-testid="button-nav-profile-picture"
                    >
                      <span className="text-sm font-medium text-gray-900">{translatedLabels.profilePicture}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setProfileSubSection("personal-information")}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                      data-testid="button-nav-personal-info"
                    >
                      <span className="text-sm font-medium text-gray-900">{translatedLabels.personalInformation}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setProfileSubSection("financial")}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                      data-testid="button-nav-financial"
                    >
                      <span className="text-sm font-medium text-gray-900">Financial</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setProfileSubSection("career")}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                      data-testid="button-nav-career"
                    >
                      <span className="text-sm font-medium text-gray-900">{translatedLabels.career}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setProfileSubSection("compliance")}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                      data-testid="button-nav-compliance"
                    >
                      <span className="text-sm font-medium text-gray-900">{translatedLabels.compliance}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setProfileSubSection("affiliation")}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                      data-testid="button-nav-affiliation"
                    >
                      <span className="text-sm font-medium text-gray-900">{translatedLabels.affiliation}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile Picture Section */}
            {profileSubSection === "profile-picture" && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setProfileSubSection("")}
                  className="mb-4"
                  data-testid="button-back-to-profile"
                >
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  {translatedLabels.backToProfile}
                </Button>
              <Card className="border-0">
                <CardHeader>
                  <CardTitle className="text-black">{translatedLabels.profilePicture}</CardTitle>
                  <CardDescription className="text-black">
                    {translatedLabels.updateProfilePhoto}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ProfilePictureUploader
                    userId={user.id}
                    username={user.username}
                    currentAvatar={formData.avatar || user.avatar || ''}
                    onUploadSuccess={handleAvatarUpdate}
                  />
                </CardContent>
              </Card>
              </div>
            )}

            {/* Personal Information Section */}
            {profileSubSection === "personal-information" && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setProfileSubSection("")}
                  className="mb-4"
                  data-testid="button-back-to-profile"
                >
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  {translatedLabels.backToProfile}
                </Button>
              <Card className="border-0">
                <CardHeader>
                  <CardTitle className="text-black">{translatedLabels.personalInformation}</CardTitle>
                  <CardDescription className="text-black">
                    {translatedLabels.updatePersonalDetails}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-black">{translatedLabels.firstName}</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder={translatedLabels.enterFirstName}
                        disabled={!isEditMode && !!formData.firstName}
                        className={!isEditMode && formData.firstName ? "bg-gray-100 text-gray-600" : "bg-white text-black"}
                        data-testid="input-firstname"
                      />
                    </div>
                    <div>
                      <Label htmlFor="surname" className="text-black">{translatedLabels.lastName}</Label>
                      <Input
                        id="surname"
                        name="surname"
                        value={formData.surname}
                        onChange={handleInputChange}
                        placeholder={translatedLabels.enterSurname}
                        disabled={!isEditMode && !!formData.surname}
                        className={!isEditMode && formData.surname ? "bg-gray-100 text-gray-600" : "bg-white text-black"}
                        data-testid="input-surname"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="username" className="text-black">{translatedLabels.username}</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder={translatedLabels.enterUsername}
                      disabled={!isEditMode && !!formData.username}
                      className={!isEditMode && formData.username ? "bg-gray-100 text-gray-600" : "bg-white text-black"}
                      data-testid="input-username"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      {getRemainingUsernameChanges()} {getRemainingUsernameChanges() !== 1 ? translatedLabels.usernameChangesRemainingPlural : translatedLabels.usernameChangesRemaining} {translatedLabels.remaining} 
                      {getDaysUntilNextUsernameChange() > 0 && ` (${translatedLabels.resetsIn} ${getDaysUntilNextUsernameChange()} ${getDaysUntilNextUsernameChange() !== 1 ? translatedLabels.days : translatedLabels.day})`}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="gender" className="text-black">{translatedLabels.gender}</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                      disabled={!isEditMode && !!formData.gender}
                    >
                      <SelectTrigger className={!isEditMode && formData.gender ? "bg-gray-100 text-gray-600" : "bg-white text-black"} data-testid="select-gender">
                        <SelectValue placeholder={translatedLabels.selectGender} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{translatedLabels.male}</SelectItem>
                        <SelectItem value="female">{translatedLabels.female}</SelectItem>
                        <SelectItem value="other">{translatedLabels.other}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth" className="text-black">{translatedLabels.dateOfBirth}</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      disabled={!isEditMode && !!formData.dateOfBirth}
                      className={!isEditMode && formData.dateOfBirth ? "bg-gray-100 text-gray-600" : "bg-white text-black"}
                      data-testid="input-dateofbirth"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bio" className="text-black">{translatedLabels.bio}</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder={translatedLabels.addBio}
                      rows={3}
                      disabled={!isEditMode && !!formData.bio}
                      className={!isEditMode && formData.bio ? "bg-gray-100 text-gray-600" : "bg-white text-black"}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-black">{translatedLabels.email}</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditMode && !!formData.email}
                        className={!isEditMode && formData.email ? "bg-gray-100 text-gray-600" : "bg-white text-black"}
                        data-testid="input-email"
                      />
                      {isEditMode && formData.email !== user.email && (
                        <p className="text-xs text-amber-600 mt-1">
                          {translatedLabels.emailVerificationRequired || 'Email verification will be required'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="text-black">{translatedLabels.phoneNumber}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder={translatedLabels.phoneExample}
                        disabled={!isEditMode && !!formData.phone}
                        className={!isEditMode && formData.phone ? "bg-gray-100 text-gray-600" : "bg-white text-black"}
                        data-testid="input-phone"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="region" className="text-black">{translatedLabels.region}</Label>
                      <Select
                        value={formData.region}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
                        disabled={!isEditMode && !!formData.region}
                      >
                        <SelectTrigger className={!isEditMode && formData.region ? "bg-gray-100 text-gray-600" : "bg-white text-black"} data-testid="select-region">
                          <SelectValue placeholder={translatedLabels.selectRegion} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa">Africa</SelectItem>
                          <SelectItem value="Central America">Central America</SelectItem>
                          <SelectItem value="Central Asia">Central Asia</SelectItem>
                          <SelectItem value="East Asia">East Asia</SelectItem>
                          <SelectItem value="Europe">Europe</SelectItem>
                          <SelectItem value="Middle East">Middle East</SelectItem>
                          <SelectItem value="North America">North America</SelectItem>
                          <SelectItem value="Oceania">Oceania</SelectItem>
                          <SelectItem value="South America">South America</SelectItem>
                          <SelectItem value="South Asia">South Asia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="country" className="text-black">{translatedLabels.country}</Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        disabled={!isEditMode && !!formData.country}
                        className={!isEditMode && formData.country ? "bg-gray-100 text-gray-600" : "bg-white text-black"}
                        data-testid="input-country"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="city" className="text-black">{translatedLabels.city}</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        disabled={!isEditMode && !!formData.city}
                        className={!isEditMode && formData.city ? "bg-gray-100 text-gray-600" : "bg-white text-black"}
                        data-testid="input-city"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="age" className="text-black">{translatedLabels.age}</Label>
                    <Input
                      id="age"
                      name="age"
                      value={formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : ''}
                      disabled
                      className="bg-gray-100 text-gray-600"
                      data-testid="input-age"
                    />
                  </div>

                  {isEditMode && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => setIsEditMode(false)}
                        className="flex-1"
                        data-testid="button-cancel-edit"
                      >
                        {translatedLabels.cancel}
                      </Button>
                      <Button 
                        onClick={() => {
                          handleProfileUpdate();
                          setIsEditMode(false);
                        }}
                        disabled={isUpdating}
                        className="flex-1 bg-black text-white hover:bg-gray-800"
                        data-testid="button-save-personal-info"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {translatedLabels.saving}
                          </>
                        ) : (
                          translatedLabels.saveChanges
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {!isEditMode && (
                    <Button 
                      onClick={() => setIsEditMode(true)}
                      className="w-full bg-black text-white hover:bg-gray-800"
                      data-testid="button-edit-bottom"
                    >
                      {translatedLabels.edit}
                    </Button>
                  )}
                </CardContent>
              </Card>
              </div>
            )}

            {/* Financial Section */}
            {profileSubSection === "financial" && (
              <FinancialSection
                onBack={() => setProfileSubSection("")}
                translatedLabels={translatedLabels}
              />
            )}

            {/* Career Section */}
            {profileSubSection === "career" && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setProfileSubSection("")}
                  className="mb-4"
                  data-testid="button-back-to-profile"
                >
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  {translatedLabels.backToProfile}
                </Button>
              <Card className="border-0">
                <CardHeader>
                  <CardTitle className="text-black">{translatedLabels.careerInformation}</CardTitle>
                  <CardDescription className="text-black">
                    {translatedLabels.updateProfessionalDetails}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPosition" className="text-black">{translatedLabels.currentPosition}</Label>
                    <Input
                      id="currentPosition"
                      name="currentPosition"
                      value={formData.currentPosition}
                      onChange={handleInputChange}
                      placeholder={translatedLabels.jobTitleExample}
                      className="bg-white text-black"
                      disabled={!isCareerEditMode && !!user.currentPosition}
                      style={{
                        backgroundColor: !isCareerEditMode && !!user.currentPosition ? '#e5e7eb' : '',
                        cursor: !isCareerEditMode && !!user.currentPosition ? 'not-allowed' : 'text'
                      }}
                      data-testid="input-current-position"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="industry" className="text-black">{translatedLabels.industry}</Label>
                    <Select 
                      value={formData.industry} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                      disabled={!isCareerEditMode && !!user.industry}
                    >
                      <SelectTrigger 
                        className="bg-white text-black" 
                        data-testid="select-industry"
                        style={{
                          backgroundColor: !isCareerEditMode && !!user.industry ? '#e5e7eb' : '',
                          cursor: !isCareerEditMode && !!user.industry ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <SelectValue placeholder={translatedLabels.selectIndustry} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">{translatedLabels.industryTech}</SelectItem>
                        <SelectItem value="healthcare">{translatedLabels.industryHealthcare}</SelectItem>
                        <SelectItem value="finance">{translatedLabels.industryFinance}</SelectItem>
                        <SelectItem value="education">{translatedLabels.industryEducation}</SelectItem>
                        <SelectItem value="retail">{translatedLabels.industryRetail}</SelectItem>
                        <SelectItem value="manufacturing">{translatedLabels.industryManufacturing}</SelectItem>
                        <SelectItem value="realestate">{translatedLabels.industryRealEstate}</SelectItem>
                        <SelectItem value="legal">{translatedLabels.industryLegal}</SelectItem>
                        <SelectItem value="marketing">{translatedLabels.industryMarketing}</SelectItem>
                        <SelectItem value="media">{translatedLabels.industryMedia}</SelectItem>
                        <SelectItem value="transportation">{translatedLabels.industryTransportation}</SelectItem>
                        <SelectItem value="hospitality">{translatedLabels.industryHospitality}</SelectItem>
                        <SelectItem value="construction">{translatedLabels.industryConstruction}</SelectItem>
                        <SelectItem value="agriculture">{translatedLabels.industryAgriculture}</SelectItem>
                        <SelectItem value="energy">{translatedLabels.industryEnergy}</SelectItem>
                        <SelectItem value="other">{translatedLabels.industryOther}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="salaryRange" className="text-black">{translatedLabels.salaryRange}</Label>
                    <Select 
                      value={formData.salaryRange} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, salaryRange: value }))}
                      disabled={!isCareerEditMode && !!user.salaryRange}
                    >
                      <SelectTrigger 
                        className="bg-white text-black" 
                        data-testid="select-salary-range"
                        style={{
                          backgroundColor: !isCareerEditMode && !!user.salaryRange ? '#e5e7eb' : '',
                          cursor: !isCareerEditMode && !!user.salaryRange ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <SelectValue placeholder={translatedLabels.selectSalaryRange} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-50000">{translatedLabels.salary0to50k}</SelectItem>
                        <SelectItem value="50000-100000">{translatedLabels.salary50kto100k}</SelectItem>
                        <SelectItem value="100000-500000">{translatedLabels.salary100kto500k}</SelectItem>
                        <SelectItem value="500000+">{translatedLabels.salary500kPlus}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="education" className="text-black">{translatedLabels.education}</Label>
                    <Input
                      id="education"
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      placeholder={translatedLabels.educationExample}
                      className="bg-white text-black"
                      disabled={!isCareerEditMode && !!user.education}
                      style={{
                        backgroundColor: !isCareerEditMode && !!user.education ? '#e5e7eb' : '',
                        cursor: !isCareerEditMode && !!user.education ? 'not-allowed' : 'text'
                      }}
                      data-testid="input-education"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-black">{translatedLabels.website}</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder={translatedLabels.websiteExample}
                      className="bg-white text-black"
                      disabled={!isCareerEditMode && !!user.website}
                      style={{
                        backgroundColor: !isCareerEditMode && !!user.website ? '#e5e7eb' : '',
                        cursor: !isCareerEditMode && !!user.website ? 'not-allowed' : 'text'
                      }}
                      data-testid="input-website"
                    />
                  </div>

                  {isCareerEditMode && (
                    <Button 
                      onClick={handleProfileUpdate}
                      disabled={isUpdating}
                      className="w-full bg-black text-white hover:bg-gray-800"
                      data-testid="button-save-career"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {translatedLabels.saving}
                        </>
                      ) : (
                        translatedLabels.saveChanges
                      )}
                    </Button>
                  )}

                  {!isCareerEditMode && (
                    <Button 
                      onClick={() => setIsCareerEditMode(true)}
                      className="w-full bg-black text-white hover:bg-gray-800"
                      data-testid="button-edit-career"
                    >
                      {translatedLabels.edit}
                    </Button>
                  )}
                </CardContent>
              </Card>
              </div>
            )}

            {/* Compliance Section */}
            {profileSubSection === "compliance" && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setProfileSubSection("")}
                  className="mb-4"
                  data-testid="button-back-to-profile"
                >
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  {translatedLabels.backToProfile}
                </Button>
              <Card className="border-0">
                <CardHeader>
                  <CardTitle className="text-black">{translatedLabels.kycCompliance}</CardTitle>
                  <CardDescription className="text-black">
                    {translatedLabels.completeIdentityVerification}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="idDocumentType" className="text-black">{translatedLabels.idDocumentType}</Label>
                      <Select 
                        value={formData.idDocumentType} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, idDocumentType: value }))}
                        disabled={!isComplianceEditMode && !!user.idDocumentType}
                      >
                        <SelectTrigger 
                          className="bg-white text-black" 
                          data-testid="select-id-type"
                          style={{
                            backgroundColor: !isComplianceEditMode && !!user.idDocumentType ? '#e5e7eb' : '',
                            cursor: !isComplianceEditMode && !!user.idDocumentType ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <SelectValue placeholder={translatedLabels.selectDocumentType} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passport">{translatedLabels.passport}</SelectItem>
                          <SelectItem value="national_id">{translatedLabels.nationalId}</SelectItem>
                          <SelectItem value="drivers_license">{translatedLabels.driversLicense}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="idDocumentNumber" className="text-black">{translatedLabels.idDocumentNumber}</Label>
                      <Input
                        id="idDocumentNumber"
                        name="idDocumentNumber"
                        value={formData.idDocumentNumber}
                        onChange={handleInputChange}
                        placeholder={translatedLabels.enterDocumentNumber}
                        className="bg-white text-black"
                        disabled={!isComplianceEditMode && !!user.idDocumentNumber}
                        style={{
                          backgroundColor: !isComplianceEditMode && !!user.idDocumentNumber ? '#e5e7eb' : '',
                          cursor: !isComplianceEditMode && !!user.idDocumentNumber ? 'not-allowed' : 'text'
                        }}
                        data-testid="input-id-number"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="idDocumentExpiryDate" className="text-black">{translatedLabels.idExpiryDate}</Label>
                      <Input
                        id="idDocumentExpiryDate"
                        name="idDocumentExpiryDate"
                        type="date"
                        value={formData.idDocumentExpiryDate}
                        onChange={handleInputChange}
                        className="bg-white text-black"
                        disabled={!isComplianceEditMode && !!user.idDocumentExpiryDate}
                        style={{
                          backgroundColor: !isComplianceEditMode && !!user.idDocumentExpiryDate ? '#e5e7eb' : '',
                          cursor: !isComplianceEditMode && !!user.idDocumentExpiryDate ? 'not-allowed' : 'text'
                        }}
                        data-testid="input-id-expiry"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="idDocumentIssueCountry" className="text-black">{translatedLabels.idIssueCountry}</Label>
                      <Input
                        id="idDocumentIssueCountry"
                        name="idDocumentIssueCountry"
                        value={formData.idDocumentIssueCountry}
                        onChange={handleInputChange}
                        placeholder={translatedLabels.enterCountry}
                        className="bg-white text-black"
                        disabled={!isComplianceEditMode && !!user.idDocumentIssueCountry}
                        style={{
                          backgroundColor: !isComplianceEditMode && !!user.idDocumentIssueCountry ? '#e5e7eb' : '',
                          cursor: !isComplianceEditMode && !!user.idDocumentIssueCountry ? 'not-allowed' : 'text'
                        }}
                        data-testid="input-id-country"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="occupation" className="text-black">{translatedLabels.occupation}</Label>
                    <Input
                      id="occupation"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      placeholder={translatedLabels.enterOccupation}
                      className="bg-white text-black"
                      disabled={!isComplianceEditMode && !!user.occupation}
                      style={{
                        backgroundColor: !isComplianceEditMode && !!user.occupation ? '#e5e7eb' : '',
                        cursor: !isComplianceEditMode && !!user.occupation ? 'not-allowed' : 'text'
                      }}
                      data-testid="input-occupation"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-3">
                      <Label className="text-black">
                        {translatedLabels.pepQuestion}
                      </Label>
                      <RadioGroup
                        value={
                          formData.isPoliticallyExposed === undefined || formData.isPoliticallyExposed === null
                            ? ""
                            : formData.isPoliticallyExposed
                            ? "yes"
                            : "no"
                        }
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          isPoliticallyExposed: value === "yes" ? true : value === "no" ? false : undefined as any
                        }))}
                        disabled={!isComplianceEditMode}
                        className="flex gap-6"
                        data-testid="radio-pep"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="yes" 
                            id="pep-yes"
                            disabled={!isComplianceEditMode}
                            data-testid="radio-pep-yes"
                          />
                          <Label 
                            htmlFor="pep-yes" 
                            className="text-black font-normal cursor-pointer"
                            style={{
                              cursor: !isComplianceEditMode ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {translatedLabels.yes}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="no" 
                            id="pep-no"
                            disabled={!isComplianceEditMode}
                            data-testid="radio-pep-no"
                          />
                          <Label 
                            htmlFor="pep-no" 
                            className="text-black font-normal cursor-pointer"
                            style={{
                              cursor: !isComplianceEditMode ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {translatedLabels.no}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {formData.isPoliticallyExposed === true && (
                      <div>
                        <Label htmlFor="politicalExposureDetails" className="text-black">
                          {translatedLabels.politicalExposureDetails}
                        </Label>
                        <Textarea
                          id="politicalExposureDetails"
                          name="politicalExposureDetails"
                          value={formData.politicalExposureDetails}
                          onChange={handleInputChange}
                          placeholder={translatedLabels.providePoliticalExposureDetails}
                          rows={3}
                          className="bg-white text-black"
                          disabled={!isComplianceEditMode && !!user.politicalExposureDetails}
                          style={{
                            backgroundColor: !isComplianceEditMode && !!user.politicalExposureDetails ? '#e5e7eb' : '',
                            cursor: !isComplianceEditMode && !!user.politicalExposureDetails ? 'not-allowed' : 'text'
                          }}
                          data-testid="textarea-pep-details"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-black font-semibold">
                        {translatedLabels.verificationDocuments}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1 mb-3">
                        {translatedLabels.uploadDocumentsText}
                      </p>
                    </div>

                    {/* Verification Status Indicator */}
                    {(() => {
                      const uploadedDocs = [
                        { name: 'Proof of Address', url: user.proofOfAddressUrl },
                        { name: 'Source of Income', url: user.sourceOfIncomeDocumentUrl },
                        { name: 'ID Front', url: user.idDocumentFrontUrl },
                        { name: 'ID Back', url: user.idDocumentBackUrl },
                        { name: 'Picture Holding ID', url: user.idSelfieUrl }
                      ];
                      
                      const completed = uploadedDocs.filter(doc => doc.url).length;
                      const total = uploadedDocs.length;
                      const allUploaded = completed === total;
                      const missingDocs = uploadedDocs.filter(doc => !doc.url);

                      return (
                        <div className={`p-4 rounded-lg border-2 ${
                          allUploaded 
                            ? 'bg-green-50 border-green-500' 
                            : 'bg-amber-50 border-amber-500'
                        }`} data-testid="verification-status-indicator">
                          <div className="flex items-start gap-3">
                            {allUploaded ? (
                              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className={`font-semibold ${
                                allUploaded ? 'text-green-800' : 'text-amber-800'
                              }`}>
                                {allUploaded 
                                  ? '✓ All Documents Uploaded' 
                                  : `${completed} of ${total} Documents Uploaded`
                                }
                              </h3>
                              {allUploaded ? (
                                <p className="text-sm text-green-700 mt-1">
                                  Your verification documents are complete and awaiting review.
                                </p>
                              ) : (
                                <div className="text-sm text-amber-700 mt-1">
                                  <p className="font-medium">Please upload the following documents:</p>
                                  <ul className="list-disc list-inside mt-1 space-y-1">
                                    {missingDocs.map((doc, index) => (
                                      <li key={index}>{doc.name}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 1. Proof of Address */}
                    <div className="p-4 border border-gray-200 rounded-md space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-black">
                          1. {translatedLabels.proofOfAddress}
                        </Label>
                        {user.proofOfAddressUrl && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Uploaded
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={!isComplianceEditMode}
                          onChange={(e) => setProofOfAddressFile(e.target.files?.[0] || null)}
                          className="flex-1 bg-white text-black cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                          style={{
                            backgroundColor: !isComplianceEditMode ? '#e5e7eb' : '',
                            cursor: !isComplianceEditMode ? 'not-allowed' : 'pointer'
                          }}
                          data-testid="input-proof-of-address"
                        />
                        <Button
                          onClick={() => proofOfAddressFile && handleDocumentUpload(proofOfAddressFile, 'proof_of_address', 'Proof of Address')}
                          disabled={!proofOfAddressFile || uploadingDoc === 'proof_of_address' || !isComplianceEditMode}
                          className="bg-black text-white hover:bg-gray-800 min-w-[100px]"
                          data-testid="button-upload-proof-of-address"
                        >
                          {uploadingDoc === 'proof_of_address' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {translatedLabels.uploading}
                            </>
                          ) : (
                            translatedLabels.upload
                          )}
                        </Button>
                      </div>
                      {proofOfAddressFile && (
                        <p className="text-xs text-green-600 font-medium">{proofOfAddressFile.name}</p>
                      )}
                    </div>

                    {/* 2. Source of Income */}
                    <div className="p-4 border border-gray-200 rounded-md space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-black">
                          2. {translatedLabels.sourceOfIncomeDoc}
                        </Label>
                        {user.sourceOfIncomeDocumentUrl && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Uploaded
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={!isComplianceEditMode}
                          onChange={(e) => setSourceOfIncomeFile(e.target.files?.[0] || null)}
                          className="flex-1 bg-white text-black cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                          style={{
                            backgroundColor: !isComplianceEditMode ? '#e5e7eb' : '',
                            cursor: !isComplianceEditMode ? 'not-allowed' : 'pointer'
                          }}
                          data-testid="input-source-of-income"
                        />
                        <Button
                          onClick={() => sourceOfIncomeFile && handleDocumentUpload(sourceOfIncomeFile, 'source_of_income', 'Source of Income')}
                          disabled={!sourceOfIncomeFile || uploadingDoc === 'source_of_income' || !isComplianceEditMode}
                          className="bg-black text-white hover:bg-gray-800 min-w-[100px]"
                          data-testid="button-upload-source-of-income"
                        >
                          {uploadingDoc === 'source_of_income' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {translatedLabels.uploading}
                            </>
                          ) : (
                            translatedLabels.upload
                          )}
                        </Button>
                      </div>
                      {sourceOfIncomeFile && (
                        <p className="text-xs text-green-600 font-medium">{sourceOfIncomeFile.name}</p>
                      )}
                    </div>

                    {/* 3. ID Front */}
                    <div className="p-4 border border-gray-200 rounded-md space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-black">
                          3. ID Front
                        </Label>
                        {user.idDocumentFrontUrl && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Uploaded
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={!isComplianceEditMode}
                          onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                          className="flex-1 bg-white text-black cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                          style={{
                            backgroundColor: !isComplianceEditMode ? '#e5e7eb' : '',
                            cursor: !isComplianceEditMode ? 'not-allowed' : 'pointer'
                          }}
                          data-testid="input-id-front"
                        />
                        <Button
                          onClick={() => idFrontFile && handleDocumentUpload(idFrontFile, 'id_front', 'ID Front')}
                          disabled={!idFrontFile || uploadingDoc === 'id_front' || !isComplianceEditMode}
                          className="bg-black text-white hover:bg-gray-800 min-w-[100px]"
                          data-testid="button-upload-id-front"
                        >
                          {uploadingDoc === 'id_front' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {translatedLabels.uploading}
                            </>
                          ) : (
                            translatedLabels.upload
                          )}
                        </Button>
                      </div>
                      {idFrontFile && (
                        <p className="text-xs text-green-600 font-medium">{idFrontFile.name}</p>
                      )}
                    </div>

                    {/* 4. ID Back */}
                    <div className="p-4 border border-gray-200 rounded-md space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-black">
                          4. ID Back
                        </Label>
                        {user.idDocumentBackUrl && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Uploaded
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={!isComplianceEditMode}
                          onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                          className="flex-1 bg-white text-black cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                          style={{
                            backgroundColor: !isComplianceEditMode ? '#e5e7eb' : '',
                            cursor: !isComplianceEditMode ? 'not-allowed' : 'pointer'
                          }}
                          data-testid="input-id-back"
                        />
                        <Button
                          onClick={() => idBackFile && handleDocumentUpload(idBackFile, 'id_back', 'ID Back')}
                          disabled={!idBackFile || uploadingDoc === 'id_back' || !isComplianceEditMode}
                          className="bg-black text-white hover:bg-gray-800 min-w-[100px]"
                          data-testid="button-upload-id-back"
                        >
                          {uploadingDoc === 'id_back' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {translatedLabels.uploading}
                            </>
                          ) : (
                            translatedLabels.upload
                          )}
                        </Button>
                      </div>
                      {idBackFile && (
                        <p className="text-xs text-green-600 font-medium">{idBackFile.name}</p>
                      )}
                    </div>

                    {/* 5. Picture Holding ID */}
                    <div className="p-4 border border-gray-200 rounded-md space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-black">
                          5. {translatedLabels.pictureWithId}
                        </Label>
                        {user.idSelfieUrl && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Uploaded
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={!isComplianceEditMode}
                          onChange={(e) => setIdSelfieFile(e.target.files?.[0] || null)}
                          className="flex-1 bg-white text-black cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                          style={{
                            backgroundColor: !isComplianceEditMode ? '#e5e7eb' : '',
                            cursor: !isComplianceEditMode ? 'not-allowed' : 'pointer'
                          }}
                          data-testid="input-id-selfie"
                        />
                        <Button
                          onClick={() => idSelfieFile && handleDocumentUpload(idSelfieFile, 'id_selfie', 'Picture Holding ID')}
                          disabled={!idSelfieFile || uploadingDoc === 'id_selfie' || !isComplianceEditMode}
                          className="bg-black text-white hover:bg-gray-800 min-w-[100px]"
                          data-testid="button-upload-id-selfie"
                        >
                          {uploadingDoc === 'id_selfie' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {translatedLabels.uploading}
                            </>
                          ) : (
                            translatedLabels.upload
                          )}
                        </Button>
                      </div>
                      {idSelfieFile && (
                        <p className="text-xs text-green-600 font-medium">{idSelfieFile.name}</p>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      Accepted formats: PDF, JPG, PNG, DOC, DOCX
                    </p>
                  </div>

                  {isComplianceEditMode && (
                    <Button 
                      onClick={handleProfileUpdate}
                      disabled={isUpdating}
                      className="w-full bg-black text-white hover:bg-gray-800"
                      data-testid="button-save-kyc"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {translatedLabels.saving}
                        </>
                      ) : (
                        translatedLabels.saveChanges
                      )}
                    </Button>
                  )}

                  {!isComplianceEditMode && (
                    <Button 
                      onClick={() => setIsComplianceEditMode(true)}
                      className="w-full bg-black text-white hover:bg-gray-800"
                      data-testid="button-edit-compliance"
                    >
                      {translatedLabels.edit}
                    </Button>
                  )}
                </CardContent>
              </Card>
              </div>
            )}

            {/* Affiliation Section */}
            {profileSubSection === "affiliation" && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setProfileSubSection("")}
                  className="mb-4"
                  data-testid="button-back-to-profile"
                >
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  {translatedLabels.backToProfile}
                </Button>
                <Card className="border-0">
                  <CardHeader>
                    <CardTitle className="text-black">{translatedLabels.affiliation}</CardTitle>
                    <CardDescription className="text-black">
                      {translatedLabels.affiliateInformation}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-muted-foreground">{translatedLabels.affiliateNumber}</Label>
                      <p className="text-2xl font-mono font-bold text-black mt-2">{user?.affiliatePartner || '-'}</p>
                      <p className="text-sm text-muted-foreground mt-1">{translatedLabels.affiliateCodeDesc}</p>
                    </div>
                    
                    {!user?.affiliatePartner && (
                      <Button 
                        onClick={() => setShowAffiliationDialog(true)}
                        className="w-full bg-black hover:bg-gray-800 text-white"
                        data-testid="button-add-affiliation"
                      >
                        {translatedLabels.addAffiliation}
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => setShowReportDialog(true)}
                      variant="outline"
                      className="w-full"
                      data-testid="button-report-issue"
                    >
                      {translatedLabels.reportIssue}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="container max-w-7xl px-4 sm:px-6 pt-4 sm:pt-6 pb-16 text-black">
      {/* Page Header - Hidden on mobile */}
      <div className="mb-4 sm:mb-6 hidden md:block">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">{translatedLabels.userSettings}</h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block md:w-64 md:shrink-0">
          <Card className="border-0 sticky top-4">
            <CardContent className="p-0">
              <div className="divide-y">
                {sidebarItems.map((item) => {
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setProfileSubSection('');
                      }}
                      className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
                        activeSection === item.id
                          ? 'bg-gray-50'
                          : 'hover:bg-gray-50'
                      }`}
                      data-testid={`desktop-menu-${item.id}`}
                    >
                      <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <Card className="border-0 sm:border">
            {renderContent()}
          </Card>
        </div>
      </div>

      {/* Report Issue Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{translatedLabels.reportProblem}</DialogTitle>
            <DialogDescription>
              {translatedLabels.describeIssue}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-message">{translatedLabels.describeIssue}</Label>
              <Textarea
                id="report-message"
                placeholder={translatedLabels.enterMessageHere}
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                rows={6}
                className="resize-none"
                data-testid="textarea-report-message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReportDialog(false);
                setReportMessage('');
              }}
              disabled={isUpdating}
              data-testid="button-cancel-report"
            >
              {translatedLabels.cancel}
            </Button>
            <Button
              onClick={handleReportIssue}
              disabled={isUpdating || !reportMessage.trim()}
              className="bg-black hover:bg-gray-800 text-white"
              data-testid="button-send-report"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translatedLabels.sending}
                </>
              ) : (
                translatedLabels.sendReport
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Affiliation Dialog */}
      <Dialog open={showAffiliationDialog} onOpenChange={(open) => {
        setShowAffiliationDialog(open);
        if (!open) setAffiliateCode('');
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{translatedLabels.addAffiliation}</DialogTitle>
            <DialogDescription>
              {translatedLabels.enterAffiliatePartnerCode}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="affiliate-code">{translatedLabels.affiliateCode}</Label>
              <Input
                id="affiliate-code"
                placeholder={translatedLabels.enterAffiliateCode}
                value={affiliateCode}
                onChange={(e) => setAffiliateCode(e.target.value)}
                className="bg-white text-black"
                data-testid="input-affiliate-code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAffiliationDialog(false);
                setAffiliateCode('');
              }}
              disabled={isUpdating}
              data-testid="button-cancel-affiliation"
            >
              {translatedLabels.cancel}
            </Button>
            <Button
              onClick={handleAddAffiliation}
              disabled={isUpdating || !affiliateCode.trim()}
              className="bg-black hover:bg-gray-800 text-white"
              data-testid="button-submit-affiliation"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translatedLabels.saving}
                </>
              ) : (
                translatedLabels.submit
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
