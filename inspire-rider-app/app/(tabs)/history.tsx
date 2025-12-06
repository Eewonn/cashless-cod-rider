import { StyleSheet, ActivityIndicator, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { Link, useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import client from '@/api/client';
import { useTheme } from '@/context/ThemeContext';

export default function HistoryScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const borderColor = theme === 'dark' ? '#333' : '#eee';

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
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title">Order History</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
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
                    <ThemedView style={[styles.card, { borderColor: borderColor }]}>
                      <View style={styles.cardHeader}>
                        <ThemedText type="defaultSemiBold">{item.order_no}</ThemedText>
                        <ThemedText style={{ color: '#4CAF50' }}>{item.status}</ThemedText>
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
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  content: {
    padding: 20,
  },
  list: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});
