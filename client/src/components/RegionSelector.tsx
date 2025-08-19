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

// Regional country mapping for filtering countries by region
const COUNTRIES_BY_REGION: Record<string, string[]> = {
  'Africa': [
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
    'Central African Republic', 'Chad', 'Comoros', 'Congo', 'Democratic Republic of the Congo',
    'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
    'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar',
    'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger',
    'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone',
    'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Swaziland', 'Tanzania', 'Togo', 'Tunisia',
    'Uganda', 'Zambia', 'Zimbabwe'
  ],
  'South Asia': [
    'Afghanistan', 'Bangladesh', 'Bhutan', 'India', 'Maldives', 'Nepal', 'Pakistan', 'Sri Lanka'
  ],
  'East Asia': [
    'Brunei', 'Cambodia', 'China', 'East Timor', 'Indonesia', 'Japan', 'Laos', 'Malaysia',
    'Myanmar', 'North Korea', 'Philippines', 'Singapore', 'South Korea', 'Taiwan', 'Thailand',
    'Vietnam'
  ],
  'Oceania': [
    'Australia', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'New Zealand',
    'Palau', 'Papua New Guinea', 'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu'
  ],
  'North America': [
    'Bahamas', 'Barbados', 'Canada', 'Cuba', 'Dominica', 'Dominican Republic', 'Grenada',
    'Haiti', 'Jamaica', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
    'Trinidad and Tobago', 'United States'
  ],
  'Central America': [
    'Belize', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras', 'Mexico', 'Nicaragua', 'Panama'
  ],
  'South America': [
    'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Guyana', 'Paraguay',
    'Peru', 'Suriname', 'Uruguay', 'Venezuela'
  ],
  'Middle East': [
    'Bahrain', 'Cyprus', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Oman',
    'Qatar', 'Saudi Arabia', 'Syria', 'Turkey', 'United Arab Emirates', 'Yemen'
  ],
  'Europe': [
    'Albania', 'Andorra', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium',
    'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Czech Republic', 'Denmark', 'Estonia',
    'Finland', 'France', 'Georgia', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland',
    'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macedonia', 'Malta',
    'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'Norway', 'Poland', 'Portugal',
    'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
    'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican City'
  ],
  'Central Asia': [
    'Kazakhstan', 'Kyrgyzstan', 'Mongolia', 'Tajikistan', 'Turkmenistan', 'Uzbekistan'
  ]
};



// Comprehensive city data for countries with population over 1000
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  // Europe
  'Albania': ['Tirana', 'Durrës', 'Vlorë', 'Shkodër', 'Fier', 'Korçë', 'Berat', 'Lushnjë', 'Pogradec', 'Gjirokastër', 'Sarandë', 'Laç', 'Kukës', 'Lezhë', 'Patos', 'Ballsh', 'Burrel', 'Krujë', 'Kuçovë', 'Gramsh'],
  'Austria': ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn', 'Wiener Neustadt', 'Steyr', 'Feldkirch', 'Bregenz', 'Leonding', 'Klosterneuburg', 'Baden', 'Wolfsberg', 'Leoben', 'Krems'],
  'Belgium': ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst', 'Mechelen', 'La Louvière', 'Kortrijk', 'Hasselt', 'Sint-Niklaas', 'Ostend', 'Tournai', 'Genk', 'Seraing', 'Roeselare', 'Verviers', 'Mouscron', 'Beveren', 'Dendermonde', 'Beringen', 'Turnhout', 'Vilvoorde', 'Lokeren', 'Sint-Truiden', 'Herstal', 'Brasschaat', 'Grimbergen', 'Mol', 'Maasmechelen', 'Waregem', 'Lier', 'Lessines', 'Geel', 'Herentals', 'Wetteren'],
  'Bulgaria': ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich', 'Shumen', 'Pernik', 'Haskovo', 'Yambol', 'Pazardzhik', 'Blagoevgrad', 'Veliko Tarnovo', 'Vratsa', 'Gabrovo', 'Asenovgrad', 'Vidin'],
  'Croatia': ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Slavonski Brod', 'Pula', 'Sesvete', 'Karlovac', 'Varaždin', 'Šibenik', 'Sisak', 'Vinkovci', 'Dubrovnik', 'Bjelovar', 'Koprivnica', 'Požega', 'Zaprešić', 'Solin', 'Petrinja'],
  'Czech Republic': ['Prague', 'Brno', 'Ostrava', 'Plzen', 'Liberec', 'Olomouc', 'České Budějovice', 'Hradec Králové', 'Ústí nad Labem', 'Pardubice', 'Zlín', 'Havířov', 'Kladno', 'Most', 'Opava', 'Frýdek-Místek', 'Karviná', 'Jihlava', 'Teplice', 'Děčín'],
  'Denmark': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde', 'Herning', 'Helsingør', 'Silkeborg', 'Næstved', 'Fredericia', 'Viborg', 'Køge', 'Holstebro', 'Taastrup', 'Slagelse'],
  'Estonia': ['Tallinn', 'Tartu', 'Narva', 'Pärnu', 'Kohtla-Järve', 'Viljandi', 'Rakvere', 'Maardu', 'Sillamäe', 'Kuressaare', 'Võru', 'Valga', 'Haapsalu', 'Jõhvi', 'Paide', 'Keila', 'Saue', 'Elva', 'Tapa', 'Kiviõli'],
  'Finland': ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori', 'Joensuu', 'Lappeenranta', 'Hämeenlinna', 'Vaasa', 'Seinäjoki', 'Rovaniemi', 'Mikkeli', 'Kotka', 'Salo', 'Porvoo'],
  'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Angers', 'Grenoble', 'Dijon', 'Nîmes', 'Aix-en-Provence', 'Saint-Quentin-en-Yvelines', 'Brest', 'Le Mans', 'Amiens', 'Tours', 'Limoges', 'Clermont-Ferrand', 'Villeurbanne', 'Besançon', 'Orléans', 'Mulhouse', 'Rouen', 'Caen', 'Nancy', 'Saint-Denis', 'Saint-Paul', 'Argenteuil', 'Montreuil', 'Roubaix', 'Tourcoing'],
  'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden', 'Gelsenkirchen', 'Mönchengladbach', 'Braunschweig', 'Chemnitz', 'Kiel', 'Aachen', 'Halle', 'Magdeburg', 'Freiburg', 'Krefeld', 'Lübeck', 'Oberhausen', 'Erfurt', 'Mainz', 'Rostock', 'Kassel'],
  'Greece': ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Rhodes', 'Ioannina', 'Chania', 'Chalcis', 'Serres', 'Alexandroupoli', 'Xanthi', 'Katerini', 'Trikala', 'Lamia', 'Kavala', 'Kalamata', 'Veria', 'Komotini'],
  'Hungary': ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely', 'Érd', 'Tatabánya', 'Kaposvár', 'Békéscsaba', 'Zalaegerszeg', 'Sopron', 'Eger', 'Nagykanizsa', 'Dunakeszi', 'Hódmezővásárhely'],
  'Iceland': ['Reykjavik', 'Kópavogur', 'Hafnarfjörður', 'Akureyri', 'Reykjanesbær', 'Garðabær', 'Mosfellsbær', 'Árborg', 'Akranes', 'Fjarðabyggð', 'Mulaþing', 'Selfoss', 'Seltjarnarnes', 'Vestmannaeyjar', 'Grindavík', 'Ísafjörður', 'Álftanes', 'Garður', 'Vogar', 'Egilsstaðir'],
  'Ireland': ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Swords', 'Bray', 'Navan', 'Ennis', 'Kilkenny', 'Carlow', 'Tralee', 'Naas', 'Athlone', 'Portlaoise', 'Mullingar', 'Wexford', 'Letterkenny'],
  'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania', 'Venice', 'Verona', 'Messina', 'Padua', 'Trieste', 'Taranto', 'Brescia', 'Prato', 'Parma', 'Modena', 'Reggio Calabria', 'Reggio Emilia', 'Perugia', 'Livorno', 'Ravenna', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara', 'Sassari', 'Latina', 'Giugliano in Campania', 'Monza', 'Syracuse', 'Pescara', 'Bergamo', 'Forlì', 'Trento', 'Vicenza'],
  'Latvia': ['Riga', 'Daugavpils', 'Liepāja', 'Jelgava', 'Jūrmala', 'Ventspils', 'Rēzekne', 'Ogre', 'Valmiera', 'Jēkabpils', 'Tukums', 'Salaspils', 'Cēsis', 'Kuldīga', 'Saldus', 'Talsi', 'Dobele', 'Krāslava', 'Bauska', 'Sigulda'],
  'Lithuania': ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys', 'Alytus', 'Marijampolė', 'Mažeikiai', 'Jonava', 'Utena', 'Kėdainiai', 'Telšiai', 'Visaginas', 'Tauragė', 'Ukmergė', 'Plungė', 'Kretinga', 'Šilutė', 'Radviliškis', 'Palanga'],
  'Luxembourg': ['Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange', 'Ettelbruck', 'Diekirch', 'Strassen', 'Bertrange', 'Bettembourg', 'Schifflange', 'Hesperange', 'Pétange', 'Sanem', 'Mamer', 'Mersch', 'Käerjeng', 'Grevenmacher', 'Mondercange', 'Remich', 'Echternach'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Enschede', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort', 'Apeldoorn', 'Hertogenbosch', 'Hoofddorp', 'Maastricht', 'Leiden', 'Dordrecht', 'Zoetermeer', 'Zwolle', 'Deventer', 'Delft', 'Alkmaar', 'Leeuwarden', 'Sittard-Geleen', 'Venlo', 'Helmond', 'Gouda', 'Purmerend', 'Hilversum', 'Oss', 'Spijkenisse', 'Vlaardingen', 'Alphen aan den Rijn', 'Roosendaal', 'Schiedam', 'Emmen'],
  'Norway': ['Oslo', 'Bergen', 'Stavanger', 'Trondheim', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Sandnes', 'Tromsø', 'Sarpsborg', 'Skien', 'Ålesund', 'Sandefjord', 'Haugesund', 'Tønsberg', 'Moss', 'Bodø', 'Arendal', 'Hamar', 'Ytrebygda'],
  'Poland': ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice', 'Białystok', 'Gdynia', 'Częstochowa', 'Radom', 'Sosnowiec', 'Toruń', 'Kielce', 'Gliwice', 'Zabrze', 'Bytom'],
  'Portugal': ['Lisbon', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga', 'Funchal', 'Coimbra', 'Setúbal', 'Almada', 'Agualva-Cacém', 'Queluz', 'Rio Tinto', 'Barreiro', 'Moreira', 'Aveiro', 'Bragança', 'Viseu', 'Guimarães', 'Odivelas', 'Loures'],
  'Romania': ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea', 'Brăila', 'Arad', 'Pitești', 'Sibiu', 'Bacău', 'Târgu Mureș', 'Baia Mare', 'Buzău', 'Botoșani', 'Satu Mare'],
  'Serbia': ['Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica', 'Zrenjanin', 'Pančevo', 'Čačak', 'Novi Pazar', 'Smederevo', 'Leskovac', 'Valjevo', 'Kruševac', 'Vranje', 'Šabac', 'Užice', 'Sombor', 'Požarevac', 'Pirot', 'Zaječar'],
  'Slovakia': ['Bratislava', 'Košice', 'Prešov', 'Žilina', 'Banská Bystrica', 'Nitra', 'Trnava', 'Trenčín', 'Martin', 'Poprad', 'Prievidza', 'Zvolen', 'Považská Bystrica', 'Michalovce', 'Spišská Nová Ves', 'Komárno', 'Levice', 'Bardejov', 'Liptovský Mikuláš', 'Ružomberok'],
  'Slovenia': ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje', 'Koper', 'Novo Mesto', 'Ptuj', 'Trbovlje', 'Kamnik', 'Jesenice', 'Nova Gorica', 'Domžale', 'Škofja Loka', 'Murska Sobota', 'Slovenj Gradec', 'Krško', 'Postojna', 'Vrhnika', 'Izola'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Hospitalet de Llobregat', 'Vitoria-Gasteiz', 'A Coruña', 'Elche', 'Granada', 'Oviedo', 'Badalona', 'Cartagena', 'Terrassa', 'Jerez de la Frontera', 'Sabadell', 'Móstoles', 'Santa Cruz de Tenerife', 'Pamplona', 'Almería', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 'Donostia-San Sebastián', 'Burgos', 'Santander', 'Castellón de la Plana', 'Alcorcón', 'Albacete', 'Getafe'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Lund', 'Umeå', 'Gävle', 'Borås', 'Södertälje', 'Eskilstuna', 'Halmstad', 'Växjö', 'Karlstad', 'Sundsvall'],
  'Switzerland': ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel/Bienne', 'Thun', 'Köniz', 'La Chaux-de-Fonds', 'Schaffhausen', 'Fribourg', 'Vernier', 'Chur', 'Neuchâtel', 'Uster', 'Sion'],
  'Ukraine': ['Kyiv', 'Kharkiv', 'Odesa', 'Dnipro', 'Donetsk', 'Zaporizhzhia', 'Lviv', 'Kryvyi Rih', 'Mykolaiv', 'Mariupol', 'Luhansk', 'Makiivka', 'Vinnytsia', 'Simferopol', 'Kherson', 'Poltava', 'Chernihiv', 'Cherkasy', 'Zhytomyr', 'Sumy'],
  'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield', 'Leeds', 'Edinburgh', 'Leicester', 'Wakefield', 'Cardiff', 'Coventry', 'Belfast', 'Nottingham', 'Newcastle', 'Sunderland', 'Brighton', 'Hull', 'Plymouth', 'Stoke-on-Trent', 'Wolverhampton', 'Derby', 'Swansea', 'Southampton', 'Salford', 'Aberdeen', 'Westminster', 'Portsmouth', 'York', 'Peterborough', 'Dundee', 'Lancaster', 'Oxford', 'Newport', 'Preston', 'St Albans', 'Norwich', 'Chester', 'Cambridge'],

  // North America
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'Seattle', 'Denver', 'El Paso', 'Detroit', 'Boston', 'Memphis', 'Nashville', 'Portland', 'Oklahoma City', 'Las Vegas', 'Baltimore', 'Louisville', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh', 'Virginia Beach', 'Long Beach', 'Miami', 'Oakland', 'Minneapolis', 'Tulsa', 'Bakersfield', 'Wichita', 'Arlington'],
  'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'St. Catharines', 'Regina', 'Sherbrooke', 'Barrie', 'Kelowna', 'Abbotsford', 'Sudbury', 'Kingston', 'Saguenay', 'Trois-Rivières', 'Guelph', 'Cambridge', 'Whitby', 'Saanich', 'Vaughan', 'Richmond Hill', 'Oakville', 'Burlington', 'Greater Sudbury', 'Levis', 'Burnaby', 'Saskatoon', 'Longueuil', 'Burnaby'],

  // Asia
  'Afghanistan': ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Kunduz', 'Jalalabad', 'Taloqan', 'Puli Khumri', 'Ghazni', 'Farah', 'Lashkar Gah', 'Bamyan', 'Gardez', 'Khost', 'Chaghcharan', 'Zaranj', 'Mahmud-i-Raqi', 'Asadabad', 'Shahr-e Naw', 'Qalat'],
  'Bangladesh': ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Rangpur', 'Barisal', 'Comilla', 'Narayanganj', 'Gazipur', 'Mymensingh', 'Bogra', 'Dinajpur', 'Jessore', 'Kushtia', 'Noakhali', 'Brahmanbaria', 'Tangail', 'Jamalpur', 'Pabna'],
  'China': ['Shanghai', 'Beijing', 'Chongqing', 'Tianjin', 'Guangzhou', 'Shenzhen', 'Wuhan', 'Dongguan', 'Chengdu', 'Nanjing', 'Foshan', 'Shenyang', 'Hangzhou', 'Xian', 'Harbin', 'Qingdao', 'Dalian', 'Zhengzhou', 'Shantou', 'Jinan', 'Changchun', 'Kunming', 'Changsha', 'Taiyuan', 'Xiamen', 'Hefei', 'Shijiazhuang', 'Urumqi', 'Fuzhou', 'Wuxi', 'Zhongshan', 'Wenzhou', 'Zibo', 'Yantai', 'Zhuhai', 'Huizhou', 'Lanzhou', 'Changzhou', 'Xuzhou', 'Ningbo'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur'],
  'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Bekasi', 'Medan', 'Depok', 'Tangerang', 'Palembang', 'Semarang', 'Makassar', 'South Tangerang', 'Batam', 'Bogor', 'Pekanbaru', 'Bandar Lampung', 'Padang', 'Malang', 'Surakarta', 'Balikpapan', 'Denpasar'],
  'Japan': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama', 'Hiroshima', 'Sendai', 'Kitakyushu', 'Chiba', 'Sakai', 'Niigata', 'Hamamatsu', 'Okayama', 'Sagamihara', 'Kumamoto', 'Shizuoka', 'Kagoshima', 'Matsuyama', 'Kanazawa', 'Utsunomiya', 'Matsudo', 'Kawaguchi', 'Ichikawa', 'Fukuyama', 'Iwaki', 'Nara', 'Takatsuki', 'Oita', 'Toyonaka', 'Nagasaki', 'Toyohashi', 'Machida', 'Gifu', 'Fujisawa', 'Kashiwa'],
  'Pakistan': ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Peshawar', 'Multan', 'Hyderabad', 'Islamabad', 'Quetta', 'Bahawalpur', 'Sargodha', 'Sialkot', 'Sukkur', 'Larkana', 'Sheikhupura', 'Jhang', 'Rahim Yar Khan', 'Gujrat', 'Kasur'],
  'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Suwon', 'Changwon', 'Seongnam', 'Goyang', 'Yongin', 'Bucheon', 'Cheongju', 'Ansan', 'Jeonju', 'Anyang', 'Cheonan', 'Pohang', 'Uijeongbu', 'Siheung', 'Gimhae', 'Pyeongtaek', 'Paju', 'Jinju', 'Hwaseong', 'Gunsan', 'Wonju', 'Gangneung', 'Jeju City', 'Iksan', 'Asan', 'Yangsan', 'Suncheon', 'Chuncheon', 'Namyangju', 'Mokpo', 'Gumi', 'Gimpo', 'Yeosu'],
  'Thailand': ['Bangkok', 'Nonthaburi', 'Pak Kret', 'Hat Yai', 'Chiang Mai', 'Phuket', 'Pattaya', 'Nakhon Ratchasima', 'Udon Thani', 'Surat Thani', 'Khon Kaen', 'Rayong', 'Lampang', 'Chiang Rai', 'Nakhon Si Thammarat', 'Phitsanulok', 'Saraburi', 'Samut Prakan', 'Kanchanaburi', 'Ratchaburi'],

  // Africa - Comprehensive coverage for all 53 African countries
  'Algeria': ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Djelfa', 'Sétif', 'Sidi Bel Abbès', 'Biskra', 'Tébessa', 'El Oued', 'Skikda', 'Tiaret', 'Béjaïa', 'Tlemcen', 'Ouargla', 'Béchar', 'Mostaganem', 'Bordj Bou Arréridj'],
  'Angola': ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Kuito', 'Lubango', 'Malanje', 'Namibe', 'Soyo', 'Cabinda', 'Uíge', 'Saurimo', 'Sumbe', 'Menongue', 'Mussende', 'Caxito', 'Kuando Kubango', 'Ondjiva', 'Ndalatando', 'Mbanza-Kongo'],
  'Benin': ['Cotonou', 'Porto-Novo', 'Parakou', 'Djougou', 'Bohicon', 'Kandi', 'Lokossa', 'Ouidah', 'Abomey', 'Natitingou', 'Savé', 'Malanville', 'Pobè', 'Kétou', 'Savalou', 'Bassila', 'Zakpota', 'Covè', 'Bembèrèkè', 'Karimama'],
  'Botswana': ['Gaborone', 'Francistown', 'Molepolole', 'Maun', 'Serowe', 'Selibe Phikwe', 'Kanye', 'Mochudi', 'Mahalapye', 'Palapye', 'Tlokweng', 'Lobatse', 'Ramotswa', 'Letlhakane', 'Tonota', 'Moshupa', 'Tutume', 'Jwaneng', 'Bobonong', 'Ghanzi'],
  'Burkina Faso': ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora', 'Kaya', 'Tenkodogo', 'Orodara', 'Fada Ngourma', 'Ziniaré', 'Koupéla', 'Réo', 'Gaoua', 'Dori', 'Boulsa', 'Manga', 'Djibo', 'Kombissiri', 'Léo', 'Pouytenga'],
  'Burundi': ['Gitega', 'Bujumbura', 'Muyinga', 'Ruyigi', 'Kayanza', 'Ngozi', 'Bururi', 'Rutana', 'Makamba', 'Muramvya', 'Cankuzo', 'Cibitoke', 'Bubanza', 'Kirundo', 'Karuzi', 'Mwaro', 'Rumonge', 'Isale'],
  'Cameroon': ['Douala', 'Yaoundé', 'Bamenda', 'Bafoussam', 'Garoua', 'Maroua', 'Nkongsamba', 'Loum', 'Kumba', 'Edéa', 'Foumban', 'Bertoua', 'Limbé', 'Dschang', 'Ngaoundéré', 'Ebolowa', 'Kribi', 'Sangmélima', 'Mbalmayo', 'Bafang'],
  'Cape Verde': ['Praia', 'Mindelo', 'Santa Maria', 'Assomada', 'Porto Novo', 'Espargos', 'Ribeira Grande', 'São Filipe', 'Tarrafal', 'Santa Cruz', 'Pedra Badejo', 'São Domingos', 'Sal Rei', 'Vila do Maio', 'Nova Sintra'],
  'Central African Republic': ['Bangui', 'Bimbo', 'Berbérati', 'Carnot', 'Bambari', 'Bouar', 'Bossangoa', 'Bria', 'Bangassou', 'Nola', 'Mbaïki', 'Kaga-Bandoro', 'Sibut', 'Mobaye', 'Zemio', 'Rafaï', 'Batangafo', 'Bozoum', 'Paoua', 'Ndélé'],
  'Chad': ['N\'Djamena', 'Moundou', 'Sarh', 'Abéché', 'Kélo', 'Koumra', 'Pala', 'Am Timan', 'Bongor', 'Mongo', 'Doba', 'Ati', 'Laï', 'Faya-Largeau', 'Mao', 'Moïssala', 'Massaguet', 'Goz Beïda', 'Béré', 'Kyabé'],
  'Comoros': ['Moroni', 'Mutsamudu', 'Fomboni', 'Domoni', 'Sima', 'Ouani', 'Mramani', 'Foumbouni', 'Tsimbeo', 'Mirontsy'],
  'Congo': ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Mossendjo', 'Ouesso', 'Madingou', 'Owando', 'Sibiti', 'Gamboma', 'Impfondo', 'Boundji', 'Makabana', 'Djambala', 'Makoua', 'Ewo', 'Loutété', 'Zanaga', 'Ngo', 'Kellé'],
  'Democratic Republic of the Congo': ['Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kisangani', 'Masina', 'Kananga', 'Likasi', 'Kolwezi', 'Tshikapa', 'Beni', 'Bukavu', 'Mwene-Ditu', 'Kikwit', 'Mbandaka', 'Matadi', 'Uvira', 'Butembo', 'Gandajika', 'Kalemie', 'Goma'],
  'Djibouti': ['Djibouti City', 'Ali Sabieh', 'Dikhil', 'Tadjourah', 'Obock', 'Arta', 'Holhol', 'Yoboki', 'As Eyla', 'Balho'],
  'Egypt': ['Cairo', 'Alexandria', 'Port Said', 'Suez', 'Luxor', 'al-Mansura', 'el-Mahalla el-Kubra', 'Tanta', 'Asyut', 'Ismailia', 'Fayyum', 'Zagazig', 'Aswan', 'Damietta', 'Damanhur', 'al-Minya', 'Beni Suef', 'Qena', 'Sohag', 'Hurghada'],
  'Equatorial Guinea': ['Malabo', 'Bata', 'Ebebiyín', 'Aconibe', 'Añisoc', 'Luba', 'Evinayong', 'Mongomo', 'Mengomeyén', 'Acurenam', 'Cogo', 'Machinda', 'Mbini', 'Mikomeseng', 'Nsok', 'Palma', 'Río Campo', 'Valdemoro', 'Bidjabidjan', 'Corisco'],
  'Eritrea': ['Asmara', 'Keren', 'Massawa', 'Assab', 'Mendefera', 'Barentu', 'Adi Keih', 'Adi Quala', 'Dekemhare', 'Areza', 'Ghinda', 'Senafe', 'Tesseney', 'Nakfa', 'Afabet', 'Ela Bered', 'Segeneiti', 'Himbirti', 'Foro', 'Gahtelay'],
  'Ethiopia': ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Adama', 'Awassa', 'Bahir Dar', 'Gondar', 'Dessie', 'Jimma', 'Jijiga', 'Shashamane', 'Nekemte', 'Bishoftu', 'Asella', 'Harar', 'Dilla', 'Sodo', 'Arba Minch', 'Hosaena', 'Debre Markos'],
  'Gabon': ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Mouila', 'Lambaréné', 'Tchibanga', 'Koulamoutou', 'Makokou', 'Bitam', 'Gamba', 'Mayumba', 'Mitzic', 'Ndendé', 'Okondja', 'Lastoursville', 'Lebamba', 'Booué', 'Fougamou'],
  'Gambia': ['Banjul', 'Serekunda', 'Brikama', 'Bakau', 'Farafenni', 'Lamin', 'Sukuta', 'Gunjur', 'Soma', 'Basse Santa Su', 'Essau', 'Georgetown', 'Kerewan', 'Mansa Konko', 'Sinchu Baliya', 'Barra', 'Janjanbureh', 'Kuntaur', 'Wuli', 'Kiang West'],
  'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Ashaiman', 'Sunyani', 'Cape Coast', 'Obuasi', 'Teshi', 'Madina', 'Koforidua', 'Wa', 'Techiman', 'Ho', 'Nungua', 'Lashibi', 'Dome', 'Kpandu', 'Yendi', 'Bolgatanga'],
  'Guinea': ['Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labe', 'Mamou', 'Boke', 'Guéckédou', 'Kissidougou', 'Dabola', 'Siguiri', 'Kouroussa', 'Beyla', 'Faranah', 'Télimélé', 'Macenta', 'Pita', 'Gaoual', 'Dinguiraye', 'Dalaba'],
  'Guinea-Bissau': ['Bissau', 'Bafatá', 'Gabú', 'Bissorã', 'Bolama', 'Cacheu', 'Catió', 'Canchungo', 'Farim', 'Fulacunda', 'Mansôa', 'Nhacra', 'Pirada', 'Quebo', 'Quinhámel', 'São Domingos', 'Tite', 'Uno', 'Varela', 'Xitole'],
  'Ivory Coast': ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Divo', 'Korhogo', 'Anyama', 'Gagnoa', 'Man', 'Soubré', 'Agboville', 'Dabou', 'Grand-Bassam', 'Bondoukou', 'Abengourou', 'Bingerville', 'Odienné', 'Séguéla', 'Danané'],
  'Kenya': ['Nairobi', 'Mombasa', 'Nakuru', 'Eldoret', 'Kisumu', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega', 'Machakos', 'Meru', 'Nyeri', 'Kericho', 'Naivasha', 'Voi', 'Homa Bay', 'Kapenguria', 'Embu', 'Webuye'],
  'Lesotho': ['Maseru', 'Teyateyaneng', 'Mafeteng', 'Hlotse', 'Mohale\'s Hoek', 'Maputsoe', 'Qacha\'s Nek', 'Quthing', 'Butha-Buthe', 'Mokhotlong', 'Thaba-Tseka', 'Peka', 'Mapoteng', 'Kolonyama', 'Semonkong', 'Bobete', 'Mantsonyane', 'Sehlabathebe', 'Nohana', 'Sekake'],
  'Liberia': ['Monrovia', 'Gbarnga', 'Kakata', 'Bensonville', 'Harper', 'Voinjama', 'Buchanan', 'Zwedru', 'New Kru Town', 'Pleebo', 'Tubmanburg', 'Greenville', 'Robertsport', 'Fish Town', 'Barclayville', 'Saclepea', 'Yekepa', 'Tappita', 'Sanniquellie', 'Bopolu'],
  'Libya': ['Tripoli', 'Benghazi', 'Misrata', 'Tarhuna', 'Al Bayda', 'Zawiya', 'Zliten', 'Ajdabiya', 'Tobruk', 'Sabha', 'Sirte', 'Gharyan', 'Derna', 'Marj', 'Bani Walid', 'Ubari', 'Sabratha', 'Sorman', 'Al Khums', 'Nalut'],
  'Madagascar': ['Antananarivo', 'Toamasina', 'Antsirabe', 'Fianarantsoa', 'Mahajanga', 'Toliara', 'Antsiranana', 'Ambovombe', 'Mandritsara', 'Ambilobe', 'Farafangana', 'Maintirano', 'Manakara', 'Morondava', 'Sambava', 'Vangaindrano', 'Ihosy', 'Betroka', 'Sainte-Marie', 'Ambalavao'],
  'Malawi': ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi', 'Karonga', 'Salima', 'Liwonde', 'Nkhotakota', 'Chintheche', 'Dedza', 'Nchalo', 'Nsanje', 'Chitipa', 'Rumphi', 'Dowa', 'Ntcheu', 'Chiradzulu', 'Thyolo'],
  'Mali': ['Bamako', 'Sikasso', 'Mopti', 'Koutiala', 'Kayes', 'Ségou', 'Gao', 'Kati', 'Tombouctou', 'San', 'Bla', 'Djenné', 'Banamba', 'Kolokani', 'Niono', 'Macina', 'Douentza', 'Kidal', 'Ansongo', 'Bourem'],
  'Mauritania': ['Nouakchott', 'Nouadhibou', 'Néma', 'Kaédi', 'Zouérat', 'Rosso', 'Atar', 'Adel Bagrou', 'Aleg', 'Bogué', 'Kiffa', 'Aioun', 'Tidjikdja', 'Akjoujt', 'Magta Lahjar', 'Boutilimit', 'Guerou', 'Chinguetti', 'Ouadane', 'Tichitt'],
  'Mauritius': ['Port Louis', 'Beau Bassin-Rose Hill', 'Vacoas-Phoenix', 'Curepipe', 'Quatre Bornes', 'Triolet', 'Goodlands', 'Centre de Flacq', 'Mahebourg', 'Saint Pierre', 'Bel Air Rivière Sèche', 'Grand Baie', 'Pamplemousses', 'Rivière du Rempart', 'Rose Belle', 'Surinam', 'Tamarin', 'Bambous', 'Grand Gaube', 'Albion'],
  'Morocco': ['Casablanca', 'Rabat', 'Fez', 'Marrakech', 'Agadir', 'Tangier', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'Mohammedia', 'Khouribga', 'El Jadida', 'Beni Mellal', 'Nador', 'Taza', 'Settat', 'Berrechid', 'Khemisset'],
  'Mozambique': ['Maputo', 'Matola', 'Nampula', 'Beira', 'Chimoio', 'Nacala', 'Quelimane', 'Tete', 'Xai-Xai', 'Lichinga', 'Pemba', 'Inhambane', 'Maxixe', 'Angoche', 'Montepuez', 'Chokwé', 'Cuamba', 'Manhiça', 'Mandimba', 'Moatize'],
  'Namibia': ['Windhoek', 'Rundu', 'Walvis Bay', 'Oshakati', 'Swakopmund', 'Katima Mulilo', 'Grootfontein', 'Rehoboth', 'Otjiwarongo', 'Okahandja', 'Ondangwa', 'Gobabis', 'Henties Bay', 'Tsumeb', 'Keetmanshoop', 'Aranos', 'Lüderitz', 'Omaruru', 'Outapi', 'Karasburg'],
  'Niger': ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua', 'Dosso', 'Tillabéri', 'Diffa', 'Tessaoua', 'Birni N Konni', 'Guigmi', 'Madaoua', 'Magaria', 'Mirriah', 'Gouré', 'Dakoro', 'Mayahi', 'Matameye', 'Dogondoutchi', 'Abalak'],
  'Nigeria': ['Lagos', 'Kano', 'Ibadan', 'Kaduna', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu', 'Abeokuta', 'Abuja', 'Sokoto', 'Onitsha', 'Warri', 'Okene', 'Calabar'],
  'Rwanda': ['Kigali', 'Butare', 'Gitarama', 'Ruhengeri', 'Gisenyi', 'Byumba', 'Cyangugu', 'Kibungo', 'Kibuye', 'Gikongoro', 'Nyagatare', 'Muhanga', 'Musanze', 'Rubavu', 'Bugesera', 'Gisagara', 'Nyaruguru', 'Kayonza', 'Kirehe', 'Ngoma'],
  'Sao Tome and Principe': ['São Tomé', 'Santo António', 'Neves', 'Santana', 'Trindade', 'Guadalupe', 'Santa Cruz', 'Cantagalo', 'Porto Alegre', 'Ribeira Afonso'],
  'Senegal': ['Dakar', 'Thiès', 'Kaolack', 'Saint-Louis', 'Ziguinchor', 'Diourbel', 'Touba', 'Tambacounda', 'Mbour', 'Tivaouane', 'Rufisque', 'Kolda', 'Fatick', 'Louga', 'Vélingara', 'Matam', 'Bakel', 'Podor', 'Linguère', 'Kédougou'],
  'Seychelles': ['Victoria', 'Anse Boileau', 'Beau Vallon', 'Takamaka', 'Anse Royale', 'Cascade', 'English River', 'Grand Anse Mahé', 'Glacis', 'Bel Ombre', 'Port Glaud', 'Saint Louis', 'Anse aux Pins', 'Au Cap', 'Baie Lazare', 'Baie Sainte Anne', 'Grand Anse Praslin', 'La Digue', 'Plaisance', 'Pointe La Rue'],
  'Sierra Leone': ['Freetown', 'Bo', 'Kenema', 'Koidu', 'Makeni', 'Lunsar', 'Port Loko', 'Waterloo', 'Kabala', 'Kailahun', 'Yengema', 'Magburaka', 'Bonthe', 'Moyamba', 'Koindu', 'Segbwema', 'Mile 91', 'Kambia', 'Pujehun', 'Bumban'],
  'Somalia': ['Mogadishu', 'Hargeisa', 'Bosaso', 'Galkayo', 'Merca', 'Jamame', 'Borama', 'Kismayo', 'Afgooye', 'Baidoa', 'Garowe', 'Berbera', 'Jowhar', 'Las Anod', 'Burao', 'Erigavo', 'Qardho', 'Luuq', 'Bardera', 'Dhusamareb'],
  'South Africa': ['Cape Town', 'Durban', 'Johannesburg', 'Soweto', 'Pretoria', 'Port Elizabeth', 'Pietermaritzburg', 'Benoni', 'Tembisa', 'East London', 'Vereeniging', 'Bloemfontein', 'Boksburg', 'Welkom', 'Newcastle', 'Krugersdorp', 'Diepsloot', 'Botshabelo', 'Brakpan', 'Witbank'],
  'South Sudan': ['Juba', 'Wau', 'Malakal', 'Yei', 'Aweil', 'Kuacjok', 'Bentiu', 'Rumbek', 'Bor', 'Torit', 'Yambio', 'Kapoeta', 'Nasir', 'Pibor', 'Pochalla', 'Akobo', 'Pariang', 'Mayom', 'Gogrial', 'Tonj'],
  'Sudan': ['Khartoum', 'Omdurman', 'Khartoum North', 'Nyala', 'Port Sudan', 'Kassala', 'Al-Ubayyid', 'Kosti', 'Wad Madani', 'El Fasher', 'Atbara', 'Dongola', 'Geneina', 'Zalingei', 'Ad-Damazin', 'Kadugli', 'Al-Qadarif', 'Rabak', 'Al Manaqil', 'Shendi'],
  'Swaziland': ['Mbabane', 'Manzini', 'Lobamba', 'Siteki', 'Malkerns', 'Nhlangano', 'Pigg\'s Peak', 'Big Bend', 'Hluti', 'Simunye', 'Tshaneni', 'Lavumisa', 'Bulembu', 'Mankayane', 'Sidvokodvo', 'Mahamba', 'Nkoyoyo', 'Luyengo', 'Maguga', 'Motshane'],
  'Tanzania': ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Kahama', 'Tabora', 'Zanzibar City', 'Kigoma', 'Sumbawanga', 'Kasulu', 'Songea', 'Moshi', 'Musoma', 'Shinyanga', 'Iringa', 'Singida', 'Njombe'],
  'Togo': ['Lomé', 'Sokodé', 'Kara', 'Atakpamé', 'Kpalimé', 'Bassar', 'Tsévié', 'Aného', 'Sansanné-Mango', 'Dapaong', 'Tchamba', 'Niamtougou', 'Bafilo', 'Notse', 'Vogan', 'Badou', 'Kandé', 'Amlamé', 'Sotouboua', 'Tabligbo'],
  'Tunisia': ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa', 'Monastir', 'Ben Arous', 'Kasserine', 'Médenine', 'Nabeul', 'Tataouine', 'Béja', 'Jendouba', 'Mahdia', 'Siliana', 'Manouba', 'Zaghouan'],
  'Uganda': ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Bwizibwera', 'Mbale', 'Mukono', 'Kasese', 'Masaka', 'Entebbe', 'Njeru', 'Kitgum', 'Hoima', 'Arua', 'Soroti', 'Kabale', 'Busia', 'Iganga', 'Fort Portal'],
  'Zambia': ['Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola', 'Mufulira', 'Livingstone', 'Luanshya', 'Kasama', 'Chipata', 'Kalulushi', 'Mazabuka', 'Chililabombwe', 'Kafue', 'Choma', 'Mongu', 'Solwezi', 'Kapiri Mposhi', 'Mansa', 'Petauke'],
  'Zimbabwe': ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Epworth', 'Gweru', 'Kwekwe', 'Kadoma', 'Masvingo', 'Chinhoyi', 'Norton', 'Marondera', 'Ruwa', 'Chegutu', 'Zvishavane', 'Bindura', 'Beitbridge', 'Redcliff', 'Victoria Falls', 'Hwange'],

  // Oceania
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Central Coast', 'Wollongong', 'Logan City', 'Geelong', 'Hobart', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba', 'Ballarat', 'Bendigo', 'Albury', 'Launceston', 'Mackay', 'Rockhampton', 'Bunbury', 'Bundaberg', 'Coffs Harbour', 'Wagga Wagga', 'Hervey Bay', 'Mildura', 'Shepparton', 'Port Macquarie', 'Gladstone', 'Tamworth', 'Traralgon', 'Orange', 'Dubbo', 'Geraldton', 'Bowral', 'Bathurst', 'Nowra'],
  'New Zealand': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Napier-Hastings', 'Dunedin', 'Palmerston North', 'Nelson', 'Rotorua', 'New Plymouth', 'Whangarei', 'Invercargill', 'Whanganui', 'Gisborne', 'Blenheim', 'Pukekohe', 'Timaru', 'Masterton', 'Levin'],

  // Americas
  'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'San Miguel de Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan', 'Neuquén', 'Santiago del Estero', 'Corrientes', 'Avellaneda', 'Bahía Blanca', 'Resistencia', 'San Salvador de Jujuy', 'Paraná', 'Posadas', 'San Luis'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia', 'Belém', 'Porto Alegre', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Nova Iguaçu', 'Teresina', 'Natal', 'Campo Grande', 'São Bernardo do Campo', 'João Pessoa', 'Santo André', 'Osasco', 'Jaboatão dos Guararapes', 'São José dos Campos', 'Ribeirão Preto', 'Uberlândia', 'Contagem', 'Sorocaba', 'Aracaju', 'Feira de Santana', 'Cuiabá', 'Aparecida de Goiânia', 'Joinville', 'Juiz de Fora', 'Londrina', 'Ananindeua'],
  'Chile': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Talca', 'Arica', 'Chillán', 'Iquique', 'Los Ángeles', 'Puerto Montt', 'Calama', 'Coquimbo', 'Osorno', 'Valdivia', 'Punta Arenas', 'Copiapó', 'Quilpué'],
  'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Soledad', 'Ibagué', 'Bucaramanga', 'Soacha', 'Santa Marta', 'Villavicencio', 'Valledupar', 'Pereira', 'Montería', 'Bello', 'Pasto', 'Manizales', 'Neiva', 'Palmira'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'Querétaro', 'San Luis Potosí', 'Mérida', 'Mexicali', 'Aguascalientes', 'Acapulco', 'Cuernavaca', 'Chihuahua', 'Veracruz', 'Villahermosa', 'Cancún', 'Indios Verdes', 'Saltillo', 'Reynosa', 'Hermosillo', 'Toluca', 'Xalapa', 'Tuxtla Gutiérrez', 'Irapuato', 'Morelia', 'Coatzacoalcos', 'Tampico', 'Culiacán', 'Matamoros', 'Mazatlán', 'Ensenada', 'Durango', 'Tepic', 'Victoria', 'Oaxaca', 'Pachuca', 'Campeche'],
  'Peru': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Huancayo', 'Piura', 'Iquitos', 'Cusco', 'Chimbote', 'Tacna', 'Juliaca', 'Ica', 'Sullana', 'Ayacucho', 'Chincha Alta', 'Huánuco', 'Tarapoto', 'Pucallpa', 'Cajamarca', 'Puno'],

  // Middle East
  'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Antalya', 'Kayseri', 'Mersin', 'Eskişehir', 'Diyarbakır', 'Samsun', 'Denizli', 'Şanlıurfa', 'Adapazarı', 'Malatya', 'Kahramanmaraş', 'Erzurum', 'Van'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Buraydah', 'Khamis Mushait', 'Hail', 'Hafar Al-Batin', 'Jubail', 'Dhahran', 'Taif', 'Qatif', 'Abha', 'Yanbu', 'Najran', 'Al Mubarraz', 'Arar'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Kalba', 'Dibba Al-Fujairah', 'Jebel Ali', 'Madinat Zayed', 'Liwa Oasis', 'Ghayathi', 'Ruwais', 'Sila', 'Mirfa', 'Dalma', 'Sweihan'],
  'Israel': ['Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion', 'Petah Tikva', 'Ashdod', 'Netanya', 'Beer Sheva', 'Holon', 'Bnei Brak', 'Rehovot', 'Bat Yam', 'Beit Shemesh', 'Kfar Saba', 'Herzliya', 'Hadera', 'Modi in', 'Nazareth', 'Lod', 'Ramat Gan'],

  // Central Asia
  'Kazakhstan': ['Almaty', 'Nur-Sultan', 'Shymkent', 'Aktobe', 'Taraz', 'Pavlodar', 'Ust-Kamenogorsk', 'Semey', 'Atyrau', 'Kostanay', 'Petropavl', 'Oral', 'Temirtau', 'Aktau', 'Kokshetau', 'Taldykorgan', 'Ekibastuz', 'Rudny', 'Zhezkazgan', 'Karaganda'],
  'Uzbekistan': ['Tashkent', 'Namangan', 'Samarkand', 'Andijan', 'Nukus', 'Bukhara', 'Qarshi', 'Kokand', 'Fergana', 'Margilan', 'Urgench', 'Jizzakh', 'Gulistan', 'Navoiy', 'Termez', 'Angren', 'Chirchiq', 'Bekabad', 'Khiva', 'Denov'],

  // Additional countries with smaller populations
  'Monaco': ['Monaco', 'Monte Carlo', 'La Condamine', 'Fontvieille'],
  'Vatican City': ['Vatican City'],
  'San Marino': ['San Marino', 'Serravalle', 'Borgo Maggiore', 'Domagnano'],
  'Liechtenstein': ['Vaduz', 'Schaan', 'Balzers', 'Triesen', 'Eschen'],
  'Andorra': ['Andorra la Vella', 'Escaldes-Engordany', 'Sant Julià de Lòria', 'Encamp', 'La Massana'],
  'Malta': ['Valletta', 'Birkirkara', 'Mosta', 'Qormi', 'Żabbar', 'San Pawl il-Baħar', 'Naxxar', 'Żejtun', 'Sliema', 'Mellieħa'],
  'Cyprus': ['Nicosia', 'Limassol', 'Larnaca', 'Famagusta', 'Paphos', 'Kyrenia', 'Protaras', 'Ayia Napa', 'Polis', 'Paralimni']
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
    "Please select a country first",
    "Please select a region first"
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
    setSelectedCountry(''); // Reset country when region changes
    setSelectedCity(''); // Reset city when region changes
    onRegionChange?.(value);
    onCountryChange?.(''); // Reset country callback too
    onCityChange?.(''); // Reset city callback too
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

  // Get available countries for the selected region
  const availableCountries = useMemo(() => {
    if (!selectedRegion) return [];
    return COUNTRIES_BY_REGION[selectedRegion] || [];
  }, [selectedRegion]);

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
        <Select value={selectedCountry} onValueChange={handleCountryChange} disabled={disabled || !selectedRegion}>
          <SelectTrigger className={isCountryMissing ? 'border-red-500 focus:border-red-500' : ''}>
            <SelectValue placeholder={selectedRegion ? (t["Choose your country"] || "Choose your country") : (t["Please select a region first"] || "Please select a region first")} />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {availableCountries.map((country) => (
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