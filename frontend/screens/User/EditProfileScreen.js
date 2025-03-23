import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store"; // Import SecureStore
import * as FileSystem from "expo-file-system"; // Import FileSystem to read files
import API_KEY from "../../config"; // Import the API_KEY from the

const EditProfileScreen = ({ navigation, route }) => {
  // Fallback if route or route.params is undefined
  const user = route?.params?.user || {
    _id: "",
    name: "",
    email: "",
    profilePic: null,
  };

  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [profilePic, setProfilePic] = useState(user.profilePic || null);
  const [isLoading, setIsLoading] = useState(false);

  // Request permission to access the camera roll
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow access to your photos to upload a profile picture.");
      }
    })();
  }, []);

  // Handle image upload
  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setProfilePic(uri); // Set the local URI for preview
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick an image.");
    }
  };

  // Convert image to Base64
  const convertImageToBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`; // Return Base64 string with MIME type
    } catch (error) {
      console.error("Error converting image to Base64:", error);
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!name || !email) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = profilePic;

      // Convert image to Base64 if a new image is selected
      if (profilePic && !profilePic.startsWith("http")) {
        console.log("Converting image to Base64..."); // Debugging log
        const base64Image = await convertImageToBase64(profilePic);
        if (!base64Image) {
          throw new Error("Failed to convert image to Base64");
        }
        imageUrl = base64Image;
        console.log("Image converted to Base64 successfully"); // Debugging log
      }

      // Retrieve the user ID from SecureStore
      const userId = await SecureStore.getItemAsync("userId");
      if (!userId) {
        Alert.alert("Error", "User ID not found. Please log in again.");
        return;
      }

      // Update user profile in your backend
      console.log("Sending request to update profile..."); // Debugging log
      const response = await axios.put(`${API_KEY}/user/edit-profile/${userId}`, {
        name,
        email,
        profilePicture: imageUrl, // Send Base64 string
      });

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error); // Debugging log
      Alert.alert("Error", error.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profilePicContainer}>
        <TouchableOpacity onPress={handleImageUpload}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.profilePic} />
          ) : (
            <View style={styles.profilePicPlaceholder}>
              <Ionicons name="person" size={50} color="#ccc" />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.editIcon} onPress={handleImageUpload}>
          <Ionicons name="camera" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  profilePicContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePicPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 100,
    backgroundColor: "#007AFF",
    borderRadius: 15,
    padding: 8,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  saveButton: {
    height: 50,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default EditProfileScreen;