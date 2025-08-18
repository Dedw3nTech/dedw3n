import { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';

const REGIONS = [
  'Africa',
  'South Asia', 
  'East Asia',
  'Oceania',
  'North America',
  'Central America',
  'South America',
  'Middle East',
  'Europe',
  'Central Asia'
];

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
  'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Macedonia', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
  'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Swaziland', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

// Comprehensive city data for major countries
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'Seattle', 'Denver', 'El Paso', 'Detroit', 'Boston', 'Memphis', 'Nashville', 'Portland', 'Oklahoma City', 'Las Vegas', 'Baltimore', 'Louisville', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh', 'Virginia Beach', 'Long Beach', 'Miami', 'Oakland', 'Minneapolis', 'Tulsa', 'Bakersfield', 'Wichita', 'Arlington'],
  'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield', 'Leeds', 'Edinburgh', 'Leicester', 'Wakefield', 'Cardiff', 'Coventry', 'Belfast', 'Nottingham', 'Newcastle', 'Sunderland', 'Brighton', 'Hull', 'Plymouth', 'Stoke-on-Trent', 'Wolverhampton', 'Derby', 'Swansea', 'Southampton', 'Salford', 'Aberdeen', 'Westminster', 'Portsmouth', 'York', 'Peterborough', 'Dundee', 'Lancaster', 'Oxford', 'Newport', 'Preston', 'St Albans', 'Norwich', 'Chester', 'Cambridge'],
  'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'St. Catharines', 'Regina', 'Sherbrooke', 'Barrie', 'Kelowna', 'Abbotsford', 'Sudbury', 'Kingston', 'Saguenay', 'Trois-Rivières', 'Guelph', 'Cambridge', 'Whitby', 'Saanich', 'Vaughan', 'Richmond Hill', 'Oakville', 'Burlington', 'Greater Sudbury', 'Levis', 'Burnaby', 'Saskatoon', 'Longueuil', 'Burnaby'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Central Coast', 'Wollongong', 'Logan City', 'Geelong', 'Hobart', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba', 'Ballarat', 'Bendigo', 'Albury', 'Launceston', 'Mackay', 'Rockhampton', 'Bunbury', 'Bundaberg', 'Coffs Harbour', 'Wagga Wagga', 'Hervey Bay', 'Mildura', 'Shepparton', 'Port Macquarie', 'Gladstone', 'Tamworth', 'Traralgon', 'Orange', 'Dubbo', 'Geraldton', 'Bowral', 'Bathurst', 'Nowra'],
  'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden', 'Gelsenkirchen', 'Mönchengladbach', 'Braunschweig', 'Chemnitz', 'Kiel', 'Aachen', 'Halle', 'Magdeburg', 'Freiburg', 'Krefeld', 'Lübeck', 'Oberhausen', 'Erfurt', 'Mainz', 'Rostock', 'Kassel'],
  'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Angers', 'Grenoble', 'Dijon', 'Nîmes', 'Aix-en-Provence', 'Saint-Quentin-en-Yvelines', 'Brest', 'Le Mans', 'Amiens', 'Tours', 'Limoges', 'Clermont-Ferrand', 'Villeurbanne', 'Besançon', 'Orléans', 'Mulhouse', 'Rouen', 'Caen', 'Nancy', 'Saint-Denis', 'Saint-Paul', 'Argenteuil', 'Montreuil', 'Roubaix', 'Tourcoing'],
  'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania', 'Venice', 'Verona', 'Messina', 'Padua', 'Trieste', 'Taranto', 'Brescia', 'Prato', 'Parma', 'Modena', 'Reggio Calabria', 'Reggio Emilia', 'Perugia', 'Livorno', 'Ravenna', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara', 'Sassari', 'Latina', 'Giugliano in Campania', 'Monza', 'Syracuse', 'Pescara', 'Bergamo', 'Forlì', 'Trento', 'Vicenza'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Hospitalet de Llobregat', 'Vitoria-Gasteiz', 'A Coruña', 'Elche', 'Granada', 'Oviedo', 'Badalona', 'Cartagena', 'Terrassa', 'Jerez de la Frontera', 'Sabadell', 'Móstoles', 'Santa Cruz de Tenerife', 'Pamplona', 'Almería', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 'Donostia-San Sebastián', 'Burgos', 'Santander', 'Castellón de la Plana', 'Alcorcón', 'Albacete', 'Getafe'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Enschede', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort', 'Apeldoorn', 'Hertogenbosch', 'Hoofddorp', 'Maastricht', 'Leiden', 'Dordrecht', 'Zoetermeer', 'Zwolle', 'Deventer', 'Delft', 'Alkmaar', 'Leeuwarden', 'Sittard-Geleen', 'Venlo', 'Helmond', 'Gouda', 'Purmerend', 'Hilversum', 'Oss', 'Spijkenisse', 'Vlaardingen', 'Alphen aan den Rijn', 'Roosendaal', 'Schiedam', 'Emmen'],
  'Belgium': ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst', 'Mechelen', 'La Louvière', 'Kortrijk', 'Hasselt', 'Sint-Niklaas', 'Ostend', 'Tournai', 'Genk', 'Seraing', 'Roeselare', 'Verviers', 'Mouscron', 'Beveren', 'Dendermonde', 'Beringen', 'Turnhout', 'Vilvoorde', 'Lokeren', 'Sint-Truiden', 'Herstal', 'Brasschaat', 'Grimbergen', 'Mol', 'Maasmechelen', 'Waregem', 'Lier', 'Lessines', 'Geel', 'Herentals', 'Wetteren'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur'],
  'China': ['Shanghai', 'Beijing', 'Chongqing', 'Tianjin', 'Guangzhou', 'Shenzhen', 'Wuhan', 'Dongguan', 'Chengdu', 'Nanjing', 'Foshan', 'Shenyang', 'Hangzhou', 'Xian', 'Harbin', 'Qingdao', 'Dalian', 'Zhengzhou', 'Shantou', 'Jinan', 'Changchun', 'Kunming', 'Changsha', 'Taiyuan', 'Xiamen', 'Hefei', 'Shijiazhuang', 'Urumqi', 'Fuzhou', 'Wuxi', 'Zhongshan', 'Wenzhou', 'Zibo', 'Yantai', 'Zhuhai', 'Huizhou', 'Lanzhou', 'Changzhou', 'Xuzhou', 'Ningbo'],
  'Japan': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama', 'Hiroshima', 'Sendai', 'Kitakyushu', 'Chiba', 'Sakai', 'Niigata', 'Hamamatsu', 'Okayama', 'Sagamihara', 'Kumamoto', 'Shizuoka', 'Kagoshima', 'Matsuyama', 'Kanazawa', 'Utsunomiya', 'Matsudo', 'Kawaguchi', 'Ichikawa', 'Fukuyama', 'Iwaki', 'Nara', 'Takatsuki', 'Oita', 'Toyonaka', 'Nagasaki', 'Toyohashi', 'Machida', 'Gifu', 'Fujisawa', 'Kashiwa'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia', 'Belém', 'Porto Alegre', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Nova Iguaçu', 'Teresina', 'Natal', 'Campo Grande', 'São Bernardo do Campo', 'João Pessoa', 'Santo André', 'Osasco', 'Jaboatão dos Guararapes', 'São José dos Campos', 'Ribeirão Preto', 'Uberlândia', 'Contagem', 'Sorocaba', 'Aracaju', 'Feira de Santana', 'Cuiabá', 'Aparecida de Goiânia', 'Joinville', 'Juiz de Fora', 'Londrina', 'Ananindeua'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'Querétaro', 'San Luis Potosí', 'Mérida', 'Mexicali', 'Aguascalientes', 'Acapulco', 'Cuernavaca', 'Chihuahua', 'Veracruz', 'Villahermosa', 'Cancún', 'Indios Verdes', 'Saltillo', 'Reynosa', 'Hermosillo', 'Toluca', 'Xalapa', 'Tuxtla Gutiérrez', 'Irapuato', 'Morelia', 'Coatzacoalcos', 'Tampico', 'Culiacán', 'Matamoros', 'Mazatlán', 'Ensenada', 'Durango', 'Tepic', 'Victoria', 'Oaxaca', 'Pachuca', 'Campeche'],
  'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod', 'Kazan', 'Chelyabinsk', 'Omsk', 'Samara', 'Rostov-on-Don', 'Ufa', 'Krasnoyarsk', 'Perm', 'Voronezh', 'Volgograd', 'Krasnodar', 'Saratov', 'Tyumen', 'Tolyatti', 'Izhevsk', 'Barnaul', 'Ulyanovsk', 'Irkutsk', 'Vladivostok', 'Yaroslavl', 'Habarovsk', 'Makhachkala', 'Tomsk', 'Orenburg', 'Kemerovo', 'Novokuznetsk', 'Ryazan', 'Naberezhnye Chelny', 'Astrakhan', 'Penza', 'Lipetsk', 'Tula', 'Kirov', 'Cheboksary', 'Kaliningrad'],
  'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Suwon', 'Changwon', 'Seongnam', 'Goyang', 'Yongin', 'Bucheon', 'Cheongju', 'Ansan', 'Jeonju', 'Anyang', 'Cheonan', 'Pohang', 'Uijeongbu', 'Siheung', 'Gimhae', 'Pyeongtaek', 'Paju', 'Jinju', 'Hwaseong', 'Gunsan', 'Wonju', 'Gangneung', 'Jeju City', 'Iksan', 'Asan', 'Yangsan', 'Suncheon', 'Chuncheon', 'Namyangju', 'Mokpo', 'Gumi', 'Gimpo', 'Yeosu']
};

interface RegionSelectorProps {
  currentRegion?: string | null;
  currentCountry?: string | null;
  currentCity?: string | null;
  onRegionChange?: (region: string) => void;
  onCountryChange?: (country: string) => void;
  onCityChange?: (city: string) => void;
  showErrors?: boolean;
  disabled?: boolean;
}

export default function RegionSelector({ 
  currentRegion, 
  currentCountry, 
  currentCity, 
  onRegionChange, 
  onCountryChange, 
  onCityChange, 
  showErrors = false, 
  disabled = false 
}: RegionSelectorProps) {
  const [selectedRegion, setSelectedRegion] = useState(currentRegion || '');
  const [selectedCountry, setSelectedCountry] = useState(currentCountry || '');
  const [selectedCity, setSelectedCity] = useState(currentCity || '');

  // Translation strings for RegionSelector
  const regionTexts = useMemo(() => [
    "Select Your Region",
    "Choose your region",
    "Please select a region",
    "Select Your Country", 
    "Choose your country",
    "Please select a country",
    "Select Your City",
    "Choose your city",
    "Please select a city",
    "City not available for manual entry",
    "Please select a country first"
  ], []);
  
  const { translations } = useMasterBatchTranslation(regionTexts, 'high');
  
  // Create translation map for easy access
  const t = regionTexts.reduce((acc, text, index) => {
    acc[text] = translations[index] || text;
    return acc;
  }, {} as Record<string, string>);

  // Sync local state with props when they change
  useEffect(() => {
    setSelectedRegion(currentRegion || '');
    setSelectedCountry(currentCountry || '');
    setSelectedCity(currentCity || '');
  }, [currentRegion, currentCountry, currentCity]);
  
  const isRegionMissing = showErrors && !selectedRegion;
  const isCountryMissing = showErrors && !selectedCountry;
  const isCityMissing = showErrors && !selectedCity.trim();

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    onRegionChange?.(value);
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedCity(''); // Reset city when country changes
    onCountryChange?.(value);
    onCityChange?.(''); // Reset city callback too
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    onCityChange?.(value);
  };

  // Get available cities for the selected country
  const availableCities = useMemo(() => {
    if (!selectedCountry) return [];
    return CITIES_BY_COUNTRY[selectedCountry] || [];
  }, [selectedCountry]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="region" className={`text-xs ${isRegionMissing ? 'text-red-600' : ''}`}>
          {t["Select Your Region"]} {showErrors && <span className="text-red-600">*</span>}
        </Label>
        <Select value={selectedRegion} onValueChange={handleRegionChange} disabled={disabled}>
          <SelectTrigger className={isRegionMissing ? 'border-red-500 focus:border-red-500' : ''}>
            <SelectValue placeholder={t["Choose your region"]} />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isRegionMissing && (
          <p className="text-red-600 text-sm">{t["Please select a region"]}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="country" className={`text-xs ${isCountryMissing ? 'text-red-600' : ''}`}>
          {t["Select Your Country"]} {showErrors && <span className="text-red-600">*</span>}
        </Label>
        <Select value={selectedCountry} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className={isCountryMissing ? 'border-red-500 focus:border-red-500' : ''}>
            <SelectValue placeholder={t["Choose your country"]} />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {COUNTRIES.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isCountryMissing && (
          <p className="text-red-600 text-sm">{t["Please select a country"]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city" className={`text-xs ${isCityMissing ? 'text-red-600' : 'text-black'}`}>
          {t["Select Your City"]} {showErrors && <span className="text-red-600">*</span>}
        </Label>
        {availableCities.length > 0 ? (
          <Select value={selectedCity} onValueChange={handleCityChange} disabled={disabled || !selectedCountry}>
            <SelectTrigger className={isCityMissing ? 'border-red-500 focus:border-red-500' : ''}>
              <SelectValue placeholder={t["Choose your city"]} />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {availableCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : selectedCountry ? (
          <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-md bg-gray-50">
            {t["City not available for manual entry"]}
          </div>
        ) : (
          <Select value="" onValueChange={() => {}} disabled={true}>
            <SelectTrigger className="text-gray-400">
              <SelectValue placeholder={t["Please select a country first"]} />
            </SelectTrigger>
          </Select>
        )}
        {isCityMissing && (
          <p className="text-red-600 text-sm">{t["Please select a city"]}</p>
        )}
      </div>
    </div>
  );
}