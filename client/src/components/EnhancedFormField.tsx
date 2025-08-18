import { useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ValidatedInputWrapper } from "./ValidationFeedback";
import { useRealtimeValidation, ValidationType, ValidationConfig } from "@/hooks/use-realtime-validation";

export interface EnhancedFormFieldProps {
  control: any;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  validationType?: ValidationType;
  validationConfig?: ValidationConfig;
  showInlineFeedback?: boolean;
  debounceMs?: number;
  onValidationComplete?: (result: any) => void;
  className?: string;
}

/**
 * Enhanced form field with real-time validation using Clearout API
 * Integrates seamlessly with React Hook Form
 */
export function EnhancedFormField({
  control,
  name,
  label,
  placeholder,
  type = "text",
  validationType,
  validationConfig,
  showInlineFeedback = true,
  debounceMs = 2000,
  onValidationComplete,
  className
}: EnhancedFormFieldProps) {
  const validation = useRealtimeValidation(validationType!, {
    debounceMs,
    config: validationConfig,
    onValidationComplete
  });

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {validationType ? (
              <ValidatedInputWrapper
                validationStatus={validation.getValidationStatus()}
                validationMessage={validation.getDisplayMessage()}
                suggestions={validation.getSuggestions()}
                confidence={validation.confidence}
                showInlineFeedback={showInlineFeedback}
                className={className}
              >
                <Input
                  type={type}
                  placeholder={placeholder}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    validation.validateField(e.target.value);
                  }}
                />
              </ValidatedInputWrapper>
            ) : (
              <Input
                type={type}
                placeholder={placeholder}
                {...field}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Email field with enhanced validation
 */
export function EmailFormField({
  control,
  name,
  label = "Email Address",
  placeholder = "Enter your email",
  blockDisposable = true,
  blockRole = false,
  blockFree = false,
  requireMx = true,
  showInlineFeedback = true,
  onValidationComplete,
  className
}: {
  control: any;
  name: string;
  label?: string;
  placeholder?: string;
  blockDisposable?: boolean;
  blockRole?: boolean;
  blockFree?: boolean;
  requireMx?: boolean;
  showInlineFeedback?: boolean;
  onValidationComplete?: (result: any) => void;
  className?: string;
}) {
  return (
    <EnhancedFormField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      type="email"
      validationType="email"
      validationConfig={{
        email: {
          block_disposable: blockDisposable,
          block_role: blockRole,
          block_free: blockFree,
          require_mx: requireMx
        }
      }}
      showInlineFeedback={showInlineFeedback}
      onValidationComplete={onValidationComplete}
      className={className}
    />
  );
}

/**
 * Phone field with enhanced validation
 */
export function PhoneFormField({
  control,
  name,
  label = "Phone Number",
  placeholder = "Enter your phone number",
  acceptMobileOnly = false,
  acceptLandlineOnly = false,
  blockVoip = true,
  blockTollfree = true,
  showInlineFeedback = true,
  onValidationComplete,
  className
}: {
  control: any;
  name: string;
  label?: string;
  placeholder?: string;
  acceptMobileOnly?: boolean;
  acceptLandlineOnly?: boolean;
  blockVoip?: boolean;
  blockTollfree?: boolean;
  showInlineFeedback?: boolean;
  onValidationComplete?: (result: any) => void;
  className?: string;
}) {
  return (
    <EnhancedFormField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      type="tel"
      validationType="phone"
      validationConfig={{
        phone: {
          accept_mobile_only: acceptMobileOnly,
          accept_landline_only: acceptLandlineOnly,
          block_voip: blockVoip,
          block_tollfree: blockTollfree
        }
      }}
      showInlineFeedback={showInlineFeedback}
      onValidationComplete={onValidationComplete}
      className={className}
    />
  );
}

/**
 * Name field with enhanced validation
 */
export function NameFormField({
  control,
  name,
  label = "Full Name",
  placeholder = "Enter your full name",
  blockGibberish = true,
  minLength = 2,
  maxLength = 100,
  showInlineFeedback = true,
  onValidationComplete,
  className
}: {
  control: any;
  name: string;
  label?: string;
  placeholder?: string;
  blockGibberish?: boolean;
  minLength?: number;
  maxLength?: number;
  showInlineFeedback?: boolean;
  onValidationComplete?: (result: any) => void;
  className?: string;
}) {
  return (
    <EnhancedFormField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      type="text"
      validationType="name"
      validationConfig={{
        name: {
          block_gibberish: blockGibberish,
          min_length: minLength,
          max_length: maxLength
        }
      }}
      showInlineFeedback={showInlineFeedback}
      onValidationComplete={onValidationComplete}
      className={className}
    />
  );
}