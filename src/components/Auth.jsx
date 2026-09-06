import React, { useState, useEffect, useCallback } from 'react';
import {
  WalletCards, AlertCircle, ArrowRight, ArrowLeft,
  KeyRound, Smartphone, Lock, CreditCard, Delete,
  UserPlus, LogIn, Shield, CheckCircle2, Eye, EyeOff,
  Check, RefreshCw, BadgeCheck, User, Phone, Mail,
  Building2, Hash, ChevronRight
} from 'lucide-react';

/* ═══════════════════════════════════
   UTILITY HOOKS
═══════════════════════════════════ */
function useField(initial = '') {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState('');
  const set = useCallback((v) => { setValue(v); setError(''); }, []);
  return { value, set, error, setError };
}

function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const run = useCallback(async (fn) => {
    setLoading(true); setError('');
    try { await fn(); }
    catch (e) { setError(e.message || 'Something went wrong'); }
    finally { setLoading(false); }
  }, []);
  return { loading, error, setError, run };
}

/* ═══════════════════════════════════
   REUSABLE UI COMPONENTS
═══════════════════════════════════ */

/* Step progress bar with labels */
function StepBar({ step }) {
  const steps = ['Your Details', 'Security PIN', 'Verify OTP'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: '24px' }}>
      {steps.map((label, i) => {
        const done    = i < step;
        const active  = i === step;
        const color   = done ? '#10b981' : active ? 'var(--primary)' : 'rgba(255,255,255,0.15)';
        const txtCol  = done ? '#10b981' : active ? 'var(--text-primary)' : 'var(--text-muted)';
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: done ? 'rgba(16,185,129,0.15)' : active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, fontWeight: 700, fontSize: '0.85rem',
                transition: 'all 0.35s ease'
              }}>
                {done ? <Check size={16} /> : i + 1}
              </div>
              <span style={{ fontSize: '0.68rem', color: txtCol, fontWeight: active ? 700 : 500, marginTop: '5px', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? '#10b981' : 'rgba(255,255,255,0.1)', marginTop: 16, transition: 'background 0.35s ease' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <div className="error-banner" role="alert" style={{ marginBottom: '12px' }}>
      <AlertCircle size={15} /><span>{msg}</span>
    </div>
  );
}

function FieldLabel({ icon: Icon, text }) {
  return (
    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
      {Icon && <Icon size={12} style={{ opacity: 0.55 }} />}{text}
    </label>
  );
}

function InlineError({ msg }) {
  if (!msg) return null;
  return <p style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '3px', fontWeight: 500 }}>{msg}</p>;
}

function PwInput({ field, placeholder = '••••••••', autoFocus = false }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        className="form-control"
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={field.value}
        onChange={(e) => field.set(e.target.value)}
        style={{ paddingRight: '40px' }}
      />
      <button
        type="button" onClick={() => setShow(s => !s)}
        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
        aria-label={show ? 'Hide' : 'Show'}
      >{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
    </div>
  );
}

function NumPad({ onComplete, onBack }) {
  const [pin, setPin] = useState('');
  const press = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) setTimeout(() => { onComplete(next); setPin(''); }, 140);
  };
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="upi-dots-wrapper" style={{ margin: '0 auto 6px' }}>
        {[0,1,2,3].map(i => <div key={i} className={`upi-dot ${pin.length > i ? 'active' : ''}`} style={{ borderColor: 'var(--primary)' }} />)}
      </div>
      <div className="upi-keypad" style={{ gap: '10px', margin: '18px auto' }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} type="button" className="upi-key-btn" onClick={() => press(String(n))} style={{ fontSize: '1.3rem' }}>{n}</button>
        ))}
        <button type="button" className="upi-key-btn" onClick={onBack} style={{ color: 'var(--text-muted)' }}><ArrowLeft size={16} /></button>
        <button type="button" className="upi-key-btn" onClick={() => press('0')} style={{ fontSize: '1.3rem' }}>0</button>
        <button type="button" className="upi-key-btn upi-key-delete" onClick={() => setPin(p => p.slice(0,-1))}><Delete size={20} /></button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   MAIN AUTH COMPONENT
═══════════════════════════════════ */
export default function Auth({ onLoginSuccess }) {
  /*
   * FLOW:
   *  reg-1 (form) → reg-2 (PIN) → reg-3 (OTP)
   *      → login (with success banner)
   *      → dashboard
   *
   *  Returning user: pin-lock → dashboard
   *  Existing user:  "Sign In" link → login → dashboard
   */
  const [view, setView] = useState('reg-1');
  const [savedUser, setSavedUser] = useState(null);
  const [regDone, setRegDone] = useState(false); // show success on login page

  /* Detect returning user */
  useEffect(() => {
    const raw = localStorage.getItem('gpay_saved_user');
    if (raw) {
      try { const u = JSON.parse(raw); setSavedUser(u); setView('pin-lock'); }
      catch (_) {}
    }
  }, []);

  /* Registration fields */
  const rName   = useField('');
  const rAge    = useField('');
  const rPhone  = useField('');
  const rEmail  = useField('');
  const rBank   = useField('');
  const rAcct   = useField('');
  const rPw     = useField('');
  const rPwConf = useField('');

  /* PIN / OTP */
  const [gpayPin, setGpayPin] = useState('');
  const [otp, setOtp]         = useState('');
  const otpVal = useField('');
  const regAsync = useAsync();
  const otpAsync = useAsync();

  /* Login fields */
  const lId = useField('');
  const lPw = useField('');
  const loginAsync = useAsync();

  /* ── helpers ── */
  const finishAuth = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('gpay_saved_user', JSON.stringify({ email: user.email, name: user.name }));
    onLoginSuccess(token, user);
  };

  const switchAccount = () => {
    localStorage.removeItem('gpay_saved_user');
    setSavedUser(null);
    setView('reg-1');
  };

  const resetReg = () => {
    rName.set(''); rAge.set(''); rPhone.set(''); rEmail.set('');
    rBank.set(''); rAcct.set(''); rPw.set(''); rPwConf.set('');
    setGpayPin(''); setOtp(''); otpVal.set('');
    regAsync.setError(''); otpAsync.setError('');
  };

  /* ── Step 1 validate → Step 2 ── */
  const handleStep1 = (e) => {
    e.preventDefault();
    let ok = true;
    if (!rName.value.trim())  { rName.setError('Full name is required');                ok = false; }
    if (!rAge.value || +rAge.value < 1 || +rAge.value > 120) { rAge.setError('Enter a valid age'); ok = false; }
    if (!rPhone.value.trim()) { rPhone.setError('Phone number is required');            ok = false; }
    if (!rBank.value.trim())  { rBank.setError('Bank name is required');                ok = false; }
    if (!rAcct.value.trim())  { rAcct.setError('Account number is required');           ok = false; }
    if (rPw.value.length < 4) { rPw.setError('Minimum 4 characters');                  ok = false; }
    if (rPwConf.value && rPw.value !== rPwConf.value) { rPwConf.setError('Passwords do not match'); ok = false; }
    if (ok) setView('reg-2');
  };

  /* ── Step 2: PIN chosen → Step 3 ── */
  const handlePinChosen = (pin) => {
    setGpayPin(pin);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtp(code);
    setView('reg-3');
  };

  /* ── Step 3: OTP verified → Create/Authenticate account → Dashboard ── */
  const handleOtp = (e) => {
    e.preventDefault();
    if (otpVal.value !== otp) { otpAsync.setError('Incorrect OTP. Please enter the code shown above.'); return; }
    otpAsync.run(async () => {
      const resolvedEmail = rEmail.value.trim() || `${rPhone.value.replace(/[^a-zA-Z0-9]/g,'').toLowerCase()}@finsphere.com`;
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resolvedEmail, password: rPw.value,
          name: rName.value.trim(), phone: rPhone.value.trim(),
          bankName: rBank.value.trim(), accountNumber: rAcct.value.trim(),
          gpayPin, age: parseInt(rAge.value),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      /* ✅ Registration/Authentication done → auto-login and go to Dashboard directly */
      finishAuth(data.token, data.user);
      resetReg();
    });
  };

  /* ── Login ── */
  const handleLogin = (e) => {
    e.preventDefault();
    if (!lId.value.trim()) { lId.setError('Phone or email is required'); return; }
    if (!lPw.value)        { lPw.setError('Password is required');       return; }
    loginAsync.run(async () => {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lId.value, password: lPw.value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Incorrect credentials. Please try again.');
      finishAuth(data.token, data.user);
    });
  };

  /* ── PIN lock (returning user) ── */
  const handlePinLogin = (pin) => {
    loginAsync.run(async () => {
      const res  = await fetch('/api/auth/login-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: savedUser?.email, gpayPin: pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Wrong PIN. Try again.');
      finishAuth(data.token, data.user);
    });
  };

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <div className="auth-container">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          STEP 1 — REGISTRATION FORM
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {view === 'reg-1' && (
        <div className="auth-card" style={{ maxWidth: '560px', padding: '36px 40px' }}>
          {/* Logo + Title */}
          <div className="auth-header" style={{ marginBottom: '8px' }}>
            <div className="auth-logo-icon"><WalletCards size={28} /></div>
            <h2>Create Your Account</h2>
            <p className="auth-subtitle">Fill in all details below — you'll set a PIN and verify your phone next</p>
          </div>

          <StepBar step={0} />
          <ErrorBanner msg={regAsync.error} />

          <form onSubmit={handleStep1} noValidate>

            {/* ── Section: Personal ── */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} /> Personal Details
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <FieldLabel icon={User} text="Full Name" />
                  <input type="text" className="form-control" placeholder="e.g. Alex Mercer" autoFocus value={rName.value} onChange={e => rName.set(e.target.value)} />
                  <InlineError msg={rName.error} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <FieldLabel text="Age" />
                  <input type="number" className="form-control" placeholder="25" min="1" max="120" value={rAge.value} onChange={e => rAge.set(e.target.value)} />
                  <InlineError msg={rAge.error} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <FieldLabel icon={Phone} text="Phone Number" />
                  <input type="tel" className="form-control" placeholder="+1 555-000-1234" value={rPhone.value} onChange={e => rPhone.set(e.target.value)} />
                  <InlineError msg={rPhone.error} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <FieldLabel icon={Mail} text="Email (Optional)" />
                  <input type="email" className="form-control" placeholder="you@email.com" value={rEmail.value} onChange={e => rEmail.set(e.target.value)} />
                </div>
              </div>
            </div>

            {/* ── Section: Bank ── */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1a73e8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={13} /> Bank Details
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <FieldLabel icon={Building2} text="Bank Name" />
                  <input type="text" className="form-control" placeholder="Chase / HDFC / SBI" value={rBank.value} onChange={e => rBank.set(e.target.value)} />
                  <InlineError msg={rBank.error} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <FieldLabel icon={Hash} text="Account No." />
                  <input type="text" className="form-control" placeholder="•••• 9876" value={rAcct.value} onChange={e => rAcct.set(e.target.value)} />
                  <InlineError msg={rAcct.error} />
                </div>
              </div>
            </div>

            {/* ── Section: Password ── */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px 18px', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#e52592', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={13} /> Set Login Password
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <FieldLabel icon={Lock} text="Password" />
                  <PwInput field={rPw} placeholder="Min. 4 characters" />
                  <InlineError msg={rPw.error} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <FieldLabel text="Confirm Password" />
                  <PwInput field={rPwConf} placeholder="Re-enter password" />
                  <InlineError msg={rPwConf.error} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-auth" style={{ fontSize: '1rem' }}>
              <span>Continue to PIN Setup</span>
              <ChevronRight size={20} />
            </button>
          </form>

        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          STEP 2 — CHOOSE GPay PIN
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {view === 'reg-2' && (
        <div className="auth-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '44px 32px' }}>
          <div className="auth-header" style={{ marginBottom: '14px' }}>
            <div className="auth-logo-icon" style={{ margin: '0 auto 10px' }}><Lock size={26} /></div>
            <h2>Set Security PIN</h2>
            <p className="auth-subtitle">This 4-digit PIN gives you quick access later. Keep it private.</p>
          </div>

          <StepBar step={1} />

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, margin: '8px 0 4px' }}>
            Tap digits to choose your PIN
          </p>
          <NumPad onComplete={handlePinChosen} onBack={() => setView('reg-1')} />

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Hello, <strong style={{ color: 'var(--text-secondary)' }}>{rName.value}</strong> — choose carefully!
          </p>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          STEP 3 — OTP VERIFICATION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {view === 'reg-3' && (
        <div className="auth-card" style={{ maxWidth: '460px' }}>
          <div className="auth-header" style={{ marginBottom: '8px' }}>
            <div className="auth-logo-icon" style={{ background: 'linear-gradient(135deg,#1a73e8,#4285f4)', margin: '0 auto 10px' }}>
              <Smartphone size={26} />
            </div>
            <h2>Verify Your Phone</h2>
            <p className="auth-subtitle">Last step! Enter the OTP sent to <strong>{rPhone.value}</strong></p>
          </div>

          <StepBar step={2} />

          {/* Simulated SMS */}
          <div style={{ background: 'linear-gradient(135deg,rgba(26,115,232,.12),rgba(99,102,241,.1))', border: '1px solid rgba(26,115,232,.2)', padding: '14px 16px', borderRadius: '14px', textAlign: 'center', marginBottom: '14px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4285f4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <KeyRound size={13} /> SMS Simulation · {rPhone.value}
            </p>
            <p style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '6px' }}>
              Your OTP: <strong style={{ letterSpacing: '6px', fontSize: '1.25rem', color: '#fff' }}>{otp}</strong>
            </p>
            <button type="button" onClick={() => { setOtp(String(Math.floor(100000 + Math.random() * 900000))); otpVal.set(''); otpAsync.setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={12} /> Resend OTP
            </button>
          </div>

          <ErrorBanner msg={otpAsync.error} />

          <form onSubmit={handleOtp} noValidate>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <FieldLabel icon={KeyRound} text="Enter 6-Digit OTP" />
              <input
                type="text" className="form-control"
                placeholder="— — — — — —"
                maxLength={6} autoFocus
                value={otpVal.value}
                onChange={e => otpVal.set(e.target.value.replace(/\D/g,''))}
                style={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '12px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-auth" disabled={otpAsync.loading}>
              <span>{otpAsync.loading ? 'Creating Account…' : 'Verify & Create Account'}</span>
              <CheckCircle2 size={18} />
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
            <button type="button" onClick={() => setView('reg-2')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500, fontSize: '0.82rem' }}>
              <ArrowLeft size={14} /> Change PIN
            </button>
          </div>
        </div>
      )}



      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          RETURNING USER — PIN LOCK
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {view === 'pin-lock' && (
        <div className="auth-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '48px 32px' }}>
          {/* Avatar */}
          <div style={{ width: 74, height: 74, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.9rem', fontWeight: 800, margin: '0 auto 14px', boxShadow: '0 10px 28px rgba(99,102,241,.4)' }}>
            {savedUser?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '3px' }}>{savedUser?.name || 'Welcome Back'}</h2>
          <p className="auth-subtitle" style={{ fontSize: '0.78rem', marginBottom: '14px' }}>{savedUser?.email}</p>

          <ErrorBanner msg={loginAsync.error} />

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, marginBottom: '4px' }}>Enter GPay Secure PIN</p>
          <NumPad onComplete={handlePinLogin} onBack={() => {}} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            <button type="button" onClick={switchAccount}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.83rem' }}>
              Switch / New Account
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
