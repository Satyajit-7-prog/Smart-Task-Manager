import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, Sparkles, Key, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function Register({ onNavigate }) {
  const { register, verifyOtp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // OTP flow states: 'info' -> 'otp' -> 'password' -> 'success'
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
    if (!fullName || !email) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await api.post('/auth/register/send-otp', { email });
      setStep('otp');
      setCountdown(30);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await api.post('/auth/register/send-otp', { email });
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
      await verifyOtp(email, otp);
      setStep('password');
    } catch (err) {
      setErrorMsg(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await register(email, password, fullName);
      setStep('success');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Switch form submit handlers based on steps
  const handleFormSubmit = (e) => {
    if (step === 'info') return handleSendOtp(e);
    if (step === 'otp') return handleVerifyOtp(e);
    return handleRegister(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none animate-float-purple"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none animate-float-cyan"></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-3xl ai-glow-ring relative animate-auth-entrance">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/15 mb-4">
            <Sparkles className="w-7 h-7 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent text-center">
            {step === 'info' && 'Create Account'}
            {step === 'otp' && 'Verify Email'}
            {step === 'password' && 'Set Password'}
            {step === 'success' && 'Ready to Log In'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm text-center">
            {step === 'info' && 'Register to experience smart, automated scheduling'}
            {step === 'otp' && 'Enter the verification code sent to your email'}
            {step === 'password' && 'Choose a secure password to complete your signup'}
            {step === 'success' && 'Your account registration was successful'}
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
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Registration Complete!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                Your account for <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span> has been created.
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
              Sign In Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {step === 'info' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 dark:text-slate-400 pointer-events-none">
                      <User className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="glass-input w-full pl-11"
                      required
                    />
                  </div>
                </div>

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
                    <span>Send Verification Code</span>
                  )}
                </button>
              </>
            )}

            {step === 'otp' && (
              <>
                <div className="text-center p-4 bg-slate-500/5 rounded-2xl border border-slate-500/10 mb-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Verification code sent to</p>
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
                    <span>Verify Email</span>
                  )}
                </button>
              </>
            )}

            {step === 'password' && (
              <>
                <input type="hidden" name="email" value={email} autoComplete="username" />
                <div className="text-center p-4 bg-slate-500/5 rounded-2xl border border-slate-500/10 mb-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Email Address Verified</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{email}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Password
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

                <button
                  type="submit"
                  disabled={loading}
                  className="glass-button-primary w-full flex items-center justify-center space-x-2 mt-6"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span>Complete Account Registration</span>
                  )}
                </button>
              </>
            )}
          </form>
        )}

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 font-semibold underline underline-offset-4 hover:underline transition-colors"
          >
            Log in instead
          </button>
        </div>
      </div>
    </div>
  );
}
