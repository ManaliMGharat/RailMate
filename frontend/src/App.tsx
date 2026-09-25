import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { apiRequest } from './api/client';

// Pages
import { Home } from './pages/Home';
import { ReservedBooking } from './pages/ReservedBooking';
import { TrainSchedulePage } from './pages/TrainSchedulePage';
import { PassengerDetails } from './pages/PassengerDetails';
import { BookingReview } from './pages/BookingReview';
import { PaymentPage } from './pages/PaymentPage';
import { DigitalTicketPage } from './pages/DigitalTicketPage';
import { MyBookings } from './pages/MyBookings';
import { UnreservedTicketing } from './pages/UnreservedTicketing';
import { PNRStatusPage } from './pages/PNRStatusPage';
import { TrackTrain } from './pages/TrackTrain';
import { LiveStationPage } from './pages/LiveStationPage';
import { CoachPositionPage } from './pages/CoachPositionPage';
import { FoodOrderingPage } from './pages/FoodOrderingPage';
import { RailSupportPage } from './pages/RailSupportPage';
import { RefundsPage } from './pages/RefundsPage';
import { WalletPage } from './pages/WalletPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { MenuPage } from './pages/MenuPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const AppLayout: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(15); // Matches screenshot badge '15'
  const location = useLocation();

  useEffect(() => {
    // Attempt to read live notification count from backend
    apiRequest<{ unread_count: number }>('/notifications')
      .then((data) => setUnreadCount(data.unread_count))
      .catch(() => {});
  }, [location.pathname]);

  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-blue-100">
      {/* Mobile-first centered app frame (360px - 430px mobile, cleanly contained on desktop) */}
      <div className="w-full max-w-md min-h-screen bg-white shadow-2xl relative flex flex-col">
        {!isLoginPage && <Header unreadCount={unreadCount} />}

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/search" element={<ReservedBooking />} />
            <Route path="/train-schedule/:trainNumber" element={<TrainSchedulePage />} />
            <Route path="/passenger-details" element={<PassengerDetails />} />
            <Route path="/booking-review" element={<BookingReview />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/ticket/:id" element={<DigitalTicketPage />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/unreserved" element={<UnreservedTicketing />} />
            <Route path="/platform-ticket" element={<UnreservedTicketing />} />
            <Route path="/pnr" element={<PNRStatusPage />} />
            <Route path="/track-train" element={<TrackTrain />} />
            <Route path="/live-station" element={<LiveStationPage />} />
            <Route path="/coach-position" element={<CoachPositionPage />} />
            <Route path="/food" element={<FoodOrderingPage />} />
            <Route path="/support" element={<RailSupportPage />} />
            <Route path="/refunds" element={<RefundsPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>

        {!isLoginPage && <BottomNav />}
      </div>
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <AppLayout />
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
