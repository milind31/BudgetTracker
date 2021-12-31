import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { PieChart, ProgressChart, ContributionGraph, BarChart } from "react-native-chart-kit";
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

const monthMap = {
    1: 'January',
    2: 'February',
    3: 'March',
    4: 'April',
    5: 'May',
    6: 'June',
    7: 'July',
    8: 'August',
    9: 'September',
    10: 'October',
    11: 'November',
    12: 'December',
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

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
    const [barData, setBarData] = useState({labels: ['loading'], datasets: [{data:[100]}]});

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
                    var copyBudgetData = budgetData;
                    for (const [key, value] of Object.entries(rows['_array'][0])) {
                        if (value != -1 && key != 'user') {
                            copyBudgetData[key] = value;
                        }
                    }
                    setBudgetData(copyBudgetData);
                }
            );
        });


        var month = 12;
        var year = 2021;

        var sqlBlanks = []; //array to fill in sql query blanks
        var lastSixMonths = [];

        for(let i = 0; i < 6; i += 1) {
            sqlBlanks.push(month);
            sqlBlanks.push(year);
            lastSixMonths.push(month);
            month -= 1;
            if (month === 0) {
                month = 12;
                year -= 1;
            }
        }

        db.transaction((tx) => {
            tx.executeSql("select month, sum(amount) as amount from Transact where (month=? and year=?) or (month=? and year=?) or (month=? and year=?) or (month=? and year=?) or (month=? and year=?) or (month=? and year=?) group by month, year", sqlBlanks, (_, { rows }) =>
                {
                    var monthlyData = {};
                    for (let i = 0; i < rows.length; i += 1) {
                        monthlyData[rows['_array'][i]['month']] = rows['_array'][i]['amount'];
                    }
                    var labels = [];
                    var data = [];
                    for (let i = 0; i < 6; i += 1) {
                        labels.push(monthMap[lastSixMonths[i]]);
                        if (lastSixMonths[i] in monthlyData) {
                            data.push(monthlyData[lastSixMonths[i]]);
                        }
                        else {
                            data.push(0)
                        }
                    }
                    setBarData({labels: labels, datasets: [{data:data}]});
                }
            );
        });

        db.transaction((tx) => {
            tx.executeSql("select category, sum(amount) as amount from Transact where month=12 and type='Expense' group by category", [], (_, { rows }) =>
                {
                    var tempCategoryData = [];
                    var sum = 0;
                    var copyBudgetData = budgetData;
                    var purchasedCategories = new Set();
                    for (let i = 0; i < rows.length; i += 1) {
                        const amount = rows["_array"][i]['amount'];
                        const category = rows["_array"][i]['category'];
                        const mappedCategory = categoryMap[category];
                        sum += amount; //get total amount spent

                        if (mappedCategory in copyBudgetData) {
                            if (amount != 0) { 
                                purchasedCategories.add(mappedCategory);
                                var originalValue = copyBudgetData[mappedCategory];
                                copyBudgetData[mappedCategory] = amount / originalValue;
                            }
                        }

                        const pieChartCategory = {
                            name: category === 'Fast Food/Restaurant' ? 'Eating Out' : category,
                            amount: amount,
                            color: '#' + Math.floor(Math.random()*16777215).toString(16),
                            legendFontColor: "#7F7F7F",
                            legendFontSize: 15
                        }
                        tempCategoryData.push(pieChartCategory);
                    }
                    var tempProgressData = [];
                    var tempProgressLabels = [];
                    var overBudgetCopy = [];

                    for (const [key, value] of Object.entries(copyBudgetData)) {
                        if (!(purchasedCategories.has(key))) {
                            continue;
                        }
                        if (value <= 1) {
                            tempProgressData.push(parseFloat(value.toFixed(2)));
                            tempProgressLabels.push(key);
                        }
                        else {
                            overBudgetCopy.push(key.toString() + ":   " + ((100*value).toFixed(0)).toString() + '%');
                        }
                    }
                    setOverBudget(overBudgetCopy);
                    setProgressData({data: tempProgressData, labels: tempProgressLabels});
                    setCategoryData(tempCategoryData);
                    setMonthlyTotal(sum.toFixed(2));
                }
            );
        });
    }, []);

  return (
    <SafeAreaView style={styles.mainContainer}>
        <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.monthlySpending}>
            <Text>Your monthly spending is: </Text>
            <Text style={styles.monthlyTotal}>${monthlyTotal}</Text>
            <Text>Net Monthly Balance: ${netMonthlyChange}</Text>
        </View>
        <PieChart
            data={categoryData}
            width={screenWidth}
            height={150}
            chartConfig={chartConfig}
            accessor={"amount"}
            backgroundColor={"transparent"}
            paddingLeft={-15}
            absolute
        />
        <View style={styles.progressChart}>
            <ProgressChart
                data={progressData}
                width={screenWidth*1}
                height={200}
                strokeWidth={10}
                radius={50}
                chartConfig={chartConfig}
                hideLegend={false}
            />
        </View>
        <Text style={styles.overBudget}>Categories Over Budget:</Text>
        {overBudget.map((str) => <Text>{str}</Text>)}
        <Button title="Set Budget"  onPress={() => navigation.navigate('SetBudget')}></Button>
        <View style={styles.contributionGraph}>
            <ContributionGraph
                values={contribData}
                endDate={"2022-01-01" /* first day of next month */}
                numDays={105}
                width={screenWidth}
                showMonthLabels={true}
                height={220}
                chartConfig={chartConfig}
            />
            <Button title="View Transactions"  onPress={() => navigation.navigate('TransactionLog')}></Button>
        </View>
        <BarChart
            data={barData}
            width={screenWidth}
            height={220}
            yAxisLabel="$"
            chartConfig={chartConfig}
            verticalLabelRotation={30}
        />
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingTop: 25,
        paddingBottom: 50,
      },
    mainContainer: {
        backgroundColor: '#fff',
      },
    monthlyTotal: {
        fontSize: 75,
    },
    progressChart: {
        marginLeft: -80,
        padding: 20,
        paddingTop: 50,
    },
    overBudget: {
        fontSize: 20,
        paddingBottom: 10,
    },
    contributionGraph: {
        padding: 50,
    },
    monthlySpending: {
        alignItems:'center',
        padding: 25,
    },
})