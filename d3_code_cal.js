var   w = 800,
      h = 480,
      square = 60;
var   weekdayLabelHeight = square/3;

var weekday = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

var margin = {left:10,right:10,top:10,bottom:0};
var internalCalendarMargin = 10;
var today = new Date();
var month = today.getMonth(),
    year = today.getFullYear();

function daysInMonth(iMonth, iYear)
{
return 32 - new Date(iYear, iMonth, 32).getDate();
}

var numdays = daysInMonth(month,year);
var firstDay = new Date(year, month, 1);
var firstDayNumber = (firstDay.getDay()+6)%7;
var firstDayName = weekday[firstDayNumber];
var days = new Array(35);

console.log(numdays);
console.log(firstDayName);
var lastMonthDays = new Date(year, month, 0).getDate();


// create the calendar
d3.select("#weekdayLabels").selectAll(".dayOfWeek")
  .data(weekday)
  .enter()
    .append("div")
      .attr("class","dayOfWeek")
      .attr("id",function(d){return d;})
      .html(function(d){ return d ;});

d3.select("#monthLayout").selectAll(".dateBox")
  .data(days)
  .enter()
    .append("div")
      .attr("class", function(d,i) {
        return "dateBox " + weekday[i%7];
      });


// var svg = d3.select("body").append("svg").attr("width", w).attr("height", h);
//
// var calendar = svg.append("g").attr("id","calendar")
//                     .attr("transform","translate("+margin.left+","+margin.top+")");
//
//
// calendar.selectAll(".weekdayLabel")
//   .data(weekday)
//   .enter()
//     .append("g")
//       .attr("class","weekdayLabel")
//       .append("rect")
//       .attr("height",weekdayLabelHeight)
//       .attr("width",square)
//       .attr("fill","blue")
//       .attr("x",function(d,i){ return (square+internalCalendarMargin)*((i+6)%7); })
//       .attr("y",0);
//
// calendar.selectAll(".weekdayLabel")
//   .append("text")
//   .attr("transform",function(d,i){ return "translate("+((square+internalCalendarMargin)*((i+6)%7)+5)+",12)";})
//   .attr("font-size","0.5em")
//   .attr("fill", "white")
//   .text(function(d,i){ return weekday[i];});
//
// calendar.selectAll(".day")
//   .data(days)
//   .enter()
//     .append("g")
//       .attr("class","day")
//       .append("rect")
//       .attr("height",square)
//       .attr("width",square)
//       .attr("fill","pink")
//       .attr("x",function(d,i){ return (square+internalCalendarMargin)*((firstDayNumber+i-1)%7); })
//       .attr("y",function(d,i){ return (Math.floor((i+firstDayNumber-1)/7)*(square+internalCalendarMargin))+weekdayLabelHeight+internalCalendarMargin});
//
// calendar.selectAll(".day")
//   .append("text")
//   .attr("transform",function(d,i){ return "translate("+((square+internalCalendarMargin)*((firstDayNumber+i-1)%7)+2)+","+((Math.floor((firstDayNumber+i-1)/7)*(square+internalCalendarMargin)+15)+weekdayLabelHeight+internalCalendarMargin)+")";})
//   .attr("font-size","1em")
//   .attr("color", "black")
//   .text(function(d,i){ return (i+1).toString();});
