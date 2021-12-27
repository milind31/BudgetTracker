import { StatusBar } from 'expo-status-bar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { CardStyleInterpolators } from '@react-navigation/stack';

import { Button } from 'react-native';

/* Screens */
import AddTransaction from './screens/AddTransaction';
import Home from './screens/Home';

const Stack = createNativeStackNavigator(); 

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={Home} 
          options={({ navigation }) => ({
            headerTitle: 'Home',
            headerRight: () => (
              <Button
              onPress={() => navigation.navigate('AddTransaction')}
              title="+"
              />
            ),
          })}
        />
        <Stack.Screen 
          name="AddTransaction" 
          component={AddTransaction}
          options={{
            title: 'Add a Transaction',
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}