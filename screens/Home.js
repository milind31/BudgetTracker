import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { PieChart } from "react-native-chart-kit";
import { StyleSheet, View, Text, Button } from 'react-native';
import { Dimensions } from "react-native";

//Imports from helper files
import openDatabase from '../database';
import { useEffect, useState } from 'react';

const db = openDatabase();

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
    backgroundGradientFrom: "#1E2923",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0.5,
    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
    barPercentage: 0.5,
  };

export default function Home({ navigation }) {
    const [monthlyTotal, setMonthlyTotal] = useState(0.00);
    const [netMonthlyChange, setNetMonthlyChange] = useState(0.00)
    const [categoryData, setCategoryData] = useState([]);

    useEffect(() => {
        db.transaction((tx) => {
            tx.executeSql("select * from Transact where month=12 and type='Expense'", [], (_, { rows }) =>
                {
                    console.log(rows);
                    var sum = 0;
                    for (let i = 0; i < rows.length; i += 1) {
                        sum += rows["_array"][i]['amount'];
                    }
                    setMonthlyTotal(sum.toFixed(2));
                }
            );
        });

        db.transaction((tx) => {
            tx.executeSql("with s1 as (select type, sum(amount) as amount from Transact where type='Income' group by type), s2 as (select type, sum(amount) as amount from Transact where type='Expense' group by type) select (s1.amount - s2.amount) as netDiff from s1, s2", [], (_, { rows }) =>
                {
                    if (rows.length > 0) {
                        setNetMonthlyChange((rows["_array"][0]['netDiff']).toFixed(2));
                    }
                }
            );
        });

        db.transaction((tx) => {
            tx.executeSql("select category, sum(amount) as amount from Transact where month=12 and type='Expense' group by category", [], (_, { rows }) =>
                {
                    var data = [];
                    for (let i = 0; i < rows.length; i += 1) {
                        const category = {
                            name: rows["_array"][i]['category'] === 'Fast Food/Restaurant' ? 'Eating Out' : rows["_array"][i]['category'],
                            amount: rows["_array"][i]['amount'],
                            color: '#' + Math.floor(Math.random()*16777215).toString(16),
                            legendFontColor: "#7F7F7F",
                            legendFontSize: 15
                        }
                        data.push(category);
                    }
                    setCategoryData(data);
                }
            );
        });
    }, []);

  return (
    <SafeAreaView style={styles.container}>
        <Text>Your monthly spending is: </Text>
        <Text style={styles.monthlyTotal}>${monthlyTotal}</Text>
        <Text>Net Monthly Balance: ${netMonthlyChange}</Text>
        <PieChart
            data={categoryData}
            width={screenWidth}
            height={200}
            chartConfig={chartConfig}
            accessor={"amount"}
            backgroundColor={"transparent"}
            absolute
        />
        <Button title="View Transactions"  onPress={() => navigation.navigate('TransactionLog')}></Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      },
    monthlyTotal: {
        fontSize: 75,
    }
})