import { useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, View, Button, ScrollView, Image, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import client from '@/api/client';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await client.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setProcessing(true);
    try {
      await client.patch(`/orders/${id}/status`, { status: newStatus });
      fetchOrder(); // Refresh data
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const generateQR = async () => {
    setProcessing(true);
    try {
      const response = await client.post('/payment/qr', {
        order_id: id,
        amount: order.cod_amount,
      });
      setQrData(response.data);
      // Automatically update status to PAYMENT if not already
      if (order.status !== 'PAYMENT') {
        updateStatus('PAYMENT');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to generate QR');
    } finally {
      setProcessing(false);
    }
  };

  const mockConfirmPayment = async () => {
    if (!qrData?.qr_id) return;
    setProcessing(true);
    try {
      await client.post('/payment/mock-confirm', { qr_id: qrData.qr_id });
      Alert.alert('Success', 'Payment Confirmed!');
      setQrData(null);
      fetchOrder();
    } catch (err) {
      Alert.alert('Error', 'Payment confirmation failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Order not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `Order ${order.order_no}` }} />
      <ScrollView contentContainerStyle={styles.content}>
        
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Customer Details</ThemedText>
          <ThemedText>{order.customer_name}</ThemedText>
          <ThemedText>{order.phone}</ThemedText>
          <ThemedText>{order.address}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Order Info</ThemedText>
          <ThemedText type="defaultSemiBold">Amount: ₱{order.cod_amount}</ThemedText>
          <ThemedText>Status: {order.status}</ThemedText>
          <ThemedText>Payment: {order.payment_status}</ThemedText>
        </ThemedView>

        {/* Status Actions */}
        <ThemedView style={styles.actions}>
          {order.status === 'PENDING' && (
            <Button 
              title="Pick Up Order" 
              onPress={() => updateStatus('EN_ROUTE')} 
              disabled={processing} 
            />
          )}

          {order.status === 'EN_ROUTE' && (
            <Button 
              title="Arrived at Location" 
              onPress={() => updateStatus('ARRIVED')} 
              disabled={processing} 
            />
          )}

          {order.status === 'ARRIVED' && (
            <View style={{ gap: 10 }}>
              <Button 
                title="Pay with QR" 
                onPress={generateQR} 
                disabled={processing} 
              />
              <Button 
                title="Pay with Cash" 
                onPress={() => updateStatus('COMPLETED')} 
                color="green"
                disabled={processing} 
              />
            </View>
          )}

          {/* QR Display */}
          {qrData && (order.status === 'PAYMENT' || order.status === 'ARRIVED') && (
            <View style={styles.qrContainer}>
              <ThemedText type="subtitle">Scan to Pay</ThemedText>
              <Image 
                source={{ uri: qrData.qr }} 
                style={{ width: 200, height: 200, marginVertical: 10 }} 
              />
              <ThemedText>Expires at: {new Date(qrData.expires_at).toLocaleTimeString()}</ThemedText>
              
              <View style={{ marginTop: 20 }}>
                <Button 
                  title="(Dev) Mock Confirm Payment" 
                  onPress={mockConfirmPayment} 
                  color="orange"
                  disabled={processing}
                />
              </View>
            </View>
          )}

          {order.status === 'COMPLETED' && (
             <ThemedText style={{ color: 'green', textAlign: 'center', marginTop: 20 }}>
               Order Completed ✅
             </ThemedText>
          )}
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    gap: 4,
  },
  actions: {
    marginTop: 20,
    gap: 10,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 20,
  }
});
