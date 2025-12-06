import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, ActivityIndicator, Dimensions } from 'react-native';
import MapView, { Marker, UrlTile, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import client from '@/api/client';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setLoading(false);

      // Start watching position
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );
    })();

    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Mocking orders with location data for now since the API might not return it yet
      // In a real scenario: const response = await client.get('/orders');
      const mockOrders = [
        {
          id: '1',
          customer_name: 'John Doe',
          latitude: 14.5995,
          longitude: 120.9842, // Manila
          status: 'Pending',
          address: 'Manila City Hall'
        },
        {
          id: '2',
          customer_name: 'Jane Smith',
          latitude: 14.5547,
          longitude: 121.0244, // Makati
          status: 'Pending',
          address: 'Ayala Triangle'
        },
        {
          id: '3',
          customer_name: 'Bob Johnson',
          latitude: 14.6091,
          longitude: 121.0223, // Cubao
          status: 'Pending',
          address: 'Araneta Coliseum'
        }
      ];
      setOrders(mockOrders);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText>Locating...</ThemedText>
      </ThemedView>
    );
  }

  if (errorMsg) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>{errorMsg}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapType="none" // Hide default Google/Apple map to use OSM tiles
        initialRegion={{
          latitude: location?.coords.latitude || 14.5995,
          longitude: location?.coords.longitude || 120.9842,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* OpenStreetMap Tiles */}
        <UrlTile
          urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {/* Order Markers */}
        {orders.map((order) => (
          <Marker
            key={order.id}
            coordinate={{
              latitude: order.latitude,
              longitude: order.longitude,
            }}
            title={`Order #${order.id}`}
            description={order.address}
            pinColor="red"
          >
            <Callout>
              <View style={styles.callout}>
                <ThemedText type="defaultSemiBold">{order.customer_name}</ThemedText>
                <ThemedText style={{ fontSize: 12 }}>{order.address}</ThemedText>
                <ThemedText style={{ fontSize: 12, color: 'blue' }}>{order.status}</ThemedText>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      <View style={styles.overlay}>
        <ThemedText type="subtitle" style={styles.overlayText}>
          Live Tracking
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: width,
    height: height,
  },
  callout: {
    padding: 5,
    minWidth: 100,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overlayText: {
    color: '#000',
  }
});
