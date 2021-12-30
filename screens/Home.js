import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { PieChart, ProgressChart, ContributionGraph } from "react-native-chart-kit";
import { StyleSheet, View, Text, Button } from 'react-native';
import { Dimensions } from "react-native";

//Imports from helper files
import openDatabase from '../database';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

const db = openDatabase();

const screenWidth = Dimensions.get("window").width;

//convert frontend category names to simplified variable names for backend
const categoryMap = {
    'Fast Food/Restaurant' : 'restaurant',
    'Entertainment' : 'entertainment',
    'Groceries' : 'groceries',
    'Home Stuff' : 'home',
    'Other' : 'other',
    'Transportation' : 'transportation'
}

// each value represents a goal ring in Progress chart
const data = {
    labels: ["Swim", "Bike", "Run"], // optional
    data: [0.4, 0.6, 0.8]
  };

const chartConfig = {
    backgroundGradientFrom: "#1E2923",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(123, 123, 146, ${opacity})`,
    barPercentage: 0.5,
  };

export default function Home({ navigation }) {
    const [monthlyTotal, setMonthlyTotal] = useState(0.00);
    const [netMonthlyChange, setNetMonthlyChange] = useState(0.00)
    const [categoryData, setCategoryData] = useState([]);
    const [budgetData, setBudgetData] = useState({})
    const [progressData, setProgressData] = useState({labels:[], data: []});
    const [overBudget, setOverBudget] = useState([]);
    const [contribData, setContribData] = useState([]);


    useEffect(() => {
        //get net difference in expense and income
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
            tx.executeSql("select month, day, year, count(*) as count from Transact group by month, day, year ", [], (_, { rows }) =>
                {
                    var data = [];
                    for (let i = 0; i < rows.length; i += 1) {
                        const contribution = {
                            date: rows['_array'][i]['year'].toString() + '-' + rows['_array'][i]['month'].toString() + '-' + rows['_array'][i]['day'].toString(),
                            count: rows['_array'][i]['count']
                        }
                        data.push(contribution);
                    }
                    setContribData(data);
                }
            );
        });

        db.transaction((tx) => {
            tx.executeSql("select * from Budget", [], (_, { rows }) =>
                {
                    for (const [key, value] of Object.entries(rows['_array'][0])) {
                        var copyBudgetData = budgetData;
                        if (value != -1 && key != 'user') {
                            copyBudgetData[key] = value;
                        }
                        setBudgetData(copyBudgetData);
                    }
                }
            );
        });

        db.transaction((tx) => {
            tx.executeSql("select category, sum(amount) as amount from Transact where month=12 and type='Expense' group by category", [], (_, { rows }) =>
                {
                    var tempCategoryData = [];
                    var sum = 0;
                    for (let i = 0; i < rows.length; i += 1) {
                        sum += rows["_array"][i]['amount']; //get total amount spent

                        console.log(rows["_array"][i]['category'])
                        if (categoryMap[rows["_array"][i]['category']] in budgetData) {
                            budgetData[categoryMap[rows["_array"][i]['category']]] = rows["_array"][i]['amount'] / budgetData[categoryMap[rows["_array"][i]['category']]];
                        }

                        const category = {
                            name: rows["_array"][i]['category'] === 'Fast Food/Restaurant' ? 'Eating Out' : rows["_array"][i]['category'],
                            amount: rows["_array"][i]['amount'],
                            color: '#' + Math.floor(Math.random()*16777215).toString(16),
                            legendFontColor: "#7F7F7F",
                            legendFontSize: 15
                        }
                        tempCategoryData.push(category);
                    }
                    var tempProgressData = [];
                    var tempProgressLabels = [];
                    var overBudgetCopy = [];

                    for (const [key, value] of Object.entries(budgetData)) {
                        if (value <= 1) {
                            tempProgressData.push(value);
                            tempProgressLabels.push(key);
                        }
                        else {
                            overBudgetCopy.push(key.toString() + "   " + ((100*value).toFixed(0)).toString() + '%');
                        }
                    }

                    setOverBudget(overBudgetCopy);

                    setProgressData({data: tempProgressData, labels: tempProgressLabels});

                    setCategoryData(tempCategoryData);
                    setMonthlyTotal(sum.toFixed(2));
                }
            );
        });
        console.log((new Date(2022, 12, 0)).toDateString('yyyy-mm-dd'));
    }, []);

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView>
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
        <ProgressChart
            data={progressData}
            width={screenWidth}
            height={220}
            strokeWidth={16}
            radius={32}
            chartConfig={chartConfig}
            hideLegend={false}
        />
        <Text>Over Budget:</Text>
        {overBudget.map((str) => <Text>{str}</Text>)}
        <ContributionGraph
            values={contribData}
            endDate={"2022-01-01" /* first day of next month */}
            numDays={105}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
        />
        <Button title="Set Budget"  onPress={() => navigation.navigate('SetBudget')}></Button>
        <Button title="View Transactions"  onPress={() => navigation.navigate('TransactionLog')}></Button>
        </ScrollView>
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