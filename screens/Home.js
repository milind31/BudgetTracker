//Import from react
import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Button, SafeAreaView, ScrollView, Dimensions, ActivityIndicator } from 'react-native';

//Other imported components
import RNPickerSelect from 'react-native-picker-select';
import { PieChart, ProgressChart, ContributionGraph, BarChart } from "react-native-chart-kit";

//Imports from helper files
import openDatabase from '../database';
import { simpleCategoryMap, formalCategoryMap, monthMap, colorMap } from '../constants/maps';
import { getFirstDayOfNextMonth } from '../utilities/dates';
import { pickerSelectStyles } from '../styles/styles';

const db = openDatabase();
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;
const currentMonth = parseInt(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}).split('/')[0]);
const currentYear = parseInt(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}).split('/')[2]);
const chartConfig = {
    backgroundGradientFrom: "#1E2923",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(80, 90, 45, ${opacity})`,
    barPercentage: 0.6,
};

export default function Home({ navigation }) {
    const [month, setMonth] = useState({month: currentMonth, year: currentYear});

    const [monthlyTotal, setMonthlyTotal] = useState(0.00);
    const [netMonthlyChange, setNetMonthlyChange] = useState(0.00)
    const [categoryData, setCategoryData] = useState([]);
    const [budgetData, setBudgetData] = useState({})
    const [progressData, setProgressData] = useState({labels:[], data: []});
    const [overBudget, setOverBudget] = useState([]);
    const [contribData, setContribData] = useState([]);
    const [barData, setBarData] = useState({labels: ['loading'], datasets: [{data:[100]}]});
    const [monthPicker, setMonthPicker] = useState([]);
    
    const [hasBudget, setHasBudget] =  useState(false);
    const [hasExpense, setHasExpense] = useState(false);
    
    const [netMonthlyChangeLoaded, setNetMonthlyChangeLoaded] = useState(false);
    const [contribDataLoaded, setContribDataLoaded] = useState(false);
    const [budgetDataLoaded, setBudgetDataLoaded] = useState(false);
    const [barChartDataLoaded, setBarChartDataLoaded] = useState(false);
    const [categoryDataLoaded, setCategoryDataLoaded] = useState(false);

    const getNetMontlyChangeData = () => {
        //get and set net difference in expense and income
        db.transaction((tx) => {
            tx.executeSql("select type, sum(amount) as amount from Transact where type='Income' and month=? and year=? group by type", [month.month, month.year], (_, { rows }) =>
                {
                    var income = rows.length > 0 ? rows["_array"][0]['amount'] : 0;
                    tx.executeSql("select type, sum(amount) as amount from Transact where type='Expense' and month=? and year=? group by type", [month.month, month.year], (_, { rows }) =>
                        {
                            var expense = rows.length > 0 ? rows["_array"][0]['amount'] : 0
                            setNetMonthlyChange((income - expense).toFixed(2));
                            setNetMonthlyChangeLoaded(true);
                        }
                    );
                }
            );
        });
    }

    const getContributionData = () => {
        //contribution chart
        db.transaction((tx) => {
            tx.executeSql("select month, day, year, count(*) as count from Transact group by month, day, year ", [], (_, { rows }) =>
                {
                    var data = [];
                    for (let i = 0; i < rows.length; i += 1) {
                        let month= rows['_array'][i]['month'];
                        let day = rows['_array'][i]['day'];
                        let year = rows['_array'][i]['year'];
                        const contribution = {
                            date: year.toString() + '-' + (month < 10 ? '0' : '') + month.toString() + '-' +  (day < 10 ? '0' : '') + day.toString(),
                            count: rows['_array'][i]['count']
                        }
                        data.push(contribution);
                    }
                    setContribData(data);
                    setContribDataLoaded(true);
                }
            );
        });
    };

    const getBudgetData = () => {
        db.transaction((tx) => {
            tx.executeSql("select * from Budget", [], (_, { rows }) =>
                {
                    if (rows.length === 0) {
                        setHasBudget(false);
                        setBudgetDataLoaded(true);
                        return
                    }
                    setHasBudget(true);
                    var copyBudgetData = budgetData;
                    for (const [key, value] of Object.entries(rows['_array'][0])) {
                        if (value != -1 && key != 'user') {
                            copyBudgetData[key] = value;
                        }
                    }
                    setBudgetData(copyBudgetData);
                    console.log('budget done');

                    setBudgetDataLoaded(true);
                }
            );
        });
    };

    const getBarChartData = () => {
        var m = month.month;
        var y = month.year;

        var sqlBlanks = []; //array to fill in sql query blanks
        var lastSixMonths = [];

        for(let i = 0; i < 6; i += 1) {
            sqlBlanks.push(m);
            sqlBlanks.push(y);
            lastSixMonths.push(m);
            m -= 1;
            if (m === 0) {
                m = 12;
                y -= 1;
            }
        }

        db.transaction((tx) => {
            tx.executeSql("select month, sum(amount) as amount from Transact where ((month=? and year=?) or (month=? and year=?) or (month=? and year=?) or (month=? and year=?) or (month=? and year=?) or (month=? and year=?)) and type='Expense' group by month, year", sqlBlanks, (_, { rows }) =>
                {
                    var monthlyData = {}; //map month to amount spent that month
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
                    setBarData({labels: labels.reverse(), datasets: [{data:data.reverse()}]});
                    console.log('bar done');

                    setBarChartDataLoaded(true);
                }
            );
        });
    };

    const getCategoryData = () => {
        db.transaction((tx) => {
            tx.executeSql("select category, sum(amount) as amount from Transact where month=? and year=? and type='Expense' group by category", [month.month, month.year], (_, { rows }) =>
                {
                    rows.length === 0 ? setHasExpense(false) : setHasExpense(true);

                    var tempCategoryData = [];
                    var sum = 0;
                    var copyBudgetData = budgetData;
                    var purchasedCategories = new Set();

                    for (let i = 0; i < rows.length; i += 1) {
                        const amount = rows["_array"][i]['amount'];
                        const category = rows["_array"][i]['category'];
                        const mappedCategory = simpleCategoryMap[category];
                        
                        sum += amount; //get total amount spent

                        //determine whether returned categories have a budget
                        if (mappedCategory in copyBudgetData) {
                            if (amount != 0) { 
                                purchasedCategories.add(mappedCategory);
                                var originalValue = copyBudgetData[mappedCategory];
                                copyBudgetData[mappedCategory] = amount / originalValue;
                            }
                        }

                        //populate pie chart data
                        const pieChartCategory = {
                            name: category === 'Fast Food/Restaurant' ? 'Eating Out' : category,
                            amount: amount,
                            color: colorMap[category],
                            legendFontColor: "#7F7F7F",
                            legendFontSize: 12
                        }
                        tempCategoryData.push(pieChartCategory);
                    }
                    var progressValues = [];
                    var progressLabels = [];
                    var overBudgetCategories = [];

                    //organize categories with budget into no spending, under budget, and over budget
                    for (const [key, value] of Object.entries(copyBudgetData)) { //no budget
                        if (!(purchasedCategories.has(key))) {
                            continue;
                        }
                        if (value <= 1) { //add to progress chart
                            progressValues.push(parseFloat(value.toFixed(2)));
                            progressLabels.push(formalCategoryMap[key]);
                        }
                        else { //over budget
                            overBudgetCategories.push(formalCategoryMap[key.toString()] + ":   " + ((100*value).toFixed(0)).toString() + '%');
                        }
                    }
                    setOverBudget(overBudgetCategories);
                    setProgressData({data: progressValues, labels: progressLabels});
                    setCategoryData(tempCategoryData);
                    setMonthlyTotal(sum.toFixed(2));
                    console.log('cat done');
                    setCategoryDataLoaded(true);
                }
            );
        });
    }

    const setData = () => {
        setNetMonthlyChangeLoaded(false);
        setBudgetDataLoaded(false);
        setContribDataLoaded(false);
        setBarChartDataLoaded(false);
        setCategoryDataLoaded(false);

        getNetMontlyChangeData();
        getContributionData();
        getBudgetData();
        getBarChartData();
        getCategoryData();
    }
    

    useEffect(() => {
        console.log('picker set');
        db.transaction((tx) => {
            tx.executeSql("select month, year from Transact group by month, year ", [], (_, { rows }) =>
                {
                    let monthPickerItems = [];
                    for (let i = 0; i < rows.length; i += 1) {
                        let row = rows['_array'][i];
                        monthPickerItems.push({label: monthMap[row['month']] + ' ' + row['year'], value: {month: row['month'], year: row['year']}})
                    }
                    setMonthPicker(monthPickerItems);
                }
            );
            setData();
        });
        const unsubscribe = navigation.addListener('focus', () => {
            setData();
          });
      
          return unsubscribe;
    }, [navigation]);

  return (
    <SafeAreaView style={styles.mainContainer}>
        {(netMonthlyChangeLoaded && budgetDataLoaded && contribDataLoaded && barChartDataLoaded && categoryDataLoaded)  ?
        <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.monthlySpending}>
            <Text>Your monthly spending is: </Text>
            <Text style={styles.monthlyTotal}>${monthlyTotal}</Text>
            <Text>Net Monthly Balance: {netMonthlyChange >= 0 ? '$' + String(netMonthlyChange) : '-$' + String(netMonthlyChange * -1)}</Text>
            <RNPickerSelect
                style={pickerSelectStyles}
                placeholder={{
                    label: 'Change month...',
                    value: null,
                    color: '#9EA0A4',
                }}
                value={month}
                onDonePress={() => setData()}
                onValueChange={(value) => setMonth(value)}
                items={monthPicker}
            />
        </View>
        {hasExpense && <PieChart
            data={categoryData}
            width={screenWidth}
            height={150}
            chartConfig={chartConfig}
            accessor={"amount"}
            backgroundColor={"transparent"}
            paddingLeft={-15}
            absolute
        />}
        {hasBudget && hasExpense && progressData.data.length > 0 && 
        <View style={styles.progressChart}>
            <ProgressChart
                data={progressData}
                width={screenWidth}
                height={200}
                strokeWidth={10}
                radius={30}
                chartConfig={chartConfig}
                hideLegend={false}
            />
        </View>}
        {hasBudget && hasExpense && ( overBudget.length > 0 ? <Text style={styles.overBudget}>Categories Over Budget:</Text> : <Text style={styles.overBudget}>No categories over budget!</Text>)}
        {hasBudget && !!!(hasExpense) && <Text style={styles.overBudget}>You have not spent any money this month!</Text>}
        {!!!(hasBudget) && hasExpense && <Text style={styles.overBudget}>You have not yet specified a budget!</Text>}
        {hasBudget && hasExpense && overBudget.map((str) => <Text>{str}</Text>)}
        {hasBudget ? 
            <Button title="Adjust Budget" onPress={() => navigation.navigate('SetBudget')}></Button> 
            :
            <Button title="Set Budget" onPress={() => navigation.navigate('SetBudget')}></Button>
        }
        <View style={styles.contributions}>
            <Text style={styles.sectionHeader}>Transaction History</Text>
            <View>
                <ContributionGraph
                    values={contribData}
                    endDate={getFirstDayOfNextMonth(month.month, month.year)}
                    numDays={100}
                    width={screenWidth}
                    height={220}
                    chartConfig={chartConfig}
                />
            </View>
            <Button title="View Transactions Log"  onPress={() => navigation.navigate('TransactionLog', month)}></Button>
        </View>
        <Text style={styles.sectionHeader}>Last Six Months</Text>
        <BarChart
            data={barData}
            width={screenWidth/1.1}
            height={275}
            yAxisLabel="$"
            chartConfig={chartConfig}
            verticalLabelRotation={30}
        />
        </ScrollView>
        : 
        <ScrollView contentContainerStyle={styles.container}>
            <ActivityIndicator style={{height: screenHeight/1.25}} size='large' color="#0000ff"/>
        </ScrollView>
        }
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
        marginLeft: -125,
        padding: 20,
        paddingTop: 30,
    },
    overBudget: {
        fontSize: 20,
        paddingBottom: 10,
    },
    contributions: {
        padding: 50,
        alignItems: 'center',
    },
    contributionGraph: {
        paddingRight: 25,
    },
    monthlySpending: {
        alignItems:'center',
        padding: 25,
    },
    loader: {
        alignItems: 'center',
        flex: 0.5,
        justifyContent: 'center'
    },
    sectionHeader: {
        fontSize: 30,
        padding: 20,
    }
});