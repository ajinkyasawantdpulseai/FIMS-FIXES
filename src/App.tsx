import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';
import { SignInForm } from './components/SignInForm';
import { FIMSDashboard } from './components/FIMSDashboard';
import { supabase, isSupabaseConfigured, supabaseConfigErrors } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      // Don't attempt any Supabase operations if not configured
      if (!isSupabaseConfigured || !supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking user:', error);
        // Handle invalid refresh token by clearing stale auth data
        if (error instanceof Error && error.message.includes('Invalid Refresh Token')) {
          try {
            // Clear any stale authentication tokens from local storage
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error signing out:', signOutError);
          }
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Only set up auth listener if Supabase is properly configured
    let subscription: any = null;
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      });
      subscription = authSubscription;
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleSignInSuccess = () => {
    // User state will be updated by the auth state listener
  };

  const handleSignOut = () => {
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Show configuration error if Supabase is not configured
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuration Required</h3>
              <p className="text-gray-600 mb-4">Supabase environment variables are missing or invalid.</p>
              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <p className="text-sm font-medium text-gray-700 mb-2">Required steps:</p>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Create a .env file in project root</li>
                  <li>2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
                  <li>3. Get values from Supabase dashboard</li>
                  <li>4. Restart the development server</li>
                </ol>
              </div>
              {supabaseConfigErrors.length > 0 && (
                <div className="mt-4 bg-red-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                  <ul className="text-xs text-red-700 space-y-1">
                    {supabaseConfigErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, show FIMS Dashboard directly
  if (user) {
    return <FIMSDashboard user={user} onSignOut={handleSignOut} />;
  }

  // Show FIMS-specific sign-in page with background image
  return (
<div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url("/website_background_collage.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%',
        height: '100vh'
      }}
    >
      {/* Overlay for better card visibility */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8">
          {/* FIMS Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-3 rounded-full shadow-lg">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
              FIMS
            </h1>
            <p className="text-gray-600 text-sm mb-2">
              {t('systems.fims.fullName')}
            </p>
            <p className="text-gray-500 text-xs">
              {t('systems.fims.description')}
            </p>
          </div>

          {/* Sign In Form */}
          <SignInForm onSignInSuccess={handleSignInSuccess} />

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              {/* {t('auth.secureAccess', 'Secure access to field inspection management system')} */}
              © 2025 ZP Chandrapur, Govt of Maharashtra. All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;