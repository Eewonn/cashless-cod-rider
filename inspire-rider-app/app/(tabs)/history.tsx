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
  const [stats, setStats] = useState({
    count: 0,
    total: 0,
    cash: 0,
    qr: 0
  });
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
      // Filter for completed orders
      const completedOrders = response.data.filter((o: any) => o.status === 'COMPLETED');
      
      // Calculate Daily Stats (Today)
      const today = new Date().toDateString();
      const todayOrders = completedOrders.filter((o: any) => {
        const date = o.completed_at ? new Date(o.completed_at) : new Date(o.created_at); // Fallback to created_at if completed_at missing
        return date.toDateString() === today;
      });

      const newStats = todayOrders.reduce((acc: any, order: any) => {
        const amount = parseFloat(order.cod_amount || 0);
        acc.count += 1;
        acc.total += amount;
        
        if (order.payment_method === 'QRPH') {
          acc.qr += amount;
        } else {
          acc.cash += amount;
        }
        return acc;
      }, { count: 0, total: 0, cash: 0, qr: 0 });

      setStats(newStats);
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
          <ThemedText type="title">Dashboard</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : error ? (
            <ThemedText>{error}</ThemedText>
          ) : (
            <>
              {/* Daily Summary Card */}
              <ThemedView style={[styles.summaryCard, { borderColor: borderColor }]}>
                <ThemedText type="subtitle" style={{ marginBottom: 15 }}>Daily Summary ({new Date().toLocaleDateString()})</ThemedText>
                
                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statLabel}>Completed</ThemedText>
                    <ThemedText type="title" style={styles.statValue}>{stats.count}</ThemedText>
                  </View>
                  <View style={styles.statItem}>
                    <ThemedText style={styles.statLabel}>Total Collected</ThemedText>
                    <ThemedText type="title" style={{ ...styles.statValue, color: '#4CAF50' }}>₱{stats.total.toFixed(2)}</ThemedText>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownItem}>
                    <ThemedText style={styles.statLabel}>Cash</ThemedText>
                    <ThemedText type="defaultSemiBold">₱{stats.cash.toFixed(2)}</ThemedText>
                  </View>
                  <View style={styles.breakdownItem}>
                    <ThemedText style={styles.statLabel}>QRPH</ThemedText>
                    <ThemedText type="defaultSemiBold" style={{ color: '#007AFF' }}>₱{stats.qr.toFixed(2)}</ThemedText>
                  </View>
                </View>
              </ThemedView>

              <ThemedText type="subtitle" style={{ marginTop: 20, marginBottom: 10 }}>Recent Activity</ThemedText>

              {orders.length === 0 ? (
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
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                            <ThemedText>₱{item.cod_amount}</ThemedText>
                            <ThemedText style={{ fontSize: 12, color: item.payment_method === 'QRPH' ? '#007AFF' : 'gray' }}>
                              {item.payment_method === 'QRPH' ? 'QRPH' : 'Cash'}
                            </ThemedText>
                          </View>
                        </ThemedView>
                      </TouchableOpacity>
                    </Link>
                  ))}
                </View>
              )}
            </>
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
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    opacity: 0.3,
    marginVertical: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  breakdownItem: {
    alignItems: 'center',
  }
});
