export var getFirstDayOfNextMonth = (month, year) => {
    month += 1;
    if (month === 13) {
        month = 1;
        year += 1;
    }
    return ( String(year) + '-' + (month >= 10 ? String(month) : ('0' + String(month))) + '-01' )
}