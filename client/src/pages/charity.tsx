import { Container } from "@/components/ui/container";
import { useEffect } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import charityHeaderImage from "@assets/Charity header _1763871204927.png";

export default function CharityPage() {
  useEffect(() => {
    document.title = "Charity - Dedw3n";
  }, []);

  const charityTexts = [
    "Charity",
    "A core component of Dedw3n is the inclusion of Dedw3n Charity. This integration underscores our strong commitment to creating prosperity and equilibrium for all, giving back and creating Environmental, Social, and Governance (ESG) principles. The ESG framework is vital for measuring a company's impact and dedication to sustainability and ethical practices, serving as a key metric for investors and stakeholders to assess long-term performance and non-financial risks. To solidify our ESG commitment, the Dedw3n Group will pledge 10% of its yearly profits to Dedw3n Charity.",
    "How We Help",
    "Through our platform, we facilitate charitable donations and partner with verified charitable organizations to ensure transparency and maximum impact.",
    "Get Involved",
    "Join us in making a difference. Together, we can create positive change in communities around the world."
  ];

  const { translations } = useMasterBatchTranslation(charityTexts);
  
  const [
    charityTitle,
    introText,
    howWeHelpTitle,
    howWeHelpText,
    getInvolvedTitle,
    getInvolvedText
  ] = translations || charityTexts;

  return (
    <>
      {/* Header Image Section */}
      <div className="w-full h-[300px] md:h-[400px] relative overflow-hidden bg-white">
        <img 
          src={charityHeaderImage} 
          alt={charityTitle}
          className="w-full h-full object-cover"
        />
      </div>

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
    </>
  );
}
