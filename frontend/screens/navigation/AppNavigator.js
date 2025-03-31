import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import all screens
import LoginScreen from '../Authentication/LoginScreen';
import RegisterScreen from '../Authentication/RegisterScreen';
import HomeScreen from '../HomeScreen';
import LandingScreen from '../LandingScreen';
import EditProfileScreen from '../User/EditProfileScreen';
import AdminDashboard from '../Admin/AdminDashboard';
import AddProductScreen from '../Admin/AddProducts';
import EditProductScreen from '../Admin/EditProductScreen';
import CartScreen from '../Cart/CartScreen';
import CheckoutScreen from '../Cart/CheckoutScreen';

const Stack = createNativeStackNavigator();

// Custom header back button component
const HeaderBackButton = ({ navigation }) => (
  <TouchableOpacity
    onPress={() => navigation.goBack()}
    style={{ paddingHorizontal: 15 }}
  >
    <Ionicons name="arrow-back" size={24} color="white" />
  </TouchableOpacity>
);

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
        }}
      >
        <Stack.Screen 
          name="Landing" 
          component={LandingScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Cart" 
          component={CartScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Checkout" 
          component={CheckoutScreen} 
          options={{ 
            title: 'Checkout',
            headerLeft: () => <HeaderBackButton />
          }} 
        />
        <Stack.Screen 
          name="EditProfileScreen" 
          component={EditProfileScreen} 
          options={{ 
            title: 'Edit Profile',
            headerLeft: () => <HeaderBackButton />
          }} 
        />
        <Stack.Screen 
          name="AdminDashboard" 
          component={AdminDashboard} 
          options={{ 
            title: 'Admin Dashboard',
            headerLeft: () => <HeaderBackButton />
          }} 
        />
        <Stack.Screen 
          name="AddProducts" 
          component={AddProductScreen} 
          options={{ 
            title: 'Add Product',
            headerLeft: () => <HeaderBackButton />
          }} 
        />
        <Stack.Screen 
          name="EditProductScreen" 
          component={EditProductScreen} 
          options={{ 
            title: 'Edit Product',
            headerLeft: () => <HeaderBackButton />
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;