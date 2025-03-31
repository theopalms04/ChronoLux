import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Image,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import API_KEY from "../../config";

const AdminDashboard = ({ navigation }) => {
  const [activeSection, setActiveSection] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_KEY}/product`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        throw new Error("Invalid products data format");
      }
    } catch (error) {
      console.error("Product fetch error:", error);
      Alert.alert(
        "Error", 
        error.response?.data?.message || "Could not load products. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced order fetching with better error handling
  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      console.log(`Fetching orders from: ${API_KEY}/orders`); // Debug log
      const response = await axios.get(`${API_KEY}/orders`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log("Orders API Response:", response.data); // Debug log
      
      // Handle both response formats (array or object with orders property)
      const ordersData = response.data.orders || response.data;
      
      if (ordersData && Array.isArray(ordersData)) {
        setOrders(ordersData);
      } else {
        throw new Error("Unexpected orders data format");
      }
    } catch (error) {
      console.error("Order fetch error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      let errorMessage = "Failed to load orders";
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = "Orders endpoint not found (404). Please check your backend route.";
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timed out. Please check your connection.";
      }

      Alert.alert("Error", errorMessage);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    if (activeSection === "products") fetchProducts();
    if (activeSection === "orders") fetchOrders();
  };

  // Delete a product
  const deleteProduct = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await axios.delete(`${API_KEY}/product/${id}`);
              Alert.alert("Success", "Product deleted successfully");
              fetchProducts();
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert(
                "Error", 
                error.response?.data?.message || "Failed to delete product"
              );
            }
          }
        }
      ]
    );
  };

  // Delete an order
  const deleteOrder = async (orderId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await axios.delete(`${API_KEY}/orders/${orderId}`);
              Alert.alert("Success", "Order deleted successfully");
              fetchOrders();
            } catch (error) {
              console.error("Error deleting order:", error);
              Alert.alert(
                "Error", 
                error.response?.data?.message || "Failed to delete order"
              );
            }
          }
        }
      ]
    );
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `${API_KEY}/orders/${orderId}/status`, 
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert(
        "Error", 
        error.response?.data?.message || "Failed to update order status"
      );
    }
  };

  // Handle section press
  const handleSectionPress = (section) => {
    setActiveSection(activeSection === section ? null : section);
    if (section === "products") fetchProducts();
    if (section === "orders") fetchOrders();
  };

  // Render product item
  const renderProductItem = ({ item }) => (
    <View style={styles.productItem}>
      {item.photo ? (
        <Image 
          source={{ uri: item.photo }} 
          style={styles.productImage}
          onError={() => console.log("Image failed to load")}
        />
      ) : (
        <View style={[styles.productImage, styles.imagePlaceholder]}>
          <MaterialCommunityIcons name="image-off" size={24} color="#ccc" />
        </View>
      )}
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price?.toFixed(2) || '0.00'}</Text>
        <Text style={styles.productQuantity}>Stock: {item.quantity || 0}</Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          onPress={() => navigation.navigate("EditProductScreen", { product: item })}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="#FF9800" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteProduct(item._id)}>
          <MaterialCommunityIcons name="delete" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render order item
  const renderOrderItem = ({ item }) => {
    const statusColor = {
      pending: '#FFA000',
      processing: '#2196F3',
      shipped: '#673AB7',
      delivered: '#4CAF50',
      cancelled: '#F44336'
    }[item?.status] || '#9E9E9E';

    return (
      <View style={styles.orderItem}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item?._id?.substring(0, 8)}</Text>
          {item?.status && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {item?.user && (
          <Text style={styles.orderCustomer}>
            Customer: {item.user.name || 'Unknown'}
          </Text>
        )}

        <View style={styles.orderProducts}>
          {item?.items?.map((orderItem, index) => (
            <View key={index} style={styles.orderProductItem}>
              {orderItem?.product?.photo ? (
                <Image 
                  source={{ uri: orderItem.product.photo }} 
                  style={styles.orderProductImage}
                />
              ) : (
                <View style={[styles.orderProductImage, styles.imagePlaceholder]}>
                  <MaterialCommunityIcons name="package-variant" size={20} color="#ccc" />
                </View>
              )}
              <View style={styles.orderProductDetails}>
                <Text style={styles.orderProductName}>
                  {orderItem?.product?.name || 'Unknown Product'}
                </Text>
                <Text style={styles.orderProductPrice}>
                  ${orderItem?.priceAtOrder?.toFixed(2) || '0.00'} × {orderItem?.quantity || 0}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>
            Total: ${item?.totalAmount?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.orderDate}>
            {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}
          </Text>
        </View>

        <View style={styles.orderActions}>
          <TouchableOpacity
            style={[styles.orderButton, styles.viewButton]}
            onPress={() => navigation.navigate("ManageOrder", { orderId: item._id })}
          >
            <Text style={styles.buttonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.orderButton, styles.deleteButton]}
            onPress={() => deleteOrder(item._id)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    const isProducts = activeSection === "products";
    const loading = isProducts ? isLoading : isLoadingOrders;
    const type = isProducts ? "products" : "orders";
    const refetch = isProducts ? fetchProducts : fetchOrders;

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name={isProducts ? "package-variant-closed" : "cart-off"} 
          size={48} 
          color="#9e9e9e" 
        />
        <Text style={styles.emptyText}>
          {loading ? `Loading ${type}...` : `No ${type} found`}
        </Text>
        {!loading && (
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={refetch}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render dashboard header
  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <MaterialCommunityIcons name="view-dashboard" size={28} color="#fff" />
        <Text style={styles.title}>Admin Dashboard</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>-</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Management</Text>

      {/* Products Section */}
      <TouchableOpacity
        style={[styles.card, activeSection === "products" && styles.activeCard]}
        onPress={() => handleSectionPress("products")}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: "#e3f2fd" }]}>
            <MaterialCommunityIcons name="package-variant" size={24} color="#1565C0" />
          </View>
          <Text style={styles.cardText}>Manage Products</Text>
        </View>
        <MaterialCommunityIcons
          name={activeSection === "products" ? "chevron-up" : "chevron-right"}
          size={24}
          color="#9e9e9e"
        />
      </TouchableOpacity>

      {activeSection === "products" && (
        <TouchableOpacity
          style={styles.addProductButton}
          onPress={() => navigation.navigate("AddProducts")}
        >
          <Text style={styles.addProductButtonText}>Add New Product</Text>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Orders Section */}
      <TouchableOpacity
        style={[styles.card, activeSection === "orders" && styles.activeCard]}
        onPress={() => handleSectionPress("orders")}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: "#e8f5e9" }]}>
            <MaterialCommunityIcons name="cart" size={24} color="#2E7D32" />
          </View>
          <Text style={styles.cardText}>Manage Orders</Text>
        </View>
        <MaterialCommunityIcons
          name={activeSection === "orders" ? "chevron-up" : "chevron-right"}
          size={24}
          color="#9e9e9e"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activeSection === "products" ? products : orders}
        renderItem={activeSection === "products" ? renderProductItem : renderOrderItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#3f51b5"]}
            tintColor="#3f51b5"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3f51b5",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 16,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "30%",
    alignItems: "center",
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3f51b5",
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#424242",
    marginVertical: 16,
    marginHorizontal: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  activeCard: {
    borderColor: "#3f51b5",
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 10,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 16,
    color: "#424242",
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#424242",
  },
  productPrice: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
  productActions: {
    flexDirection: "row",
    gap: 16,
  },
  addProductButton: {
    flexDirection: 'row',
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: 'center',
    elevation: 2,
  },
  addProductButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  orderItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3f51b5",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderCustomer: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
  },
  orderProducts: {
    marginVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 10,
  },
  orderProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  orderProductImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  orderProductDetails: {
    flex: 1,
  },
  orderProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
  },
  orderProductPrice: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
  },
  orderDate: {
    fontSize: 14,
    color: "#757575",
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  orderButton: {
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  viewButton: {
    backgroundColor: "#3f51b5",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#3f51b5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
export default AdminDashboard;