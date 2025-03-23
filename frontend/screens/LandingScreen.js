import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

const { width, height } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>ChronoLux</Text>
          <Text style={styles.tagline}>Luxury Timepieces</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Sign Up</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={styles.skipButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 ChronoLux. All rights reserved.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  logoContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.05,
  },
  logo: {
    width: width * 0.4,
    height: height * 0.15,
    marginBottom: 15,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e6e6e6',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 18,
    color: '#a0a0a0',
    marginTop: 10,
  },
  buttonContainer: {
    flex: 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    width: '100%',
  },
  button: {
    width: '100%',
    height: 55,
    backgroundColor: '#d4af37', // Gold color for luxury feel
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  secondaryButtonText: {
    color: '#d4af37',
  },
  skipButton: {
    marginTop: 10,
    padding: 10,
  },
  skipButtonText: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  footer: {
    flex: 0.05,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: '#666666',
    fontSize: 12,
  }
});

export default LandingScreen;