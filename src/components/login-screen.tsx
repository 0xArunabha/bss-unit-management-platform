"use client";

import React, { useState, useEffect } from "react";
import { identity } from "@/lib/identity";
import { Avatar, Badge, Button, Modal } from "@/components/ui";
import { Lock, ShieldCheck, KeyRound, ChevronRight, HelpCircle, Eye, EyeOff, UserCheck, Sparkles, AlertCircle, ArrowRight, CheckCircle2, Compass, AlertTriangle, ExternalLink } from "lucide-react";
import type { WorkspaceData, Profile, PerformAction } from "@/lib/types";
import { hapticTap, hapticSuccess, hapticWarning } from "@/lib/haptics";
import { normalizeCode } from "@/lib/claim-format";
import { authClient } from "@/lib/auth-client";

interface LoginScreenProps {
  data: WorkspaceData;
  perform: PerformAction;
  onContinueAsGuest: () => void;
}

export function LoginScreen({ data, perform, onContinueAsGuest }: LoginScreenProps) {
  const [mode, setMode] = useState<"login" | "claimCode" | "apply">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // In-app browser detection (Google OAuth blocks webviews)
  const [isInAppBrowser] = useState(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent || "";
      return /FBAN|FBAV|Instagram|Line|WhatsApp|Snapchat|BytedanceWebview/i.test(ua);
    }
    return false;
  });

  // Claim code state
  const [claimCodeInput, setClaimCodeInput] = useState("");
  const [simulatedGoogleEmail, setSimulatedGoogleEmail] = useState("");

  // Application form state
  const [appFullName, setAppFullName] = useState("");
  const [appPhone, setAppPhone] = useState("");
  const [appReason, setAppReason] = useState("");
  const [isAdult, setIsAdult] = useState(true);
  const [guardianName, setGuardianName] = useState("");

  // Auto-format code as XXXX-XXXX
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^23456789ABCDEFGHJKMNPQRSTVWXYZ]/g, "");
    if (raw.length <= 8) {
      if (raw.length > 4) {
        setClaimCodeInput(`${raw.slice(0, 4)}-${raw.slice(4)}`);
      } else {
        setClaimCodeInput(raw);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    hapticTap(10);
    setLoading(true);
    setError("");

    try {
      // If Better Auth has configured social providers and we are on a real domain with Google keys
      if (process.env.NEXT_PUBLIC_USE_REAL_GOOGLE === "true") {
        await authClient.signIn.social({
          provider: "google",
          callbackURL: window.location.origin,
        });
        return;
      }

      // Preview / demo authentication: prompt user for demo Google account or auto-match
      // If already linked, straight into the workspace!
      const email = prompt("Enter your Google Account email for sign-in (or leave default for Secretary Arunabha Ghosh):", "arunabha.science@gmail.com");
      if (!email) {
        setLoading(false);
        return;
      }

      setSimulatedGoogleEmail(email.trim().toLowerCase());

      // Check if this Google account is already linked to a profile
      const matchingProfile = data.profiles.find(
        (p) => p.googleEmail?.toLowerCase() === email.trim().toLowerCase()
      );

      if (matchingProfile) {
        // Straight into workspace!
        const res = await perform("login", { memberId: matchingProfile.id });
        if (res) {
          hapticSuccess();
          return;
        }
      }

      // If unlinked, direct user to onboarding step (Enter invite code or Apply to join)
      setMode("claimCode");
      setError("");
      setSuccess(`Signed in with Google as ${email.trim().toLowerCase()}. Link your member code below, or submit an application.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in could not be completed.");
      hapticWarning();
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeCode(claimCodeInput);
    if (normalized.length !== 8) {
      setError("Please enter a complete 8-character code (e.g. K7M2-Q9XD).");
      hapticWarning();
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await perform("claimInviteCode", {
        code: normalized,
        googleEmail: simulatedGoogleEmail || "member@gmail.com",
        googleSub: `sub_${Date.now()}`,
      });
      if (res) {
        hapticSuccess();
        setSuccess("Success! Code verified. Entering unit workspace...");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim code. Check with Secretary Arunabha Ghosh.");
      hapticWarning();
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appFullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!appPhone.trim() || appPhone.trim().length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!isAdult && !guardianName.trim()) {
      setError("Under-18 advocates must provide a parent/guardian name for DPDP Act compliance.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await perform("applyToJoin", {
        fullName: appFullName.trim(),
        phone: appPhone.trim(),
        reason: appReason.trim() || "Passionate about scientific temper and anti-superstition advocacy in Jalpaiguri.",
        isMinor: !isAdult,
        guardianName: !isAdult ? guardianName.trim() : null,
        googleEmail: simulatedGoogleEmail || "applicant@gmail.com",
        googleSub: `sub_${Date.now()}`,
      });
      if (res) {
        hapticSuccess();
        setSuccess("Application received! Unit executives will review and approve your membership.");
        setTimeout(() => {
          onContinueAsGuest();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application.");
      hapticWarning();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen-wrap">
      <div className="login-card">
        {/* In-app browser warning pill */}
        {isInAppBrowser && (
          <div className="in-app-browser-alert" role="alert">
            <AlertTriangle size={16} />
            <div>
              <strong>In-app browser detected:</strong> Google blocks OAuth inside social media apps.
              <span> Tap the menu (⋮ or Share) and choose <strong>Open in Chrome / Safari</strong>.</span>
            </div>
          </div>
        )}

        {/* Unit Masthead */}
        <div className="login-header">
          <div className="login-logo-seal">
            <img src="/images/bss-logo.svg" alt="BSS Logo" className="login-logo" />
            <div className="login-seal-stamp">
              <span>{identity.bengali}</span>
              <small>JALPAIGURI</small>
            </div>
          </div>
          <h1>{identity.name}</h1>
          <p className="login-subtitle">
            {identity.organisation} · {identity.unit}
          </p>
          <div className="login-tagline">
            “{identity.motto}”
          </div>
        </div>

        {error && (
          <div className="login-error-banner" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="login-success-banner" role="status">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* MODE 1: SINGLE MEMBER LOGIN BUTTON (GOOGLE FIRST) */}
        {mode === "login" && (
          <div className="login-body">
            <div className="auth-google-box">
              <p className="auth-instruction">
                Sign in with your Google account. If your account is linked to the unit, you will be taken straight to your workspace.
              </p>

              <button
                type="button"
                className="google-oauth-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? "Signing in..." : "Member Login with Google"}</span>
              </button>

              <div className="login-alt-actions">
                <button
                  type="button"
                  className="login-chip-btn"
                  onClick={() => setMode("apply")}
                >
                  <Sparkles size={13} />
                  <span>New to the unit? Apply to join</span>
                </button>
              </div>
            </div>

            <div className="public-visitor-divider">
              <span>OR</span>
            </div>

            {/* Public Entry */}
            <div className="public-access-card">
              <div className="public-access-header">
                <div className="public-access-badge">
                  <Compass size={17} />
                </div>
                <div className="public-access-info">
                  <strong>Public Visitor or Science Advocate?</strong>
                  <p>Browse open science outreach notices, anti-superstition demo guides, verify donation receipts, or submit a membership request.</p>
                </div>
              </div>
              <button
                type="button"
                className="guest-action-btn"
                onClick={onContinueAsGuest}
              >
                <span>Explore Public Unit Portal</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: ONBOARDING — ENTER MEMBER CODE */}
        {mode === "claimCode" && (
          <form className="login-body onboarding-form" onSubmit={handleClaimCodeSubmit}>
            <div className="onboarding-step-header">
              <span className="step-tag">STEP 2 OF 2</span>
              <h2>Claim your Member Invite Code</h2>
              <p>
                Enter the 8-character single-use code handed over by Secretary Arunabha Ghosh. This links your Google account permanently.
              </p>
            </div>

            <div className="code-input-wrap">
              <input
                type="text"
                className="claim-code-input"
                placeholder="K7M2-Q9XD"
                value={claimCodeInput}
                onChange={handleCodeChange}
                maxLength={9}
                autoFocus
                required
              />
              <span className="code-help-text">
                Codes are random 8 characters (Crockford Base32), single-use, and expire in 14 days.
              </span>
              <button
                type="button"
                className="executive-code-hint-chip"
                onClick={() => setClaimCodeInput("K7M2-Q9XD")}
              >
                <span>💡 Use Secretary Setup Code: <strong>K7M2-Q9XD</strong> (tap to auto-fill)</span>
              </button>
            </div>

            <div className="onboarding-actions">
              <Button
                type="submit"
                disabled={loading || claimCodeInput.replace(/[^A-Z0-9]/gi, "").length !== 8}
              >
                {loading ? "Verifying code..." : "Link Google & Enter Workspace"}
              </Button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setMode("login")}
              >
                Back to Sign In
              </button>
            </div>

            <div className="onboarding-footer">
              <p>
                Don’t have a code yet?{" "}
                <button type="button" className="inline-link" onClick={() => setMode("apply")}>
                  Submit a membership application
                </button>{" "}
                or contact the unit secretary in person.
              </p>
            </div>
          </form>
        )}

        {/* MODE 3: APPLY TO JOIN UNIT */}
        {mode === "apply" && (
          <form className="login-body onboarding-form" onSubmit={handleApplySubmit}>
            <div className="onboarding-step-header">
              <span className="step-tag">MEMBERSHIP</span>
              <h2>Apply to Join Jalpaiguri Unit</h2>
              <p>
                Join our science movement. Once submitted, unit executives will review your application and issue your member code.
              </p>
            </div>

            <div className="form-field-group">
              <label>
                <span>Full Name</span>
                <input
                  type="text"
                  placeholder="e.g. Priyabrata Roy"
                  value={appFullName}
                  onChange={(e) => setAppFullName(e.target.value)}
                  required
                />
              </label>

              <label>
                <span>Mobile Number (WhatsApp)</span>
                <input
                  type="tel"
                  placeholder="e.g. 9434012345"
                  value={appPhone}
                  onChange={(e) => setAppPhone(e.target.value)}
                  required
                />
              </label>

              {/* India DPDP Act minor protection */}
              <div className="dpdp-age-box">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isAdult}
                    onChange={(e) => setIsAdult(e.target.checked)}
                  />
                  <span>I am 18 years of age or older</span>
                </label>
                <small className="dpdp-notice text-xs text-muted block mt-1">
                  Compliant with India&apos;s Digital Personal Data Protection (DPDP) Act.
                </small>
                {!isAdult && (
                  <div className="guardian-field mt-2">
                    <label>
                      <span>Parent / Guardian Name (Required under DPDP Act 2023)</span>
                      <input
                        type="text"
                        placeholder="e.g. Subir Roy (Guardian)"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        required={!isAdult}
                      />
                    </label>
                  </div>
                )}
              </div>

              <label>
                <span>Why do you want to join Breakthrough Science Society?</span>
                <textarea
                  rows={3}
                  placeholder="Share your interests (e.g. school science demonstration camps, telescope sessions, debunking miracles)..."
                  value={appReason}
                  onChange={(e) => setAppReason(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="onboarding-actions">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting application..." : "Submit Membership Application"}
              </Button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setMode("login")}
              >
                Cancel & Return
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="login-footer">
          <ShieldCheck size={14} className="security-icon" />
          <span>Zero-Knowledge Server Projection · Zero Plaintext Storage · DPDP Act 2023 Compliant</span>
        </div>
      </div>
    </div>
  );
}
