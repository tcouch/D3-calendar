//screen dimensions based on Raspberry Pi 7" touchscreen
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
var selected;
var currentEvent;
var eventsList;
var dateBoxData;

// Calendar ID
var CALENDAR_ID = 'hayleyptommyc@gmail.com'

// Get Client ID and API key from secrets.json
var secrets = JSON.parse(secrets);
var CLIENT_ID = secrets.web.client_id;
var API_KEY = secrets.api_key;

// Array of API discovery doc URLs for APIs used by the calendar
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
//var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
var SCOPES = "https://www.googleapis.com/auth/calendar";

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

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

function getBoxID(iDate, iMonth, iYear){
  var firstDay = firstDayNumber(iMonth, iYear);
  var boxNumber = firstDay + iDate - 1;
  return "#box" + boxNumber;
}

function makeDaysArray(iMonth, iYear){
  var daysArray = new Array(42);
  var monthLength = daysInMonth(iMonth, iYear);
  var monthStart = firstDayNumber(iMonth, iYear);
  var prevMonthYear = new Date(iYear,iMonth,0).getFullYear();
  var prevMonthLength = daysLastMonth(iMonth, iYear);
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
    daysArray[i]["year"] = new Date(iYear,iMonth,32).getFullYear();
    daysArray[i]["notCurrent"] = true;
    day += 1;
  }
  day = prevMonthLength - monthStart + 1
  for (i=0; i<monthStart; i++) {
    daysArray[i] = {};
    daysArray[i]["number"] = day;
    daysArray[i]["month"] = (iMonth-1)%12;
    daysArray[i]["monthName"] = months[(iMonth+11)%12];
    daysArray[i]["year"] = prevMonthYear;
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
    daysArray[i]["events"] = [];
  }
  return daysArray;
}

function selectEvent() {
  d3.selectAll(".eventSummary")
      .style("display", "none");
  currentEvent = d3.select(this);
  currentEvent.style("display","block")
      .transition()
      .duration(500)
      .style("background-color","#8F993E")
      .style("height","366px")
      .style("cursor","default");
  currentEvent.on("click",null);
  currentEvent.insert("div",":first-child")
      .attr("class","clsBtn")
      .html("X")
      .on("click",unSelectEvent);
  currentEvent.insert("div")
      .attr("class","delBtn")
      .html("Delete")
      .on("click", questionDelete);
  if (currentEvent.datum().hasOwnProperty('location')) {
    currentEvent.append("p")
      .attr("class","locDesc")
      .html(currentEvent.datum().location);
  };
  if (currentEvent.datum().start.hasOwnProperty('date')) {
    currentEvent.append("p")
      .html("Starts: " + currentEvent.datum().start.date);
    currentEvent.append("p")
      .html("Ends: " + currentEvent.datum().end.date);
  };
  if (currentEvent.datum().start.hasOwnProperty('dateTime')) {
    currentEvent.append("p")
      .html("Starts: " + currentEvent.datum().start.dateTime.substring(11,16));
    currentEvent.append("p")
      .html("Ends: " + currentEvent.datum().end.dateTime.substring(11,16));
  };
  if (currentEvent.datum().hasOwnProperty('description')) {
    currentEvent.append("div")
      .attr("class","eventDescription")
      .html("<p>Description:</p> <p>" + currentEvent.datum().description + "</p>")
  };
}

function unSelectEvent(event) {
  d3.event.stopPropagation();
  var thisEvent = d3.select(this);
  d3.select(".clsBtn").remove();
  d3.select(".delBtn").remove();
  thisEvent.transition()
            .duration(0)
            .style("height","20px")
            .style("background-color","#AC145A")
            .on("end", function(d){
                d3.selectAll(".eventSummary")
                  .attr("style", null)
                  .on("click",selectEvent)
                  .selectAll("p, div").remove();
                  });
}

function questionDelete() {
  var qBox = d3.select("body").append("div").attr("class","yesNo");;
  qBox.html("<h4>Are you sure you want to delete this event?</h4>")
  var bBox = qBox.append("div").attr("class","btnContainer");
  bBox.append("div")
        .html("Yes")
        .on("click",deleteEvent);
  bBox.append("div")
        .html("No")
        .on("click", function(){d3.select(".yesNo").remove();});
}

function deleteEvent() {
  d3.select(".yesNo").remove();
  gapi.client.calendar.events.delete({
    'calendarId': CALENDAR_ID,
    'eventId': currentEvent.datum().id
  }).execute(function(response) {
            if(response.error || response == false){
                alert('Error');
            }
            else{
              currentEvent.remove();
              d3.selectAll(".eventSummary")
                .attr("style",null)
                .on("click",selectEvent)
                .selectAll("p, div").remove();
            }
    });
}

function selectBox() {
  selected.classed("selected",false);
  selected = d3.select(this);
  selected.classed("selected",true);
  selected.data = selected.datum();
  d3.select("#detailName")
    .html(function(){ return selected.data["longName"];});
  d3.selectAll(".eventSummary").remove();
  d3.select("#daysEvents").selectAll(".eventSummary")
    .data(selected.data.events)
    .enter()
      .append("div")
      .attr("class","eventSummary")
      .html(function(d){ return "<h4>" + d.summary + "</h4>";})
      .on("click", selectEvent);
}

// create the calendar
d3.select("#weekdayLabels").selectAll(".dayOfWeek")
  .data(weekdays)
  .enter()
    .append("div")
      .attr("class","dayOfWeek")
      .attr("id",function(d){return d;})
      .html(function(d){ return "<h3>" + d.substring(0, 2) + "</h3>" ;});

function getMonthEvents(iMonth,iYear) {
  var firstDay = new Date(iYear, iMonth, 1);
  var nDays = daysInMonth(iMonth, iYear);
  var lastDay = new Date(iYear, iMonth, nDays);
  var firstDayStr = firstDay.toISOString();
  var lastDayStr = lastDay.toISOString();
  console.log('calling update...')
  updateEventsList(firstDayStr, lastDayStr, iMonth, iYear, addEventsData);
}

function addEventsData(iMonth, iYear) {
  console.log('running addEventsData');
  if (eventsList.length > 0) {
    for (i=0;i<eventsList.length;i++) {
      var event = eventsList[i];
      var start = event.start.dateTime;
      if (!start) {
        start = event.start.date;
      };
      var end = event.end.dateTime;
      if (!end) {
        end = event.end.date;
      };
      var month1 = parseInt(start.substring(5,7)) -1;
      var monthN = parseInt(end.substring(5,7)) -1;
      var year1 = parseInt(start.substring(0,4));
      var yearN = parseInt(end.substring(0,4));
      var day1 = parseInt(start.substring(8,10));
      var dayN = parseInt(end.substring(8,10));
      if (month1 != iMonth) { day1 = 1; };
      if (monthN != iMonth) { dayN = daysInMonth(iMonth, iYear) + 1;};
      do {
        for (j=0;j<42;j++) {
          if (dateBoxData[j]["number"] == day1 && dateBoxData[j].notCurrent == false) {
            dateBoxData[j]["events"].push(event);
          }
        }
        day1 += 1;
      } while (day1 < dayN);
    }
  }
  selected.each(selectBox);
}

function drawMonth(iMonth,iYear) {
  dateBoxData = makeDaysArray(iMonth, iYear);
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
  d3.select("#monthTitle h2")
    .html(months[iMonth] + " " + iYear);
}


d3.select("#monthPrev")
  .on("click", function(){
    prevMonthLastDay = new Date(year,month,0);
    month = prevMonthLastDay.getMonth();
    year = prevMonthLastDay.getFullYear();
    d3.selectAll(".dateBox").remove();
    drawMonth(month,year);
    getMonthEvents(month,year);
  });

d3.select("#monthNext")
  .on("click", function(){
    nextMonthDate = new Date(year,month,32);
    month = nextMonthDate.getMonth();
    year = nextMonthDate.getFullYear();
    d3.selectAll(".dateBox").remove();
    drawMonth(month,year);
    getMonthEvents(month,year);
  });

/**
*  On load, called to load the auth2 library and API client library.
*/
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
  console.log("load ok");
}

/**
*  Initializes the API client library and sets up sign-in state
*  listeners.
*/
function initClient() {
  console.log("initialising...")
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function() {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;

  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    drawMonth(month, year);
    selected = d3.select(getBoxID(date,month,year));
    selected.each(selectBox);
    getMonthEvents(month, year);
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
*  Sign out the user upon button click.
*/
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
* Append a pre element to the body containing the given message
* as its text node. Used to display the results of the API call.
*
* @param {string} message Text to be placed in pre element.
*/
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

// List all events in the period between firstDayStr and lastDayStr

function updateEventsList(firstDayStr, lastDayStr, iMonth, iYear, _callback) {
  gapi.client.calendar.events.list({
    'calendarId': CALENDAR_ID,
    'timeMin': firstDayStr,
    'timeMax': lastDayStr,
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 50,
    'orderBy': 'startTime'
  }).then(function(response) {
    eventsList = response.result.items;
    _callback(iMonth, iYear);
  }, console.log('Events list update unfulfilled'));
}
