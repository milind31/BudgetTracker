import { StatusBar } from 'expo-status-bar';
import { Dimensions } from "react-native";

//Components
import { StyleSheet, Text, SafeAreaView } from 'react-native';
import { Table, Row, Rows } from 'react-native-table-component';


//Imports from helper files
import openDatabase from '../database';
import { useEffect, useState } from 'react';

const db = openDatabase();

const screenWidth = Dimensions.get("window").width;


export default function TransactionLog({ navigation }) {
    const [transactions, setTransactions] = useState([['','','','','']]);

    useEffect(() => {
        db.transaction((tx) => {
            tx.executeSql("select * from Transact where month=12", [], (_, { rows }) => 
                {
                    var transactionsCopy = [];
                    //Format into Name, Price, Category, Date, Description arrays
                    for (let i = 0; i < rows.length; i += 1) {
                        var row = [];
                        row.push(rows['_array'][i]['item']);
                        row.push(rows['_array'][i]['type'] === 'Expense' ? '-$' + rows['_array'][i]['amount'].toString() : '$' + rows['_array'][i]['amount'].toString());
                        row.push(rows['_array'][i]['category']);
                        row.push(rows['_array'][i]['month'].toString() + '/' + rows['_array'][i]['day'].toString() + '/' + rows['_array'][i]['year'].toString());
                        row.push(rows['_array'][i]['description']);
                        transactionsCopy.push(row);
                    }
                    setTransactions(transactionsCopy);
                }
            );
        });
    }, [console.log(transactions)]);


  return (
    <SafeAreaView style={styles.container}>
        <Table style={styles.table} borderStyle={{borderWidth: 1, borderColor: '#c8e1ff'}}>
          <Row data={['Name', 'Amount', 'Category', 'Date', 'Description']} style={styles.head} textStyle={styles.text}/>
          <Rows data={transactions} textStyle={styles.text}/>
        </Table>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 30, backgroundColor: '#fff' },
    head: { height: 40, backgroundColor: '#f1f8ff' },
    text: { fontSize: 10, margin: 6 },
    table: { margin: 10, marginTop: 25, justifyContent: 'center' }
  });