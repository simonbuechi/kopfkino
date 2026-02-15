import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

import icon from '../../assets/icon.png';

export const AuthPage = () => {
    const { user, signInWithGoogle, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">Loading...</div>;
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-4">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="flex flex-col items-center">
                    <img src={icon} alt="Kopfkino" className="w-20 h-20 mb-6 rounded-2xl shadow-xl" />
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-100 mb-2">Kopfkino</h1>
                    <p className="mt-2 text-zinc-500 text-sm">
                        learn more on <a href="https://github.com/simonbuechi/kopfkino" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors underline decoration-zinc-700 underline-offset-4">https://github.com/simonbuechi/kopfkino</a>
                    </p>
                </div>

                <div className="mt-8">
                    <button
                        onClick={signInWithGoogle}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-transparent text-base font-medium rounded-xl text-zinc-950 bg-zinc-100 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-zinc-100 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        Sign in with Google
                    </button>
                    <div className="text-xs text-zinc-600 mt-6">
                        Note: A popup will appear to sign in. Ensure popups are allowed.
                    </div>
                </div>
            </div>
        </div>
    );
};
