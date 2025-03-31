import React from 'react';
import { View, StatusBar } from 'react-native';
import AppNavigator from './screens/navigation/AppNavigator';
const App = () => {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <AppNavigator />
    </View>
  );
};

export default App;