import { Container } from "@/components/ui/container";
import { useEffect } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import charityHeaderImage from "@assets/Charity header _1763871204927.png";
import partneringImage from "@assets/waste  ENPLAREC_1763873002193.png";

export default function CharityPage() {
  useEffect(() => {
    document.title = "Charity - Dedw3n";
  }, []);

  const charityTexts = [
    "Charity",
    "A core component of Dedw3n is the inclusion of Dedw3n Charity. This integration underscores our strong commitment to creating prosperity and equilibrium for all, giving back and creating Environmental, Social, and Governance (ESG) principles. The ESG framework is vital for measuring a company's impact and dedication to sustainability and ethical practices, serving as a key metric for investors and stakeholders to assess long-term performance and non-financial risks. To solidify our ESG commitment, the Dedw3n Group will pledge 10% of its yearly profits to Dedw3n Charity.",
    "Partnering for Impact on the Ground",
    "We recognize that creating lasting change requires deep local knowledge and trusted partnerships. Our approach is not to dictate solutions, but to empower them.",
    "We work hand-in-hand with a network of vetted local partners around the world to realize our mission of equilibrium and prosperity. By collaborating with those who understand their communities' unique challenges and opportunities, we ensure that our support is effective, culturally relevant, and sustainable.",
    "Our focus areas, aligned with ESG principles, include:",
    "Environmental: Supporting projects that protect and restore our natural world.",
    "Social: Investing in communities to improve health, education, and equality.",
    "Governance: Promoting ethical practices, transparency, and accountability within our own operations and our partner network.",
    "Get Involved",
    "Join us in making a difference. Together, we can create positive change in communities around the world."
  ];

  const { translations } = useMasterBatchTranslation(charityTexts);
  
  const [
    charityTitle,
    introText,
    partneringTitle,
    partneringText1,
    partneringText2,
    partneringText3,
    partneringFocus1,
    partneringFocus2,
    partneringFocus3,
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
          <p className="text-base leading-relaxed">
            {introText}
          </p>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              {partneringTitle}
            </h2>
            
            <div className="md:flex md:gap-6 md:items-start">
              <div className="md:flex-1">
                <p className="text-base leading-relaxed mb-4">
                  {partneringText1}
                </p>
                <p className="text-base leading-relaxed mb-4">
                  {partneringText2}
                </p>
                <p className="text-base leading-relaxed mb-3">
                  {partneringText3}
                </p>
                <div className="space-y-2 ml-4">
                  <p className="text-base leading-relaxed">
                    <strong>Environmental:</strong> {partneringFocus1?.replace('Environmental: ', '') || 'Supporting projects that protect and restore our natural world.'}
                  </p>
                  <p className="text-base leading-relaxed">
                    <strong>Social:</strong> {partneringFocus2?.replace('Social: ', '') || 'Investing in communities to improve health, education, and equality.'}
                  </p>
                  <p className="text-base leading-relaxed">
                    <strong>Governance:</strong> {partneringFocus3?.replace('Governance: ', '') || 'Promoting ethical practices, transparency, and accountability within our own operations and our partner network.'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 md:w-80 lg:w-96 flex-shrink-0">
                <img 
                  src={partneringImage} 
                  alt="Environmental impact - waste management initiative"
                  className="w-full h-auto rounded-sm shadow-sm"
                />
              </div>
            </div>
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
