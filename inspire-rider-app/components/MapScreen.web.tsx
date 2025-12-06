import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MapScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Live Map (Web)</ThemedText>
      <View style={styles.messageContainer}>
        <ThemedText>
          The native map module is not supported on the web. 
          Please use an Android or iOS emulator/device to view the OpenStreetMap integration.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
});
