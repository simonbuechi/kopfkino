import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const AuthPage = () => {
    const { user, signInWithGoogle, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-indigo-500 mb-2">Kopfkino</h1>
                    <h2 className="text-2xl font-semibold">Sign in to your account</h2>
                    <p className="mt-2 text-gray-400">Manage your locations, scenes, and shots across devices.</p>
                </div>

                <button
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                    Sign in with Google
                </button>
                <div className="text-xs text-gray-500 mt-4">
                    Note: A popup will appear to sign in. Ensure popups are allowed.
                </div>
            </div>
        </div>
    );
};
