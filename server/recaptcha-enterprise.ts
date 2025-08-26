import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

/**
 * Create an assessment to analyze the risk of a UI action using reCAPTCHA Enterprise.
 * 
 * @param projectID - Your Google Cloud Project ID
 * @param recaptchaSiteKey - The reCAPTCHA key associated with the site/app  
 * @param token - The generated token obtained from the client
 * @param recaptchaAction - Action name corresponding to the token
 * @returns The risk score (0.0-1.0) or null if assessment failed
 */
export async function createAssessment({
  projectID = "dedw3n-e440a",
  recaptchaKey = "6LcFQForAAAAAAN8Qb50X0uJxT4mcIKLzrM1cKTJ",
  token = "action-token",
  recaptchaAction = "action-name",
}: {
  projectID?: string;
  recaptchaKey?: string;  
  token: string;
  recaptchaAction?: string;
}) {
  try {
    // Create the reCAPTCHA client
    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(projectID);

    // Build the assessment request
    const request = {
      assessment: {
        event: {
          token: token,
          siteKey: recaptchaKey,
        },
      },
      parent: projectPath,
    };

    console.log('[RECAPTCHA-ENTERPRISE] Creating assessment with request:', {
      projectID,
      siteKey: recaptchaKey,
      action: recaptchaAction,
      tokenLength: token.length
    });

    const [response] = await client.createAssessment(request);

    console.log('[RECAPTCHA-ENTERPRISE] Assessment response:', {
      tokenValid: response.tokenProperties?.valid,
      invalidReason: response.tokenProperties?.invalidReason,
      action: response.tokenProperties?.action,
      score: response.riskAnalysis?.score,
      reasons: response.riskAnalysis?.reasons
    });

    // Check if the token is valid
    if (!response.tokenProperties?.valid) {
      console.log(`[RECAPTCHA-ENTERPRISE] Assessment failed: ${response.tokenProperties?.invalidReason}`);
      return null;
    }

    // Check if the expected action was executed (if provided)
    if (recaptchaAction && response.tokenProperties.action !== recaptchaAction) {
      console.log(`[RECAPTCHA-ENTERPRISE] Action mismatch: expected '${recaptchaAction}', got '${response.tokenProperties.action}'`);
      return null;
    }

    const score = response.riskAnalysis?.score ?? 0;
    console.log(`[RECAPTCHA-ENTERPRISE] Assessment successful - Score: ${score}`);
    
    // Log risk analysis reasons if any
    if (response.riskAnalysis?.reasons && response.riskAnalysis.reasons.length > 0) {
      response.riskAnalysis.reasons.forEach((reason) => {
        console.log(`[RECAPTCHA-ENTERPRISE] Risk reason: ${reason}`);
      });
    }

    // Close the client
    await client.close();

    return {
      score,
      valid: true,
      action: response.tokenProperties.action,
      reasons: response.riskAnalysis?.reasons || [],
      tokenProperties: response.tokenProperties
    };

  } catch (error) {
    console.error('[RECAPTCHA-ENTERPRISE] Assessment error:', error);
    return null;
  }
}

/**
 * Test the reCAPTCHA Enterprise assessment with sample data
 */
export async function testAssessment() {
  const result = await createAssessment({
    token: "TOKEN",
    recaptchaAction: "USER_ACTION"
  });
  
  console.log('[RECAPTCHA-ENTERPRISE] Test result:', result);
  return result;
}

export default {
  createAssessment,
  testAssessment
};