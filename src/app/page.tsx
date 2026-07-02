"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { userProfileService, createUserDocument } from "@/lib/db";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginForm from "@/app/components/LoginForm";
import RegisterForm from "@/app/components/RegisterForm";
import SocialLogin from "@/app/components/SocialLogin";
import AdminRegisterSheet from "@/app/components/AdminRegisterSheet";
import ForgotSheetModal from "@/app/components/ForgotSheetModal";
import TermsSheetModal from "@/app/components/TermsSheetModal";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, user } = useAuth();

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

  // ─── Clock ──────────────────────────────────────────────────────────
  const [clockTime, setClockTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClockTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      );
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

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

  // ─── Social login ───────────────────────────────────────────────────
  const handleSocialLogin = (provider: string) => {
    showToast(`Connecting to ${provider}...`, "success");
  };

  // ─── Biometric ──────────────────────────────────────────────────────
  const handleBiometric = () => {
    showToast("Biometric authentication", "success");
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
  return (
    <div className="app-container">
      {/* Status Bar */}
      <div className="status-bar">
        <span className="time">{clockTime}</span>
        <div className="icons">
          <i className="fas fa-signal"></i>
          <i className="fas fa-wifi"></i>
          <i className="fas fa-battery-full"></i>
        </div>
      </div>

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
