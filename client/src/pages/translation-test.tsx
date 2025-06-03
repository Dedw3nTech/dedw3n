import { TranslatedText } from "@/hooks/use-translated-text";
import { Card } from "@/components/ui/card";

export default function TranslationTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6">
            <TranslatedText>Translation Test Page</TranslatedText>
          </h1>
          
          <div className="space-y-4">
            <p className="text-lg">
              <TranslatedText>Welcome to Dedw3n Marketplace</TranslatedText>
            </p>
            
            <p className="text-lg">
              <TranslatedText>Search for Products</TranslatedText>
            </p>
            
            <p className="text-lg">
              <TranslatedText>Categories</TranslatedText>
            </p>
            
            <p className="text-lg">
              <TranslatedText>Product or Service</TranslatedText>
            </p>
            
            <p className="text-lg">
              <TranslatedText>Fashion & Apparel</TranslatedText>
            </p>
            
            <p className="text-lg">
              <TranslatedText>Electronics</TranslatedText>
            </p>
            
            <p className="text-lg">
              <TranslatedText>Featured Products</TranslatedText>
            </p>
            
            <p className="text-lg">
              <TranslatedText>New Arrivals</TranslatedText>
            </p>
            
            <p className="text-lg">
              <TranslatedText>Shop by Category</TranslatedText>
            </p>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <TranslatedText>Switch language using the dropdown in the top navigation to see translations in action.</TranslatedText>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}