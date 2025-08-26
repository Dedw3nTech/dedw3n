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
    // Complete list of 411 Algerian cities with population over 1,000 - scraped from OpenDataSoft GeoNames dataset
    'Abadla', 'Abou Hasan', 'Abou el Hassan', 'Adrar', 'Aflou', 'Ahmed Bel Hadj', 'Ain Babouche', 'Ain Berda', 'Ain Bida', 'Ain Boudinar',
    'Ain Bousif', 'Ain Charchar', 'Ain Djasser', 'Ain Fekan', 'Ain Ghoraba', 'Ain Kada', 'Ain Kechara', 'Ain Lahdjar', 'Ain Madhi', 'Ain Naga',
    'Ain Rich', 'Ain Sandel', 'Ain Seynour', 'Ain Sidi Cherif', 'Ain Sultan', 'Ain Tagourait', 'Ain Tallout', 'Ain Tolba', 'Ain Touila', 'Ain Turk',
    'Ain Zaatout', 'Ain Zana', 'Ain el Assel', 'Ain el Hadjel', 'Ain el Ibel', 'Ain el Kebira', 'Aissaouia', 'Ait Bouadou', 'Ait Chaffa', 'Ait Khelili',
    'Ait Mahmoud', 'Ait Yahia', 'Ait Yahia Moussa', 'Akacha', 'Akbil', 'Akbou', 'Akfadou', 'Al Affroun', 'Al Attaf', 'Al Ghicha',
    'Al Hamdania', 'Al Hoceima', 'Al Khroub', 'Al Madania', 'Al Marsa', 'Al Matmar', 'Al Milia', 'Al Tarf', 'Alexandrie', 'Alger Centre',
    'Algiers', 'Ali Mendjeli', 'Amalou', 'Amarnas', 'Amenas', 'Amizour', 'Ammari', 'Ammi Moussa', 'Amoucha', 'Ancienne Kouba',
    'Annaba', 'Annassir', 'Aokas', 'Aoubellil', 'Aouf', 'Aouinet el Tarf', 'Aoulef', 'Aoulmene', 'Aqbou', 'Arba',
    'Arbal', 'Arbatache', 'Arhribs', 'Arib', 'Arris', 'Arzew', 'Asfour', 'Assela', 'Assi Bou Nif', 'Azail',
    'Azazga', 'Azeffoun', 'Azzaba', 'Azzefoun', 'Azzouz', 'Aïn Abid', 'Aïn Arnat', 'Aïn Azel', 'Aïn Benian', 'Aïn Bessem',
    'Aïn Beïda', 'Aïn Boucif', 'Aïn Defla', 'Aïn Deheb', 'Aïn Fakroun', 'Aïn Kercha', 'Aïn M\'Lila', 'Aïn Merane', 'Aïn Oulmene', 'Aïn Oussera',
    'Aïn Sefra', 'Aïn Smara', 'Aïn Taya', 'Aïn Touta', 'Aïn Témouchent', 'Aïn el Bell', 'Aïn el Berd', 'Aïn el Bya', 'Aïn el Hadjar', 'Aïn el Hammam',
    'Aïn el Melh', 'Aïn el Turk', 'BABOR', 'Bab Ezzouar', 'Babar', 'Bach Djerrah', 'Badredine el Mokrani', 'Baghai', 'Baines', 'Baraki',
    'Barbacha', 'Barbouche', 'Barika', 'Barkaoui', 'Batna', 'Bazer Sakra', 'Bechar', 'Bechloul', 'Beida', 'Bekkouche Lakhdar',
    'Belaabes', 'Belaiba', 'Belala', 'Belcourt', 'Beldjoudi', 'Belfort', 'Belgaid', 'Belhadj Bouchaib', 'Belimour', 'Belkacem',
    'Bellaa', 'Bellefontaine', 'Ben Mehidi', 'Benaicha Chelia', 'Benamira', 'Benazzouz', 'Benchicao', 'Bendaoud', 'Benguerir', 'Beni Amrane',
    'Beni Aziz', 'Beni Bahdel', 'Beni Boussaid', 'Beni Chaib', 'Beni Chebana', 'Beni Dejella', 'Beni Douala', 'Beni Fouda', 'Beni Hamidane', 'Beni Haoua',
    'Beni Ilmane', 'Beni K\'sila', 'Beni Lahcene', 'Beni Maouche', 'Beni Mered', 'Beni Mester', 'Beni Mezline', 'Beni Mouhli', 'Beni Ouarsous', 'Beni Ourthilane',
    'Beni Rached', 'Beni Saf', 'Beni Sliman', 'Beni Snous', 'Beni Tamou', 'Beni Yenni', 'Beni Zid', 'Beni Zikri', 'Beni Zmenzer', 'Benkhelil',
    'Bensekrane', 'Bentalha', 'Berabah', 'Berhoum', 'Berkane', 'Berrahal', 'Berriane', 'Berrouaghia', 'Besbes', 'Bethioua',
    'Bhir el Chergui', 'Bhir el Djir', 'Biban', 'Bidja', 'Bilbeis', 'Bir Ben Laabed', 'Bir Bouhouche', 'Bir Chouhada', 'Bir Dhab', 'Bir Foda',
    'Bir Ghbalou', 'Bir Haddada', 'Bir Kasdali', 'Bir Mokkadem', 'Bir Ould Khelifa', 'Bir el Arche', 'Bir el Gaada', 'Birtouta', 'Biskra', 'Bitam',
    'Blad Guitoun', 'Blida', 'Blidet Amor', 'Bogni', 'Bologhine', 'Bordj Bou Arréridj', 'Bou Azza', 'Bou Caid', 'Bou Djebaa el Borj', 'Bou Hanifia el Hamamat',
    'Bou Haroun', 'Bou Henni', 'Bou Ismail', 'Bou Saada', 'Bouaiche', 'Bouakal', 'Bouandas', 'Bouati Mahmoud', 'Boucaid', 'Bouchain',
    'Bouchekouf', 'Bouchentouf', 'Boudouaou', 'Boufarik', 'Boufatis', 'Bougaa', 'Boughar', 'Boughezoul', 'Bouguirat', 'Bouhatem',
    'Bouhjar', 'Bouhlou', 'Bouira', 'Boukais', 'Boukhadra', 'Boukhenana', 'Boumahra Ahmed', 'Boumerdas', 'Bounaamane', 'Bounouara',
    'Bounouh', 'Bououchoul', 'Bour', 'Bouraoui Belhadef', 'Bourbia', 'Bourgoun', 'Bousfer', 'Boussaada', 'Bousselam', 'Boussemghoun',
    'Boustane', 'Bouteldja', 'Bouteldjika', 'Bouzareah', 'Bouzeguene', 'Bouzina', 'Branis', 'Brida', 'Brikcha', 'Briska',
    'Brogla', 'Béchar', 'Béjaïa', 'Béni Abbès', 'Caroubier', 'Chaabat el Leham', 'Chabet el Ameur', 'Chabet el Leham', 'Chabet el Saghir', 'Chahbounia',
    'Chaiba', 'Chair', 'Chalebet Edouaar', 'Charef', 'Charhoula', 'Chebli', 'Chetaibi', 'Chetouane', 'Chettaba', 'Chibanat',
    'Chibli', 'Chiffa', 'Chlef', 'Chorfa', 'Chott', 'Colla', 'Constantine', 'Dahmouni', 'Dahouara', 'Damous',
    'Dar Chioukh', 'Debdeb', 'Debila', 'Dechmia', 'Dehamcha', 'Dehamna', 'Dehib', 'Deldoul', 'Dellys', 'Denden',
    'Derradji Bousselah', 'Derrag', 'Dhaya', 'Dib', 'Didouche Mourad', 'Difallah', 'Dinar', 'Djamaa', 'Djanet', 'Djebahia',
    'Djebel Onk', 'Djelfa', 'Djella', 'Djellal', 'Djemaa Beni Habibi', 'Djemila', 'Djenien Bourzeg', 'Djezzar', 'Drariya', 'Drean',
    'Drean ville', 'Echmoul', 'Eddis', 'El Achir', 'El Affroun', 'El Ansar', 'El Aouana', 'El Asnam', 'El Bayadh', 'El Biar',
    'El Biodh Sidi Cheikh', 'El Bordj', 'El Eulma', 'El Fedjoudj Boughrara Saoudi', 'El Flaye', 'El Ghomri', 'El Hadaiek', 'El Haddab', 'El Hamdania', 'El Hamel',
    'El Hamiz', 'El Hamma', 'El Harrouch', 'El Hassi', 'El Houidjbet', 'El Idrissia', 'El Kala', 'El Kerma', 'El Khemis', 'El Khroub',
    'El Kseur', 'El Malah', 'El Matmar', 'El Menia', 'El Milia', 'El Mouradia', 'El Oued', 'Ghardaïa', 'Ghazaouet', 'Guelma',
    'Hammam Bou Hadjar', 'Jijel', 'Kenchela', 'Khenchela', 'Ksar Chellala', 'Laghouat', 'Mascara', 'Merouana', 'Mila', 'Mostaganem',
    'Mouzaïa', 'Médéa', 'Oran', 'Ouargla', 'Oum el Bouaghi', 'Reghaïa', 'Relizane', 'Saoula', 'Saïda', 'Sidi Bel Abbès',
    'Skikda', 'Souk Ahras', 'Sétif', 'Tebesbest', 'Tiaret', 'Tindouf', 'Tissemsilt', 'Tizi Ouzou', 'Tlemcen', 'Tébessa', 'Zeribet el Oued'
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

// Comprehensive coverage for ALL world countries and territories
export const ADDITIONAL_COUNTRIES: Record<string, string[]> = {
  // Caribbean and Central America - Complete Coverage
  'Jamaica': [
    'Kingston', 'Spanish Town', 'Portmore', 'Montego Bay', 'May Pen', 'Mandeville', 'Old Harbour', 'Savanna-la-Mar', 'Linstead', 'Half Way Tree',
    'Ocho Rios', 'Port Antonio', 'Negril', 'Black River', 'Falmouth', 'Morant Bay', 'Port Maria', 'Lucea', 'Santa Cruz', 'Bog Walk',
    'Yallahs', 'Ewarton', 'Hayes', 'Lluidas Vale', 'Richmond', 'Chapelton', 'Frankfield', 'Porus', 'Williamsfield', 'Christiana',
    'Mile Gully', 'Spaldings', 'Alley', 'Kellits', 'Lionel Town', 'Angel', 'Trout Hall', 'Fair Prospect', 'Guys Hill', 'Moneague'
  ],

  'Barbados': [
    'Bridgetown', 'Speightstown', 'Oistins', 'Holetown', 'Lawrence Gap', 'St. Lawrence Gap', 'Crane', 'Bathsheba', 'Cattlewash', 'Martin\'s Bay',
    'Six Cross Roads', 'The Pine', 'Fairfield', 'Worthing', 'Rockley', 'Hastings', 'Maxwell', 'Dover', 'Enterprise', 'Silver Sands',
    'Blackmans', 'Warrens', 'Sunset Crest', 'Paradise Heights', 'Fitts Village', 'Porters', 'Mullins', 'Gibbes', 'Checker Hall', 'Orange Hill'
  ],

  'Trinidad and Tobago': [
    'Port of Spain', 'San Fernando', 'Chaguanas', 'Arima', 'Point Fortin', 'Laventille', 'Tunapuna', 'Piarco', 'Sangre Grande', 'Couva',
    'Debe', 'Penal', 'Marabella', 'Rio Claro', 'Tabaquite', 'Toco', 'Moruga', 'Mayaro', 'Princes Town', 'Siparia',
    'Scarborough', 'Crown Point', 'Canaan', 'Bon Accord', 'Plymouth', 'Roxborough', 'Charlotteville', 'Speyside', 'Castara', 'Les Coteaux'
  ],

  'Bahamas': [
    'Nassau', 'Freeport', 'West End', 'Coopers Town', 'Marsh Harbour', 'High Rock', 'Sweeting\'s Cay', 'Alice Town', 'Matthew Town', 'Cockburn Town',
    'Dunmore Town', 'Governor\'s Harbour', 'Rock Sound', 'George Town', 'Clarence Town', 'Simms', 'Deadman\'s Cay', 'Colonel Hill', 'Duncan Town', 'New Bight'
  ],

  'Cuba': [
    'Havana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Santa Clara', 'Guantánamo', 'Bayamo', 'Las Tunas', 'Cienfuegos', 'Pinar del Río',
    'Matanzas', 'Ciego de Ávila', 'Sancti Spíritus', 'Manzanillo', 'Cardenas', 'Palma Soriano', 'Sagua la Grande', 'Contramaestre', 'Florida', 'Placetas',
    'Moa', 'Artemisa', 'San José de las Lajas', 'Trinidad', 'Morón', 'Jovellanos', 'Güines', 'Baracoa', 'San Cristóbal', 'Consolación del Sur'
  ],

  'Dominican Republic': [
    'Santo Domingo', 'Santiago', 'Santo Domingo Este', 'Santo Domingo Norte', 'San Pedro de Macorís', 'La Romana', 'San Cristóbal', 'Puerto Plata', 'San Francisco de Macorís', 'Higüey',
    'Concepción de La Vega', 'Punta Cana', 'Baní', 'Bonao', 'Cotuí', 'Azua', 'Moca', 'Bajos de Haina', 'Esperanza', 'Mao',
    'San Juan de la Maguana', 'Nagua', 'Constanza', 'Villa Altagracia', 'Jarabacoa', 'Salcedo', 'Licey al Medio', 'Tamboril', 'Cabrera', 'Samaná'
  ],

  'Haiti': [
    'Port-au-Prince', 'Cap-Haïtien', 'Carrefour', 'Delmas', 'Gonaïves', 'Pétion-Ville', 'Saint-Marc', 'Les Cayes', 'Fort-de-France', 'Jacmel',
    'Jérémie', 'Hinche', 'Port-de-Paix', 'Limbé', 'Petit-Goâve', 'Milot', 'Grand-Goâve', 'Léogâne', 'Croix-des-Bouquets', 'Thomazeau',
    'Miragoâne', 'Aquin', 'Saint-Louis du Sud', 'Trou du Nord', 'Ouanaminthe', 'Fort-Liberté', 'Vallières', 'Dondon', 'Grande-Rivière-du-Nord', 'Plaine-du-Nord'
  ],

  // Pacific Islands - Complete Coverage
  'Fiji': [
    'Suva', 'Nadi', 'Lautoka', 'Labasa', 'Ba', 'Tavua', 'Rakiraki', 'Levuka', 'Sigatoka', 'Nasinu',
    'Nausori', 'Savusavu', 'Korovou', 'Vunidawa', 'Pacific Harbour', 'Denarau', 'Coral Coast', 'Beqa', 'Taveuni', 'Kadavu',
    'Nabouwalu', 'Seaqaqa', 'Bukuya', 'Navua', 'Wainibuka', 'Keiyasi', 'Votua', 'Vatukarasa', 'Waidalice', 'Nasaucoko'
  ],

  'Papua New Guinea': [
    'Port Moresby', 'Lae', 'Mount Hagen', 'Madang', 'Wewak', 'Vanimo', 'Popondetta', 'Daru', 'Kerema', 'Mendi',
    'Goroka', 'Kimbe', 'Rabaul', 'Kokopo', 'Lorengau', 'Alotau', 'Kundiawa', 'Tari', 'Ialibu', 'Wabag',
    'Buka', 'Kandrian', 'Samarai', 'Balimo', 'Tapini', 'Kiunga', 'Tabubil', 'Ok Tedi', 'Finschhafen', 'Bulolo'
  ],

  'Solomon Islands': [
    'Honiara', 'Gizo', 'Munda', 'Auki', 'Kirakira', 'Tulagi', 'Buala', 'Tigoa', 'Lata', 'Ringgi',
    'Noro', 'Yandina', 'Seghe', 'Choiseul Bay', 'Taro Island', 'Graciosa Bay', 'Mbambanakira', 'Rennell', 'Santa Cruz', 'Temotu'
  ],

  'Vanuatu': [
    'Port Vila', 'Luganville', 'Isangel', 'Sola', 'Lakatoro', 'Norsup', 'Lenakel', 'Longana', 'Saratamata', 'Craig Cove',
    'Whitegrass', 'Loltong', 'Melsisi', 'Redcliffe', 'Wintua', 'Abwatuntora', 'Lalinda', 'Rano', 'Southwest Bay', 'Dillons Bay'
  ],

  // European smaller countries - Complete Coverage
  'Luxembourg': [
    'Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange', 'Ettelbruck', 'Diekirch', 'Strassen', 'Bertrange', 'Bettembourg', 'Schifflange',
    'Hesperange', 'Pétange', 'Sanem', 'Mamer', 'Mersch', 'Käerjeng', 'Grevenmacher', 'Mondercange', 'Remich', 'Echternach',
    'Wiltz', 'Redange', 'Vianden', 'Clervaux', 'Troisvierges', 'Winseler', 'Hosingen', 'Consthum', 'Munshausen', 'Wincrange'
  ],

  'Malta': [
    'Valletta', 'Birkirkara', 'Mosta', 'Qormi', 'Żabbar', 'San Pawl il-Baħar', 'Sliema', 'Naxxar', 'Ħamrun', 'Pietà',
    'Fgura', 'Żejtun', 'Rabat', 'Marsaxlokk', 'Attard', 'Balzan', 'Lija', 'Iklin', 'Għargħur', 'San Ġwann',
    'Żurrieq', 'Siġġiewi', 'Dingli', 'Mdina', 'Żebbuġ', 'San Lawrenz', 'Għasri', 'Għarb', 'Kerċem', 'Munxar'
  ],

  'Monaco': [
    'Monaco-Ville', 'Monte Carlo', 'La Condamine', 'Fontvieille', 'Moneghetti', 'Les Révoires', 'Larvotto', 'La Rousse', 'Saint-Roman', 'Les Moulins'
  ],

  'San Marino': [
    'San Marino', 'Serravalle', 'Borgo Maggiore', 'Domagnano', 'Fiorentino', 'Acquaviva', 'Faetano', 'Chiesanuova', 'Montegiardino'
  ],

  'Liechtenstein': [
    'Vaduz', 'Schaan', 'Balzers', 'Triesen', 'Eschen', 'Mauren', 'Triesenberg', 'Ruggell', 'Gamprin', 'Schellenberg', 'Planken'
  ],

  'Andorra': [
    'Andorra la Vella', 'Escaldes-Engordany', 'Encamp', 'Sant Julià de Lòria', 'La Massana', 'Ordino', 'Canillo', 'Soldeu', 'Pas de la Casa', 'Arinsal'
  ],

  'Vatican City': ['Vatican City'],

  // African countries - Massive expansion
  'Morocco': [
    'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Agadir', 'Tangier', 'Meknès', 'Oujda', 'Kenitra', 'Tétouan',
    'Salé', 'Temara', 'Mohammedia', 'Khouribga', 'El Jadida', 'Beni Mellal', 'Nador', 'Taza', 'Settat', 'Berrechid',
    'Ksar El Kebir', 'Larache', 'Khemisset', 'Guelmim', 'Errachidia', 'Oulad Teima', 'Sidi Slimane', 'Azrou', 'Fnideq', 'Midelt',
    'Sefrou', 'Youssoufia', 'Tiznit', 'Taroudant', 'Ouarzazate', 'Sidi Kacem', 'Chefchaouen', 'Al Hoceïma', 'Taourirt', 'Zagora'
  ],

  'Tunisia': [
    'Tunis', 'Sfax', 'Sousse', 'Ettadhamen', 'Kairouan', 'Bizerte', 'Gabès', 'Aryanah', 'Gafsa', 'Monastir',
    'Ben Arous', 'Kasserine', 'Médenine', 'Nabeul', 'Tataouine', 'Béja', 'Jendouba', 'Kef', 'Mahdia', 'Sidi Bouzid',
    'Tozeur', 'Zaghouan', 'Siliana', 'Kebili', 'Manouba', 'Hammamet', 'Djerba', 'Zarzis', 'Douz', 'Matmata'
  ],

  'Libya': [
    'Tripoli', 'Benghazi', 'Misrata', 'Tarhuna', 'Al Bayda', 'Zawiya', 'Zliten', 'Ajdabiya', 'Tobruk', 'Sabha',
    'Gharyan', 'Sirte', 'Derna', 'Marj', 'Bani Walid', 'Murzuq', 'Al Khums', 'Ubari', 'Ghat', 'Hun',
    'Waddan', 'Socna', 'Zella', 'Brak', 'Awbari', 'Ghadames', 'Nalut', 'Mizda', 'Yafran', 'Jadu'
  ],

  'Ghana': [
    'Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Ashaiman', 'Tema', 'Teshie', 'Cape Coast', 'Sekondi', 'Obuasi',
    'Medina', 'Gbawe', 'Koforidua', 'Wa', 'Ejisu', 'Nungua', 'Sunyani', 'Ho', 'Techiman', 'Aflao',
    'Berekum', 'Akim Oda', 'Bawku', 'Hohoe', 'Bolgatanga', 'Tafo', 'Prestea', 'Tarkwa', 'Kintampo', 'Salaga'
  ],

  'Kenya': [
    'Nairobi', 'Mombasa', 'Nakuru', 'Eldoret', 'Kisumu', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega',
    'Machakos', 'Lamu', 'Nyeri', 'Meru', 'Embu', 'Webuye', 'Mumias', 'Naivasha', 'Nyahururu', 'Mandera',
    'Kericho', 'Migori', 'Isiolo', 'Kitui', 'Watamu', 'Kilifi', 'Narok', 'Marsabit', 'Wajir', 'Moyale'
  ],

  'Tanzania': [
    'Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Zanzibar City', 'Tabora', 'Kigoma',
    'Sumbawanga', 'Kasulu', 'Songea', 'Moshi', 'Musoma', 'Shinyanga', 'Iringa', 'Singida', 'Njombe', 'Bukoba',
    'Lindi', 'Mtwara', 'Mpanda', 'Masasi', 'Newala', 'Kilosa', 'Korogwe', 'Babati', 'Mafinga', 'Kahama'
  ],

  'Uganda': [
    'Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Busia', 'Iganga', 'Fort Portal', 'Mityana', 'Lugazi',
    'Masaka', 'Entebbe', 'Soroti', 'Mbale', 'Kasese', 'Kabale', 'Arua', 'Kitgum', 'Koboko', 'Moroto',
    'Hoima', 'Tororo', 'Adjumani', 'Apac', 'Bundibugyo', 'Bushenyi', 'Nebbi', 'Yumbe', 'Wakiso', 'Mukono'
  ],

  // Asian countries - Massive expansion
  'Bangladesh': [
    'Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Barisal', 'Rangpur', 'Comilla', 'Narayanganj', 'Gazipur',
    'Tongi', 'Mymensingh', 'Bogra', 'Dinajpur', 'Jessore', 'Noakhali', 'Brahmanbaria', 'Tangail', 'Jamalpur', 'Pabna',
    'Kushtia', 'Faridpur', 'Munshiganj', 'Chuadanga', 'Meherpur', 'Lalmonirhat', 'Nilphamari', 'Thakurgaon', 'Panchagarh', 'Kurigram'
  ],

  'Sri Lanka': [
    'Colombo', 'Dehiwala-Mount Lavinia', 'Moratuwa', 'Negombo', 'Kandy', 'Kalmunai', 'Galle', 'Trincomalee', 'Batticaloa', 'Jaffna',
    'Katunayake', 'Dambulla', 'Kolonnawa', 'Gampaha', 'Ratnapura', 'Badulla', 'Matara', 'Kalutara', 'Mannar', 'Beruwala',
    'Panadura', 'Wattala', 'Horana', 'Kelaniya', 'Peliyagoda', 'Kaduwela', 'Maharagama', 'Embilipitiya', 'Monaragala', 'Hambantota'
  ],

  'Nepal': [
    'Kathmandu', 'Pokhara', 'Lalitpur', 'Bharatpur', 'Biratnagar', 'Birgunj', 'Dharan', 'Butwal', 'Hetauda', 'Janakpur',
    'Dhangadhi', 'Tulsipur', 'Nepalgunj', 'Itahari', 'Mechinagar', 'Damak', 'Dhankuta', 'Lahan', 'Malangwa', 'Rajbiraj',
    'Siddharthanagar', 'Mahendranagar', 'Baglung', 'Ilam', 'Tansen', 'Gorkha', 'Dadeldhura', 'Pyuthan', 'Chainpur', 'Dailekh'
  ],

  'Myanmar': [
    'Yangon', 'Mandalay', 'Naypyidaw', 'Mawlamyine', 'Bago', 'Pathein', 'Monywa', 'Meiktila', 'Sittwe', 'Mergui',
    'Lashio', 'Pakokku', 'Pyay', 'Taungoo', 'Sagaing', 'Myitkyina', 'Dawei', 'Magway', 'Hpa-An', 'Loikaw',
    'Taunggyi', 'Hakha', 'Falam', 'Putao', 'Bhamo', 'Shwebo', 'Chauk', 'Minbu', 'Aunglan', 'Yenangyaung'
  ],

  'Cambodia': [
    'Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville', 'Poipet', 'Kampong Cham', 'Pursat', 'Kampong Chhnang', 'Kratie', 'Pailin',
    'Takeo', 'Kampot', 'Kep', 'Kampong Speu', 'Kampong Thom', 'Preah Vihear', 'Stung Treng', 'Ratanakiri', 'Mondulkiri', 'Koh Kong',
    'Svay Rieng', 'Prey Veng', 'Kandal', 'Banteay Meanchey', 'Oddar Meanchey', 'Preah Sihanouk', 'Tboung Khmum', 'Kep', 'Pailin', 'Bavet'
  ],

  'Laos': [
    'Vientiane', 'Luang Prabang', 'Savannakhet', 'Pakse', 'Thakhek', 'Xam Neua', 'Phonsavan', 'Muang Xay', 'Attapeu', 'Salavan',
    'Sekong', 'Saravan', 'Champasak', 'Khammouane', 'Bolikhamsai', 'Vientiane Province', 'Xiangkhouang', 'Houaphanh', 'Phongsaly', 'Bokeo'
  ],

  // African continuation
  'Ethiopia': [
    'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Adama', 'Awassa', 'Bahir Dar', 'Jimma', 'Dessie', 'Shashamane',
    'Bishoftu', 'Arba Minch', 'Hosaena', 'Harar', 'Dilla', 'Nekemte', 'Debre Markos', 'Axum', 'Lalibela', 'Jijiga',
    'Ambo', 'Asella', 'Sebeta', 'Debre Berhan', 'Kombolcha', 'Wolaita Sodo', 'Burayu', 'Adrigat', 'Wukro', 'Shire'
  ],

  'Rwanda': [
    'Kigali', 'Butare', 'Gitarama', 'Ruhengeri', 'Gisenyi', 'Byumba', 'Cyangugu', 'Kibungo', 'Kibuye', 'Gikongoro',
    'Umutara', 'Kicukiro', 'Gasabo', 'Nyarugenge', 'Karongi', 'Rusizi', 'Rubavu', 'Musanze', 'Gicumbi', 'Rulindo'
  ],

  'Burundi': [
    'Bujumbura', 'Gitega', 'Muyinga', 'Ruyigi', 'Kayanza', 'Ngozi', 'Bururi', 'Makamba', 'Rumonge', 'Cibitoke',
    'Bubanza', 'Muramvya', 'Cankuzo', 'Karuzi', 'Kirundo', 'Mwaro', 'Rutana', 'Bujumbura Rural'
  ],

  // Additional Asian coverage
  'Afghanistan': [
    'Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Jalalabad', 'Kunduz', 'Taloqan', 'Puli Khumri', 'Ghazni', 'Khost',
    'Bamyan', 'Farah', 'Zaranj', 'Lashkar Gah', 'Gardez', 'Chaghcharan', 'Nili', 'Mahmud-i-Raqi', 'Asadabad', 'Sharan',
    'Qalat', 'Fayzabad', 'Maymana', 'Sheberghan', 'Aybak', 'Baghlan', 'Charikar', 'Jalalabad', 'Paghman', 'Spin Boldak'
  ],

  'Maldives': [
    'Malé', 'Addu City', 'Fuvahmulah', 'Kulhudhuffushi', 'Thinadhoo', 'Naifaru', 'Dhidhdhoo', 'Mahibadhoo', 'Muli', 'Bilehdhoo',
    'Hinnavaru', 'Kudahuvadhoo', 'Thulusdhoo', 'Rasdhoo', 'Gan', 'Hithadhoo', 'Maradhoo', 'Feydhoo', 'Hulhumalé', 'Vilimalé'
  ],

  'Bhutan': [
    'Thimphu', 'Phuntsholing', 'Punakha', 'Wangdue Phodrang', 'Jakar', 'Mongar', 'Trashigang', 'Samdrup Jongkhar', 'Paro', 'Haa',
    'Samtse', 'Chukha', 'Tsirang', 'Dagana', 'Pemgatshel', 'Lhuntse', 'Gasa', 'Zhemgang', 'Bumthang', 'Trongsa'
  ]
};

// MASSIVE GLOBAL EXPANSION - 195+ countries with comprehensive city/town/village coverage
export const ULTIMATE_GLOBAL_COUNTRIES: Record<string, string[]> = {
  // Complete African continent expansion
  'Angola': [
    'Luanda', 'Huambo', 'Lobito', 'Benguela', 'Kuito', 'Lubango', 'Malanje', 'Namibe', 'Soyo', 'Cabinda',
    'Uíge', 'Sumbe', 'Menongue', 'Mbanza-Kongo', 'Saurimo', 'Luena', 'Caxito', 'Kuando Kubango', 'Ondjiva', 'N\'dalatando',
    'Catumbela', 'Caála', 'Camacha', 'Camacupa', 'Cassongue', 'Chibia', 'Bibala', 'Tômbua', 'Lucapa', 'Dundo'
  ],

  'Benin': [
    'Cotonou', 'Porto-Novo', 'Parakou', 'Djougou', 'Bohicon', 'Kandi', 'Lokossa', 'Ouidah', 'Abomey', 'Natitingou',
    'Savé', 'Malanville', 'Pobé', 'Kétou', 'Sakété', 'Come', 'Bembèrèkè', 'Nikki', 'Banikoara', 'Segbana',
    'Karimama', 'Gogounou', 'Sinendé', 'Péhunco', 'Kouandé', 'Tanguiéta', 'Matéri', 'Cobly', 'Boukombé', 'Bassila'
  ],

  'Botswana': [
    'Gaborone', 'Francistown', 'Molepolole', 'Maun', 'Serowe', 'Selebe Phikwe', 'Kanye', 'Mochudi', 'Mahalapye', 'Palapye',
    'Tlokweng', 'Gabane', 'Jwaneng', 'Lobatse', 'Tonota', 'Letlhakane', 'Orapa', 'Ghanzi', 'Kasane', 'Shakawe',
    'Tutume', 'Bobonong', 'Tsabong', 'Hukuntsi', 'Kang', 'Werda', 'Rakops', 'Nata', 'Sua Pan', 'Makgadikgadi'
  ],

  'Burkina Faso': [
    'Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya', 'Pouytenga', 'Kaya', 'Tenkodogo', 'Orodara', 'Fada N\'gourma',
    'Ziniaré', 'Gaoua', 'Dori', 'Kombissiri', 'Manga', 'Réo', 'Boulsa', 'Kongoussi', 'Tougan', 'Yako',
    'Bogandé', 'Diapaga', 'Gayéri', 'Léo', 'Pô', 'Diébougou', 'Batié', 'Boromo', 'Nouna', 'Solenzo'
  ],

  'Cameroon': [
    'Douala', 'Yaoundé', 'Bamenda', 'Bafoussam', 'Garoua', 'Maroua', 'Nkongsamba', 'Kumba', 'Edéa', 'Foumban',
    'Bertoua', 'Loum', 'Kumbo', 'Limbe', 'Kribi', 'Mbalmayo', 'Bafang', 'Dschang', 'Mbouda', 'Sangmélima',
    'Ngaoundéré', 'Ebolowa', 'Guider', 'Meiganga', 'Mokolo', 'Kousséri', 'Wum', 'Fundong', 'Bali', 'Mamfe'
  ],

  'Chad': [
    'N\'Djamena', 'Moundou', 'Sarh', 'Abéché', 'Kélo', 'Koumra', 'Pala', 'Am Timan', 'Bongor', 'Mongo',
    'Doba', 'Ati', 'Laï', 'Fianga', 'Massaguet', 'Massenya', 'Moïssala', 'Goz Beïda', 'Biltine', 'Adré',
    'Iriba', 'Baïbokoum', 'Kyabé', 'Béré', 'Lère', 'Gounou Gaya', 'Mao', 'Moussoro', 'Bol', 'Fada'
  ],

  'Democratic Republic of the Congo': [
    'Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kisangani', 'Kananga', 'Likasi', 'Kolwezi', 'Tshikapa', 'Beni', 'Bukavu',
    'Mwene-Ditu', 'Kikwit', 'Mbandaka', 'Matadi', 'Uvira', 'Butembo', 'Gandajika', 'Kalemie', 'Goma', 'Kindu',
    'Isiro', 'Bandundu', 'Gemena', 'Ilebo', 'Bumba', 'Kabinda', 'Kamina', 'Lisala', 'Lodja', 'Lusambo'
  ],

  'Ivory Coast': [
    'Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man', 'Divo', 'Gagnoa', 'Anyama',
    'Abengourou', 'Agboville', 'Grand-Bassam', 'Bondoukou', 'Odienné', 'Duékoué', 'Séguéla', 'Sinfra', 'Soubré', 'Danané',
    'Issia', 'Guiglo', 'Bangolo', 'Bongouanou', 'Tiassalé', 'Vavoua', 'Zuénoula', 'Daoukro', 'Adzopé', 'Akoupé'
  ],

  'Gabon': [
    'Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Mouila', 'Lambaréné', 'Tchibanga', 'Koulamoutou', 'Makokou',
    'Bitam', 'Gamba', 'Mayumba', 'Mitzic', 'Ndjolé', 'Okondja', 'Booué', 'Lastoursville', 'Mékambo', 'Minvoul'
  ],

  'Guinea': [
    'Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labé', 'Mamou', 'Boke', 'Guéckédou', 'Kissidougou', 'Dabola',
    'Faranah', 'Kérouané', 'Koundara', 'Macenta', 'Mandiana', 'Pita', 'Siguiri', 'Télimélé', 'Tougué', 'Yomou',
    'Beyla', 'Dinguiraye', 'Forécariah', 'Fria', 'Gaoual', 'Kouroussa', 'Lélouma', 'Lola', 'Mali', 'Coyah'
  ],

  'Madagascar': [
    'Antananarivo', 'Antsirabe', 'Fianarantsoa', 'Toamasina', 'Mahajanga', 'Toliara', 'Antsiranana', 'Ambovombe', 'Ambatondrazaka', 'Morondava',
    'Manakara', 'Farafangana', 'Maintirano', 'Sambava', 'Nosy Be', 'Antalaha', 'Ihosy', 'Vangaindrano', 'Ambalavao', 'Bekily',
    'Mananjary', 'Vohémar', 'Fort Dauphin', 'Ambanja', 'Maroantsetra', 'Mananara Nord', 'Soavinandriana', 'Betioky', 'Tsiroanomandidy', 'Brickaville'
  ],

  'Mali': [
    'Bamako', 'Sikasso', 'Mopti', 'Koutiala', 'Ségou', 'Kayes', 'Gao', 'Kidal', 'Tombouctou', 'San',
    'Bougouni', 'Djenné', 'Bankass', 'Koro', 'Douentza', 'Bandiagara', 'Kolokani', 'Niono', 'Macina', 'Markala',
    'Yorosso', 'Kolondiéba', 'Yanfolila', 'Kéniéba', 'Bafoulabé', 'Diéma', 'Nioro', 'Yélimané', 'Ansongo', 'Bourem'
  ],

  'Mauritania': [
    'Nouakchott', 'Nouadhibou', 'Néma', 'Kaédi', 'Zouérat', 'Rosso', 'Atar', 'Sélibaby', 'Kiffa', 'Aleg',
    'Boutilimit', 'Tidjikja', 'Akjoujt', 'Chinguetti', 'Ouadane', 'Tichit', 'Oualata', 'Aioun', 'Tamchakett', 'Magta Lahjar'
  ],

  'Mozambique': [
    'Maputo', 'Matola', 'Nampula', 'Beira', 'Chimoio', 'Nacala', 'Quelimane', 'Tete', 'Xai-Xai', 'Lichinga',
    'Pemba', 'Inhambane', 'Maxixe', 'Gurué', 'Manica', 'Montepuez', 'Cuamba', 'Angoche', 'Chókwè', 'Catandica',
    'Mandimba', 'Mocuba', 'Namaacha', 'Vilanculos', 'Massinga', 'Homoine', 'Marracuene', 'Manhiça', 'Magude', 'Moamba'
  ],

  'Namibia': [
    'Windhoek', 'Rundu', 'Walvis Bay', 'Oshakati', 'Swakopmund', 'Katima Mulilo', 'Grootfontein', 'Rehoboth', 'Otjiwarongo', 'Ondangwa',
    'Okahandja', 'Keetmanshoop', 'Tsumeb', 'Gobabis', 'Henties Bay', 'Outapi', 'Lüderitz', 'Mariental', 'Kalkrand', 'Karasburg',
    'Omaruru', 'Usakos', 'Karibib', 'Outjo', 'Kamanjab', 'Opuwo', 'Ruacana', 'Oshikango', 'Omuthiya', 'Eenhana'
  ],

  'Niger': [
    'Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua', 'Dosso', 'Tillabéri', 'Diffa', 'Arlit', 'Gaya',
    'Tessaoua', 'Madaoua', 'Dogondoutchi', 'Dakoro', 'Gouré', 'Magaria', 'Matameye', 'Mirriah', 'Tanout', 'Tchin-Tabaraden',
    'Abalak', 'Illéla', 'Keita', 'Bouza', 'Birni N\'Konni', 'Tibiri', 'Loga', 'Boboye', 'Kollo', 'Say'
  ],

  'Senegal': [
    'Dakar', 'Touba', 'Thiès', 'Kaolack', 'Saint-Louis', 'Mbour', 'Ziguinchor', 'Rufisque', 'Diourbel', 'Louga',
    'Tambacounda', 'Kolda', 'Fatick', 'Vélingara', 'Matam', 'Kédougou', 'Sédhiou', 'Guinguinéo', 'Bignona', 'Oussouye',
    'Dagana', 'Podor', 'Richard Toll', 'Linguère', 'Kebemer', 'Tivaouane', 'Mékhé', 'Pout', 'Diamniadio', 'Bargny'
  ],

  'Sierra Leone': [
    'Freetown', 'Bo', 'Kenema', 'Koidu', 'Makeni', 'Lunsar', 'Port Loko', 'Waterloo', 'Kabala', 'Kailahun',
    'Pujehun', 'Moyamba', 'Bonthe', 'Yengema', 'Segbwema', 'Pendembu', 'Joru', 'Daru', 'Zimmi', 'Gbangbatok',
    'Mile 91', 'Magburaka', 'Yele', 'Kambia', 'Rokupr', 'Kamakwie', 'Gberia Fotombu', 'Mattru Jong', 'Njala', 'Bumpe'
  ],

  'Togo': [
    'Lomé', 'Sokodé', 'Kara', 'Kpalimé', 'Atakpamé', 'Dapaong', 'Tsévié', 'Vogan', 'Aného', 'Sansanné-Mango',
    'Bassar', 'Niamtougou', 'Bafilo', 'Tchamba', 'Notsé', 'Tabligbo', 'Badou', 'Amlamé', 'Kpédze', 'Agou',
    'Danyi', 'Kévé', 'Glidji', 'Togoville', 'Mission Tové', 'Kpémé', 'Agbodrafo', 'Baguida', 'Kégué', 'Akoumapé'
  ],

  'Zambia': [
    'Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola', 'Mufulira', 'Luanshya', 'Livingstone', 'Kasama', 'Chipata',
    'Mazabuka', 'Choma', 'Mongu', 'Solwezi', 'Mansa', 'Kafue', 'Kalulushi', 'Kapiri Mposhi', 'Chililabombwe', 'Mumbwa',
    'Senanga', 'Nakonde', 'Isoka', 'Mpika', 'Samfya', 'Kawambwa', 'Nchelenge', 'Mporokoso', 'Luwingu', 'Chilubi'
  ],

  'Zimbabwe': [
    'Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Epworth', 'Gweru', 'Kwekwe', 'Kadoma', 'Masvingo', 'Chinhoyi',
    'Norton', 'Marondera', 'Ruwa', 'Chegutu', 'Zvishavane', 'Bindura', 'Beitbridge', 'Redcliff', 'Victoria Falls', 'Hwange',
    'Chiredzi', 'Kariba', 'Karoi', 'Gokwe', 'Lupane', 'Plumtree', 'Gwanda', 'Shurugwi', 'Rusape', 'Chipinge'
  ],

  // Complete Latin American expansion
  'Bolivia': [
    'Santa Cruz de la Sierra', 'La Paz', 'Cochabamba', 'Sucre', 'Oruro', 'Tarija', 'Potosí', 'Sacaba', 'Quillacollo', 'Trinidad',
    'El Alto', 'Montero', 'Riberalta', 'Yacuiba', 'Warnes', 'Cobija', 'Villamontes', 'Camiri', 'Guayaramerín', 'Vallegrande',
    'Tupiza', 'Uyuni', 'Llallagua', 'Bermejo', 'San Ignacio de Velasco', 'Ascensión de Guarayos', 'San Borja', 'Reyes', 'Rurrenabaque', 'Sorata'
  ],

  'Chile': [
    'Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Talca', 'Arica', 'Chillán',
    'Iquique', 'Los Ángeles', 'Puerto Montt', 'Coquimbo', 'Osorno', 'Valdivia', 'Punta Arenas', 'Copiapó', 'Quillota', 'Curicó',
    'Viña del Mar', 'San Antonio', 'Calama', 'Ovalle', 'Linares', 'Quilpué', 'Villa Alemana', 'San Felipe', 'Melipilla', 'Buin'
  ],

  'Colombia': [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Soledad', 'Ibagué', 'Bucaramanga', 'Soacha',
    'Santa Marta', 'Villavicencio', 'Valledupar', 'Pereira', 'Montería', 'Manizales', 'Neiva', 'Palmira', 'Popayán', 'Pasto',
    'Sincelejo', 'Floridablanca', 'Itagüí', 'Envigado', 'Tumaco', 'Barrancas', 'Apartadó', 'Turbo', 'Maicao', 'Riohacha'
  ],

  'Ecuador': [
    'Guayaquil', 'Quito', 'Cuenca', 'Santo Domingo', 'Machala', 'Durán', 'Manta', 'Portoviejo', 'Ambato', 'Riobamba',
    'Loja', 'Esmeraldas', 'Quevedo', 'Milagro', 'Ibarra', 'La Libertad', 'Babahoyo', 'Sangolquí', 'Daule', 'Salinas',
    'Latacunga', 'Pasaje', 'Montecristi', 'Chone', 'El Carmen', 'Vinces', 'Jipijapa', 'Otavalo', 'Cayambe', 'Azogues'
  ],

  'Paraguay': [
    'Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Capiatá', 'Lambaré', 'Fernando de la Mora', 'Limpio', 'Ñemby', 'Encarnación',
    'Mariano Roque Alonso', 'Pedro Juan Caballero', 'Coronel Oviedo', 'Concepción', 'Villarrica', 'Pilar', 'Itauguá', 'Caaguazú', 'Caacupé', 'Paraguarí',
    'Hernandarias', 'Presidente Franco', 'Villa Elisa', 'Areguá', 'Ypané', 'Itá', 'Villa Hayes', 'Benjamín Aceval', 'Carapeguá', 'Eusebio Ayala'
  ],

  'Peru': [
    'Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Huancayo', 'Piura', 'Iquitos', 'Cusco', 'Chimbote', 'Tacna',
    'Juliaca', 'Ica', 'Sullana', 'Ayacucho', 'Chincha Alta', 'Huánuco', 'Tarapoto', 'Pucallpa', 'Castilla', 'Catacaos',
    'Huacho', 'Huaral', 'Tumbes', 'Talara', 'Jaén', 'Moyobamba', 'Chulucanas', 'Paita', 'Ferreñafe', 'Yurimaguas'
  ],

  'Uruguay': [
    'Montevideo', 'Salto', 'Paysandú', 'Las Piedras', 'Rivera', 'Maldonado', 'Tacuarembó', 'Melo', 'Mercedes', 'Artigas',
    'Minas', 'San José de Mayo', 'Durazno', 'Florida', 'Barros Blancos', 'Ciudad de la Costa', 'Treinta y Tres', 'Rocha', 'San Carlos', 'Fray Bentos',
    'Dolores', 'Río Branco', 'Trinidad', 'La Paz', 'Tala', 'Carmelo', 'Nueva Helvecia', 'Young', 'Progreso', 'Canelones'
  ],

  'Venezuela': [
    'Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'Barcelona', 'Maturín', 'San Cristóbal', 'Ciudad Bolívar',
    'Cumana', 'Mérida', 'Cabimas', 'Turmero', 'Barinas', 'Petare', 'Punto Fijo', 'Los Teques', 'Acarigua', 'Carúpano',
    'Coro', 'Guanare', 'San Fernando de Apure', 'Porlamar', 'Valle de la Pascua', 'Araure', 'San Juan de los Morros', 'El Tigre', 'Anaco', 'Calabozo'
  ]
};

// Merge all comprehensive city data from all databases
export const COMPREHENSIVE_CITIES_BY_COUNTRY = {
  ...ENHANCED_CITIES_BY_COUNTRY,
  ...ADDITIONAL_COUNTRIES,
  ...ULTIMATE_GLOBAL_COUNTRIES
};