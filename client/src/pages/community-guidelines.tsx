import { Link } from "wouter";
import { useEffect, useMemo } from 'react';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';

export default function CommunityGuidelines() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Community Guidelines - Dedw3n";
  }, []);

  // Master Translation batch for Community Guidelines page
  const guidelinesTexts = useMemo(() => [
    "← Back to Home",
    "DEDW3N LTD. Community Guidelines",
    "Version 08-07-2025", 
    "WELCOME TO DEDW3N",
    "At Dedw3n we are a multi-vendor marketplace and social platform built with modern web technologies. This platform integrates e-commerce capabilities with social networking features, creating a comprehensive transactional ecosystem where users can purchase products, engage socially, and access exclusive content. Dedw3n represents a holistic solution for online commerce, incorporating social, financial, and shipping features to foster meaningful digital connections while facilitating transactions.",
    "We have established Community Guidelines to foster a welcoming, safe, and engaging experience for all users. These guidelines are applicable to everyone and encompass all content on our platform. They delineate the rules governing acceptable behaviour on Dedw3n. In response to emerging risks and concerns, these guidelines are continually updated.",
    "To facilitate your understanding, we categorize the guidelines by topic and emphasize each rule in bold. Within each section, you can click on \"More Information\" for definitions, examples, and clarifications of common queries. Please note that the examples provided are not exhaustive; we mention this to avoid the repetitive phrase \"including, but not limited to.\" If you ever find yourself uncertain about what to share, we encourage you to embody kindness and treat others as you would wish to be treated.",
    "Thank you for contributing to the creation of a welcoming environment for everyone on Dedw3n!",
    "Content Moderation",
    "To maintain a safe, trustworthy, and dynamic platform, we must balance creative expression with the necessity of preventing harm. Our approach to safety involves a combination of strategies to achieve this equilibrium:",
    "1. Removal of Prohibited Content",
    "Every individual who joins Dedw3n is granted the freedom to share content on our platform. However, we will remove any content, whether public or private, that violates our established guidelines.",
    "2. Empowering Our Community with Information and Resources",
    "We are committed to ensuring you have the necessary information to manage your experience on Dedw3n effectively. To this end, we may implement labels, \"opt-in\" screens, or warnings to provide additional context.",
    "Our 3 Mission Points:",
    "Balancing harm prevention with freedom of expression",
    "Upholding human dignity",
    "Ensuring fairness in our actions",
    "Safety and Civility",
    "Physical and psychological safety are fundamental to individual well-being, while civility is essential for fostering a thriving community. Practicing civility does not require agreement; instead, it involves recognizing each person's inherent dignity and engaging with respect in both words and tone.",
    "Violent and Criminal Behaviour",
    "We are dedicated to fostering an environment that discourages physical conflict. We acknowledge that online content pertaining to violence can have real-world repercussions. Therefore, we prohibit any threats of violence, promotion of violence, incitement to violence, or advocacy of criminal activities that may endanger individuals, animals, or property."
  ], []);

  const { translations, isLoading } = useMasterBatchTranslation(guidelinesTexts, 'instant');
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading translations...</div>;
  }
  
  const t = (text: string): string => {
    if (Array.isArray(translations)) {
      const index = guidelinesTexts.indexOf(text);
      return index !== -1 ? translations[index] || text : text;
    }
    return text;
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-8">
              <Link href="/" className="text-primary hover:underline text-sm mb-4 inline-block">
                {t("← Back to Home")}
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{t("DEDW3N LTD. Community Guidelines")}</h1>
              <p className="text-lg font-semibold text-gray-800 mb-2">{t("Version 08-07-2025")}</p>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("WELCOME TO DEDW3N")}</h2>
                <p className="text-gray-700 mb-4">
                  {t("At Dedw3n we are a multi-vendor marketplace and social platform built with modern web technologies. This platform integrates e-commerce capabilities with social networking features, creating a comprehensive transactional ecosystem where users can purchase products, engage socially, and access exclusive content. Dedw3n represents a holistic solution for online commerce, incorporating social, financial, and shipping features to foster meaningful digital connections while facilitating transactions.")}
                </p>
                <p className="text-gray-700 mb-4">
                  {t("We have established Community Guidelines to foster a welcoming, safe, and engaging experience for all users. These guidelines are applicable to everyone and encompass all content on our platform. They delineate the rules governing acceptable behaviour on Dedw3n. In response to emerging risks and concerns, these guidelines are continually updated.")}
                </p>
                <p className="text-gray-700 mb-4">
                  {t("To facilitate your understanding, we categorize the guidelines by topic and emphasize each rule in bold. Within each section, you can click on \"More Information\" for definitions, examples, and clarifications of common queries. Please note that the examples provided are not exhaustive; we mention this to avoid the repetitive phrase \"including, but not limited to.\" If you ever find yourself uncertain about what to share, we encourage you to embody kindness and treat others as you would wish to be treated.")}
                </p>
                <p className="text-gray-700 font-medium">
                  {t("Thank you for contributing to the creation of a welcoming environment for everyone on Dedw3n!")}
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("Content Moderation")}</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    {t("To maintain a safe, trustworthy, and dynamic platform, we must balance creative expression with the necessity of preventing harm. Our approach to safety involves a combination of strategies to achieve this equilibrium:")}
                  </p>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{t("1. Removal of Prohibited Content")}</h3>
                    <p className="mb-4">
                      {t("Every individual who joins Dedw3n is granted the freedom to share content on our platform. However, we will remove any content, whether public or private, that violates our established guidelines.")}
                    </p>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{t("2. Empowering Our Community with Information and Resources")}</h3>
                    <p className="mb-4">
                      {t("We are committed to ensuring you have the necessary information to manage your experience on Dedw3n effectively. To this end, we may implement labels, \"opt-in\" screens, or warnings to provide additional context.")}
                    </p>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">{t("Our 3 Mission Points:")}</h4>
                      <ul className="list-disc list-inside text-blue-800 space-y-1">
                        <li>{t("Balancing harm prevention with freedom of expression")}</li>
                        <li>{t("Upholding human dignity")}</li>
                        <li>{t("Ensuring fairness in our actions")}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("Safety and Civility")}</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    {t("Physical and psychological safety are fundamental to individual well-being, while civility is essential for fostering a thriving community. Practicing civility does not require agreement; instead, it involves recognizing each person's inherent dignity and engaging with respect in both words and tone.")}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("Violent and Criminal Behaviour")}</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>{t("We are dedicated to fostering an environment that discourages physical conflict.")}</strong> {t("We acknowledge that online content pertaining to violence can have real-world repercussions. Therefore, we prohibit any threats of violence, promotion of violence, incitement to violence, or advocacy of criminal activities that may endanger individuals, animals, or property.")}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hate Speech and Hateful Behaviour</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>Dedw3n thrives on the diversity of its community.</strong> Our differences should be celebrated rather than serve as a basis for division. We do not tolerate hate speech, hateful behaviour, or the promotion of hateful ideologies. This encompasses both explicit and implicit content that targets protected groups.
                  </p>
                  <p>
                    In discussions about social issues on Dedw3n, we encourage respectful dialogue.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sexual/Physical Abuse</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>We are dedicated to fostering an environment that champions gender equity, promotes healthy relationships, and upholds intimate privacy.</strong> Any actions that undermine these values can result in trauma and may lead to both physical and psychological harm. We do not allow showing, promoting, or engaging in adult sexual or physical abuse or exploitation. This includes non-consensual sexual acts, image-based sexual abuse, sextortion, physical abuse, and sexual harassment.
                  </p>
                  <p className="italic text-gray-600">
                    If you or someone you know has experienced abuse or exploitation, support is available.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Human Smuggling and Trafficking</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>We are dedicated to upholding individual human dignity and ensuring that Dedw3n is not utilized to exploit vulnerable individuals.</strong> We do not allow human trafficking and smuggling. We understand how important it is for survivors of human trafficking and smuggling to share their stories, and for migrants to be able to document their journeys, so we provide a space to do so.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Harassment and Bullying</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>We encourage the respectful expression of diverse viewpoints and strive to create an environment where individuals can voice their opinions without fear of degradation or bullying.</strong> Harassing, degrading, or bullying behaviour is strictly prohibited, including any retaliatory harassment in response to such actions.
                  </p>
                  <p>
                    We acknowledge that public figures often attract public scrutiny and have means to address negative commentary. Therefore, we permit certain negative or critical comments and images related to public figures, provided they do not violate our other policies. Content that includes violent threats, hate speech, sexual exploitation, or severe forms of harassment—such as doxxing or wishing serious physical harm upon others—will be removed without exception.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Suicide and Self-Harm</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong>At Dedw3n, our aim is to create a safe space for discussing emotionally complex topics in a supportive environment, while minimizing the risk of harm.</strong> We do not permit the promotion or sharing of plans related to suicide or self-harm.
                  </p>
                  <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                    <p className="text-red-800">
                      <strong>If you or someone you know is experiencing thoughts of suicide or self-harm, please seek support.</strong> We encourage you to reach out to a local suicide prevention helpline or your emergency services. Furthermore, we reserve the right to contact local emergency services if there is a specific and credible threat to safety or imminent threat to human life or serious physical injury, such as sharing details about a plan to harm yourself.
                    </p>
                  </div>
                  <p>
                    Visit our <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> for more information.
                  </p>
                </div>
              </section>
            </div>

            <div className="mt-12 p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Questions or Concerns?</h3>
              <p className="text-blue-800 mb-4">
                If you have questions about these guidelines or need to report a violation, please contact our support team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center">
                  Contact Support
                </Link>
                <Link href="/faq" className="bg-white text-blue-600 border border-blue-300 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors text-center">
                  View FAQ
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: July 8, 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}