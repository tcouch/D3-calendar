var   w = 800,
      h = 480,
      square = 60;
var   weekdayLabelHeight = square/3;

var weekdays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
                "Sunday"];
var months = ["January","February","March","April","May","June","July",
              "August","September","October","November","December"]

var today = new Date();
var date = today.getDate(),
    month = today.getMonth(),
    year = today.getFullYear();

function daysInMonth(iMonth, iYear)
{
return 32 - new Date(iYear, iMonth, 32).getDate();
}

function daysLastMonth(iMonth, iYear){
  return new Date(iYear, iMonth, 0).getDate();
}

function firstDayNumber(iMonth, iYear){
  var firstDay = new Date(iYear, iMonth, 1);
  return (firstDay.getDay()+6)%7;
}

function getBoxNumber(iDate, iMonth, iYear){
  firstDay = firstDayNumber(iMonth, iYear);
  boxNumber = firstDay + iDate - 1;
  return boxNumber;
}

function makeDaysArray(iMonth, iYear){
  daysArray = new Array(42);
  monthLength = daysInMonth(iMonth, iYear);
  monthStart = firstDayNumber(iMonth, iYear);
  console.log(monthStart);
  console.log(monthLength);
  var day = 1;
  for (i=monthStart; i< (monthLength+monthStart); i++) {
    daysArray[i] = {};
    daysArray[i]["number"] = day;
    daysArray[i]["month"] = iMonth;
    daysArray[i]["monthName"] = months[iMonth];
    daysArray[i]["year"] = iYear;
    daysArray[i]["notCurrent"] = false;
    day += 1;
  }
  day = 1;
  for (i=(monthLength+monthStart); i<42; i++) {
    daysArray[i] = {};
    daysArray[i]["number"] = day;
    daysArray[i]["month"] = (iMonth+1)%12;
    daysArray[i]["monthName"] = months[(iMonth+1)%12];
    daysArray[i]["year"] = iYear;
    daysArray[i]["notCurrent"] = true;
    day += 1;
  }
  lastMonthLength = daysLastMonth(iMonth, iYear);
  day = lastMonthLength - monthStart + 1
  for (i=0; i<monthStart; i++) {
    daysArray[i] = {};
    daysArray[i]["number"] = day;
    daysArray[i]["month"] = (iMonth-1)%12;
    daysArray[i]["monthName"] = months[(iMonth-1)%12];
    daysArray[i]["year"] = iYear;
    daysArray[i]["notCurrent"] = true;
    day += 1;
  }
  for (i=0; i<42; i++) {
    daysArray[i]["dayName"] = weekdays[i%7];
    daysArray[i]["ID"] = "box"+i;
    if ([1,21,31].indexOf(daysArray[i]["number"]) != -1 ) {
      daysArray[i]["suffix"] = "st";
    }
    else if ([2,22].indexOf(daysArray[i]["number"]) != -1 ) {
      daysArray[i]["suffix"] = "nd";
    }
    else if ([3,23].indexOf(daysArray[i]["number"]) != -1 ) {
      daysArray[i]["suffix"] = "rd";
    }
    else {
      daysArray[i]["suffix"] = "th";
    }
    daysArray[i]["longName"] = daysArray[i]["dayName"] + " "
                             + daysArray[i]["number"] + daysArray[i]["suffix"]
                             + " " + daysArray[i]["monthName"] + " "
                             + daysArray[i]["year"];
  }
  return daysArray;
}

function selectBox() {
  selected.classed("selected",false);
  selected = d3.select(this);
  selected.classed("selected",true);
  selected.data = selected.datum();
  d3.select("#detailBox")
    .html(function(){ return "<h3>"+selected.data["longName"]+"</h3>";});
}

var dateBoxData = makeDaysArray(month, year);
console.log(dateBoxData);

// create the calendar
d3.select("#weekdayLabels").selectAll(".dayOfWeek")
  .data(weekdays)
  .enter()
    .append("div")
      .attr("class","dayOfWeek")
      .attr("id",function(d){return d;})
      .html(function(d){ return d ;});

d3.select("#monthLayout").selectAll(".dateBox")
  .data(dateBoxData)
  .enter()
    .append("div")
      .attr("class", function(d) {
        return "dateBox " + d["dayName"];
      })
      .classed("notCurrent", function(d){ return d["notCurrent"]; })
      .on("click", selectBox)
      .attr("id",function(d){ return d["ID"]; })
      .html(function(d){ return "<p>"+d["number"]+"</p>";});

// select todayBox to start
var todayBoxNumber = getBoxNumber(date,month,year);
var selected = d3.select("#box"+todayBoxNumber)
selected.each(selectBox);
