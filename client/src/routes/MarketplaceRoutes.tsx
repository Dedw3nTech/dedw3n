import { lazy } from 'react';
import { Route, Switch } from 'wouter';
import { SEOHead, seoConfigs } from '@/components/seo/SEOHead';
import { ProtectedRoute } from '@/lib/protected-route';

const Products = lazy(() => import('@/pages/products'));
const ProductDetail = lazy(() => import('@/pages/product-detail'));
const AddProduct = lazy(() => import('@/pages/add-product'));
const UploadProduct = lazy(() => import('@/pages/upload-product'));
const VendorsPage = lazy(() => import('@/pages/vendors'));
const VendorDetailPage = lazy(() => import('@/pages/vendor-detail'));
const VendorProfile = lazy(() => import('@/pages/vendor-profile'));
const MarketplaceRaw = lazy(() => import('@/pages/marketplace-raw'));
const MarketplaceCreators = lazy(() => import('@/pages/MarketplaceCreators'));
const MarketplaceRealEstate = lazy(() => import('@/pages/MarketplaceRealEstate'));
const Cart = lazy(() => import('@/pages/cart'));
const Checkout = lazy(() => import('@/pages/checkout'));
const PaymentGateway = lazy(() => import('@/pages/payment-gateway'));
const PaymentSuccess = lazy(() => import('@/pages/payment-success'));
const GiftCards = lazy(() => import('@/pages/gift-cards'));
const SearchPage = lazy(() => import('@/pages/search'));

export function MarketplaceRoutes({ params }: any) {
  return (
    <Switch>
        <Route path="/marketplace">
          <SEOHead {...seoConfigs.home} />
          <Products />
        </Route>
        
        <Route path="/marketplace/b2c">
          <SEOHead {...seoConfigs.products} title="B2C Marketplace - Dedw3n" description="Browse our Business-to-Consumer marketplace with thousands of products from verified vendors." />
          <Products />
        </Route>
        
        <Route path="/marketplace/b2b">
          <SEOHead {...seoConfigs.products} title="B2B Marketplace - Dedw3n" description="Discover Business-to-Business solutions and wholesale products from trusted suppliers." />
          <Products />
        </Route>
        
        <Route path="/marketplace/c2c">
          <SEOHead {...seoConfigs.products} title="C2C Marketplace - Dedw3n" description="Shop Consumer-to-Consumer marketplace for unique items and second-hand products." />
          <Products />
        </Route>
        
        <Route path="/marketplace/raw">
          <SEOHead title="Raw Marketplace - Dedw3n" description="Raw materials marketplace where you can find bulk raw materials, commodities, and unfinished goods for your business." />
          <MarketplaceRaw />
        </Route>
        
        <Route path="/marketplace/creators">
          <SEOHead title="Content Creators - Dedw3n" description="Discover and support content creators. Watch exclusive videos, subscribe to your favorite creators, and enjoy premium content." />
          <MarketplaceCreators />
        </Route>
        
        <Route path="/marketplace/real-estate">
          <SEOHead title="Real Estate - Dedw3n" description="Browse real estate listings including houses, apartments, condos, and commercial properties for sale or rent." />
          <MarketplaceRealEstate />
        </Route>
        
        <Route path="/marketplace/rqst">
          <SEOHead title="RQST Marketplace - Dedw3n" description="Request marketplace where you can post product requests and connect with vendors who can fulfill them." />
          <Products />
        </Route>
        
        <Route path="/products">
          <SEOHead {...seoConfigs.products} />
          <Products />
        </Route>
        
        <Route path="/product/:identifier" component={ProductDetail} />
        
        <Route path="/vendors">
          <SEOHead {...seoConfigs.vendors} />
          <VendorsPage />
        </Route>
        
        <Route path="/vendor/:slug" component={VendorDetailPage} />
        
        <Route path="/search">
          <SEOHead title="Search Results - Dedw3n" description="Search results for products, vendors, and content on Dedw3n marketplace." />
          <SearchPage />
        </Route>
        
        <Route path="/gift-cards" component={GiftCards} />
        
        <ProtectedRoute path="/cart" component={Cart} />
        <ProtectedRoute path="/checkout" component={Checkout} />
        <ProtectedRoute path="/payment-gateway" component={PaymentGateway} />
        <ProtectedRoute path="/payment-success" component={PaymentSuccess} />
        <ProtectedRoute path="/add-product" component={AddProduct} />
        <ProtectedRoute path="/upload-product" component={UploadProduct} />
    </Switch>
  );
}
