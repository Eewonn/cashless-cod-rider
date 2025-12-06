import { useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, View, Button, ScrollView, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import client from '@/api/client';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [podImage, setPodImage] = useState<string | null>(null);

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

  const updateStatus = async (newStatus: string, podUrl?: string) => {
    setProcessing(true);
    try {
      await client.patch(`/orders/${id}/status`, { 
        status: newStatus,
        pod_url: podUrl 
      });
      fetchOrder(); // Refresh data
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPodImage(result.assets[0].uri);
    }
  };

  const uploadAndComplete = async () => {
    if (!podImage) {
      Alert.alert('Error', 'Please take a photo first');
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: podImage,
        name: 'pod.jpg',
        type: 'image/jpeg',
      } as any);

      const uploadResponse = await client.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const podUrl = uploadResponse.data.url;
      await updateStatus('COMPLETED', podUrl);
      Alert.alert('Success', 'Order completed with Proof of Delivery!');
      setPodImage(null);

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to upload photo');
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
          {order.pod_url && (
            <View style={{ marginTop: 10 }}>
              <ThemedText type="defaultSemiBold">Proof of Delivery:</ThemedText>
              <Image source={{ uri: order.pod_url }} style={{ width: '100%', height: 200, borderRadius: 8, marginTop: 5 }} />
            </View>
          )}
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
              
              <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 10 }} />
              
              <ThemedText type="subtitle">Cash Payment (POD)</ThemedText>
              
              {!podImage ? (
                <Button 
                  title="Take Photo (POD)" 
                  onPress={takePhoto} 
                  disabled={processing} 
                />
              ) : (
                <View>
                  <Image source={{ uri: podImage }} style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 10 }} />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button 
                      title="Retake" 
                      onPress={takePhoto} 
                      color="gray"
                      disabled={processing} 
                    />
                    <Button 
                      title="Complete Order" 
                      onPress={uploadAndComplete} 
                      color="green"
                      disabled={processing} 
                    />
                  </View>
                </View>
              )}
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
