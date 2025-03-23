  import React from "react";
  import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    ScrollView, 
    Image, 
    StatusBar, 
    SafeAreaView,
    Alert 
  } from "react-native";
  import { Ionicons } from "@expo/vector-icons";
  import * as SecureStore from 'expo-secure-store'; // Import SecureStore

  const WATCHES = [
    {
      id: 1,
      name: "Classic Chronograph",
      price: "$299",
      image: "https://placehold.co/300x300?text=Watch1",
      rating: 4.8,
    },
    {
      id: 2,
      name: "Diver Pro",
      price: "$459",
      image: "https://placehold.co/300x300?text=Watch2",
      rating: 4.6,
      sale: true,
    },
    {
      id: 3,
      name: "Minimalist 38mm",
      price: "$199",
      image: "https://placehold.co/300x300?text=Watch3",
      rating: 4.9,
    },
    {
      id: 4,
      name: "Aviator GMT",
      price: "$349",
      image: "https://placehold.co/300x300?text=Watch4",
      rating: 4.7,
    },
  ];

  const CATEGORIES = [
    { id: 1, name: "Luxury", icon: "diamond-outline" },
    { id: 2, name: "Sport", icon: "bicycle-outline" },
    { id: 3, name: "Casual", icon: "cafe-outline" },
    { id: 4, name: "Smart", icon: "fitness-outline" },
  ];

  const HomeScreen = ({ navigation }) => {
    const user = navigation.getParam ? navigation.getParam("user", { name: "Guest" }) : { name: "Guest" };

    // Logout function
    const handleLogout = async () => {
      try {
        // Clear the JWT from SecureStore
        await SecureStore.deleteItemAsync('jwt');
        Alert.alert("Success", "You have been logged out.");
        navigation.navigate("Login"); // Navigate back to the Login screen
      } catch (error) {
        Alert.alert("Error", "Failed to log out. Please try again.");
      }
    };

    const renderWatchCard = (item) => (
      <TouchableOpacity 
        key={item.id} 
        style={styles.watchCard}
        onPress={() => navigation.navigate("WatchDetails", { watch: item })}
      >
        {item.sale && (
          <View style={styles.saleTag}>
            <Text style={styles.saleTagText}>SALE</Text>
          </View>
        )}
        <Image 
          source={{ uri: item.image }} 
          style={styles.watchImage} 
          resizeMode="cover"
        />
        <View style={styles.watchInfo}>
          <Text style={styles.watchName}>{item.name}</Text>
          <View style={styles.priceRatingRow}>
            <Text style={styles.watchPrice}>{item.price}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Search")}>
              <Ionicons name="search-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Cart")}>
              <Ionicons name="cart-outline" size={24} color="#333" />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>2</Text>
              </View>
            </TouchableOpacity>
            {/* Logout Button */}
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.heroContainer}>
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

            <View style={styles.categoriesContainer}>
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
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Watches</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Featured")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.watchesGrid}>
              {WATCHES.map(watch => renderWatchCard(watch))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => {}}>
            <Ionicons name="home" size={24} color="#1C1C1E" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Explore")}>
            <Ionicons name="compass-outline" size={24} color="#8E8E93" />
            <Text style={[styles.navText, { color: "#8E8E93" }]}>Explore</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Favorites")}>
            <Ionicons name="heart-outline" size={24} color="#8E8E93" />
            <Text style={[styles.navText, { color: "#8E8E93" }]}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity
  style={styles.navItem}
  onPress={() => {
    console.log("Navigating to EditProfileScreen with user:", user); // Debugging line
    navigation.navigate("EditProfileScreen", { user }); // Pass the user object as a route param
  }}
>
  <Ionicons name="person-outline" size={24} color="#8E8E93" />
  <Text style={[styles.navText, { color: "#8E8E93" }]}>Profile</Text>
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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: "#FFFFFF",
    },
    welcomeText: {
      fontSize: 16,
      color: "#8E8E93",
    },
    userName: {
      fontSize: 20,
      fontWeight: "700",
      color: "#1C1C1E",
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
    scrollView: {
      flex: 1,
    },
    heroContainer: {
      height: 200,
      margin: 20,
      marginTop: 10,
      backgroundColor: "#1C1C1E",
      borderRadius: 20,
      overflow: "hidden",
      justifyContent: "center",
    },
    heroContent: {
      padding: 20,
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
      opacity: 0.8,
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
      paddingHorizontal: 20,
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#1C1C1E",
    },
    seeAllText: {
      fontSize: 14,
      color: "#007AFF",
      fontWeight: "600",
    },
    categoriesContainer: {
      flexDirection: "row",
      paddingHorizontal: 15,
      justifyContent: "space-between",
    },
    categoryItem: {
      alignItems: "center",
      width: 80,
    },
    categoryIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#007AFF",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    categoryName: {
      fontSize: 12,
      color: "#1C1C1E",
      textAlign: "center",
    },
    watchesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 10,
    },
    watchCard: {
      width: "46%",
      marginHorizontal: "2%",
      marginBottom: 15,
      backgroundColor: "#F2F2F7",
      borderRadius: 15,
      overflow: "hidden",
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
      backgroundColor: "#E5E5EA",
    },
    watchInfo: {
      padding: 10,
    },
    watchName: {
      fontSize: 14,
      fontWeight: "600",
      color: "#1C1C1E",
      marginBottom: 5,
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
    bottomNav: {
      flexDirection: "row",
      height: 60,
      borderTopWidth: 1,
      borderTopColor: "#E5E5EA",
      backgroundColor: "#FFFFFF",
    },
    navItem: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    navText: {
      fontSize: 12,
      marginTop: 4,
      color: "#1C1C1E",
    },
  });

  export default HomeScreen;