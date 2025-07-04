import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/carousel/styles.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import type { AppProps } from 'next/app';
import { Notifications } from '@mantine/notifications';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <MantineProvider withGlobalStyles withNormalizeCSS>
        <Notifications />
        <AuthProvider>
          <ProtectedRoute>
            <Component {...pageProps} />
          </ProtectedRoute>
        </AuthProvider>
      </MantineProvider>
    </GoogleOAuthProvider>
  );
}
