import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Dashboard } from './src/screens/Dashboard';
import { RuleEditor } from './src/screens/RuleEditor';
import { Permissions } from './src/screens/Permissions';
import { StatusBar } from 'react-native';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Navigator
        initialRouteName="Permissions"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F172A' },
        }}
      >
        <Stack.Screen name="Permissions" component={Permissions} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="RuleEditor" component={RuleEditor} />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
