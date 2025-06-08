# DATING PROFILE ENHANCED GIFTS SYSTEM - COMPREHENSIVE DEVELOPMENT PLAN

## PROJECT OVERVIEW
Implement an advanced dating profile gifts system with intelligent search functionality, displaying only selected gifts from products and events, featuring real-time search suggestions with product images and enhanced user experience.

## CURRENT STATUS ANALYSIS
The dating profile gift system is partially functional but has critical issues preventing proper display of selected gifts. The Plus (+) button successfully adds items to the database, but authentication issues prevent the frontend from displaying them correctly.

## ROOT CAUSE ANALYSIS

### 1. Authentication Issues with Dating Profile Endpoint
- **Issue**: Dating profile GET endpoint returns 401 unauthorized despite valid session
- **Evidence**: Console logs show "Unauthorized - No valid authentication" errors
- **Impact**: Selected gifts cannot be displayed in dating profile interface

### 2. Missing Selected Gifts Display Logic
- **Issue**: Current GiftsSelection component shows all products, not user's selected gifts
- **Evidence**: Component queries all products instead of user's dating profile gifts
- **Impact**: Users cannot see their previously selected items

### 3. Lack of Advanced Search Functionality
- **Issue**: No search interface for products/events with real-time suggestions
- **Evidence**: Static product grid without search or filtering capabilities
- **Impact**: Poor user experience when selecting gifts from large catalogs

### 4. Events Integration Missing
- **Issue**: System only handles products, not events as gift options
- **Evidence**: No event-related gift functionality in current implementation
- **Impact**: Limited gift selection options for users

## COMPREHENSIVE EXECUTION PLAN

### PHASE 1: AUTHENTICATION FIX & SELECTED GIFTS DISPLAY

#### Step 1.1: Fix Dating Profile Authentication
```typescript
// Update dating profile endpoint with proper fallback authentication
app.get('/api/dating-profile', async (req: Request, res: Response) => {
  try {
    // Use unified authentication with fallback
    let authenticatedUser = null;
    
    if (req.user) {
      authenticatedUser = req.user;
    } else {
      // Fallback session authentication
      const sessionAuth = await getSessionAuth(req);
      if (sessionAuth) {
        authenticatedUser = sessionAuth;
      }
    }
    
    if (!authenticatedUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const datingProfile = await storage.getDatingProfile(authenticatedUser.id);
    if (!datingProfile) {
      return res.status(404).json({ message: 'Dating profile not found' });
    }
    
    return res.json(datingProfile);
  } catch (error) {
    console.error('Error fetching dating profile:', error);
    res.status(500).json({ message: 'Failed to fetch dating profile' });
  }
});
```

#### Step 1.2: Create Selected Gifts Display Component
```typescript
// New component: SelectedGiftsDisplay.tsx
interface SelectedGiftsDisplayProps {
  userId: number;
  onRemoveGift: (giftId: number) => void;
}

function SelectedGiftsDisplay({ userId, onRemoveGift }: SelectedGiftsDisplayProps) {
  const { data: selectedGifts, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/dating-profile/gifts', userId],
    enabled: !!userId,
  });
  
  if (isLoading) {
    return <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="ml-2">Loading your selected gifts...</span>
    </div>;
  }
  
  if (!selectedGifts || selectedGifts.length === 0) {
    return <div className="text-center py-8">
      <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">No gifts selected yet</p>
      <p className="text-sm text-gray-400 mt-2">
        Add gifts from the marketplace using the Plus (+) button
      </p>
    </div>;
  }
  
  return <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Your Selected Gifts ({selectedGifts.length}/20)</h3>
      <Badge variant="secondary">{selectedGifts.length} selected</Badge>
    </div>
    
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {selectedGifts.map((gift) => (
        <GiftCard 
          key={gift.id} 
          gift={gift} 
          onRemove={() => onRemoveGift(gift.id)}
          showRemoveButton={true}
        />
      ))}
    </div>
  </div>;
}
```

#### Step 1.3: Integrate with Dating Profile Page
```typescript
// Replace existing GiftsSelection with dual-mode component
const [viewMode, setViewMode] = useState<'selected' | 'browse'>('selected');

// In dating profile render:
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <Gift className="h-5 w-5" />
        Gifts
      </CardTitle>
      <div className="flex gap-2">
        <Button 
          variant={viewMode === 'selected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('selected')}
        >
          Selected ({selectedGifts.length})
        </Button>
        <Button 
          variant={viewMode === 'browse' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('browse')}
        >
          Browse & Add
        </Button>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    {viewMode === 'selected' ? (
      <SelectedGiftsDisplay 
        userId={user?.id || 0}
        onRemoveGift={handleRemoveGift}
      />
    ) : (
      <AdvancedGiftSearch 
        selectedGifts={selectedGifts}
        onAddGift={handleAddGift}
      />
    )}
  </CardContent>
</Card>
```

### PHASE 2: ADVANCED SEARCH SYSTEM WITH REAL-TIME SUGGESTIONS

#### Step 2.1: Create Advanced Search Backend API
```typescript
// Add to server/routes.ts - Advanced search endpoint
app.get('/api/search/gifts', unifiedIsAuthenticated, async (req: Request, res: Response) => {
  try {
    const { q, type = 'all', limit = 10, offset = 0 } = req.query;
    const userId = req.user!.id;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json({ results: [], total: 0, suggestions: [] });
    }
    
    const searchTerm = q.trim().toLowerCase();
    let results = [];
    
    // Search products if type is 'all' or 'products'
    if (type === 'all' || type === 'products') {
      const productResults = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          imageUrl: products.imageUrl,
          category: products.category,
          type: sql<string>`'product'`,
          vendor: {
            id: vendors.id,
            storeName: vendors.storeName,
            rating: vendors.rating
          }
        })
        .from(products)
        .innerJoin(vendors, eq(products.vendorId, vendors.id))
        .where(
          or(
            like(products.name, `%${searchTerm}%`),
            like(products.description, `%${searchTerm}%`),
            like(products.category, `%${searchTerm}%`)
          )
        )
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      results.push(...productResults);
    }
    
    // Search events if type is 'all' or 'events'
    if (type === 'all' || type === 'events') {
      const eventResults = await db
        .select({
          id: eventsTable.id,
          name: eventsTable.title,
          description: eventsTable.description,
          price: eventsTable.ticketPrice,
          imageUrl: eventsTable.imageUrl,
          category: eventsTable.category,
          type: sql<string>`'event'`,
          date: eventsTable.eventDate,
          location: eventsTable.location
        })
        .from(eventsTable)
        .where(
          or(
            like(eventsTable.title, `%${searchTerm}%`),
            like(eventsTable.description, `%${searchTerm}%`),
            like(eventsTable.category, `%${searchTerm}%`),
            like(eventsTable.location, `%${searchTerm}%`)
          )
        )
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      results.push(...eventResults);
    }
    
    // Generate search suggestions based on popular terms
    const suggestions = await generateSearchSuggestions(searchTerm);
    
    res.json({
      results: results.slice(0, parseInt(limit as string)),
      total: results.length,
      suggestions,
      searchTerm
    });
    
  } catch (error) {
    console.error('Error in gift search:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

// Helper function for search suggestions
async function generateSearchSuggestions(searchTerm: string): Promise<string[]> {
  try {
    // Get popular product categories and names that match
    const productSuggestions = await db
      .select({ suggestion: products.category })
      .from(products)
      .where(like(products.category, `%${searchTerm}%`))
      .groupBy(products.category)
      .limit(5);
    
    const nameSuggestions = await db
      .select({ suggestion: products.name })
      .from(products)
      .where(like(products.name, `%${searchTerm}%`))
      .limit(5);
    
    const eventSuggestions = await db
      .select({ suggestion: eventsTable.category })
      .from(eventsTable)
      .where(like(eventsTable.category, `%${searchTerm}%`))
      .groupBy(eventsTable.category)
      .limit(3);
    
    return [
      ...productSuggestions.map(s => s.suggestion),
      ...nameSuggestions.map(s => s.suggestion),
      ...eventSuggestions.map(s => s.suggestion)
    ].filter(Boolean).slice(0, 8);
    
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [];
  }
}
```

#### Step 2.2: Create Advanced Search Frontend Component
```typescript
// New component: AdvancedGiftSearch.tsx
interface SearchResult {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  type: 'product' | 'event';
  vendor?: { id: number; storeName: string; rating: number };
  date?: string;
  location?: string;
}

interface AdvancedGiftSearchProps {
  selectedGifts: number[];
  onAddGift: (giftId: number, type: 'product' | 'event') => void;
}

function AdvancedGiftSearch({ selectedGifts, onAddGift }: AdvancedGiftSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'products' | 'events'>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { formatPriceFromGBP } = useCurrency();
  
  // Debounced search query
  const { data: searchResults, isLoading } = useQuery<{
    results: SearchResult[];
    total: number;
    suggestions: string[];
  }>({
    queryKey: ['/api/search/gifts', searchTerm, searchType],
    enabled: searchTerm.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });
  
  const handleSearchTermChange = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
      setShowSuggestions(term.length >= 2);
    }, 300),
    []
  );
  
  const selectSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };
  
  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search for gifts, events, or categories..."
            className="pl-10 pr-4"
            onChange={(e) => handleSearchTermChange(e.target.value)}
            onFocus={() => setShowSuggestions(searchTerm.length >= 2)}
          />
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchResults?.suggestions && searchResults.suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
              <div className="py-2">
                <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Suggestions
                </div>
                {searchResults.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Search className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Search Type Filter */}
        <div className="flex gap-2">
          <Button
            variant={searchType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchType('all')}
          >
            All
          </Button>
          <Button
            variant={searchType === 'products' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchType('products')}
          >
            Products
          </Button>
          <Button
            variant={searchType === 'events' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchType('events')}
          >
            Events
          </Button>
        </div>
      </div>
      
      {/* Search Results */}
      {searchTerm.length >= 2 && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Searching...</span>
            </div>
          ) : searchResults?.results && searchResults.results.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Search Results ({searchResults.total})
                </h3>
                <Badge variant="secondary">
                  "{searchTerm}" in {searchType}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {searchResults.results.map((result) => (
                  <SearchResultCard
                    key={`${result.type}-${result.id}`}
                    result={result}
                    isSelected={selectedGifts.includes(result.id)}
                    onAdd={() => onAddGift(result.id, result.type)}
                    formatPrice={formatPriceFromGBP}
                  />
                ))}
              </div>
            </>
          ) : searchTerm.length >= 2 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No results found for "{searchTerm}"</p>
              <p className="text-sm text-gray-400 mt-2">
                Try different keywords or browse categories
              </p>
            </div>
          ) : null}
        </div>
      )}
      
      {/* Quick Categories when no search */}
      {searchTerm.length < 2 && (
        <QuickCategories onCategorySelect={(category) => {
          handleSearchTermChange(category);
        }} />
      )}
    </div>
  );
}

// Search Result Card Component
interface SearchResultCardProps {
  result: SearchResult;
  isSelected: boolean;
  onAdd: () => void;
  formatPrice: (price: number) => string;
}

function SearchResultCard({ result, isSelected, onAdd, formatPrice }: SearchResultCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 rounded-md mb-3 overflow-hidden">
        {result.imageUrl ? (
          <img 
            src={result.imageUrl} 
            alt={result.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {result.type === 'event' ? (
              <Calendar className="h-8 w-8 text-gray-400" />
            ) : (
              <Gift className="h-8 w-8 text-gray-400" />
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm leading-tight">{result.name}</h4>
          <Badge variant="outline" className="text-xs">
            {result.type}
          </Badge>
        </div>
        
        <p className="text-xs text-gray-600 line-clamp-2">
          {result.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">
            {formatPrice(result.price)}
          </span>
          
          <Button
            size="sm"
            variant={isSelected ? "secondary" : "default"}
            onClick={onAdd}
            disabled={isSelected}
            className="h-8"
          >
            {isSelected ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Added
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
        
        {/* Additional info for events */}
        {result.type === 'event' && (result.date || result.location) && (
          <div className="text-xs text-gray-500 space-y-1">
            {result.date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(result.date).toLocaleDateString()}
              </div>
            )}
            {result.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {result.location}
              </div>
            )}
          </div>
        )}
        
        {/* Vendor info for products */}
        {result.type === 'product' && result.vendor && (
          <div className="text-xs text-gray-500">
            By {result.vendor.storeName}
            {result.vendor.rating && (
              <span className="ml-1">⭐ {result.vendor.rating.toFixed(1)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Categories Component
function QuickCategories({ onCategorySelect }: { onCategorySelect: (category: string) => void }) {
  const categories = [
    { name: "Electronics", icon: "💻" },
    { name: "Fashion", icon: "👗" },
    { name: "Home & Garden", icon: "🏠" },
    { name: "Sports", icon: "⚽" },
    { name: "Books", icon: "📚" },
    { name: "Beauty", icon: "💄" },
    { name: "Concerts", icon: "🎵" },
    { name: "Dining", icon: "🍽️" }
  ];
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Browse Categories</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => onCategorySelect(category.name)}
            className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors"
          >
            <div className="text-2xl mb-2">{category.icon}</div>
            <div className="text-sm font-medium">{category.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### Step 2.3: Update Dating Profile Gift Handlers
```typescript
// Enhanced gift management in dating profile page
const handleAddGift = useMutation({
  mutationFn: async ({ giftId, type }: { giftId: number; type: 'product' | 'event' }) => {
    const endpoint = type === 'event' 
      ? '/api/dating-profile/event-gifts' 
      : '/api/dating-profile/gifts';
    
    const response = await apiRequest('POST', endpoint, {
      [type === 'event' ? 'eventId' : 'productId']: giftId
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to add ${type} to dating profile`);
    }
    
    return response.json();
  },
  onSuccess: (data, variables) => {
    toast({
      title: "Gift Added!",
      description: `${variables.type === 'event' ? 'Event' : 'Product'} added to your dating profile`,
    });
    
    // Update selected gifts state
    setSelectedGifts(prev => [...prev, variables.giftId]);
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['/api/dating-profile/gifts'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dating-profile'] });
  },
  onError: (error: Error) => {
    toast({
      title: "Unable to Add Gift",
      description: error.message,
      variant: "destructive",
    });
  }
});

const handleRemoveGift = useMutation({
  mutationFn: async (giftId: number) => {
    const response = await apiRequest('DELETE', `/api/dating-profile/gifts/${giftId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove gift');
    }
    
    return response.json();
  },
  onSuccess: (data, giftId) => {
    toast({
      title: "Gift Removed",
      description: "Gift removed from your dating profile",
    });
    
    // Update selected gifts state
    setSelectedGifts(prev => prev.filter(id => id !== giftId));
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['/api/dating-profile/gifts'] });
  },
  onError: (error: Error) => {
    toast({
      title: "Unable to Remove Gift",
      description: error.message,
      variant: "destructive",
    });
  }
});
```
```typescript
// Enhanced error catching in storage methods
try {
  const result = await db.operation();
  return result;
} catch (error) {
  console.error('Detailed error context:', {
    operation: 'addGiftToDatingProfile',
    userId,
    productId,
    error: error.message,
    stack: error.stack,
    sqlState: error.code
  });
  throw error;
}
```

#### Step 2.2: API Response Improvement
```typescript
// Better API error responses
catch (error) {
  console.error('API Error Details:', error);
  res.status(500).json({ 
    message: 'Database operation failed',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString()
  });
}
```

### PHASE 3: DATA VALIDATION & TYPE SAFETY

#### Step 3.1: Input Validation Layer
```typescript
// Validate product ID format and existence
const productIdNumber = parseInt(productId);
if (isNaN(productIdNumber) || productIdNumber <= 0) {
  return res.status(400).json({ message: 'Invalid product ID format' });
}

// Verify product exists before adding to gifts
const product = await storage.getProduct(productIdNumber);
if (!product) {
  return res.status(404).json({ message: 'Product not found' });
}
```

#### Step 3.2: Profile Data Structure Validation
```typescript
// Ensure selectedGifts array is properly initialized
const profileData: InsertDatingProfile = {
  userId,
  selectedGifts: [productId], // Ensure array format
  displayName: '',
  age: 25, // Default minimum age
  bio: '',
  location: '',
  interests: [],
  lookingFor: '',
  relationshipType: 'casual',
  profileImages: [],
  isActive: false
};
```

### PHASE 4: AUTHENTICATION FORTIFICATION

#### Step 4.1: User Context Validation
```typescript
// Robust user authentication check
const handleAddToDatingProfile = async (req: Request, res: Response) => {
  // Multiple authentication verification layers
  const user = req.user;
  if (!user || !user.id) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Verify user exists in database
  const dbUser = await storage.getUser(user.id);
  if (!dbUser) {
    return res.status(401).json({ message: 'User not found' });
  }
  
  // Continue with gift addition logic
};
```

#### Step 4.2: Session Persistence Check
```typescript
// Ensure session data is accessible
if (!req.session || !req.session.passport) {
  console.warn('Session data missing for user', user.id);
}
```

### PHASE 5: TRANSACTION SAFETY

#### Step 5.1: Database Transaction Wrapper
```typescript
// Implement transaction for gift addition
async addGiftToDatingProfile(userId: number, productId: number): Promise<boolean> {
  return await db.transaction(async (tx) => {
    // Get or create profile within transaction
    let profile = await tx.select().from(datingProfiles).where(eq(datingProfiles.userId, userId)).limit(1);
    
    if (profile.length === 0) {
      // Create new profile
      const [newProfile] = await tx.insert(datingProfiles).values({
        userId,
        selectedGifts: [productId],
        displayName: '',
        age: 25,
        bio: '',
        location: '',
        interests: [],
        lookingFor: '',
        relationshipType: 'casual',
        profileImages: [],
        isActive: false
      }).returning();
      return true;
    } else {
      // Update existing profile
      const currentGifts = profile[0].selectedGifts || [];
      if (currentGifts.includes(productId)) return false;
      if (currentGifts.length >= 20) return false;
      
      await tx.update(datingProfiles)
        .set({ selectedGifts: [...currentGifts, productId] })
        .where(eq(datingProfiles.userId, userId));
      return true;
    }
  });
}
```

### PHASE 6: FRONTEND ERROR HANDLING

#### Step 6.1: Enhanced Mutation Error Processing
```typescript
// Improved frontend error handling
const addToDatingProfileMutation = useMutation({
  mutationFn: async (productId: number) => {
    const response = await apiRequest('POST', '/api/dating-profile/gifts', {
      productId
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add to dating profile');
    }
    
    return response.json();
  },
  onSuccess: (data) => {
    toast({
      title: "Added to Dating Profile!",
      description: `${data.productName} added to your gifts (${data.giftCount}/20)`,
    });
    
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['/api/dating-profile/gifts'] });
  },
  onError: (error: Error) => {
    console.error('Dating profile gift addition failed:', error);
    toast({
      title: "Unable to Add Gift",
      description: error.message,
      variant: "destructive",
    });
  }
});
```

### PHASE 7: TESTING & VALIDATION

#### Step 7.1: Unit Test Coverage
```typescript
// Test cases for gift addition functionality
describe('Dating Profile Gift System', () => {
  test('should add first gift and create profile', async () => {
    const result = await storage.addGiftToDatingProfile(userId, productId);
    expect(result).toBe(true);
    
    const profile = await storage.getDatingProfile(userId);
    expect(profile.selectedGifts).toContain(productId);
  });
  
  test('should prevent duplicate gifts', async () => {
    await storage.addGiftToDatingProfile(userId, productId);
    const result = await storage.addGiftToDatingProfile(userId, productId);
    expect(result).toBe(false);
  });
  
  test('should enforce 20-gift limit', async () => {
    // Add 20 gifts
    for (let i = 1; i <= 20; i++) {
      await storage.addGiftToDatingProfile(userId, i);
    }
    
    // 21st gift should fail
    const result = await storage.addGiftToDatingProfile(userId, 21);
    expect(result).toBe(false);
  });
});
```

#### Step 7.2: Integration Testing
```typescript
// API endpoint testing
describe('Dating Profile Gift API', () => {
  test('POST /api/dating-profile/gifts', async () => {
    const response = await request(app)
      .post('/api/dating-profile/gifts')
      .send({ productId: 1 })
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### PHASE 8: MONITORING & OBSERVABILITY

#### Step 8.1: Performance Metrics
```typescript
// Add performance monitoring
const startTime = Date.now();
const result = await storage.addGiftToDatingProfile(userId, productId);
const duration = Date.now() - startTime;

console.log('Dating profile gift operation completed', {
  userId,
  productId,
  duration,
  success: result
});
```

#### Step 8.2: Error Tracking
```typescript
// Comprehensive error tracking
const trackError = (error: Error, context: any) => {
  console.error('Dating Profile Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: context.req?.headers['user-agent'],
    userId: context.userId
  });
};
```

## EXECUTION PRIORITY

### HIGH PRIORITY (Immediate)
1. Fix schema import issues in storage.ts
2. Add comprehensive error logging
3. Implement transaction safety
4. Validate authentication context

### MEDIUM PRIORITY (Next iteration)
1. Enhanced frontend error handling
2. Input validation layer
3. Unit test coverage
4. Performance monitoring

### LOW PRIORITY (Future enhancement)
1. Advanced error tracking
2. Integration tests
3. Load testing
4. Performance optimization

## SUCCESS METRICS

### Technical Metrics
- 0 dating profile gift addition failures
- < 200ms API response time
- 100% transaction success rate
- 99.9% uptime for gift endpoints

### User Experience Metrics
- < 3 clicks to add gift to profile
- Clear error messages for all failure cases
- Immediate feedback on successful additions
- Seamless profile creation for new users

### Business Metrics
- 40% increase in dating profile completions
- 25% increase in marketplace-to-dating conversion
- 80% adoption rate for gift functionality
- < 5% user-reported errors

## DEPLOYMENT STRATEGY

### Phase 1: Schema Fix (Immediate)
- Deploy schema corrections
- Update import statements
- Add error logging

### Phase 2: Enhanced Validation (Same day)
- Add input validation
- Implement transaction safety
- Deploy authentication fixes

### Phase 3: Frontend Polish (Next day)
- Enhanced error handling
- Improved user feedback
- Query invalidation

### Phase 4: Testing & Monitoring (Following week)
- Comprehensive test suite
- Performance monitoring
- Error tracking system

This plan addresses the root causes of the dating profile gift system failure and provides a comprehensive roadmap for implementation, testing, and deployment.