import React from "react";
import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import LoginScreen from "../Authentication/LoginScreen";
import RegisterScreen from "../Authentication/RegisterScreen";
import HomeScreen from "../HomeScreen";
import LandingScreen from "../LandingScreen"; // Make sure path matches where you save the file
import EditProfileScreen from "../User/EditProfileScreen";
const AppNavigator = createStackNavigator(
  {
    Landing: {
      screen: LandingScreen,
      navigationOptions: {
        headerShown: false,
      },
    },
    Login: {
      screen: LoginScreen,
      navigationOptions: {
        headerShown: false,
      },
    },
    Register: {
      screen: RegisterScreen,
      navigationOptions: {
        headerShown: false,
      },
    },
    Home: {
      screen: HomeScreen,
    },
    EditProfileScreen: {
      screen: EditProfileScreen,
      navigationOptions: {
        title: "Edit Profile", // Optional: Customize the header title
        headerStyle: {
          backgroundColor: "#1a1a2e",
        },
        headerTintColor: "#fff",
      },
    },
  },
  {
    initialRouteName: "Landing", // Changed to make Landing the initial screen
    defaultNavigationOptions: {
      headerStyle: {
        backgroundColor: "#1a1a2e",
      },
      headerTintColor: "#fff",
    },
  }
);

export default createAppContainer(AppNavigator);