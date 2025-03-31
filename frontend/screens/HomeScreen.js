import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  StatusBar, 
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { DrawerActions } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import API_KEY from "../config";

import { LogBox } from 'react-native';

LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 1, name: "Luxury", icon: "diamond-outline" },
  { id: 2, name: "Sport", icon: "bicycle-outline" },
  { id: 3, name: "Casual", icon: "cafe-outline" },
  { id: 4, name: "Smart", icon: "fitness-outline" },
];

const PRICE_RANGES = [
  { label: "Under $100", min: 0, max: 100 },
  { label: "$100 - $300", min: 100, max: 300 },
  { label: "$300 - $500", min: 300, max: 500 },
  { label: "Over $500", min: 500, max: Infinity },
];

const HomeScreen = ({ navigation }) => {
  const user = navigation.getParam ? navigation.getParam("user", { 
    name: "Guest", 
    profilePicture: "https://www.gravatar.com/avatar/default?s=200&d=mp" 
  }) : { 
    name: "Guest", 
    profilePicture: "https://www.gravatar.com/avatar/default?s=200&d=mp" 
  };
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_KEY}/product`);
        setProducts(response.data);
        setFilteredProducts(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        Alert.alert("Error", "Failed to fetch products. Please try again.");
        setLoading(false);
      }
    };

    fetchProducts();
    loadRecentSearches();
  }, []);

  // Load recent searches from storage
  const loadRecentSearches = async () => {
    try {
      const searches = await SecureStore.getItemAsync('recentSearches');
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  // Save recent searches to storage
  const saveRecentSearches = async (searches) => {
    try {
      await SecureStore.setItemAsync('recentSearches', JSON.stringify(searches));
    } catch (error) {
      console.error("Error saving recent searches:", error);
    }
  };

  // Add a search to recent searches
  const addToRecentSearches = (query) => {
    if (!query.trim()) return;
    
    const updatedSearches = [
      query,
      ...recentSearches.filter(item => item !== query).slice(0, 4)
    ];
    setRecentSearches(updatedSearches);
    saveRecentSearches(updatedSearches);
  };

  // Filter products based on search criteria
  const filterProducts = () => {
    let results = [...products];
    
    // Filter by search query
    if (searchQuery) {
      results = results.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      results = results.filter(product => 
        product.category === selectedCategory
      );
    }
    
    // Filter by price range
    results = results.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    setFilteredProducts(results);
    if (searchQuery) {
      addToRecentSearches(searchQuery);
    }
    setShowSearchModal(false);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setPriceRange([0, 10000]);
    setFilteredProducts(products);
    setShowSearchModal(false);
  };

  // Load user's cart when component mounts
  useEffect(() => {
    const loadCart = async () => {
      try {
        const userId = await SecureStore.getItemAsync('userId');
        if (userId) {
          const userCartKey = `cart_${userId}`;
          const cartData = await SecureStore.getItemAsync(userCartKey);
          if (cartData) {
            setCart(JSON.parse(cartData));
          }
        }
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    };

    loadCart();
  }, []);

  // Save cart whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        const userId = await SecureStore.getItemAsync('userId');
        if (userId) {
          const userCartKey = `cart_${userId}`;
          await SecureStore.setItemAsync(userCartKey, JSON.stringify(cart));
        }
      } catch (error) {
        console.error("Error saving cart:", error);
      }
    };

    if (cart.length > 0) {
      saveCart();
    }
  }, [cart]);

  // Add product to cart with user-specific storage
  const addToCart = async (product) => {
    try {
      const userId = await SecureStore.getItemAsync('userId');
      if (!userId) {
        Alert.alert("Login Required", "Please login to add items to your cart", [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login") }
        ]);
        return;
      }

      const userCartKey = `cart_${userId}`;
      const cartData = await SecureStore.getItemAsync(userCartKey);
      let currentCart = cartData ? JSON.parse(cartData) : [];

      const existingItem = currentCart.find((item) => item._id === product._id);
      
      if (existingItem) {
        currentCart = currentCart.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        currentCart = [...currentCart, { ...product, quantity: 1 }];
      }

      await SecureStore.setItemAsync(userCartKey, JSON.stringify(currentCart));
      setCart(currentCart);
      
      Alert.alert("Added to Cart", `${product.name} has been added to your cart`, [
        { text: "Continue Shopping", style: "cancel" },
        { text: "View Cart", onPress: () => navigation.navigate("Cart", { cart: currentCart }) }
      ]);
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add product to cart");
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('jwt');
      await SecureStore.deleteItemAsync('userId');
      await SecureStore.deleteItemAsync('recentSearches');
      setRecentSearches([]);
      setCart([]);
      Alert.alert("Success", "You have been logged out.");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  const renderWatchCard = (item) => (
    <TouchableOpacity 
      key={item._id} 
      style={styles.watchCard}
      onPress={() => navigation.navigate("WatchDetails", { watch: item })}
    >
      {item.sale && (
        <View style={styles.saleTag}>
          <Text style={styles.saleTagText}>SALE</Text>
        </View>
      )}
      <Image 
        source={{ uri: item.photo }} 
        style={styles.watchImage} 
        resizeMode="cover"
      />
      <View style={styles.watchInfo}>
        <Text style={styles.watchName}>{item.name}</Text>
        <View style={styles.priceRatingRow}>
          <Text style={styles.watchPrice}>${item.price}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating || 4.5}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={() => addToCart(item)}
        >
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.searchModalContainer}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for watches..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            <TouchableOpacity onPress={filterProducts}>
              <Ionicons name="search" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {recentSearches.length > 0 && (
            <View style={styles.recentSearchesContainer}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <FlatList
                data={recentSearches}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.recentSearchItem}
                    onPress={() => {
                      setSearchQuery(item);
                      filterProducts();
                    }}
                  >
                    <Ionicons name="time-outline" size={18} color="#8E8E93" />
                    <Text style={styles.recentSearchText}>{item}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
            </View>
          )}

          <TouchableOpacity 
            style={styles.filterToggle}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterToggleText}>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Text>
            <Ionicons 
              name={showFilters ? "chevron-up" : "chevron-down"} 
              size={18} 
              color="#007AFF" 
            />
          </TouchableOpacity>

          {showFilters && (
            <View style={styles.filtersContainer}>
              <Text style={styles.filterLabel}>Category</Text>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="All Categories" value={null} />
                {CATEGORIES.map(category => (
                  <Picker.Item 
                    key={category.id} 
                    label={category.name} 
                    value={category.name} 
                  />
                ))}
              </Picker>

              <Text style={styles.filterLabel}>
                Price Range: ${priceRange[0]} - ${priceRange[1]}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10000}
                step={50}
                value={priceRange[1]}
                onValueChange={(value) => setPriceRange([priceRange[0], value])}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#E5E5EA"
                thumbTintColor="#007AFF"
              />

              <View style={styles.filterButtons}>
                <TouchableOpacity 
                  style={[styles.filterButton, styles.resetButton]}
                  onPress={resetFilters}
                >
                  <Text style={styles.filterButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, styles.applyButton]}
                  onPress={filterProducts}
                >
                  <Text style={styles.filterButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Main Content */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={styles.menuButton}
          >
            <MaterialIcons name="menu" size={28} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate("EditProfileScreen", { user })}
            style={styles.profileButton}
          >
            <Image 
              source={{ uri: user.profilePicture }} 
              style={styles.profileImage} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => navigation.navigate("Cart", { cart })}
          >
            <Ionicons name="cart-outline" size={24} color="#333" />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.userGreeting}>
            <Text style={styles.greetingText}>Hello, {user.name}</Text>
            <Text style={styles.welcomeText}>What are you looking for today?</Text>
          </View>

          <View style={styles.heroContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
              style={styles.heroImage}
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Premium Watch Collection</Text>
              <Text style={styles.heroSubtitle}>Discover our latest arrivals</Text>
              <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate("Collection", { type: "new" })}>
                <Text style={styles.heroButtonText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Categories")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {CATEGORIES.map(category => (
                <TouchableOpacity 
                  key={category.id} 
                  style={styles.categoryItem}
                  onPress={() => navigation.navigate("Category", { category })}
                >
                  <View style={styles.categoryIcon}>
                    <Ionicons name={category.icon} size={24} color="#fff" />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Watches</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Featured")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredProducts}
              renderItem={({ item }) => renderWatchCard(item)}
              keyExtractor={item => item._id}
              numColumns={2}
              columnWrapperStyle={styles.watchesGrid}
              contentContainerStyle={styles.watchesContainer}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </ScrollView>
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    marginLeft: 15,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  menuButton: {
    padding: 5,
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    position: 'relative',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  userGreeting: {
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 5,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    height: 180,
    margin: 20,
    marginTop: 10,
    borderRadius: 20,
    overflow: "hidden",
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroContent: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 15,
  },
  heroButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: "flex-start",
  },
  heroButtonText: {
    color: "#1C1C1E",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  seeAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  categoriesScroll: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: "center",
    width: 100,
    marginRight: 15,
  },
  categoryIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 14,
    color: "#1C1C1E",
    textAlign: "center",
    fontWeight: '500',
  },
  watchesContainer: {
    paddingHorizontal: 15,
  },
  watchesGrid: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  watchCard: {
    width: '48%',
    marginBottom: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saleTag: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  saleTagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  watchImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#F2F2F7",
  },
  watchInfo: {
    padding: 12,
  },
  watchName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  priceRatingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  watchPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "600",
  },
  addToCartButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  addToCartButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#E5E5EA',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    backgroundColor: '#F8F8F8',
  },
  recentSearchesContainer: {
    marginBottom: 20,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  recentSearchText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#1C1C1E',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    marginBottom: 15,
  },
  filterToggleText: {
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 5,
  },
  filtersContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 10,
  },
  picker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 15,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 20,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  resetButton: {
    backgroundColor: '#E5E5EA',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontWeight: '600',
  },
});

export default HomeScreen;