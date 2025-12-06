import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, View, Button, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    console.log('RegisterScreen mounted');
  }, []);

  const handleRegister = async () => {
    console.log('Register button pressed');
    
    if (!name || !email) {
      console.log('Validation failed: Name or email missing');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const userProfile = { name, email };
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
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>Register</ThemedText>
        <ThemedText style={styles.subtitle}>Create your rider account</ThemedText>

        <View style={styles.form}>
          <ThemedText style={styles.label}>Full Name</ThemedText>
          <TextInput
            style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor }]}
            placeholder="Enter your full name"
            placeholderTextColor={placeholderColor}
            value={name}
            onChangeText={(text) => {
              console.log('Name changed:', text);
              setName(text);
            }}
            autoCapitalize="words"
          />

          <ThemedText style={styles.label}>Email Address</ThemedText>
          <TextInput
            style={[styles.input, { borderColor: inputBorderColor, color: inputTextColor }]}
            placeholder="Enter your email"
            placeholderTextColor={placeholderColor}
            value={email}
            onChangeText={(text) => {
              console.log('Email changed:', text);
              setEmail(text);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={{ marginTop: 20 }}>
            <Button title="Register" onPress={handleRegister} />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
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
    gap: 20,
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
  button: {
    backgroundColor: '#0a7ea4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
