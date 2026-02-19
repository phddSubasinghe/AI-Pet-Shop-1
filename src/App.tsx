import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Outlet, useNavigate, Navigate } from "react-router-dom";
import { ShelterProvider } from "@/contexts/ShelterContext";
import { CartProvider } from "@/contexts/CartContext";
import { CartDrawerProvider } from "@/contexts/CartDrawerContext";
import { getStoredUser, clearStoredUser } from "@/lib/auth";
import { onPasswordReset, onUserDeleted } from "@/lib/socket";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import Index from "./pages/Index";
import BrowsePets from "./pages/BrowsePets";
import PetDetail from "./pages/PetDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Fundraising from "./pages/Fundraising";
import FundraisingDetail from "./pages/FundraisingDetail";
import FundraisingDonate from "./pages/FundraisingDonate";
import AIMatching from "./pages/AIMatching";
import PetStore from "./pages/PetStore";
import PetStoreProducts from "./pages/PetStoreProducts";
import ProductDetail from "./pages/ProductDetail";
import Pricing from "./pages/Pricing";
import AboutUs from "./pages/AboutUs";
import Careers from "./pages/Careers";
import Blog from "./pages/Blog";
import Press from "./pages/Press";
import HelpCenter from "./pages/HelpCenter";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Signin from "./pages/auth/Signin";
import Signup from "./pages/auth/Signup";
import VerifyPending from "./pages/auth/VerifyPending";
import AdopterProfile from "./pages/AdopterProfile";
import AdopterSaved from "./pages/AdopterSaved";
import AdopterHappyMatch from "./pages/AdopterHappyMatch";
import AdopterOrders from "./pages/AdopterOrders";
import AdopterRequests from "./pages/AdopterRequests";
import Checkout from "./pages/Checkout";
import ShelterDashboardLayout from "./pages/dashboard/shelter/ShelterDashboardLayout";
import ShelterOverview from "./pages/dashboard/shelter/ShelterOverview";
import ShelterPets from "./pages/dashboard/shelter/ShelterPets";
import ShelterPetForm from "./pages/dashboard/shelter/ShelterPetForm";
import ShelterProfile from "./pages/dashboard/shelter/ShelterProfile";
import ShelterRequests from "./pages/dashboard/shelter/ShelterRequests";
import ShelterEvents from "./pages/dashboard/shelter/ShelterEvents";
import ShelterFundraising from "./pages/dashboard/shelter/ShelterFundraising";
import ShelterNotifications from "./pages/dashboard/shelter/ShelterNotifications";
import ShelterSettings from "./pages/dashboard/shelter/ShelterSettings";
import SellerDashboardLayout from "./pages/dashboard/seller/SellerDashboardLayout";
import SellerOverview from "./pages/dashboard/seller/SellerOverview";
import SellerProducts from "./pages/dashboard/seller/SellerProducts";
import SellerProductForm from "./pages/dashboard/seller/SellerProductForm";
import SellerOrders from "./pages/dashboard/seller/SellerOrders";
import SellerInventory from "./pages/dashboard/seller/SellerInventory";
import SellerReviews from "./pages/dashboard/seller/SellerReviews";
import SellerEarnings from "./pages/dashboard/seller/SellerEarnings";
import SellerNotifications from "./pages/dashboard/seller/SellerNotifications";
import SellerSettings from "./pages/dashboard/seller/SellerSettings";
import AdminDashboardLayout from "./pages/dashboard/admin/AdminDashboardLayout";
import AdminOverview from "./pages/dashboard/admin/AdminOverview";
import AdminApprovals from "./pages/dashboard/admin/AdminApprovals";
import AdminUsers from "./pages/dashboard/admin/AdminUsers";
import AdminPets from "./pages/dashboard/admin/AdminPets";
import AdminAdoptions from "./pages/dashboard/admin/AdminAdoptions";
import AdminDonations from "./pages/dashboard/admin/AdminDonations";
import AdminFundraising from "./pages/dashboard/admin/AdminFundraising";
import AdminPayments from "./pages/dashboard/admin/AdminPayments";
import AdminAnalytics from "./pages/dashboard/admin/AdminAnalytics";
import AdminSettings from "./pages/dashboard/admin/AdminSettings";
import AdminProducts from "./pages/dashboard/admin/AdminProducts";
import AdminCategories from "./pages/dashboard/admin/AdminCategories";
import AdminEvents from "./pages/dashboard/admin/AdminEvents";
import AdminIntegrationsOpenAI from "./pages/dashboard/admin/AdminIntegrationsOpenAI";
import MatchStart from "./pages/match/MatchStart";
import MatchQuestions from "./pages/match/MatchQuestions";
import MatchResults from "./pages/match/MatchResults";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

/** Redirect /signin to /auth/signin so both URLs reach the login page; preserves query (e.g. ?redirect=). */
const SigninRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={{ pathname: "/auth/signin", search }} replace />;
};

/** When admin resets a user's password or deletes a user, that user is logged out everywhere. */
const UserKickListener = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const unsubReset = onPasswordReset((payload) => {
      const current = getStoredUser();
      if (!current?.id || payload.userId !== current.id) return;
      const role = (current as { role?: string }).role;
      if (role !== "seller" && role !== "shelter") return; // only log out seller or shelter; never admin or adopter
      clearStoredUser();
      toast.info("Your password was reset. Please sign in with your new password.");
      navigate("/auth/signin", { replace: true });
    });
    const unsubDeleted = onUserDeleted((payload) => {
      const current = getStoredUser();
      if (!current?.id || payload.userId !== current.id) return;
      clearStoredUser();
      toast.error("Your account was deleted.");
      navigate("/auth/signin", { replace: true });
    });
    return () => {
      unsubReset();
      unsubDeleted();
    };
  }, [navigate]);
  return null;
};

const PageTransitionLayout = () => {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <CartDrawer />
      <div key={location.pathname} className="page-transition">
        <Outlet />
      </div>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
      <CartDrawerProvider>
      <ShelterProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <UserKickListener />
          <Routes>
            <Route path="/dashboard/shelter" element={<ShelterDashboardLayout />}>
                <Route index element={<ShelterOverview />} />
                <Route path="pets" element={<ShelterPets />} />
                <Route path="pets/:id/edit" element={<ShelterPetForm />} />
                <Route path="requests" element={<ShelterRequests />} />
                <Route path="events" element={<ShelterEvents />} />
                <Route path="fundraising" element={<ShelterFundraising />} />
                <Route path="notifications" element={<ShelterNotifications />} />
                <Route path="settings" element={<ShelterSettings />} />
                <Route path="profile" element={<ShelterProfile />} />
              </Route>
            <Route path="/dashboard/seller" element={<SellerDashboardLayout />}>
                <Route index element={<SellerOverview />} />
                <Route path="products" element={<SellerProducts />} />
                <Route path="products/new" element={<SellerProductForm />} />
                <Route path="products/:id/edit" element={<SellerProductForm />} />
                <Route path="orders" element={<SellerOrders />} />
                <Route path="inventory" element={<SellerInventory />} />
                <Route path="reviews" element={<SellerReviews />} />
                <Route path="earnings" element={<SellerEarnings />} />
                <Route path="notifications" element={<SellerNotifications />} />
                <Route path="settings" element={<SellerSettings />} />
              </Route>
            <Route path="/dashboard/admin" element={<AdminDashboardLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="approvals" element={<AdminApprovals />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="pets" element={<AdminPets />} />
              <Route path="adoptions" element={<AdminAdoptions />} />
              <Route path="donations" element={<AdminDonations />} />
              <Route path="fundraising" element={<AdminFundraising />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="integrations/openai" element={<AdminIntegrationsOpenAI />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route element={<PageTransitionLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/browse-pets" element={<BrowsePets />} />
              <Route path="/pet/:id" element={<PetDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/fundraising" element={<Fundraising />} />
              <Route path="/fundraising/:id" element={<FundraisingDetail />} />
              <Route path="/fundraising/:id/donate" element={<FundraisingDonate />} />
              <Route path="/donate" element={<Fundraising />} />
              <Route path="/ai-matching" element={<AIMatching />} />
              <Route path="/pet-store/products/:productId" element={<ProductDetail />} />
              <Route path="/pet-store/products" element={<PetStoreProducts />} />
              <Route path="/pet-store" element={<PetStore />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/press" element={<Press />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/signin" element={<SigninRedirect />} />
              <Route path="/auth/signin" element={<Signin />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/verify-pending" element={<VerifyPending />} />
              <Route path="/profile" element={<AdopterProfile />} />
              <Route path="/profile/orders" element={<AdopterOrders />} />
              <Route path="/profile/requests" element={<AdopterRequests />} />
              <Route path="/profile/saved" element={<AdopterSaved />} />
              <Route path="/profile/happy-match" element={<AdopterHappyMatch />} />
              <Route path="/cart" element={<Checkout />} />
              <Route path="/dashboard/adopter" element={<Navigate to="/profile" replace />} />
              <Route path="/match/start" element={<MatchStart />} />
              <Route path="/match/questions" element={<MatchQuestions />} />
              <Route path="/match/results" element={<MatchResults />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ShelterProvider>
      </CartDrawerProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
