import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

import icon from '../../assets/icon.webp';

type Mode = 'login' | 'register';

export const AuthPage = () => {
    const { user, signInWithGoogle, signInWithEmail, registerWithEmail, loading } = useAuth();
    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-primary-950 text-primary-100">Loading...</div>;
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (mode === 'register' && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setSubmitting(true);
        try {
            if (mode === 'login') {
                await signInWithEmail(email, password);
            } else {
                await registerWithEmail(email, password);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Authentication failed.';
            setError(msg.replace('Firebase: ', '').replace(/ \(auth\/.*?\)\.?/, ''));
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogle = async () => {
        setError('');
        try {
            await signInWithGoogle();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
            setError(msg);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-primary-950 text-primary-100 p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="flex flex-col items-center text-center">
                    <img src={icon} alt="Kopfkino" className="w-20 h-20 mb-6 rounded-2xl shadow-xl" />
                    <h1 className="text-4xl font-bold tracking-tight text-primary-100 mb-2">Kopfkino</h1>
                    <p className="mt-2 text-primary-500 text-sm">
                        learn more on{' '}
                        <a
                            href="https://github.com/simonbuechi/kopfkino"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary-300 transition-colors underline decoration-primary-700 underline-offset-4"
                        >
                            https://github.com/simonbuechi/kopfkino
                        </a>
                    </p>
                </div>

                <div className="flex rounded-xl overflow-hidden border border-primary-800">
                    <button
                        onClick={() => { setMode('login'); setError(''); }}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-primary-100 text-primary-950' : 'bg-primary-900 text-primary-400 hover:text-primary-200'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setMode('register'); setError(''); }}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'register' ? 'bg-primary-100 text-primary-950' : 'bg-primary-900 text-primary-400 hover:text-primary-200'}`}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-primary-400 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-primary-900 border border-primary-700 text-primary-100 placeholder-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-primary-400 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-primary-900 border border-primary-700 text-primary-100 placeholder-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                    {mode === 'register' && (
                        <div>
                            <label className="block text-xs text-primary-400 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-primary-900 border border-primary-700 text-primary-100 placeholder-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    {error && (
                        <p className="text-red-400 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full px-6 py-3 rounded-xl text-base font-medium text-primary-950 bg-primary-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-900 focus:ring-primary-100 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    >
                        {submitting ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-primary-800" />
                    <span className="text-xs text-primary-600">or</span>
                    <div className="flex-1 h-px bg-primary-800" />
                </div>

                <button
                    onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-primary-700 text-base font-medium rounded-xl text-primary-100 bg-primary-900 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-900 focus:ring-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    Continue with Google
                </button>
            </div>
        </div>
    );
};
