import React, { useState } from 'react';
import { StyleSheet, Button, View, Alert, TouchableOpacity, TextInput, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { theme } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    
    // For demo purposes, we just set the session
    await AsyncStorage.setItem('user_profile', JSON.stringify({ email }));
    router.replace('/(tabs)');
  };

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
           const { url } = result;
           const params = new URLSearchParams(url.split('#')[1]);
           const access_token = params.get('access_token');
           const refresh_token = params.get('refresh_token');

           if (access_token && refresh_token) {
             await supabase.auth.setSession({
               access_token,
               refresh_token,
             });
             // Also set AsyncStorage for our simple auth check
             await AsyncStorage.setItem('user_profile', JSON.stringify({ email: 'google_user' }));
             router.replace('/(tabs)');
           }
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputBorderColor = theme === 'dark' ? '#555' : '#ccc';
  const inputTextColor = theme === 'dark' ? '#fff' : '#000';
  const placeholderColor = theme === 'dark' ? '#aaa' : '#888';

  return (
    <ThemedView style={styles.container}>
      <Image 
        source={require('../assets/images/motor.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <ThemedText type="title" style={styles.title}>Welcome Rider</ThemedText>
      <ThemedText style={{ marginBottom: 20, color: '#FF3B30', fontSize: 24, fontWeight: 'bold' }}>Scan. Pay. Deliver.</ThemedText>
      <ThemedText style={styles.subtitle}>Sign In</ThemedText>
      
      <View style={styles.form}>
        <TextInput
          style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor }]}
          placeholder="Email"
          placeholderTextColor={placeholderColor}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor }]}
          placeholder="Password"
          placeholderTextColor={placeholderColor}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Login" onPress={handleLogin} />
      </View>

      <View style={styles.divider}>
        <ThemedText>or</ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="Sign in with Google" 
          onPress={signInWithGoogle} 
          disabled={loading} 
        />
      </View>

      <TouchableOpacity onPress={() => router.push('/register')} style={{ marginTop: 20 }}>
        <ThemedText style={{ color: '#0a7ea4' }}>Don't have an account? Register</ThemedText>
      </TouchableOpacity>
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
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    marginBottom: 10,
  },
  subtitle: {
    marginBottom: 40,
    opacity: 0.7,
  },
  form: {
    width: '100%',
    maxWidth: 300,
    gap: 15,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  divider: {
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
});
