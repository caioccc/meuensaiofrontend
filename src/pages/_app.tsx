import '@/i18n';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/carousel/styles.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import type { AppProps } from 'next/app';
import { Notifications } from '@mantine/notifications';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
        <MantineProvider>
          <Notifications />
          <AuthProvider>
            <ProtectedRoute>
              <Component {...pageProps} />
            </ProtectedRoute>
          </AuthProvider>
        </MantineProvider>
      </GoogleOAuthProvider>
    </I18nextProvider>
  );
}
