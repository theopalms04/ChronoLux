import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useIsFocused } from '@react-navigation/native';

const CartScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUserId = await SecureStore.getItemAsync('userId');
        if (!currentUserId) {
          Alert.alert("Please Login", "You need to login to view your cart");
          navigation.navigate("Login");
          return;
        }
        setUserId(currentUserId);
        await loadCartData(currentUserId);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    if (isFocused) {
      loadData();
    }
  }, [isFocused, navigation]);

  const loadCartData = async (currentUserId) => {
    try {
      const userCartKey = `cart_${currentUserId}`;
      const cartData = await SecureStore.getItemAsync(userCartKey);
      if (cartData) {
        setCart(JSON.parse(cartData));
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      Alert.alert("Error", "Failed to load cart data");
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 10 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const updateCart = async (updatedCart) => {
    setCart(updatedCart);
    try {
      const userCartKey = `cart_${userId}`;
      await SecureStore.setItemAsync(userCartKey, JSON.stringify(updatedCart));
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  };

  const increaseQuantity = (itemId) => {
    const updatedCart = cart.map(item => 
      item._id === itemId 
        ? { ...item, quantity: item.quantity + 1 } 
        : item
    );
    updateCart(updatedCart);
  };

  const decreaseQuantity = (itemId) => {
    const updatedCart = cart.map(item => 
      item._id === itemId 
        ? { ...item, quantity: Math.max(1, item.quantity - 1) } 
        : item
    );
    updateCart(updatedCart);
  };

  const removeItem = (itemId) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => {
            const updatedCart = cart.filter(item => item._id !== itemId);
            updateCart(updatedCart);
          }
        }
      ]
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart before checkout");
      return;
    }

    navigation.navigate('Checkout', {
      cartItems: cart,
      subtotal,
      shipping,
      tax,
      total
    });
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
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      {cart.length > 0 ? (
        <>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.cartItemsContainer}>
              {cart.map((item) => (
                <View key={item._id} style={styles.cartItem}>
                  <Image
                    source={{ uri: item.photo }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                  
                  <View style={styles.itemDetails}>
                    <View style={styles.itemInfoRow}>
                      <View>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => removeItem(item._id)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.quantityControl}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => decreaseQuantity(item._id)}
                      >
                        <Ionicons name="remove" size={16} color="#007AFF" />
                      </TouchableOpacity>
                      
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => increaseQuantity(item._id)}
                      >
                        <Ionicons name="add" size={16} color="#007AFF" />
                      </TouchableOpacity>
                      
                      <Text style={styles.itemTotal}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            
            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>${shipping.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (8%)</Text>
                <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
              </View>
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.checkoutContainer}>
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.checkoutButtonText}>Proceed to Checkout (${total.toFixed(2)})</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyCartContainer}>
          <View style={styles.emptyCartIconContainer}>
            <Ionicons name="cart-outline" size={80} color="#8E8E93" />
          </View>
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartSubtitle}>
            Looks like you haven't added any items to your cart yet.
          </Text>
          <TouchableOpacity 
            style={styles.startShoppingButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.startShoppingText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  },
  cartItemsContainer: {
    padding: 16,
  },
  cartItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "space-between",
  },
  itemInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#007AFF",
  },
  removeButton: {
    padding: 4,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 16,
  },
  itemTotal: {
    marginLeft: "auto",
    fontSize: 16,
    fontWeight: "700",
  },
  orderSummary: {
    margin: 16,
    padding: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  summaryRow: {
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
  totalRow: {
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
  checkoutContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  checkoutButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyCartIconContainer: {
    marginBottom: 24,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyCartSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  startShoppingButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    paddingHorizontal: 32,
  },
  startShoppingText: {
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

export default CartScreen;