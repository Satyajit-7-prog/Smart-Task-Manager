import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, Sparkles, Key, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPassword({ onNavigate }) {
  const { sendResetOtp, verifyResetOtp, confirmPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Flow steps: 'info' -> 'otp' -> 'password' -> 'success'
  const [step, setStep] = useState('info');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [successCountdown, setSuccessCountdown] = useState(5);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    let timer;
    if (step === 'success' && successCountdown > 0) {
      timer = setTimeout(() => setSuccessCountdown(successCountdown - 1), 1000);
    } else if (step === 'success' && successCountdown === 0) {
      onNavigate('login');
    }
    return () => clearTimeout(timer);
  }, [step, successCountdown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await sendResetOtp(email);
      setStep('otp');
      setCountdown(30);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP code. Make sure this email is registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await sendResetOtp(email);
      setCountdown(30);
      setOtp('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit verification code.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await verifyResetOtp(email, otp);
      setStep('password');
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMsg('Please fill in both password fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await confirmPasswordReset(email, password);
      setStep('success');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    if (step === 'info') return handleSendOtp(e);
    if (step === 'otp') return handleVerifyOtp(e);
    return handleResetPassword(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-3xl ai-glow-ring relative">
        {step !== 'success' && (
          <button
            onClick={() => onNavigate('login')}
            className="absolute top-8 left-8 text-slate-400 hover:text-slate-200 flex items-center space-x-1 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}

        <div className="flex flex-col items-center mb-8 mt-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/15 mb-4">
            <Sparkles className="w-7 h-7 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent text-center">
            {step === 'info' && 'Forgot Password?'}
            {step === 'otp' && 'Verify Code'}
            {step === 'password' && 'Reset Password'}
            {step === 'success' && 'Reset Successful'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm text-center">
            {step === 'info' && 'Recover your AI task scheduler account'}
            {step === 'otp' && 'Enter the reset code sent to your email'}
            {step === 'password' && 'Enter your new secure account password'}
            {step === 'success' && 'You can now sign in with your new password'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {errorMsg}
          </div>
        )}

        {step === 'success' ? (
          <div className="flex flex-col items-center justify-center space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/15 animate-bounce">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Password Reset Complete!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                The password for <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span> has been updated successfully.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Redirecting to login in <span className="font-bold text-cyan-500">{successCountdown}s</span>...
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="glass-button-primary w-full flex items-center justify-center mt-6"
            >
              Log In Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {step === 'info' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400 pointer-events-none">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      autoComplete="username"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input w-full pl-11"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="glass-button-primary w-full flex items-center justify-center space-x-2 mt-4"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span>Send Reset Code</span>
                  )}
                </button>
              </>
            )}

            {step === 'otp' && (
              <>
                <div className="text-center p-4 bg-slate-500/5 rounded-2xl border border-slate-500/10 mb-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Reset code sent to</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{email}</p>
                  <button
                    type="button"
                    onClick={() => setStep('info')}
                    className="text-xs text-cyan-500 hover:text-cyan-400 mt-2 underline block mx-auto transition-colors"
                  >
                    Change email / edit details
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Verification Code
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400 pointer-events-none">
                      <Key className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="glass-input w-full pl-11 text-center font-bold text-lg tracking-[0.5em]"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs mt-2 px-1">
                  <span className="text-slate-500">Didn't receive code?</span>
                  {countdown > 0 ? (
                    <span className="text-slate-400 dark:text-slate-500 font-medium">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-cyan-500 hover:text-cyan-400 font-semibold transition-colors"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="glass-button-primary w-full flex items-center justify-center space-x-2 mt-6"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>
              </>
            )}

            {step === 'password' && (
              <>
                <input type="hidden" name="email" value={email} autoComplete="username" />
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400 pointer-events-none">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="new-password"
                      placeholder="•••••••• (min 6 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input w-full pl-11 pr-10"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400 pointer-events-none">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirm-password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="glass-input w-full pl-11"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="glass-button-primary w-full flex items-center justify-center space-x-2 mt-6"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
