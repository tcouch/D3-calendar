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
var tomorrow = new Date(year,month,date+1);
var selected;

// Get Client ID and API key from secrets.json
var secrets = JSON.parse(secrets);
var CLIENT_ID = secrets.web.client_id;
var API_KEY = secrets.api_key;

// Array of API discovery doc URLs for APIs used by the calendar
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

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
  }
  return daysArray;
}

function selectBox() {
  selected.classed("selected",false);
  selected = d3.select(this);
  selected.classed("selected",true);
  selected.data = selected.datum();
  d3.select("#detailName")
    .html(function(){ return selected.data["longName"];});
}

// create the calendar
d3.select("#weekdayLabels").selectAll(".dayOfWeek")
  .data(weekdays)
  .enter()
    .append("div")
      .attr("class","dayOfWeek")
      .attr("id",function(d){return d;})
      .html(function(d){ return "<p>" + d.substring(0, 2) + "</p>" ;});

function getMonthEvents(iMonth,iYear) {
  var firstDay = new Date(iYear, iMonth, 1);
  var nDays = daysInMonth(iMonth, iYear);
  var lastDay = new Date(iYear, iMonth, nDays);
  var firstDayStr = firstDay.toISOString();
  var lastDayStr = lastDay.toISOString();
  listUpcomingEvents(firstDayStr, lastDayStr);
}

function drawMonth(iMonth,iYear) {
  var dateBoxData = makeDaysArray(iMonth, iYear);
  getMonthEvents(iMonth, iYear);
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
  });

d3.select("#monthNext")
  .on("click", function(){
    nextMonthDate = new Date(year,month,32);
    month = nextMonthDate.getMonth();
    year = nextMonthDate.getFullYear();
    d3.selectAll(".dateBox").remove();
    drawMonth(month,year);
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
    console.log("promised");
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

/**
* Print the summary and start datetime/date of the next ten events in
* the authorized user's calendar. If no events are found an
* appropriate message is printed.
*/
function listUpcomingEvents(firstDayStr, lastDayStr) {
  console.log(firstDayStr,lastDayStr);
  gapi.client.calendar.events.list({
    'calendarId': 'hayleyptommyc@gmail.com',
    'timeMin': firstDayStr,
    'timeMax': lastDayStr,
    //'timeMax': tomorrow.toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 50,
    'orderBy': 'startTime'
  }).then(function(response) {
    var events = response.result.items;
    document.getElementById('content').innerHTML = "";
    appendPre('Upcoming events:');

    if (events.length > 0) {
      for (i = 0; i < events.length; i++) {
        var event = events[i];
        var when = event.start.dateTime;
        if (!when) {
          when = event.start.date;
        }
        appendPre(event.summary + ' (' + when + ')')
      }
    } else {
      appendPre('No upcoming events found.');
    }
  });
}

localStorage.setItem('thing1','[1,2,3,4,5]');
