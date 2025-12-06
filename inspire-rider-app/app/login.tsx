import React, { useState } from 'react';
import { StyleSheet, Button, View, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const redirectUri = makeRedirectUri({
        scheme: 'inspireriderapp',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        
        if (result.type === 'success' && result.url) {
           // Supabase handles the session automatically via the URL listener in lib/supabase.ts
           // However, we might need to manually parse the URL if auto-detection fails or if we want to be explicit.
           // For now, let's rely on the deep link handling.
           
           // Actually, we need to extract the access_token and refresh_token from the URL hash
           // and set the session manually if the auto-detection doesn't pick it up immediately.
           const { url } = result;
           const params = new URLSearchParams(url.split('#')[1]);
           const access_token = params.get('access_token');
           const refresh_token = params.get('refresh_token');

           if (access_token && refresh_token) {
             await supabase.auth.setSession({
               access_token,
               refresh_token,
             });
           }
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Welcome Rider</ThemedText>
      <ThemedText style={styles.subtitle}>Sign in to start delivering</ThemedText>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Sign in with Google" 
          onPress={signInWithGoogle} 
          disabled={loading} 
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 10,
  },
  subtitle: {
    marginBottom: 40,
    opacity: 0.7,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
});
