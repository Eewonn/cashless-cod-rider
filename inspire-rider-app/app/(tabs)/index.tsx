import { Image, StyleSheet, FlatList, ActivityIndicator, View, Text, TouchableOpacity, Switch, SafeAreaView } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { Link, useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import client from '@/api/client';
import { useTheme } from '@/context/ThemeContext';

export default function HomeScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const borderColor = theme === 'dark' ? '#333' : '#eee';
  const secondaryTextColor = theme === 'dark' ? '#aaa' : '#666';

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
      // Auto-refresh every 5 seconds to check for status updates
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }, [])
  );

  const fetchOrders = async () => {
    try {
      // Hardcoded rider_id for demo
      const response = await client.get('/orders?rider_id=a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      
      // Filter out completed orders (they belong in History)
      const activeOrders = response.data.filter((order: any) => order.status !== 'COMPLETED');
      
      setOrders(activeOrders);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <View>
            <ThemedText type="title">Hi, Rider</ThemedText>
            <ThemedText style={{ fontSize: 14, color: secondaryTextColor }}>Ready to deliver?</ThemedText>
          </View>
          <View style={styles.themeToggle}>
            <ThemedText style={{ marginRight: 8, fontSize: 12 }}>{theme === 'dark' ? 'Dark' : 'Light'}</ThemedText>
            <Switch 
              value={theme === 'dark'} 
              onValueChange={toggleTheme}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={theme === 'dark' ? "#f5dd4b" : "#f4f3f4"}
            />
          </View>
        </View>

        <View style={styles.content}>
          <ThemedText type="subtitle" style={{ marginBottom: 10 }}>My Orders</ThemedText>

          {loading ? (
            <ActivityIndicator size="large" />
          ) : error ? (
            <ThemedText style={{ color: 'red' }}>{error}</ThemedText>
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }) => (
                <Link href={`/orders/${item.id}`} asChild>
                  <TouchableOpacity>
                    <ThemedView style={[styles.orderCard, { borderColor: borderColor, backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }]}>
                      <View style={styles.cardHeader}>
                        <ThemedText type="defaultSemiBold">{item.order_no}</ThemedText>
                        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                          <Text style={styles.badgeText}>{item.status}</Text>
                        </View>
                      </View>
                      <ThemedText>{item.customer_name}</ThemedText>
                      <ThemedText style={{ color: secondaryTextColor, fontSize: 12 }}>{item.address}</ThemedText>
                      <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <ThemedText type="defaultSemiBold">₱{item.cod_amount}</ThemedText>
                        <ThemedText style={{ fontSize: 12 }}>{item.payment_status}</ThemedText>
                      </View>
                    </ThemedView>
                  </TouchableOpacity>
                </Link>
              )}
              ListEmptyComponent={<ThemedText>No orders found.</ThemedText>}
            />
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED': return '#4CAF50'; // Green
    case 'PAYMENT': return '#2196F3'; // Blue
    case 'ARRIVED': return '#FF9800'; // Orange
    case 'EN_ROUTE': return '#FFC107'; // Amber
    default: return '#9E9E9E'; // Grey
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: 40, // Adjust for status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  subtitle: {
    fontSize: 14,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  orderCard: {
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
