import { StyleSheet } from 'react-native';

export const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
      padding: 10,
      margin: 15,
      borderWidth: 0.5,
      width: 300,
      height: 40,
      borderRadius: 7,
      color: 'black',
      paddingRight: 30, // to ensure the text is never behind the icon
    },
    inputAndroid: {
      fontSize: 16,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 0.5,
      width: 300,
      borderColor: 'purple',
      borderRadius: 8,
      color: 'black',
      paddingRight: 30, // to ensure the text is never behind the icon
    },
  });