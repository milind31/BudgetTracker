import { Button, SafeAreaView, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';

//Imported components
import SegmentedControl from '@react-native-community/segmented-control';
import RNPickerSelect from 'react-native-picker-select';

//Imports from helper files
import { pickerItemsExpense, pickerItemsIncome }  from '../constants/pickerItems'; 
import { pickerSelectStyles } from '../styles/styles';
import openDatabase from '../database';

const db = openDatabase();

export default function AddTransaction() {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState(0.00);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Expense');
  const [pickerItems, setPickerItems] =  useState(pickerItemsExpense);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        //"drop table if exists Transact"
      );
      tx.executeSql(
        "create table if not exists Transact (item varchar(100) not null, amount numeric not null, category varchar(100) not null, description varchar(500), type varchar(10) not null, month int not null, day int not null, year int not null);"
      );
    });
  }, []);

  const onChangeType = (event) => {
    setCategory('');

    if (event.nativeEvent.selectedSegmentIndex === 0) {
      setType('Expense');
      setPickerItems(pickerItemsExpense);
    }
    else {
      setType('Income');
      setPickerItems(pickerItemsIncome);
    }
  }
  
  const onSubmitTransaction = () => {
    var amountCopy = amount;
    var castedAmount = +amountCopy;

    if (amount > 100000) {
      Alert.alert(
        "Amount must be less than $100,000",
        "I know you ain't got it like that bro...",
        [{ text: "OK" }]
      );
      return
    }

    if (item.length > 50) {
      Alert.alert(
        "Item has max length of 50 characters",
        "",
        [{ text: "OK" }]
      );
      return
    }

    if (description.length > 100) {
      Alert.alert(
        "Description has max length of 100 characters",
        "",
        [{ text: "OK" }]
      );
      return
    }

    if (isNaN(castedAmount)) {
      Alert.alert(
        "Amount must be a numerical value",
        "",
        [{ text: "OK" }]
      );
      return
    }

    if (!item || !amount || !category) {
      Alert.alert(
        "Missing required value...",
        "Make sure item, amount, and category fields are filled in",
        [{ text: "OK" }]
      );
      return
    }

    let currentDate = new Date().toLocaleString("en-US", {timeZone: "America/New_York"}).split('/');

    var transactionItem = {
      item: item,
      amount: castedAmount.toFixed(2),
      category: category,
      description: description,
      type: type,
      month: parseInt(currentDate[0]),
      day: parseInt(currentDate[1]),
      year: parseInt(currentDate[2]),
    }
    console.log(transactionItem)

    db.transaction(
      (tx) => {
        tx.executeSql('INSERT INTO Transact (item, amount, category, description, type, month, day, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [transactionItem.item, transactionItem.amount, transactionItem.category, transactionItem.description, transactionItem.type, transactionItem.month, transactionItem.day, transactionItem.year]);
        tx.executeSql("select * from Transact", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      }
    );

    setItem('');
    setAmount(0.00);
    setCategory('');
    setDescription('');

    Alert.alert(
      "Transaction has been added successfully!",
      "",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Enter a Transaction</Text>
        <SegmentedControl 
          style={styles.segCtrl}
          values={["Expense", "Income"]}
          onChange={(event) => onChangeType(event)}
          selectedIndex={0}
        />
      </View>
      <View style={styles.form}>
        <TextInput style={styles.input}
          onChangeText={(value) => setItem(value)}
          placeholder="Enter item here..."
          value={item}
        />
        <TextInput style={styles.input}
          keyboardType="numeric"
          onChangeText={(value) => setAmount(value)}
          placeholder="Enter amount here..."
          value={amount === 0 ? '' : amount.toString()}
        />
        <RNPickerSelect
          style={pickerSelectStyles}
          placeholder={{
            label: 'Select a category here...',
            value: null,
            color: '#9EA0A4',
          }}
          value={category}
          onValueChange={(value) => setCategory(value)}
          items={pickerItems}
          />
        <TextInput style={styles.input}
          onChangeText={(value) => setDescription(value)}
          placeholder="Enter description here..."
          value={description}
        />
        <Button title="Submit"
          onPress={() => onSubmitTransaction()}
        />
      </View>
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
    width: 300,
    borderWidth: 0.5,
    padding: 10,
    margin: 15,
    borderRadius: 7,
  },
  headerText: {
    fontSize: 30,
  },
  form: {
    flex: 1.75,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
  },
  segCtrl: {
    top: '10%',
    fontSize: 200,
  }
});