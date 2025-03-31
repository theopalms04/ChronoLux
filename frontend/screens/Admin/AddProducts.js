import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import axios from 'axios'; // Import Axios
import * as FileSystem from 'expo-file-system'; // For converting image to base64
import API_KEY from '../../config';

const AddProductScreen = ({ navigation }) => {
  // State for form fields
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    photo: '',
  });

  // State for form validation
  const [errors, setErrors] = useState({});

  // State for loading indication
  const [isLoading, setIsLoading] = useState(false);

  // Predefined categories
  const categories = [
    'Luxury Watches',
    'Sports Watches',
    'Smart Watches',
    'Vintage Watches',
    'Limited Edition',
    'Accessories',
  ];

  // Handle text input changes
  const handleChange = (field, value) => {
    setProductData({
      ...productData,
      [field]: value,
    });

    // Clear error when user types
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null,
      });
    }
  };

  // Handle image picking
  const pickImage = async () => {
    // Request permissions
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      // For newer versions of expo-image-picker
      const selectedAsset = result.assets ? result.assets[0] : result;
      setProductData({
        ...productData,
        photo: selectedAsset.uri,
      });
    }
  };

  // Convert image to base64
  const convertImageToBase64 = async (uri) => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

    if (!productData.name.trim()) {
      newErrors.name = 'Product name is required';
      isValid = false;
    }

    if (!productData.price) {
      newErrors.price = 'Product price is required';
      isValid = false;
    } else if (isNaN(productData.price) || Number(productData.price) < 0) {
      newErrors.price = 'Price must be a non-negative number';
      isValid = false;
    }

    if (!productData.quantity) {
      newErrors.quantity = 'Product quantity is required';
      isValid = false;
    } else if (
      isNaN(productData.quantity) ||
      Number(productData.quantity) < 0 ||
      !Number.isInteger(Number(productData.quantity))
    ) {
      newErrors.quantity = 'Quantity must be a non-negative integer';
      isValid = false;
    }

    if (!productData.category) {
      newErrors.category = 'Product category is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Convert image to base64 if selected
      let photoBase64 = '';
      if (productData.photo) {
        photoBase64 = await convertImageToBase64(productData.photo);
      }

      // Prepare form data for API
      const formData = {
        ...productData,
        price: parseFloat(productData.price),
        quantity: parseInt(productData.quantity, 10),
        photo: photoBase64, // Include the base64 image
      };

      // Make API call to backend
      const response = await axios.post(`${API_KEY}/product/create`, formData);

      // Success handling
      Alert.alert(
        'Success',
        'Product has been added successfully',
        [
          {
            text: 'Add Another',
            onPress: () => {
              // Reset form
              setProductData({
                name: '',
                description: '',
                price: '',
                quantity: '',
                category: productData.category, // Keep the same category for convenience
                photo: '',
              });
            },
          },
          {
            text: 'View Products',
            onPress: () => navigation.navigate('ProductsList'), // Navigate to product list
          },
        ],
      );
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Watch</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Product Image Picker */}
            <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
              {productData.photo ? (
                <Image source={{ uri: productData.photo }} style={styles.productImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <FontAwesome name="camera" size={40} color="#ccc" />
                  <Text style={styles.imagePlaceholderText}>Add Product Image</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Product Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Name</Text>
              <TextInput
                style={[styles.textInput, errors.name && styles.inputError]}
                placeholder="Enter product name"
                value={productData.name}
                onChangeText={(text) => handleChange('name', text)}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Product Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
                <Picker
                  selectedValue={productData.category}
                  onValueChange={(itemValue) => handleChange('category', itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a category" value="" />
                  {categories.map((category, index) => (
                    <Picker.Item key={index} label={category} value={category} />
                  ))}
                </Picker>
              </View>
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>

            {/* Price and Quantity Row */}
            <View style={styles.rowContainer}>
              {/* Product Price */}
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Price ($)</Text>
                <TextInput
                  style={[styles.textInput, errors.price && styles.inputError]}
                  placeholder="0.00"
                  value={productData.price}
                  onChangeText={(text) => handleChange('price', text)}
                  keyboardType="decimal-pad"
                />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              </View>

              {/* Product Quantity */}
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={[styles.textInput, errors.quantity && styles.inputError]}
                  placeholder="0"
                  value={productData.quantity}
                  onChangeText={(text) => handleChange('quantity', text)}
                  keyboardType="number-pad"
                />
                {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
              </View>
            </View>

            {/* Product Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter product description"
                value={productData.description}
                onChangeText={(text) => handleChange('description', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Add Product</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
    color: '#333',
  },
  formContainer: {
    padding: 20,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: '#888',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  inputError: {
    borderColor: '#e53935',
  },
  errorText: {
    color: '#e53935',
    fontSize: 12,
    marginTop: 5,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  submitButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddProductScreen;