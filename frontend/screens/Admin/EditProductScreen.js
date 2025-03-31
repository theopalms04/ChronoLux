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
  ScrollView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";
import API_KEY from "../../config";

const EditProfileScreen = ({ navigation, route }) => {
  const user = route?.params?.user || {
    _id: "",
    name: "",
    email: "",
    profilePic: null,
    address: "",
    phoneNumber: ""
  };

  const [name, setName] = useState(user.name || "");
  const [address, setAddress] = useState(user.address || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [profilePic, setProfilePic] = useState(user.profilePic || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow access to your photos to upload a profile picture.");
      }
    })();
  }, []);

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
        setProfilePic(uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick an image.");
    }
  };

  const convertImageToBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error("Error converting image to Base64:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!name) { // Removed email from required fields
      Alert.alert("Error", "Name is required.");
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = profilePic;

      if (profilePic && !profilePic.startsWith("http")) {
        const base64Image = await convertImageToBase64(profilePic);
        if (!base64Image) {
          throw new Error("Failed to convert image to Base64");
        }
        imageUrl = base64Image;
      }

      const userId = await SecureStore.getItemAsync("userId");
      if (!userId) {
        Alert.alert("Error", "User ID not found. Please log in again.");
        return;
      }

      const response = await axios.put(`${API_KEY}/user/edit-profile/${userId}`, {
        name,
        address,
        phoneNumber,
        profilePicture: imageUrl,
      });

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
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

        <Text style={styles.emailText}>{user.email}</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSubmit} 
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
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
  emailText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
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
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default EditProfileScreen;