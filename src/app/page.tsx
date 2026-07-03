"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { userProfileService, createUserDocument } from "@/lib/db";
import { GoogleAuthProvider, signInWithCredential, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LandingOnboarding from "@/app/components/LandingOnboarding";
import LoginForm from "@/app/components/LoginForm";
import RegisterForm from "@/app/components/RegisterForm";
import SocialLogin from "@/app/components/SocialLogin";
import AdminRegisterSheet from "@/app/components/AdminRegisterSheet";
import ForgotSheetModal from "@/app/components/ForgotSheetModal";
import TermsSheetModal from "@/app/components/TermsSheetModal";
import { authenticateWithBiometrics, initBiometricAuth, isBiometricAvailable, signInWithGoogleNative, hapticsImpact, isNative, setPreference, getPreference } from "@/lib/capacitor";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, user } = useAuth();

  // ─── Onboarding state — always show before login ────────────────────
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingChecked] = useState(true);

  const handleOnboardingComplete = useCallback(() => {
    setOnboardingDone(true);
  }, []);

  // ─── Page navigation ───────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<"login" | "register">("login");

  // ─── Login state ────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // ─── Register state ─────────────────────────────────────────────────
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regCity, setRegCity] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [termsAgree, setTermsAgree] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regShake, setRegShake] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  // ─── Forgot password sheet state ────────────────────────────────────
  const [forgotSheetOpen, setForgotSheetOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // ─── Terms sheet state ──────────────────────────────────────────────
  const [termsSheetOpen, setTermsSheetOpen] = useState(false);

  // ─── Admin register sheet state ─────────────────────────────────────
  const [adminRegisterOpen, setAdminRegisterOpen] = useState(false);

  // ─── Toast state ────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastVisible, setToastVisible] = useState(false);

  // ─── Redirect if already logged in ──────────────────────────────────
  useEffect(() => {
    if (user) {
      userProfileService
        .getProfile(user.uid)
        .then((profile: any) => {
          if (profile?.role === "admin") router.push("/dashboard");
          else router.push("/client/shop");
        })
        .catch(() => router.push("/dashboard"));
    }
  }, [user, router]);

  // ─── Helpers ────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }, []);

  const triggerRegShake = useCallback(() => {
    setRegShake(true);
    setTimeout(() => setRegShake(false), 400);
  }, []);

  // ─── Navigation ─────────────────────────────────────────────────────
  const goToLogin = useCallback(() => {
    setCurrentPage("login");
  }, []);

  const goToRegister = useCallback(() => {
    setCurrentPage("register");
  }, []);

  // ─── Login handler ──────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await hapticsImpact('light');
    let valid = true;

    setEmailError(false);
    setPasswordError(false);

    if (!loginEmail.includes("@")) {
      setEmailError(true);
      valid = false;
    }
    if (loginPassword.length < 6) {
      setPasswordError(true);
      valid = false;
    }

    if (!valid) {
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const cred = await signIn(loginEmail, loginPassword);
      const profile = await userProfileService.getProfile(cred.user.uid);
      setPreference('wamorgan_last_email', loginEmail);
      showToast("Welcome back! Login successful", "success");
      setTimeout(() => {
        if (profile?.role === "admin") router.push("/dashboard");
        else router.push("/client/shop");
      }, 500);
    } catch (err: any) {
      const msg =
        err.code === "auth/user-not-found"
          ? "No account found with this email"
          : err.code === "auth/wrong-password" || err.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : err.message || "Login failed. Please try again.";
      showToast(msg, "error");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ─── Register handler ───────────────────────────────────────────────
  const handleRegister = async () => {
    const errors: Record<string, string> = {};
    if (!regName.trim()) errors.name = "Name is required";
    if (!regEmail.includes("@")) errors.email = "Valid email is required";
    if (regPassword.length < 6) errors.password = "Password must be at least 6 characters";
    if (!termsAgree) errors.terms = "You must agree to the terms";

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      triggerRegShake();
      return;
    }

    setRegErrors({});
    setRegLoading(true);
    try {
      const cred = await signUp(regEmail, regPassword);
      await createUserDocument(cred.user.uid, regEmail, {
        displayName: regName.trim(),
        role: "client",
        phone: regPhone,
      });

      // Auto-setup Evolution instance and webhook for new user
      try {
        const instanceName = `tenant_${cred.user.uid}`;
        await fetch('/api/evolution/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceName, userId: cred.user.uid }),
        });
      } catch {
        // Non-critical — user can set up later from dashboard
      }

      showToast("Account created successfully!", "success");
      setTimeout(() => router.push("/client/shop"), 500);
    } catch (err: any) {
      showToast(err.message || "Registration failed", "error");
    } finally {
      setRegLoading(false);
    }
  };

  // ─── On mount — init biometric and try to load stored email ────────
  const [biometricReady, setBiometricReady] = useState(false);

  useEffect(() => {
    if (isNative()) {
      initBiometricAuth().then(() => setBiometricReady(true));
    } else {
      setBiometricReady(true);
    }
    // Load last used email
    getPreference('wamorgan_last_email').then(email => {
      if (email) setLoginEmail(email);
    });
  }, []);

  // ─── Social login ───────────────────────────────────────────────────
  const handleSocialLogin = async (provider: string) => {
    await hapticsImpact('light');
    if (provider === 'Google' && isNative()) {
      const result = await signInWithGoogleNative();
      if (result && result.idToken) {
        try {
          if (auth) {
            const credential = GoogleAuthProvider.credential(result.idToken);
            const cred = await signInWithCredential(auth, credential);
            await setPreference('wamorgan_last_email', result.email);
            const profile = await userProfileService.getProfile(cred.user.uid);
            showToast('Signed in with Google!', 'success');
            setTimeout(() => {
              if (profile?.role === 'admin') router.push('/dashboard');
              else router.push('/client/shop');
            }, 500);
          }
        } catch (err: any) {
          showToast(err.message || 'Google sign-in failed', 'error');
        }
      } else {
        showToast('Google sign-in cancelled', 'error');
      }
    } else {
      showToast(`Connecting to ${provider}...`, 'success');
    }
  }; 

  // ─── Store email after successful login ────────────────────────────
  // The login handler already exists — augment it to store the email

  // ─── Biometric ──────────────────────────────────────────────────────
  const handleBiometric = async () => {
    if (isNative()) {
      await initBiometricAuth();
      if (!isBiometricAvailable()) {
        showToast("No biometric sensor available on this device", "error");
        return;
      }
      const authenticated = await authenticateWithBiometrics('Log in to WAMORGAN');
      if (authenticated) {
        await hapticsImpact('light');
        // Retrieve stored email for convenience
        const storedEmail = await getPreference('wamorgan_last_email');
        if (storedEmail) {
          setLoginEmail(storedEmail);
          // Focus password field — biometric verified, just need password
          showToast('Biometric verified! Enter your password to continue', 'success');
        } else {
          // No stored email — check if Firebase session exists
          if (user) {
            const profile = await userProfileService.getProfile(user.uid);
            if (profile?.role === 'admin') router.push('/dashboard');
            else router.push('/client/shop');
          } else {
            showToast('Biometric verified! Please log in with your credentials', 'success');
          }
        }
      } else {
        showToast('Biometric authentication cancelled', 'error');
      }
    } else {
      // Web fallback
      showToast('Biometric authentication is only available on mobile app', 'success');
    }
  };

  // ─── Forgot password ────────────────────────────────────────────────
  const handleForgotSend = async () => {
    if (!forgotEmail.includes("@")) {
      showToast("Please enter a valid email", "error");
      return;
    }
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, forgotEmail);
      }
      setForgotSheetOpen(false);
      showToast("Reset link sent to your email", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to send reset email", "error");
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────
  // Show nothing while checking onboarding status
  if (!onboardingChecked) {
    return (
      <div className="app-container" style={{ background: 'var(--bg-primary)' }}>
        <div className="lo-splash-loader" style={{ position: 'fixed', top: '50%', left: '50%', margin: '-20px 0 0 -20px' }} />
      </div>
    );
  }

  // Show onboarding if not completed
  if (!onboardingDone) {
    return (
      <div className="app-container" style={{ background: 'var(--bg-primary)' }}>
        <LandingOnboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="app-container login-root">
      {/* Background Effects */}
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      {/* Main Content */}
      <div className="main-content">
        {/* LOGIN PAGE */}
        <div className={`page ${currentPage === "login" ? "active" : ""}`}>
          <LoginForm
            loginEmail={loginEmail}
            loginPassword={loginPassword}
            rememberMe={rememberMe}
            showPassword={showPassword}
            emailError={emailError}
            passwordError={passwordError}
            formShaking={shake}
            loading={loading}
            onEmailChange={setLoginEmail}
            onPasswordChange={setLoginPassword}
            onRememberChange={setRememberMe}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onSubmit={handleLogin}
            onForgotClick={() => setForgotSheetOpen(true)}
          />

          <SocialLogin
            onSocialLogin={handleSocialLogin}
            onGoToRegister={goToRegister}
            onBiometricClick={handleBiometric}
            nativeBiometricAvailable={biometricReady && isBiometricAvailable()}
          />

          <div className="bottom-text" style={{ marginTop: 8 }}>
            <a onClick={() => setAdminRegisterOpen(true)}>Admin? Register here</a>
          </div>
        </div>

        {/* REGISTER PAGE */}
        <div className={`page ${currentPage === "register" ? "active" : ""}`}>
          <RegisterForm
            regName={regName}
            regEmail={regEmail}
            regPhone={regPhone}
            regPassword={regPassword}
            regAddress={regAddress}
            regCity={regCity}
            showRegPassword={showRegPassword}
            termsAgree={termsAgree}
            loading={regLoading}
            formShaking={regShake}
            errors={regErrors}
            onRegNameChange={setRegName}
            onRegEmailChange={setRegEmail}
            onRegPhoneChange={setRegPhone}
            onRegPasswordChange={setRegPassword}
            onRegAddressChange={setRegAddress}
            onRegCityChange={setRegCity}
            onToggleRegPassword={() => setShowRegPassword(!showRegPassword)}
            onTermsAgreeChange={setTermsAgree}
            onRegister={handleRegister}
            onOpenTerms={() => setTermsSheetOpen(true)}
            onGoBack={goToLogin}
          />
        </div>
      </div>

      {/* Forgot Password Sheet */}
      <ForgotSheetModal
        open={forgotSheetOpen}
        sheetEmail={forgotEmail}
        onEmailChange={setForgotEmail}
        onSend={handleForgotSend}
        onClose={() => setForgotSheetOpen(false)}
      />

      {/* Admin Register Sheet */}
      <AdminRegisterSheet
        open={adminRegisterOpen}
        onClose={() => setAdminRegisterOpen(false)}
        showToast={showToast}
      />

      {/* Terms Sheet */}
      <TermsSheetModal
        open={termsSheetOpen}
        onClose={() => setTermsSheetOpen(false)}
      />

      {/* Toast */}
      <div className={`toast ${toastVisible ? "show" : ""} ${toastType}`}>
        <i className={`fas ${toastType === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
