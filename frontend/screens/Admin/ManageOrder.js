import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Picker } from 'react-native';
import API_KEY from './config'; // Import your API configuration

const ManageOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState('pending');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_KEY}/orders`);
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Delete an order
  const deleteOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_KEY}/orders/${orderId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Order deleted successfully');
        fetchOrders(); // Refresh the list
      } else {
        Alert.alert('Error', data.message || 'Failed to delete order');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Confirm before deleting
  const confirmDelete = (orderId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteOrder(orderId) },
      ]
    );
  };

  // Update order status
  const updateOrderStatus = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`${API_KEY}/orders/${selectedOrder._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          ...(trackingNumber && { trackingNumber }) 
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Order status updated successfully');
        setModalVisible(false);
        fetchOrders(); // Refresh the list
      } else {
        Alert.alert('Error', data.message || 'Failed to update order status');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Open modal with order details
  const openEditModal = (order) => {
    setSelectedOrder(order);
    setStatus(order.status);
    setTrackingNumber(order.trackingNumber || '');
    setModalVisible(true);
  };

  // Render each order item
  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <Text style={styles.orderId}>Order ID: {item._id}</Text>
      <Text>Status: {item.status.toUpperCase()}</Text>
      <Text>Total: ${item.totalAmount.toFixed(2)}</Text>
      <Text>Items: {item.items.length}</Text>
      <Text>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.editButton]} 
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.deleteButton]} 
          onPress={() => confirmDelete(item._id)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Orders</Text>
      
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        refreshing={refreshing}
        onRefresh={fetchOrders}
        contentContainerStyle={styles.listContainer}
      />
      
      {/* Edit Order Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            
            <Text style={styles.label}>Order ID: {selectedOrder?._id}</Text>
            <Text style={styles.label}>Current Status: {selectedOrder?.status}</Text>
            
            <Text style={styles.label}>New Status:</Text>
            <Picker
              selectedValue={status}
              style={styles.picker}
              onValueChange={(itemValue) => setStatus(itemValue)}
            >
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="Processing" value="processing" />
              <Picker.Item label="Shipped" value="shipped" />
              <Picker.Item label="Delivered" value="delivered" />
              <Picker.Item label="Cancelled" value="cancelled" />
            </Picker>
            
            <Text style={styles.label}>Tracking Number:</Text>
            <TextInput
              style={styles.input}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="Enter tracking number (optional)"
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.updateButton]} 
                onPress={updateOrderStatus}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  orderItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderId: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    padding: 12,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  updateButton: {
    backgroundColor: '#2ecc71',
  },
});

export default ManageOrder;