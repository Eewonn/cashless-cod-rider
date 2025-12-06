import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, View, Button, Platform, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    console.log('RegisterScreen mounted');
  }, []);

  const handleRegister = async () => {
    console.log('Register button pressed');
    
    if (!name || !email || !password) {
      console.log('Validation failed: Fields missing');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const userProfile = { name, email }; // Not saving password for security in demo
      console.log('Saving user profile:', userProfile);
      await AsyncStorage.setItem('user_profile', JSON.stringify(userProfile));
      console.log('User profile saved successfully');
      
      if (Platform.OS === 'web') {
        window.alert('Registration successful!');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Success', 'Registration successful!', [
          { text: 'OK', onPress: () => {
            console.log('Navigating to home screen');
            router.replace('/(tabs)');
          }}
        ]);
      }
    } catch (error) {
      console.error('Failed to save user profile:', error);
      Alert.alert('Error', 'Failed to register. Please try again.');
    }
  };

  const inputBorderColor = theme === 'dark' ? '#555' : '#ccc';
  const inputTextColor = theme === 'dark' ? '#fff' : '#000';
  const placeholderColor = theme === 'dark' ? '#aaa' : '#888';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={{ alignItems: 'center' }}>
            <Image 
              source={require('../assets/images/motor.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <ThemedText type="title" style={styles.title}>Register</ThemedText>
          <ThemedText style={styles.subtitle}>Create your rider account</ThemedText>

          <View style={styles.form}>
            <ThemedText style={styles.label}>Full Name</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor }]}
              placeholder="Enter your full name"
              placeholderTextColor={placeholderColor}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <ThemedText style={styles.label}>Email Address</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor }]}
              placeholder="Enter your email"
              placeholderTextColor={placeholderColor}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor }]}
              placeholder="Enter your password"
              placeholderTextColor={placeholderColor}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <View style={{ marginTop: 20 }}>
              <Button title="Register" onPress={handleRegister} />
            </View>
            
            <TouchableOpacity onPress={() => router.push('/login')} style={{ marginTop: 15, alignItems: 'center' }}>
              <ThemedText style={{ color: '#0a7ea4' }}>Already have an account? Login</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <ThemedText style={styles.tagline}>Scan. Pay. Deliver.</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.7,
  },
  form: {
    gap: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  tagline: {
    fontSize: 18,
    fontWeight: 'bold',
    opacity: 0.8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#FF3B30',
  }
});
