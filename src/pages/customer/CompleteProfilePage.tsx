import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { RESORT_IMAGES } from '../../lib/assets';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import {
  User,
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface CompleteProfilePageProps {
  onComplete?: () => void;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States & Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
];

export const CompleteProfilePage: React.FC<CompleteProfilePageProps> = ({ onComplete }) => {
  const { user, saveCustomerProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Form State initialized with any existing data
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [age, setAge] = useState<string>(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Prefer not to say' | ''>(
    (user?.gender as any) || ''
  );
  const [countryCode, setCountryCode] = useState('+91');
  
  // Extract existing phone number without country code if present
  const initialLocalPhone = () => {
    const raw = user?.mobile_number || user?.phone || '';
    if (raw.startsWith('+91')) return raw.slice(3).trim();
    if (raw.startsWith('+1')) return raw.slice(2).trim();
    if (raw.startsWith('+44')) return raw.slice(3).trim();
    return raw;
  };
  const [localNumber, setLocalNumber] = useState(initialLocalPhone());

  // Validation & Submission State
  const [errors, setErrors] = useState<{
    fullName?: string;
    age?: string;
    gender?: string;
    mobileNumber?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = () => {
    const newErrors: typeof errors = {};

    // 1. Full Name: required, non-empty text
    if (!fullName || fullName.trim().length === 0) {
      newErrors.fullName = 'Full legal name is required.';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    // 2. Age: numeric, valid between 18 and 120
    if (!age || age.trim() === '') {
      newErrors.age = 'Age is required to comply with hospitality safety guidelines.';
    } else {
      const parsedAge = Number(age);
      if (isNaN(parsedAge) || !Number.isInteger(parsedAge)) {
        newErrors.age = 'Please enter a valid whole number for age.';
      } else if (parsedAge < 18) {
        newErrors.age = 'Guests must be at least 18 years of age to register.';
      } else if (parsedAge > 120) {
        newErrors.age = 'Please enter a realistic age up to 120.';
      }
    }

    // 3. Gender: Male, Female, Prefer not to say
    if (!gender) {
      newErrors.gender = 'Please select a gender preference option.';
    } else if (!['Male', 'Female', 'Prefer not to say'].includes(gender)) {
      newErrors.gender = 'Please select a valid option from the dropdown.';
    }

    // 4. Mobile Number: with country code, valid phone input
    const cleanDigits = localNumber.replace(/\D/g, '');
    if (!localNumber || cleanDigits.length === 0) {
      newErrors.mobileNumber = 'Mobile number is required for booking confirmations and SMS updates.';
    } else if (cleanDigits.length < 7 || cleanDigits.length > 15) {
      newErrors.mobileNumber = 'Please enter a valid phone number (7 to 15 digits).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage(null);

    const fullMobile = `${countryCode} ${localNumber.trim()}`;

    try {
      const res = await saveCustomerProfile({
        full_name: fullName.trim(),
        age: parseInt(age, 10),
        gender,
        mobile_number: fullMobile,
      });

      if (!res.success) {
        setErrors({ general: res.error || 'Failed to save profile. Please review your details and try again.' });
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Your profile has been saved successfully. Preparing your personalized guest dashboard...');
      setTimeout(() => {
        onComplete?.();
      }, 1200);
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred while saving your profile. Please try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] dark:bg-[#141714] text-[#242722] dark:text-[#F7F3EA] flex flex-col justify-between selection:bg-[#C7A36A]/30 selection:text-[#12382D] transition-colors duration-200">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#12382D] text-[#F7F3EA] border-b border-[#C7A36A]/25 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#C7A36A] flex items-center justify-center bg-[#0D2820] text-[#C7A36A] text-xs font-serif font-bold">
              N
            </div>
            <div>
              <span className="font-serif text-lg tracking-[0.2em] text-[#F7F3EA]">NIVORA</span>
              <span className="block text-[8px] uppercase tracking-[0.25em] text-[#C7A36A]">Guest Onboarding</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 rounded-lg border border-[#C7A36A]/30 text-[#F7F3EA] hover:bg-white/10 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#C7A36A]" /> : <Moon className="w-4 h-4 text-[#C7A36A]" />}
            </button>

            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#C7A36A]/30 text-xs text-[#A9B8A4] hover:text-[#F7F3EA] hover:bg-white/10 transition-colors cursor-pointer"
              title="Sign out of current account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* Left Column: Hospitality Editorial Card */}
          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden min-h-[280px] lg:min-h-full flex flex-col justify-between p-6 sm:p-8 text-white shadow-xl border border-[#C7A36A]/25 bg-[#12382D]">
            <ImageWithFallback
              src={RESORT_IMAGES.hero}
              alt="Nivora Luxury Resort"
              loading="eager"
              containerClassName="absolute inset-0 w-full h-full"
              className="w-full h-full object-cover object-center scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A201A] via-[#12382D]/80 to-[#12382D]/45 mix-blend-multiply" />
            <div className="absolute inset-0 bg-black/20" />

            {/* Top Badge */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F7F3EA] text-[11px] tracking-widest uppercase mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#C7A36A]" />
                <span>Sanctuary Guest Folio</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-wide text-white leading-tight">
                Your Bespoke Haven Awaits
              </h2>
              <p className="text-xs text-[#A9B8A4] mt-2 leading-relaxed">
                We personalize every moment of your stay, from custom room climate and private arrival to tailored culinary menus.
              </p>
            </div>

            {/* Middle Feature Highlights */}
            <div className="relative z-10 my-6 py-6 border-y border-white/15 space-y-3.5 text-xs text-[#F7F3EA]">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#C7A36A]/20 border border-[#C7A36A] flex items-center justify-center text-[#C7A36A] shrink-0 text-[11px]">
                  ✓
                </div>
                <span>Curated accommodations matched to your preferences</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#C7A36A]/20 border border-[#C7A36A] flex items-center justify-center text-[#C7A36A] shrink-0 text-[11px]">
                  ✓
                </div>
                <span>Direct SMS alerts for private transfers & dining bookings</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#C7A36A]/20 border border-[#C7A36A] flex items-center justify-center text-[#C7A36A] shrink-0 text-[11px]">
                  ✓
                </div>
                <span>Seamless zero-delay check-in upon resort arrival</span>
              </div>
            </div>

            {/* Bottom Footer Trust Tag */}
            <div className="relative z-10 flex items-center justify-between text-xs text-[#A9B8A4]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C7A36A]" />
                <span>Supabase Secure Storage</span>
              </span>
              <span className="text-[#C7A36A] font-serif">✦ ✦ ✦ ✦ ✦</span>
            </div>
          </div>

          {/* Right Column: Profile Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#1A1E1A] border border-[#C7A36A]/30 rounded-2xl p-6 sm:p-10 shadow-xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="pb-5 border-b border-[#C7A36A]/20">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A36A] font-semibold">
                  Required Guest Registration
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-[#12382D] dark:text-[#F7F3EA] mt-1">
                  Welcome to Nivora Resort!
                </h1>
                <p className="text-xs sm:text-sm text-[#242722]/75 dark:text-[#A9B8A4] mt-1.5 leading-relaxed">
                  Complete your profile to enjoy a personalized resort experience.
                </p>
              </div>

              {/* General Feedback Banners */}
              {errors.general && (
                <div className="mt-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errors.general}</span>
                </div>
              )}
              {successMessage && (
                <div className="mt-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-start gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                
                {/* 1. Full Name */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="fullNameInput" className="block text-xs font-semibold text-[#12382D] dark:text-[#F7F3EA]">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#A9B8A4]">As stated in passport or legal ID</span>
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#C7A36A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="fullNameInput"
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                      placeholder="e.g. Eleanor Vance"
                      required
                      className={`w-full bg-[#F7F3EA]/60 dark:bg-[#121612] border ${
                        errors.fullName ? 'border-rose-500 focus:border-rose-600' : 'border-[#C7A36A]/40 focus:border-[#12382D] dark:focus:border-[#C7A36A]'
                      } rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#242722] dark:text-[#F7F3EA] focus:outline-none transition-colors shadow-2xs`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* 2 & 3. Age and Gender Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Age Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="ageInput" className="block text-xs font-semibold text-[#12382D] dark:text-[#F7F3EA]">
                        Age <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-[#A9B8A4]">18 – 120 years</span>
                    </div>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#C7A36A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="ageInput"
                        type="number"
                        min="18"
                        max="120"
                        step="1"
                        value={age}
                        onChange={(e) => {
                          setAge(e.target.value);
                          if (errors.age) setErrors((prev) => ({ ...prev, age: undefined }));
                        }}
                        placeholder="e.g. 34"
                        required
                        className={`w-full bg-[#F7F3EA]/60 dark:bg-[#121612] border ${
                          errors.age ? 'border-rose-500 focus:border-rose-600' : 'border-[#C7A36A]/40 focus:border-[#12382D] dark:focus:border-[#C7A36A]'
                        } rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#242722] dark:text-[#F7F3EA] focus:outline-none transition-colors tabular-nums shadow-2xs`}
                      />
                    </div>
                    {errors.age && (
                      <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.age}</span>
                      </p>
                    )}
                  </div>

                  {/* Gender Dropdown */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="genderSelect" className="block text-xs font-semibold text-[#12382D] dark:text-[#F7F3EA]">
                        Gender <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-[#A9B8A4]">Hospitality preference</span>
                    </div>
                    <div className="relative">
                      <select
                        id="genderSelect"
                        value={gender}
                        onChange={(e) => {
                          setGender(e.target.value as any);
                          if (errors.gender) setErrors((prev) => ({ ...prev, gender: undefined }));
                        }}
                        required
                        className={`w-full appearance-none bg-[#F7F3EA]/60 dark:bg-[#121612] border ${
                          errors.gender ? 'border-rose-500 focus:border-rose-600' : 'border-[#C7A36A]/40 focus:border-[#12382D] dark:focus:border-[#C7A36A]'
                        } rounded-xl pl-3.5 pr-9 py-2.5 text-xs sm:text-sm text-[#242722] dark:text-[#F7F3EA] focus:outline-none transition-colors shadow-2xs cursor-pointer`}
                      >
                        <option value="" disabled>Select gender option</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#C7A36A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {errors.gender && (
                      <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.gender}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Mobile Number with Country Code */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="mobileInput" className="block text-xs font-semibold text-[#12382D] dark:text-[#F7F3EA]">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#A9B8A4]">Defaults to India (+91)</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Country Code Selection */}
                    <div className="relative w-36 sm:w-44 shrink-0">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        aria-label="Country Code"
                        className="w-full appearance-none bg-[#F7F3EA]/60 dark:bg-[#121612] border border-[#C7A36A]/40 focus:border-[#12382D] dark:focus:border-[#C7A36A] rounded-xl pl-3 pr-8 py-2.5 text-xs sm:text-sm text-[#242722] dark:text-[#F7F3EA] focus:outline-none transition-colors cursor-pointer"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-[#C7A36A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Phone Number Input */}
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-[#C7A36A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="mobileInput"
                        type="tel"
                        value={localNumber}
                        onChange={(e) => {
                          setLocalNumber(e.target.value);
                          if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: undefined }));
                        }}
                        placeholder="98765 43210"
                        required
                        className={`w-full bg-[#F7F3EA]/60 dark:bg-[#121612] border ${
                          errors.mobileNumber ? 'border-rose-500 focus:border-rose-600' : 'border-[#C7A36A]/40 focus:border-[#12382D] dark:focus:border-[#C7A36A]'
                        } rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono text-[#242722] dark:text-[#F7F3EA] focus:outline-none transition-colors tabular-nums shadow-2xs`}
                      />
                    </div>
                  </div>
                  {errors.mobileNumber && (
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.mobileNumber}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-[#242722]/60 dark:text-[#A9B8A4] mt-1.5">
                    Your complete contact string will be formatted as: <span className="font-mono text-[#12382D] dark:text-[#C7A36A]">{countryCode} {localNumber || 'XXXXX XXXXX'}</span>
                  </p>
                </div>

                {/* Submit Action Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 bg-[#12382D] hover:bg-[#0D2820] disabled:opacity-60 text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-[#C7A36A]/30 hover:border-[#C7A36A]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#C7A36A]" />
                        <span>Saving your sanctuary profile...</span>
                      </>
                    ) : (
                      <>
                        <span>Save & Continue</span>
                        <ArrowRight className="w-4 h-4 text-[#C7A36A]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom Security Note */}
            <div className="mt-8 pt-4 border-t border-[#C7A36A]/20 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#242722]/60 dark:text-[#A9B8A4] gap-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C7A36A]" />
                <span>Encrypted profile linked to authenticated Supabase identity</span>
              </span>
              <span>Nivora Hospitality Suite</span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#C7A36A]/20 bg-[#12382D] text-[#F7F3EA] py-6 text-xs text-center">
        <p className="text-[11px] text-[#A9B8A4]">
          © {new Date().getFullYear()} Nivora Resort & Residences · Luxury Peninsula Sanctuary. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
