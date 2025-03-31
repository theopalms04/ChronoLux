import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const CustomDrawerContent = ({ navigation }) => {
  const [user, setUser] = useState({
    name: 'Guest',
    email: '',
    profilePicture: 'https://www.gravatar.com/avatar/default?s=200&d=mp',
  });
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const loadUserAndCart = async () => {
      try {
        // Load user data
        const userData = await SecureStore.getItemAsync('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }

        // Load cart data
        const userId = await SecureStore.getItemAsync('userId');
        if (userId) {
          const userCartKey = `cart_${userId}`;
          const cartData = await SecureStore.getItemAsync(userCartKey);
          if (cartData) {
            setCart(JSON.parse(cartData));
          }
        }
      } catch (error) {
        console.error("Error loading user/cart data:", error);
      }
    };

    loadUserAndCart();
  }, []);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('jwt');
      await SecureStore.deleteItemAsync('userId');
      await SecureStore.deleteItemAsync('recentSearches');
      await SecureStore.deleteItemAsync('user');
      
      Alert.alert("Success", "You have been logged out.");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: user.profilePicture }}
          style={styles.profileImage}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email || 'Guest User'}</Text>
        </View>
      </View>

      <View style={styles.drawerSection}>
        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={22} color="#333" />
          <Text style={styles.drawerItemText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => navigation.navigate('Cart')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="cart-outline" size={22} color="#333" />
            <Text style={styles.drawerItemText}>Cart</Text>
          </View>
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => navigation.navigate('Categories')}
        >
          <Ionicons name="grid-outline" size={22} color="#333" />
          <Text style={styles.drawerItemText}>Categories</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => navigation.navigate('Featured')}
        >
          <Ionicons name="star-outline" size={22} color="#333" />
          <Text style={styles.drawerItemText}>Featured</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => navigation.navigate('Collection', { type: "new" })}
        >
          <Ionicons name="time-outline" size={22} color="#333" />
          <Text style={styles.drawerItemText}>New Arrivals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => navigation.navigate('EditProfileScreen')}
        >
          <Ionicons name="person-outline" size={22} color="#333" />
          <Text style={styles.drawerItemText}>My Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Admin Section - Only show if user is admin */}
      {user.role === 'admin' && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Admin</Text>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <MaterialIcons name="dashboard" size={22} color="#333" />
            <Text style={styles.drawerItemText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => navigation.navigate('AddProducts')}
          >
            <Ionicons name="add-circle-outline" size={22} color="#333" />
            <Text style={styles.drawerItemText}>Add Products</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          <Text style={[styles.drawerItemText, { color: '#FF3B30' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  drawerSection: {
    marginTop: 15,
    paddingHorizontal: 10,
  },
  adminSection: {
    marginTop: 15,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 15,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 5,
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginLeft: 15,
    flex: 1,
  },
  cartBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 'auto',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});

export default CustomDrawerContent;