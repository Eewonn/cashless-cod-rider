import { StyleSheet, Image, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MapScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Live Map</ThemedText>
      <View style={styles.mapPlaceholder}>
        <ThemedText>Map View Mockup</ThemedText>
        <ThemedText style={styles.subtext}>Rider Location vs Customer Location</ThemedText>
        {/* In a real app, this would be <MapView /> */}
        <View style={styles.pinRider} />
        <View style={styles.pinCustomer} />
        <View style={styles.routeLine} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    marginBottom: 20,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e1e1e1',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  subtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  pinRider: {
    width: 20,
    height: 20,
    backgroundColor: 'blue',
    borderRadius: 10,
    position: 'absolute',
    bottom: '30%',
    left: '30%',
    borderWidth: 2,
    borderColor: 'white',
  },
  pinCustomer: {
    width: 20,
    height: 20,
    backgroundColor: 'red',
    borderRadius: 10,
    position: 'absolute',
    top: '30%',
    right: '30%',
    borderWidth: 2,
    borderColor: 'white',
  },
  routeLine: {
    position: 'absolute',
    width: 2,
    height: 200,
    backgroundColor: '#666',
    transform: [{ rotate: '45deg' }],
    zIndex: -1,
  }
});
