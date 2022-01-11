import { useEffect, useState } from 'react';
import { Button } from 'react-native';
import { Alert } from 'react-native';
import { ScrollView, StyleSheet, SafeAreaView, View, Text, RefreshControl } from "react-native";

//Components
import { Table, Row, TableWrapper, Cell } from 'react-native-table-component';

//Imports from helper files
import { currentMonth, currentYear } from '../utilities/dates';
import { monthMap } from '../constants/maps';
import openDatabase from '../database';

const db = openDatabase();

export default function TransactionLog({ route, navigation }) {
    const [transactions, setTransactions] = useState([['','','','','']]);
    const [loading, setLoading] = useState(true);

    const loadData = () => {
      db.transaction((tx) => {
        tx.executeSql("select * from Transact where month = ? and year = ?", [route.params.month, route.params.year], (_, { rows }) => 
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
                    row.push(rows['_array'][i]['id']);
                    transactionsCopy.push(row);
                }
                setTransactions(transactionsCopy);
                setLoading(false);
            }
        );
    });
    }

    useEffect(() => {
        loadData();
    }, []);

  const onClickDelete = (rowData) => {
    Alert.alert(
      "Are you sure you want to delete?",
      "",
      [{ text: "Yes" , onPress: () => deleteRow(rowData)}, { text: "No" }]
    );
  }

  const deleteRow = (rowData) => {
    db.transaction((tx) => {
      tx.executeSql("delete from Transact where id = ?", [rowData[rowData.length - 1]]);
    });
    setTransactions(transactions.filter((e, _) => e[rowData.length - 1] != rowData[rowData.length - 1]));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{"Transaction Log for " + monthMap[route.params.month] + String(route.params.year)}</Text>
      </View>
      <ScrollView 
        refreshControl={
            <RefreshControl
                refreshing={loading}
                onRefresh={loadData}
            />
        }>
        <Table style={styles.table} borderStyle={{borderWidth: 1, borderColor: '#c8e1ff'}}>
          <Row data={['Name', 'Amount', 'Category', 'Date', 'Description', '']} style={styles.head} textStyle={styles.text}/>
          {
            transactions.map((rowData, index) => (
              <TableWrapper key={index} style={styles.row}>
                {
                  rowData.map((cellData, cellIndex) => (
                    <Cell key={cellIndex} data={cellIndex === 5 ? <Button title="X" onPress={() => {onClickDelete(rowData)}}/> : cellData} textStyle={styles.text}/>
                  ))
                }
              </TableWrapper>
            ))
          }
        </Table>
        {((currentMonth != route.params.month) || (currentYear != route.params.year)) && <Button title="Add a Transaction for this Month" onPress={() => navigation.navigate('AddTransaction', {month: route.params.month, year: route.params.year})}/> }
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      padding: 20, 
      paddingTop: 30, 
      backgroundColor: '#fff'
    },
    head: { 
      height: 40, 
      backgroundColor: '#f1f8ff'
    },
    text: { 
      fontSize: 9,
      margin: 6
    },
    table: { 
      margin: 10,
      marginTop: 25, 
      justifyContent: 'center'
    },
    row: { 
      flexDirection: 'row'
    },
    header: {  
      alignItems: 'center',
      paddingTop: 20
    },
    headerText: { 
      fontSize: 20
    },
  });