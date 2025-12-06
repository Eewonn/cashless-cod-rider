import { Image, StyleSheet, FlatList, ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import client from '@/api/client';

export default function HistoryScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    try {
      // Hardcoded rider_id for demo
      const response = await client.get('/orders?rider_id=a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      // Filter for completed orders locally for now (or add backend filter)
      const completedOrders = response.data.filter((o: any) => o.status === 'COMPLETED');
      setOrders(completedOrders);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Order History</ThemedText>
      </ThemedView>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <ThemedText>{error}</ThemedText>
      ) : orders.length === 0 ? (
        <ThemedText>No completed orders yet.</ThemedText>
      ) : (
        <View style={styles.list}>
          {orders.map((item: any) => (
            <Link key={item.id} href={`/orders/${item.id}`} asChild>
              <TouchableOpacity>
                <ThemedView style={styles.card}>
                  <View style={styles.cardHeader}>
                    <ThemedText type="defaultSemiBold">{item.order_no}</ThemedText>
                    <ThemedText style={{ color: 'green' }}>{item.status}</ThemedText>
                  </View>
                  <ThemedText>{item.customer_name}</ThemedText>
                  <ThemedText>{item.address}</ThemedText>
                  <ThemedText style={{ marginTop: 4 }}>₱{item.cod_amount}</ThemedText>
                  {item.pod_url && <ThemedText style={{ fontSize: 12, color: 'gray' }}>📷 POD Uploaded</ThemedText>}
                </ThemedView>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  list: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});
