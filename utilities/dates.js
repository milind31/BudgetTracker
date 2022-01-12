export var getFirstDayOfNextMonth = (month, year) => {
    month += 1;
    if (month === 13) {
        month = 1;
        year += 1;
    }
    return ( `${String(year)}-${(month >= 10 ? String(month) : ('0' + String(month)))}-01` )
}

export const currentMonth = parseInt(new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}).split('/')[0]);
export const currentYear = parseInt(new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}).split('/')[2]);
export const currentDay = parseInt(new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}).split('/')[1]);;

export var getMaxDayInMonth = (month, year) => {
    if (month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
        return 31;
    }
    else if (month === 4 || month === 6 || month === 9 || month === 11) {
         return 30;
    }
    else {
        return (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) ? 29 : 28;
    }
}