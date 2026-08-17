import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Booking from "./pages/Booking";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";
import { AdminProvider } from "./context/AdminContext";

import MobileBottomNav from "./components/MobileBottomNav";

function SiteLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
            <Route path="/services" element={<SiteLayout><Services /></SiteLayout>} />
            <Route path="/shop" element={<SiteLayout><Shop /></SiteLayout>} />
            <Route path="/cart" element={<SiteLayout><Cart /></SiteLayout>} />
            <Route path="/booking" element={<SiteLayout><Booking /></SiteLayout>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AdminProvider>
  );
}
