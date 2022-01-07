//Components
import { StyleSheet, Text, SafeAreaView, View, TextInput, Button, Alert } from 'react-native';

//Imports from helper files
import openDatabase from '../database';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

const db = openDatabase();

export default function SetBudget() {
  const [restaurant, setRestaurant] = useState(-1.00);
  const [groceries, setGroceries] = useState(-1.00);
  const [home, setHome] = useState(-1.00);
  const [entertainment, setEntertainment] = useState(-1.00);
  const [transportation, setTransportation] = useState(-1.00);
  const [other, setOther] = useState(-1.00);

    useEffect(() => {
        db.transaction((tx) => {
            console.log("here")
            tx.executeSql("select * from Budget", [], (_, { rows }) => 
                {
                    if (rows.length > 0) {
                        console.log(rows);
                        var budgetArr = rows['_array'][0];
                        setRestaurant(budgetArr['restaurant']);
                        setGroceries(budgetArr['groceries']);
                        setHome(budgetArr['home']);
                        setEntertainment(budgetArr['entertainment']);
                        setTransportation(budgetArr['transportation']);
                        setOther(budgetArr['other']);
                    }
                    else {
                        console.log('initializing first row')
                        tx.executeSql('INSERT INTO Budget (user, restaurant, groceries, home, entertainment, transportation, other) VALUES (?, ?, ?, ?, ?, ?, ?)', ['user', -1.00, -1.00, -1.00, -1.00, -1.00, -1.00]);
                    }
                }
            );
        });
    }, []);

    const onSubmitBudget = () => {
        db.transaction((tx) => {
            tx.executeSql("UPDATE Budget SET restaurant=?, groceries=?, home=?, entertainment=?, transportation=?, other=? WHERE user='user'", 
            [parseFloat(restaurant).toFixed(2), parseFloat(groceries).toFixed(2), parseFloat(home).toFixed(2), parseFloat(entertainment).toFixed(2), parseFloat(transportation).toFixed(2), parseFloat(other).toFixed(2)]);
            
            tx.executeSql("select * from Budget", [], (_, { rows }) => console.log(rows));
        });
        Alert.alert(
            "Budget Set!",
            "",
            [{ text: "OK" }]
          );
    }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps='handled'>
        <View style={styles.header}>
          <Text style={styles.headerText}>Set Budget</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.category}>
              <Text style={styles.label}>Food/Restaurant: </Text>
              <TextInput style={styles.input}
              keyboardType="numeric"
              onChangeText={(value) => setRestaurant(value === '' ? -1.00 : value)}
              value={restaurant === -1.00 ? '' : String(restaurant)}
              />
          </View>
          <View style={styles.category}>
              <Text style={styles.label}>Groceries: </Text>
              <TextInput style={styles.input}
              keyboardType="numeric"
              onChangeText={(value) => setGroceries(value === '' ? -1.00 : value)}
              value={groceries === -1.00 ? '' : String(groceries)}
              />
          </View>
          <View style={styles.category}>
              <Text style={styles.label}>Home Stuff: </Text>
              <TextInput style={styles.input}
              keyboardType="numeric"
              onChangeText={(value) => setHome(value === '' ? -1.00 : value)}
              value={home === -1.00 ? '' : String(home)}
              />
          </View>
          <View style={styles.category}>
              <Text style={styles.label}>Entertainment: </Text>
              <TextInput style={styles.input}
              keyboardType="numeric"
              onChangeText={(value) => setEntertainment(value === '' ? -1.00 : value)}
              value={entertainment === -1.00 ? '' : String(entertainment)}
              />
          </View>
          <View style={styles.category}>
              <Text style={styles.label}>Transportation: </Text>
              <TextInput style={styles.input}
              keyboardType="numeric"
              onChangeText={(value) => setTransportation(value === '' ? -1.00 : value)}
              value={transportation === -1.00 ? '' : String(transportation)}
              />
          </View>
          <View style={styles.category}>
              <Text style={styles.label}>Other: </Text>
              <TextInput style={styles.input}
              keyboardType="numeric"
              onChangeText={(value) => setOther(value === '' ? -1.00 : value)}
              value={other === -1.00 ? '' : String(other)}
              />
          </View>
          <View style={{padding: 50}}>
              <Button           
                  title="Submit"
                  onPress={() => onSubmitBudget()}
              />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
    },
    input: {
      height: 40,
      width: 150,
      borderWidth: 0.5,
      padding: 10,
      margin: 15,
      borderRadius: 7,
    },
    headerText: {
      fontSize: 30,
    },
    form: {
      flex: 3.5,
    },
    header: {
      flex: 1,
      justifyContent: 'center',
    },
    label: {
        margin: 15,
        padding: 10,
        paddingRight: 0,
        marginRight: 0
    },
    category: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
  });