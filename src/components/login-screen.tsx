"use client";

import React, { useState } from "react";
import { identity } from "@/lib/identity";
import { Avatar, Badge, Button, Modal } from "@/components/ui";
import { Lock, ShieldCheck, KeyRound, ChevronRight, HelpCircle, Eye, EyeOff, UserCheck, Sparkles, AlertCircle } from "lucide-react";
import type { WorkspaceData, Profile, PerformAction } from "@/lib/types";
import { hapticTap, hapticSuccess, hapticWarning } from "@/lib/haptics";

interface LoginScreenProps {
  data: WorkspaceData;
  perform: PerformAction;
  onContinueAsGuest: () => void;
}

export function LoginScreen({ data, perform, onContinueAsGuest }: LoginScreenProps) {
  const [selectedId, setSelectedId] = useState<string>(data.profiles[0]?.id || "");
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Recovery state
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");

  const selectedMember = data.profiles.find((p) => p.id === selectedId) || data.profiles[0];

  const handleKeyPress = (num: string) => {
    hapticTap(8);
    if (pin.length < 6) {
      const next = pin + num;
      setPin(next);
      setError("");
      if (next.length === 4) {
        // Auto-submit after 4 digits for fast thumb entry
        void submitLogin(next);
      }
    }
  };

  const handleDelete = () => {
    hapticTap(12);
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    hapticTap(15);
    setPin("");
    setError("");
  };

  const submitLogin = async (pinToTry?: string) => {
    const attemptPin = pinToTry || pin;
    if (!attemptPin) {
      setError("Please enter your 4-digit PIN.");
      hapticWarning();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await perform("login", { memberId: selectedMember.id, pin: attemptPin });
      if (!res) {
        setError("Incorrect PIN. Check with Secretary Arunabha Ghosh or reset below.");
        hapticWarning();
        setPin("");
      } else {
        hapticSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid PIN. Check with Secretary Arunabha Ghosh.");
      hapticWarning();
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail || !recoveryEmail.includes("@")) {
      setRecoveryError("Please enter a valid Gmail address.");
      return;
    }
    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      setRecoveryError("PIN must be 4 to 6 numbers.");
      return;
    }
    if (newPin !== confirmPin) {
      setRecoveryError("PINs do not match.");
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError("");
    setRecoverySuccess("");

    try {
      const res = await perform("resetPinWithGoogle", {
        memberId: selectedMember.id,
        googleEmail: recoveryEmail.trim().toLowerCase(),
        newPin: newPin.trim(),
      });
      if (res) {
        setRecoverySuccess("Identity verified! PIN reset and logged in.");
        setTimeout(() => setShowRecoveryModal(false), 1200);
      } else {
        setRecoveryError(`Recovery email didn't match the linked Google account for ${selectedMember.fullName}. Ask unit secretary Arunabha Ghosh to reset your PIN.`);
      }
    } catch (err) {
      setRecoveryError(err instanceof Error ? err.message : "Failed to reset PIN with Google.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="login-screen-wrap">
      <div className="login-card">
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

        {/* Member Chooser */}
        <div className="login-body">
          <label className="login-label">
            <span>Select Unit Member</span>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setPin("");
                setError("");
              }}
              className="login-select"
            >
              {data.profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.role === "admin" ? "Secretary / Executive" : p.role})
                </option>
              ))}
            </select>
          </label>

          {/* Member Card Preview */}
          <div className="login-member-badge">
            <Avatar person={selectedMember} size="normal" />
            <div className="login-member-info">
              <strong>{selectedMember.fullName}</strong>
              <span>
                {selectedMember.role === "admin"
                  ? "Unit Executive / Secretary"
                  : selectedMember.role.charAt(0).toUpperCase() + selectedMember.role.slice(1)}{" "}
                · {identity.city}
              </span>
            </div>
            <Badge tone="green">
              {selectedMember.hasGoogleLinked ? "Google Linked" : "Member"}
            </Badge>
          </div>

          {/* 4-Digit PIN Display */}
          <div className="login-pin-section">
            <span className="login-pin-title">Enter 4-Digit Security PIN</span>
            <div className="login-pin-dots">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`login-pin-dot ${idx < pin.length ? "filled" : ""} ${error ? "error-dot" : ""}`}
                />
              ))}
            </div>

            {/* Hidden Input for Keyboard Typing */}
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPin(val);
                setError("");
                if (val.length === 4) void submitLogin(val);
              }}
              className="login-hidden-input"
              autoFocus
              placeholder="Type PIN..."
            />

            {error ? (
              <div className="login-error-msg">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            ) : (
              <div className="login-hint-msg">
                <KeyRound size={13} />
                <span>
                  {selectedMember.role === "admin"
                    ? <>Executive initial PIN is <strong>2401</strong></>
                    : <>Enter assigned unique PIN (phone members: last 4 digits)</>}
                </span>
              </div>
            )}
          </div>

          {/* On-Screen Touch Numpad */}
          <div className="login-keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                disabled={loading}
                className="keypad-btn"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              disabled={loading || pin.length === 0}
              className="keypad-btn keypad-util"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              disabled={loading}
              className="keypad-btn"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || pin.length === 0}
              className="keypad-btn keypad-util"
            >
              ⌫
            </button>
          </div>

          {/* Unlock Submit Button */}
          <Button
            variant="primary"
            onClick={() => void submitLogin()}
            disabled={loading || pin.length === 0}
            className="login-unlock-btn"
          >
            {loading ? "Unlocking Workspace…" : <><Lock size={16} /> Unlock Unit Workspace</>}
          </Button>

          {/* Recovery & Public Visitor links */}
          <div className="login-footer-actions">
            <button
              type="button"
              onClick={() => {
                setRecoveryError("");
                setRecoverySuccess("");
                setNewPin("");
                setConfirmPin("");
                setShowRecoveryModal(true);
              }}
              className="login-link-btn"
            >
              <ShieldCheck size={14} /> Forgot PIN? Reset with Google Account
            </button>

            <button
              type="button"
              onClick={onContinueAsGuest}
              className="login-guest-btn"
            >
              Public Visitor? View Notices & Science Calendar <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Google PIN Recovery Modal */}
      {showRecoveryModal && (
        <Modal
          title="Reset PIN with Google Account"
          subtitle={`Security recovery for ${selectedMember.fullName}`}
          onClose={() => setShowRecoveryModal(false)}
        >
          <form onSubmit={handleGoogleRecovery} className="recovery-form">
            <div className="recovery-explainer">
              <ShieldCheck size={20} className="shield-icon" />
              <p>
                Enter the verified <strong>Google (Gmail) address</strong> linked to your member profile to authorize setting a new 4-digit PIN.
              </p>
            </div>

            <label className="form-field">
              <span>Your Linked Google Email</span>
              <input
                type="email"
                required
                placeholder="e.g. yourname@gmail.com"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
              />
              <small>Must match the recovery account saved in your profile.</small>
            </label>

            <div className="recovery-pin-grid">
              <label className="form-field">
                <span>New 4-Digit PIN</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                />
              </label>

              <label className="form-field">
                <span>Confirm PIN</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                />
              </label>
            </div>

            {recoveryError && (
              <div className="login-error-msg">
                <AlertCircle size={15} />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccess && (
              <div className="login-success-msg">
                <ShieldCheck size={15} />
                <span>{recoverySuccess}</span>
              </div>
            )}

            <div className="recovery-help-box">
              <HelpCircle size={15} />
              <p>
                Haven't linked a Google account yet? Ask Unit Secretary <strong>Arunabha Ghosh</strong> to view or issue your unique PIN.
              </p>
            </div>

            <div className="form-actions">
              <Button variant="secondary" onClick={() => setShowRecoveryModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={recoveryLoading}>
                {recoveryLoading ? "Verifying..." : "Verify & Set New PIN"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
