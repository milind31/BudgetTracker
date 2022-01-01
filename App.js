import { StatusBar } from 'expo-status-bar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { CardStyleInterpolators } from '@react-navigation/stack';

import { Button } from 'react-native';

import openDatabase from './database';


/* Screens */
import AddTransaction from './screens/AddTransaction';
import Home from './screens/Home';
import TransactionLog from './screens/TransactionLog';
import SetBudget from './screens/SetBudget';

const Stack = createNativeStackNavigator(); 
const db = openDatabase();

db.transaction((tx) => {
  //tx.executeSql(
  //  "drop table if exists Budget;"
  //);
  //tx.executeSql(
  //  "delete from Transact where item = 'Drug Deal'"
  //);
  tx.executeSql(
    "create table if not exists Transact (item varchar(100) not null, amount numeric not null, category varchar(100) not null, description varchar(500), type varchar(10) not null, month int not null, day int not null, year int not null);"
  );
  tx.executeSql(
    "create table if not exists Budget (user varchar(100) primary key, restaurant numeric, groceries numeric, home numeric, entertainment numeric, transportation numeric, other numeric);"
  );
});

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
              title="➕"
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
        <Stack.Screen 
          name="TransactionLog" 
          component={TransactionLog}
          options={{
            title: 'View Transactions',
          }}
        />
        <Stack.Screen 
          name="SetBudget" 
          component={SetBudget}
          options={{
            title: 'Set Budget',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}