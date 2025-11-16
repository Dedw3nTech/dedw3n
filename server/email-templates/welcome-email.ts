import { EmailTemplate, createBaseTemplate, createPlainTextBase } from './base-template';

// Helper to get public asset base URL
function getPublicAssetBaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return 'https://dedw3n.com';
  } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev`;
  }
  return 'http://localhost:5000';
}

const config = { publicAssetBaseUrl: getPublicAssetBaseUrl() };

export interface WelcomeEmailData {
  name: string;
  username: string;
  email: string;
  verificationLink: string;
  language?: string;
}

const getTranslations = (language: string = 'EN') => {
  const translations: { [key: string]: any } = {
    EN: {
      subject: 'Welcome to Dedw3n - Please Verify Your Email',
      welcome: 'Welcome to Dedw3n',
      greeting: (name: string) => `Hello ${name}!`,
      thankYou: 'Thank you for joining our community. We\'re excited to have you on board!',
      verifyTitle: 'Verify Your Email Address',
      verifyDescription: 'Please confirm your email address to unlock all features and ensure the security of your account:',
      verifyButton: 'Verify Email Address',
      alternativeLink: 'If the button doesn\'t work, you can also copy and paste this link into your browser:',
      features: 'What you can do with Dedw3n:',
      feature1: '🛍️ Browse and shop from our marketplace',
      feature2: '👥 Connect with communities that share your interests',
      feature3: '🏪 Become a vendor and start your own business',
      feature4: '💬 Chat and interact with other users',
      feature5: '🎁 Access exclusive deals and promotions',
      expiryWarning: 'Important: This verification link will expire in 24 hours for security reasons.',
      notYou: 'If you didn\'t create this account, please ignore this email or contact our support team.',
      questions: 'Have questions?',
      questionsText: 'We\'re here to help! Visit our support center or reply to this email for assistance.'
    },
    FR: {
      subject: 'Bienvenue sur Dedw3n - Veuillez vérifier votre email',
      welcome: 'Bienvenue sur Dedw3n',
      greeting: (name: string) => `Bonjour ${name}!`,
      thankYou: 'Merci de rejoindre notre communauté. Nous sommes ravis de vous accueillir!',
      verifyTitle: 'Vérifiez votre adresse email',
      verifyDescription: 'Veuillez confirmer votre adresse email pour débloquer toutes les fonctionnalités:',
      verifyButton: 'Vérifier l\'adresse email',
      alternativeLink: 'Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur:',
      features: 'Ce que vous pouvez faire avec Dedw3n:',
      feature1: '🛍️ Parcourir et acheter sur notre marché',
      feature2: '👥 Connectez-vous avec des communautés partageant vos intérêts',
      feature3: '🏪 Devenez vendeur et lancez votre propre entreprise',
      feature4: '💬 Discutez et interagissez avec d\'autres utilisateurs',
      feature5: '🎁 Accédez à des offres et promotions exclusives',
      expiryWarning: 'Important: Ce lien de vérification expirera dans 24 heures pour des raisons de sécurité.',
      notYou: 'Si vous n\'avez pas créé ce compte, veuillez ignorer cet email.',
      questions: 'Des questions?',
      questionsText: 'Nous sommes là pour vous aider! Visitez notre centre d\'aide ou répondez à cet email.'
    },
    ES: {
      subject: 'Bienvenido a Dedw3n - Por favor verifica tu correo',
      welcome: 'Bienvenido a Dedw3n',
      greeting: (name: string) => `¡Hola ${name}!`,
      thankYou: '¡Gracias por unirte a nuestra comunidad! Estamos emocionados de tenerte a bordo.',
      verifyTitle: 'Verifica tu dirección de correo',
      verifyDescription: 'Por favor confirma tu dirección de correo para desbloquear todas las funciones:',
      verifyButton: 'Verificar correo electrónico',
      alternativeLink: 'Si el botón no funciona, también puedes copiar y pegar este enlace en tu navegador:',
      features: 'Lo que puedes hacer con Dedw3n:',
      feature1: '🛍️ Navegar y comprar en nuestro mercado',
      feature2: '👥 Conectar con comunidades que comparten tus intereses',
      feature3: '🏪 Conviértete en vendedor y comienza tu propio negocio',
      feature4: '💬 Chatea e interactúa con otros usuarios',
      feature5: '🎁 Accede a ofertas y promociones exclusivas',
      expiryWarning: 'Importante: Este enlace de verificación expirará en 24 horas por razones de seguridad.',
      notYou: 'Si no creaste esta cuenta, por favor ignora este correo.',
      questions: '¿Tienes preguntas?',
      questionsText: '¡Estamos aquí para ayudarte! Visita nuestro centro de ayuda o responde a este correo.'
    }
  };
  
  return translations[language] || translations.EN;
};

export const createWelcomeEmail = (data: WelcomeEmailData): EmailTemplate => {
  const t = getTranslations(data.language);
  const logoUrl = `${config.publicAssetBaseUrl}/attached_assets/Copy%20of%20MRCHT%201.0_1761908207631.png`;
  const footerLogoUrl = `${config.publicAssetBaseUrl}/attached_assets/Dedw3n%20Logo_1761908207632.png`;
  
  const htmlContent = `
    <div class="logo-header">
      <img src="${logoUrl}" alt="Dedw3n" class="logo-image" />
    </div>
    
    <div class="content">
      <h1 class="welcome-title">${t.welcome}</h1>
      <p class="welcome-greeting">${t.greeting(data.name || data.username)}</p>
      
      <p class="excitement-text"><strong>${t.thankYou}</strong></p>
      <p>${t.verifyDescription}</p>
      
      <div class="button-container">
        <a href="${data.verificationLink}" class="verify-button">
          ${t.verifyButton}
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">${t.alternativeLink}</p>
      <div class="link-box">
        ${data.verificationLink}
      </div>
      
      <p style="color: #333; font-size: 14px; margin-top: 30px; text-align: center;">
        ${t.notYou}
      </p>
    </div>
  `;
  
  const textContent = createPlainTextBase([
    t.welcome,
    '',
    t.greeting(data.name || data.username),
    '',
    t.thankYou,
    '',
    t.verifyTitle,
    t.verifyDescription,
    '',
    `${t.verifyButton}: ${data.verificationLink}`,
    '',
    t.expiryWarning,
    '',
    t.features,
    t.feature1.replace(/[🛍️👥🏪💬🎁]/g, '-'),
    t.feature2.replace(/[🛍️👥🏪💬🎁]/g, '-'),
    t.feature3.replace(/[🛍️👥🏪💬🎁]/g, '-'),
    t.feature4.replace(/[🛍️👥🏪💬🎁]/g, '-'),
    t.feature5.replace(/[🛍️👥🏪💬🎁]/g, '-'),
    '',
    t.questions,
    t.questionsText,
    '',
    t.notYou,
    '',
    '---',
    'The Dedw3n Team',
    `© ${new Date().getFullYear()} Dedw3n. All rights reserved.`
  ]);
  
  return {
    subject: t.subject,
    html: createBaseTemplate(htmlContent),
    text: textContent
  };
};