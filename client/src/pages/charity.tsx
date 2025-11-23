import { Container } from "@/components/ui/container";
import { useEffect } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

export default function CharityPage() {
  useEffect(() => {
    document.title = "Charity - Dedw3n";
  }, []);

  const charityTexts = [
    "Charity",
    "At Dedw3n, we believe in giving back to the community and making a positive impact on society.",
    "Our Commitment",
    "We are committed to supporting charitable causes and organizations that align with our values of sustainability, education, and social responsibility.",
    "How We Help",
    "Through our platform, we facilitate charitable donations and partner with verified charitable organizations to ensure transparency and maximum impact.",
    "Get Involved",
    "Join us in making a difference. Together, we can create positive change in communities around the world."
  ];

  const { translations } = useMasterBatchTranslation(charityTexts);
  
  const [
    charityTitle,
    introText,
    commitmentTitle,
    commitmentText,
    howWeHelpTitle,
    howWeHelpText,
    getInvolvedTitle,
    getInvolvedText
  ] = translations || charityTexts;

  return (
    <Container className="py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-6">
          {charityTitle}
        </h1>
        
        <div className="space-y-8 text-black">
          <p className="text-base md:text-lg leading-relaxed">
            {introText}
          </p>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              {commitmentTitle}
            </h2>
            <p className="text-base leading-relaxed">
              {commitmentText}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              {howWeHelpTitle}
            </h2>
            <p className="text-base leading-relaxed">
              {howWeHelpText}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              {getInvolvedTitle}
            </h2>
            <p className="text-base leading-relaxed">
              {getInvolvedText}
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
