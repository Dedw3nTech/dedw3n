/**
 * Enhanced Comprehensive City and Village Database
 * Expanded coverage with major cities, towns, and villages for all countries
 */

export const ENHANCED_CITIES_BY_COUNTRY: Record<string, string[]> = {
  // Europe - Expanded with more cities, towns, and villages
  'Albania': [
    'Tirana', 'Durrës', 'Vlorë', 'Shkodër', 'Fier', 'Korçë', 'Berat', 'Lushnjë', 'Pogradec', 'Gjirokastër',
    'Sarandë', 'Laç', 'Kukës', 'Lezhë', 'Patos', 'Ballsh', 'Burrel', 'Krujë', 'Kuçovë', 'Gramsh',
    'Përmet', 'Delvinë', 'Maliq', 'Bilisht', 'Ersekë', 'Leskovik', 'Memaliaj', 'Këlcyrë', 'Tepelënë', 'Libohova'
  ],
  
  'Austria': [
    'Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn',
    'Wiener Neustadt', 'Steyr', 'Feldkirch', 'Bregenz', 'Leonding', 'Klosterneuburg', 'Baden', 'Wolfsberg', 'Leoben', 'Krems',
    'Traun', 'Kapfenberg', 'Mödling', 'Hallein', 'Kufstein', 'Traiskirchen', 'Schwechat', 'Braunau', 'Stockerau', 'Saalfelden'
  ],

  'Belgium': [
    'Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst',
    'Mechelen', 'La Louvière', 'Kortrijk', 'Hasselt', 'Sint-Niklaas', 'Ostend', 'Tournai', 'Genk', 'Seraing', 'Roeselare',
    'Verviers', 'Mouscron', 'Beveren', 'Dendermonde', 'Beringen', 'Turnhout', 'Vilvoorde', 'Lokeren', 'Sint-Truiden', 'Herstal',
    'Brasschaat', 'Grimbergen', 'Mol', 'Maasmechelen', 'Waregem', 'Lier', 'Lessines', 'Geel', 'Herentals', 'Wetteren',
    'Ninove', 'Oudenaarde', 'Tienen', 'Boom', 'Wavre', 'Binche', 'Jette', 'Uccle', 'Waterloo', 'Diest'
  ],

  // Major European countries with significantly expanded city lists
  'France': [
    'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille',
    'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Angers', 'Grenoble', 'Dijon', 'Nîmes', 'Aix-en-Provence',
    'Saint-Quentin-en-Yvelines', 'Brest', 'Le Mans', 'Amiens', 'Tours', 'Limoges', 'Clermont-Ferrand', 'Villeurbanne', 'Besançon', 'Orléans',
    'Mulhouse', 'Rouen', 'Caen', 'Nancy', 'Saint-Denis', 'Saint-Paul', 'Argenteuil', 'Montreuil', 'Roubaix', 'Tourcoing',
    'Avignon', 'Poitiers', 'Créteil', 'Versailles', 'Pau', 'Fort-de-France', 'Vitry-sur-Seine', 'Courbevoie', 'Colombes', 'Aulnay-sous-Bois',
    'Asnières-sur-Seine', 'Saint-Pierre', 'Rueil-Malmaison', 'Champigny-sur-Marne', 'Antibes', 'La Rochelle', 'Cannes', 'Calais', 'Drancy', 'Mérignac',
    'Ajaccio', 'Bourges', 'Boulogne-Billancourt', 'Metz', 'Perpignan', 'Orléans', 'Caen', 'Mulhouse', 'Boulogne-sur-Mer', 'Rouen',
    'Dunkerque', 'Bayonne', 'Annecy', 'Troyes', 'Lorient', 'Belfort', 'Chambéry', 'Montluçon', 'Chalon-sur-Saône', 'Châlons-en-Champagne'
  ],

  'Germany': [
    'Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig',
    'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster',
    'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden', 'Gelsenkirchen', 'Mönchengladbach', 'Braunschweig', 'Chemnitz', 'Kiel', 'Aachen',
    'Halle', 'Magdeburg', 'Freiburg', 'Krefeld', 'Lübeck', 'Oberhausen', 'Erfurt', 'Mainz', 'Rostock', 'Kassel',
    'Hagen', 'Hamm', 'Saarbrücken', 'Mülheim', 'Potsdam', 'Ludwigshafen', 'Oldenburg', 'Leverkusen', 'Osnabrück', 'Solingen',
    'Heidelberg', 'Herne', 'Neuss', 'Darmstadt', 'Paderborn', 'Regensburg', 'Ingolstadt', 'Würzburg', 'Fürth', 'Wolfsburg',
    'Offenbach', 'Ulm', 'Heilbronn', 'Pforzheim', 'Göttingen', 'Bottrop', 'Trier', 'Recklinghausen', 'Reutlingen', 'Bremerhaven',
    'Koblenz', 'Bergisch Gladbach', 'Jena', 'Remscheid', 'Erlangen', 'Moers', 'Siegen', 'Hildesheim', 'Salzgitter'
  ],

  'Italy': [
    'Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania',
    'Venice', 'Verona', 'Messina', 'Padua', 'Trieste', 'Taranto', 'Brescia', 'Prato', 'Parma', 'Modena',
    'Reggio Calabria', 'Reggio Emilia', 'Perugia', 'Livorno', 'Ravenna', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara',
    'Sassari', 'Latina', 'Giugliano in Campania', 'Monza', 'Syracuse', 'Pescara', 'Bergamo', 'Forlì', 'Trento', 'Vicenza',
    'Terni', 'Bolzano', 'Novara', 'Piacenza', 'Ancona', 'Andria', 'Arezzo', 'Udine', 'Cesena', 'Lecce',
    'La Spezia', 'Catanzaro', 'Pesaro', 'Brindisi', 'Grosseto', 'Asti', 'Cremona', 'Cosenza', 'Pavia', 'Varese',
    'Como', 'Pistoia', 'Matera', 'Potenza', 'Benevento', 'Avellino', 'Caserta', 'Viterbo', 'Rieti', 'Frosinone'
  ],

  'Spain': [
    'Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao',
    'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Hospitalet de Llobregat', 'Vitoria-Gasteiz', 'A Coruña', 'Elche', 'Granada',
    'Oviedo', 'Badalona', 'Cartagena', 'Terrassa', 'Jerez de la Frontera', 'Sabadell', 'Móstoles', 'Santa Cruz de Tenerife', 'Pamplona', 'Almería',
    'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 'Donostia-San Sebastián', 'Burgos', 'Santander', 'Castellón de la Plana', 'Alcorcón', 'Albacete', 'Getafe',
    'Salamanca', 'Huelva', 'Badajoz', 'Logroño', 'Tarragona', 'León', 'Cádiz', 'Lleida', 'Mataró', 'Dos Hermanas',
    'Santa Coloma de Gramenet', 'Torrejón de Ardoz', 'Parla', 'Alcobendas', 'Reus', 'Telde', 'Ourense', 'Girona', 'Santiago de Compostela', 'Lugo'
  ],

  'United Kingdom': [
    'London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield', 'Leeds', 'Edinburgh', 'Leicester',
    'Wakefield', 'Cardiff', 'Coventry', 'Belfast', 'Nottingham', 'Newcastle', 'Sunderland', 'Brighton', 'Hull', 'Plymouth',
    'Stoke-on-Trent', 'Wolverhampton', 'Derby', 'Swansea', 'Southampton', 'Salford', 'Aberdeen', 'Westminster', 'Portsmouth', 'York',
    'Peterborough', 'Dundee', 'Lancaster', 'Oxford', 'Newport', 'Preston', 'St Albans', 'Norwich', 'Chester', 'Cambridge',
    'Salisbury', 'Exeter', 'Gloucester', 'Lisburn', 'Chichester', 'Winchester', 'Londonderry', 'Carlisle', 'Worcester', 'Bath',
    'Durham', 'Lincoln', 'Hereford', 'Armagh', 'Bangor', 'Truro', 'Ely', 'Ripon', 'Wells', 'St Davids',
    'Stirling', 'Inverness', 'Perth', 'Elgin', 'Dumfries', 'Kilmarnock', 'Ayr', 'Greenock', 'Paisley', 'Hamilton'
  ],

  // North America - Expanded coverage
  'United States': [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'Seattle', 'Denver', 'El Paso', 'Detroit', 'Boston',
    'Memphis', 'Nashville', 'Portland', 'Oklahoma City', 'Las Vegas', 'Baltimore', 'Louisville', 'Milwaukee', 'Albuquerque', 'Tucson',
    'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh', 'Virginia Beach', 'Long Beach',
    'Miami', 'Oakland', 'Minneapolis', 'Tulsa', 'Bakersfield', 'Wichita', 'Arlington', 'Tampa', 'New Orleans', 'Honolulu',
    'Aurora', 'Anaheim', 'Santa Ana', 'St. Louis', 'Riverside', 'Corpus Christi', 'Lexington', 'Pittsburgh', 'Anchorage', 'Stockton',
    'Cincinnati', 'St. Paul', 'Toledo', 'Greensboro', 'Newark', 'Plano', 'Henderson', 'Lincoln', 'Buffalo', 'Jersey City',
    'Chula Vista', 'Fort Wayne', 'Orlando', 'St. Petersburg', 'Chandler', 'Laredo', 'Norfolk', 'Durham', 'Madison', 'Lubbock'
  ],

  'Canada': [
    'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener',
    'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'St. Catharines', 'Regina', 'Sherbrooke', 'Barrie',
    'Kelowna', 'Abbotsford', 'Sudbury', 'Kingston', 'Saguenay', 'Trois-Rivières', 'Guelph', 'Cambridge', 'Whitby', 'Saanich',
    'Vaughan', 'Richmond Hill', 'Oakville', 'Burlington', 'Greater Sudbury', 'Levis', 'Burnaby', 'Longueuil', 'Richmond', 'Markham',
    'Thunder Bay', 'St. John\'s', 'Fredericton', 'Charlottetown', 'Whitehorse', 'Yellowknife', 'Iqaluit', 'Moncton', 'Saint John', 'Red Deer',
    'Lethbridge', 'Kamloops', 'Nanaimo', 'Medicine Hat', 'Prince George', 'Chilliwack', 'Drummondville', 'Granby', 'Saint-Hyacinthe', 'Shawinigan'
  ],

  // Asia - Major countries with expanded coverage
  'China': [
    'Shanghai', 'Beijing', 'Chongqing', 'Tianjin', 'Guangzhou', 'Shenzhen', 'Wuhan', 'Dongguan', 'Chengdu', 'Nanjing',
    'Foshan', 'Shenyang', 'Hangzhou', 'Xi\'an', 'Harbin', 'Qingdao', 'Dalian', 'Zhengzhou', 'Shantou', 'Jinan',
    'Changchun', 'Kunming', 'Changsha', 'Taiyuan', 'Xiamen', 'Hefei', 'Shijiazhuang', 'Urumqi', 'Fuzhou', 'Wuxi',
    'Zhongshan', 'Wenzhou', 'Zibo', 'Yantai', 'Zhuhai', 'Huizhou', 'Lanzhou', 'Changzhou', 'Xuzhou', 'Ningbo',
    'Baotou', 'Datong', 'Mudanjiang', 'Anshan', 'Fushun', 'Benxi', 'Jinzhou', 'Yingkou', 'Liaoyang', 'Panjin'
  ],

  'India': [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
    'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
    'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi',
    'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur',
    'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubballi-Dharwad'
  ],

  'Japan': [
    'Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama',
    'Hiroshima', 'Sendai', 'Kitakyushu', 'Chiba', 'Sakai', 'Niigata', 'Hamamatsu', 'Okayama', 'Sagamihara', 'Kumamoto',
    'Shizuoka', 'Kagoshima', 'Matsuyama', 'Kanazawa', 'Utsunomiya', 'Matsudo', 'Kawaguchi', 'Ichikawa', 'Fukuyama', 'Iwaki',
    'Nara', 'Takatsuki', 'Oita', 'Toyonaka', 'Nagasaki', 'Toyohashi', 'Machida', 'Gifu', 'Fujisawa', 'Kashiwa',
    'Toyama', 'Nagano', 'Iwakuni', 'Asahikawa', 'Maebashi', 'Yokosuka', 'Aomori', 'Kurume', 'Hachioji', 'Morioka'
  ],

  'South Korea': [
    'Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Suwon', 'Changwon', 'Seongnam',
    'Goyang', 'Yongin', 'Bucheon', 'Cheongju', 'Ansan', 'Jeonju', 'Anyang', 'Cheonan', 'Pohang', 'Uijeongbu',
    'Siheung', 'Gimhae', 'Pyeongtaek', 'Paju', 'Jinju', 'Hwaseong', 'Gunsan', 'Wonju', 'Gangneung', 'Jeju City',
    'Iksan', 'Asan', 'Yangsan', 'Suncheon', 'Chuncheon', 'Namyangju', 'Mokpo', 'Gumi', 'Gimpo', 'Yeosu',
    'Andong', 'Gyeongju', 'Tongyeong', 'Sacheon', 'Miryang', 'Hadong', 'Changnyeong', 'Geochang', 'Hapcheon', 'Sancheong'
  ],

  // Africa - Major countries expanded
  'Algeria': [
    'Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Djelfa', 'Sétif', 'Sidi Bel Abbès', 'Biskra',
    'Tébessa', 'El Oued', 'Skikda', 'Tiaret', 'Béjaïa', 'Tlemcen', 'Ouargla', 'Béchar', 'Mostaganem', 'Bordj Bou Arréridj',
    'Chlef', 'Médéa', 'Tizi Ouzou', 'Mascara', 'Oum el Bouaghi', 'Guelma', 'Laghouat', 'Kenchela', 'Souk Ahras', 'Saïda',
    'Aïn Defla', 'Aïn Témouchent', 'Ghardaïa', 'Relizane', 'Tindouf', 'Tissemsilt', 'El Bayadh', 'Khenchela', 'Mila', 'Aïn Beïda',
    'Aïn Oussera', 'Aflou', 'Barika', 'Aïn M\'Lila', 'Aïn Touta', 'Aïn Sefra', 'Arzew', 'Azzaba', 'Bab Ezzouar', 'Baraki',
    'Ben Mehidi', 'Beni Saf', 'Berriane', 'Aïn el Turk', 'Aïn el Hammam', 'Aïn Fakroun', 'Aïn Kercha', 'Aïn Oulmene', 'Aïn Smara', 'Aïn Taya',
    'Akbou', 'Ali Mendjeli', 'Amizour', 'Ammi Moussa', 'Aoulef', 'Arbatache', 'Arhribs', 'Arris', 'Assi Bou Nif', 'Azazga',
    'BABOR', 'Barbacha', 'Béni Abbès', 'Beni Amrane', 'Beni Douala', 'Beni Mered', 'Beni Mester', 'Beni Tamou', 'Bensekrane', 'Berrahal',
    'Aïn Abid', 'Aïn Azel', 'Aïn Benian', 'Aïn Boucif', 'Aïn Deheb', 'Aïn el Bell', 'Aïn el Berd', 'Aïn el Hadjar', 'Aïn el Melh', 'Aïn Merane',
    'Abadla', 'Abou el Hassan', 'Adrar', 'Ahmed Bel Hadj', 'Aïn Arnat', 'Aïn Bessem', 'Aïn el Bya', 'Ain el Hadjel', 'Ait Yahia'
  ],

  'South Africa': [
    'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Pietermaritzburg', 'Benoni', 'Tembisa', 'East London', 'Vereeniging',
    'Bloemfontein', 'Boksburg', 'Welkom', 'Newcastle', 'Krugersdorp', 'Diepsloot', 'Botshabelo', 'Brakpan', 'Witbank', 'Oberholzer',
    'Centurion', 'Vanderbijlpark', 'Roodepoort', 'Uitenhage', 'Potchefstroom', 'Carletonville', 'Rustenburg', 'Midrand', 'Polokwane', 'Paarl',
    'Springs', 'Klerksdorp', 'George', 'Randburg', 'Westonaria', 'Mthatha', 'Middelburg', 'Vryheid', 'Orkney', 'Kimberley'
  ],

  'Nigeria': [
    'Lagos', 'Kano', 'Ibadan', 'Kaduna', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos',
    'Ilorin', 'Oyo', 'Enugu', 'Abeokuta', 'Abuja', 'Sokoto', 'Onitsha', 'Warri', 'Okene', 'Calabar',
    'Uyo', 'Katsina', 'Ado-Ekiti', 'Ogbomoso', 'Akure', 'Osogbo', 'Bauchi', 'Ikeja', 'Makurdi', 'Minna',
    'Effon-Alaiye', 'Ilesa', 'Offa', 'Iwo', 'Shaki', 'Iseyin', 'Oka-Akoko', 'Igbo-Ora', 'Aiyetoro', 'Fiditi'
  ],

  'Egypt': [
    'Cairo', 'Alexandria', 'Giza', 'Shubra El-Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El-Mahalla El-Kubra', 'Tanta',
    'Asyut', 'Ismailia', 'Fayyum', 'Zagazig', 'Aswan', 'Damietta', 'Damanhur', 'Minya', 'Beni Suef', 'Hurghada',
    'Qena', 'Sohag', 'Shibin El Kom', 'Banha', 'Kafr el-Sheikh', 'Arish', 'Mallawi', 'Bilbays', 'Marsa Matruh', 'Idfu'
  ],

  // South America - Major countries
  'Brazil': [
    'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia',
    'Belém', 'Porto Alegre', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Nova Iguaçu', 'Teresina',
    'Natal', 'Campo Grande', 'São Bernardo do Campo', 'João Pessoa', 'Santo André', 'Osasco', 'Jaboatão dos Guararapes', 'Contagem', 'São José dos Campos', 'Uberlândia',
    'Sorocaba', 'Cuiabá', 'Aparecida de Goiânia', 'Aracaju', 'Feira de Santana', 'Londrina', 'Juiz de Fora', 'Belford Roxo', 'Joinville', 'Niterói'
  ],

  'Argentina': [
    'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan',
    'Resistencia', 'Santiago del Estero', 'Corrientes', 'Posadas', 'Neuquén', 'Bahía Blanca', 'Paraná', 'Formosa', 'San Luis', 'Catamarca',
    'La Rioja', 'Río Cuarto', 'Comodoro Rivadavia', 'San Rafael', 'Concordia', 'San Nicolás', 'Villa Mercedes', 'Tandil', 'Río Gallegos', 'Ushuaia'
  ],

  // Middle East
  'Saudi Arabia': [
    'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran', 'Taif', 'Tabuk', 'Buraidah',
    'Khamis Mushait', 'Hail', 'Hofuf', 'Mubarraz', 'Najran', 'Yanbu', 'Jubail', 'Abha', 'Arar', 'Sakaka',
    'Jizan', 'Qatif', 'Bisha', 'Ras Tanura', 'Unaizah', 'Al Qunfudhah', 'Hafr Al-Batin', 'Rafha', 'Tubarjal', 'Ar Rass'
  ],

  'Turkey': [
    'Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Şanlıurfa', 'Gaziantep', 'Kayseri',
    'Mersin', 'Eskişehir', 'Diyarbakır', 'Samsun', 'Denizli', 'Adapazarı', 'Malatya', 'Kahramanmaraş', 'Erzurum', 'Van',
    'Batman', 'Elazığ', 'İzmit', 'Manisa', 'Sivas', 'Gebze', 'Balıkesir', 'Tarsus', 'Kütahya', 'Trabzon'
  ],

  // Oceania
  'Australia': [
    'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Central Coast', 'Wollongong',
    'Logan City', 'Geelong', 'Hobart', 'Townsville', 'Cairns', 'Darwin', 'Launceston', 'Bendigo', 'Albury', 'Ballarat',
    'Mackay', 'Rockhampton', 'Bunbury', 'Bundaberg', 'Wagga Wagga', 'Hervey Bay', 'Mildura', 'Shepparton', 'Port Macquarie', 'Gladstone'
  ],

  'New Zealand': [
    'Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Lower Hutt', 'Dunedin', 'Palmerston North', 'Napier', 'Porirua',
    'Hibiscus Coast', 'New Plymouth', 'Rotorua', 'Whangārei', 'Nelson', 'Hastings', 'Invercargill', 'Upper Hutt', 'Gisborne', 'Taupō',
    'Timaru', 'Whanganui', 'Blenheim', 'Pukekohe', 'Masterton', 'Cambridge', 'Levin', 'Tokoroa', 'Oamaru', 'Ashburton'
  ]
};

// Additional smaller countries and territories with comprehensive coverage
export const ADDITIONAL_COUNTRIES: Record<string, string[]> = {
  // Caribbean
  'Jamaica': [
    'Kingston', 'Spanish Town', 'Portmore', 'Montego Bay', 'May Pen', 'Mandeville', 'Old Harbour', 'Savanna-la-Mar', 'Linstead', 'Half Way Tree',
    'Ocho Rios', 'Port Antonio', 'Negril', 'Black River', 'Falmouth', 'Morant Bay', 'Port Maria', 'Lucea', 'Santa Cruz', 'Bog Walk'
  ],

  'Barbados': [
    'Bridgetown', 'Speightstown', 'Oistins', 'Holetown', 'Lawrence Gap', 'St. Lawrence Gap', 'Crane', 'Bathsheba', 'Cattlewash', 'Martin\'s Bay',
    'Six Cross Roads', 'The Pine', 'Fairfield', 'Worthing', 'Rockley', 'Hastings', 'Maxwell', 'Dover', 'Enterprise', 'Silver Sands'
  ],

  // Pacific Islands
  'Fiji': [
    'Suva', 'Nadi', 'Lautoka', 'Labasa', 'Ba', 'Tavua', 'Rakiraki', 'Levuka', 'Sigatoka', 'Nasinu',
    'Nausori', 'Savusavu', 'Korovou', 'Vunidawa', 'Pacific Harbour', 'Denarau', 'Coral Coast', 'Beqa', 'Taveuni', 'Kadavu'
  ],

  // European smaller countries
  'Luxembourg': [
    'Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange', 'Ettelbruck', 'Diekirch', 'Strassen', 'Bertrange', 'Bettembourg', 'Schifflange',
    'Hesperange', 'Pétange', 'Sanem', 'Mamer', 'Mersch', 'Käerjeng', 'Grevenmacher', 'Mondercange', 'Remich', 'Echternach'
  ],

  'Malta': [
    'Valletta', 'Birkirkara', 'Mosta', 'Qormi', 'Żabbar', 'San Pawl il-Baħar', 'Sliema', 'Naxxar', 'Ħamrun', 'Pietà',
    'Fgura', 'Żejtun', 'Rabat', 'Marsaxlokk', 'Attard', 'Balzan', 'Lija', 'Iklin', 'Għargħur', 'San Ġwann'
  ]
};

// Merge all city data
export const COMPREHENSIVE_CITIES_BY_COUNTRY = {
  ...ENHANCED_CITIES_BY_COUNTRY,
  ...ADDITIONAL_COUNTRIES
};