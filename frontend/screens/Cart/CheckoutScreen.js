import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useRoute } from '@react-navigation/native';
import API_KEY from '../../config'; // Import the API_KEY from the config file


const TIMEOUT = 15000;
const getApiUrl = (endpoint) => `${API_KEY}${endpoint}`;

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { cartItems, subtotal, shipping, tax, total } = route.params;

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUserId = await SecureStore.getItemAsync('userId');
        if (!currentUserId) {
          Alert.alert("Login Required", "Please login to proceed to checkout");
          navigation.navigate("Login");
          return;
        }
        setUserId(currentUserId);
        
        const userData = await SecureStore.getItemAsync(`user_${currentUserId}`);
        if (userData) {
          const parsedData = JSON.parse(userData);
          if (parsedData.address) {
            setShippingAddress(parsedData.address);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, [navigation]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!shippingAddress.trim()) {
      newErrors.shippingAddress = "Shipping address is required";
    }
    
    if (paymentMethod === 'credit_card') {
      if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length !== 16) {
        newErrors.cardNumber = "Valid card number is required";
      }
      
      if (!cardExpiry.trim() || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        newErrors.cardExpiry = "Valid expiry date (MM/YY) is required";
      }
      
      if (!cardCvc.trim() || cardCvc.length !== 3) {
        newErrors.cardCvc = "Valid CVC is required";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const orderData = {
        userId: userId,
        items: cartItems.map(item => ({
          productId: item._id,
          quantity: item.quantity,
          priceAtOrder: item.price
        })),
        shippingAddress,
        paymentMethod,
        totalAmount: total,
        status: "pending",
        paymentStatus: "pending",
        trackingNumber: ""
      };

      const response = await fetch(getApiUrl('/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await SecureStore.getItemAsync('token')}`
        },
        body: JSON.stringify(orderData),
        signal: controller.signal
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Order failed with status ${response.status}`);
      }

      await SecureStore.deleteItemAsync(`cart_${userId}`);
      
      Alert.alert(
        "Order Successful", 
        `Your order #${data._id} has been placed!\nTotal: $${total.toFixed(2)}`,
        [
          { 
            text: "Continue Shopping", 
            onPress: () => navigation.navigate('Home') 
          }
        ]
      );

    } catch (error) {
      console.error("Order error:", error);
      Alert.alert(
        "Order Failed", 
        error.message || "Couldn't complete your order. Please try again."
      );
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholderButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={90}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Information</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Shipping Address</Text>
              <TextInput
                style={[styles.input, errors.shippingAddress && styles.inputError]}
                placeholder="Enter your shipping address"
                value={shippingAddress}
                onChangeText={setShippingAddress}
                multiline
                numberOfLines={3}
              />
              {errors.shippingAddress && (
                <Text style={styles.errorText}>{errors.shippingAddress}</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <View style={styles.paymentMethodContainer}>
              {['credit_card', 'paypal', 'cash_on_delivery'].map((method) => (
                <TouchableOpacity 
                  key={method}
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === method && styles.paymentMethodSelected
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Ionicons 
                    name={paymentMethod === method ? 'radio-button-on' : 'radio-button-off'} 
                    size={20} 
                    color={paymentMethod === method ? '#007AFF' : '#8E8E93'} 
                  />
                  <Text style={styles.paymentMethodText}>
                    {method === 'credit_card' ? 'Credit Card' : 
                     method === 'paypal' ? 'PayPal' : 'Cash on Delivery'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentMethod === 'credit_card' && (
              <View style={styles.cardDetailsContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <TextInput
                    style={[styles.input, errors.cardNumber && styles.inputError]}
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChangeText={text => setCardNumber(text.replace(/[^0-9]/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                  {errors.cardNumber && (
                    <Text style={styles.errorText}>{errors.cardNumber}</Text>
                  )}
                </View>
                
                <View style={styles.row}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TextInput
                      style={[styles.input, errors.cardExpiry && styles.inputError]}
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChangeText={text => {
                        const cleaned = text.replace(/[^0-9]/g, '');
                        if (cleaned.length <= 2) {
                          setCardExpiry(cleaned);
                        } else if (cleaned.length <= 4) {
                          setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                    {errors.cardExpiry && (
                      <Text style={styles.errorText}>{errors.cardExpiry}</Text>
                    )}
                  </View>
                  
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>CVC</Text>
                    <TextInput
                      style={[styles.input, errors.cardCvc && styles.inputError]}
                      placeholder="123"
                      value={cardCvc}
                      onChangeText={text => setCardCvc(text.replace(/[^0-9]/g, '').slice(0, 3))}
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                    />
                    {errors.cardCvc && (
                      <Text style={styles.errorText}>{errors.cardCvc}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            
            {cartItems.map((item, index) => (
              <View key={`${item._id}-${index}`} style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{item.name} (x{item.quantity})</Text>
                <Text style={styles.summaryValue}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>${shipping.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            
            <View style={[styles.summaryItem, styles.totalItem]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.placeOrderButtonText}>Place Order (${total.toFixed(2)})</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  placeholderButton: {
    width: 24,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 20,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1C1C1E",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
  },
  paymentMethodContainer: {
    marginBottom: 16,
  },
  paymentMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  paymentMethodSelected: {
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
  },
  paymentMethodText: {
    fontSize: 16,
    marginLeft: 12,
  },
  cardDetailsContainer: {
    marginTop: 16,
  },
  row: {
    flexDirection: "row",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalItem: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
  },
  footer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  placeOrderButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  placeOrderButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CheckoutScreen;