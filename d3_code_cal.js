var square = 60;
var weekdayLabelHeight = square/3;

var weekdays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
                "Sunday"];
var months = ["January","February","March","April","May","June","July",
              "August","September","October","November","December"];
var imgSources = [];

var today, date, month, year;
var forecastLimit;
var selected;
var currentEvent;
var eventsList;
var dateBoxData;
var calendarTimer;
var slideTimer;
var pageToken;
var actionBarTimer;
var slidePosition = 6;
var imgCounter = 0;
var todaySummary = {};
var fiveDayForecast = [{},{},{},{},{}];

// Get Client ID and API keys from secrets.json
var secrets = JSON.parse(secrets);
var CLIENT_ID = secrets.web.client_id;
var GAPI_KEY = secrets.api_key;
var CALENDAR_ID = secrets.calendarId;
var DATAPOINT_KEY = secrets.DP_Key;

// Get weather icon classes from dp2icons.json
var dp2icons = JSON.parse(dp2icons);

// Array of API discovery doc URLs for APIs used by the calendar
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
                      "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
//var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
var SCOPES = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive";
var CALENDAR_KEEP_ALIVE_TIME = 10000;
var SLIDE_CYCLE_TIME = 20000;

var authorizeButton = d3.select("#authorize-button");
var signoutButton = d3.select("#signout-button");
var settingsMenu = d3.select("#settings-menu");
var detailBox = d3.select("#detailBox");
var signedIn;

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

function getDateSuffix(iDate){
  if ([1,21,31].indexOf(iDate) != -1 ) {
    return "st";
  }
  else if ([2,22].indexOf(iDate) != -1 ) {
    return "nd";
  }
  else if ([3,23].indexOf(iDate) != -1 ) {
    return "rd";
  }
  else {
    return "th";
  }
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
    daysArray[i]["date"] = new Date(daysArray[i]["year"],daysArray[i]["month"],day);
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
    daysArray[i]["date"] = new Date(daysArray[i]["year"],daysArray[i]["month"],day);
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
    daysArray[i]["date"] = new Date(daysArray[i]["year"],daysArray[i]["month"],day);
    daysArray[i]["notCurrent"] = true;
    day += 1;
  }
  for (i=0; i<42; i++) {
    daysArray[i]["dayName"] = weekdays[i%7];
    daysArray[i]["ID"] = "box"+i;
    daysArray[i]["suffix"] = getDateSuffix(daysArray[i]["number"]);
    daysArray[i]["longName"] = daysArray[i]["dayName"] + " "
                             + daysArray[i]["number"] + daysArray[i]["suffix"]
                             + " " + daysArray[i]["monthName"] + " "
                             + daysArray[i]["year"];
    daysArray[i]["events"] = [];
    daysArray[i]["weather"] = [];
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
  hideSettings();
  d3.select("#settings .menu-icon-container").classed("change",false);
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

function getMonthEvents(iMonth,iYear) {
  var firstDay = new Date(iYear, iMonth, 1);
  var nDays = daysInMonth(iMonth, iYear);
  var lastDay = new Date(iYear, iMonth, nDays);
  var firstDayStr = firstDay.toISOString();
  var lastDayStr = lastDay.toISOString();
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

function getFiveDayForecast(){
  fetch("http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/324153?res=daily&key=" + DATAPOINT_KEY)
    .then(function(response) {
      response.json().then(function(jResponse) {
        var periods = jResponse.SiteRep.DV.Location.Period;
        for (var i=0; i<5;i++) {
          console.log(periods[i]);
          var fD = periods[i].value.substring(8,10);
          var fM = periods[i].value.substring(5,7)-1;
          var fY = periods[i].value.substring(0,4);
          var forecastDate = new Date(fY,fM,fD);
          fiveDayForecast[i]["date"] = forecastDate;
          fiveDayForecast[i]["dayForecast"] = periods[i].Rep[0];
          fiveDayForecast[i]["nightForecast"] = periods[i].Rep[1];
        };
      });
    });
}

function addWeatherData() {
  console.log("Adding weather");
  fetch("http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/324153?res=daily&key=" + DATAPOINT_KEY)
    .then(function(response) {
      response.json().then(function(jsonData) {
        for (var i = 0; i < jsonData.SiteRep.DV.Location.Period.length; i++) {
          forecastDay = jsonData.SiteRep.DV.Location.Period[i].value.substring(8,10);
          forecastMonth = jsonData.SiteRep.DV.Location.Period[i].value.substring(5,7)-1;
          forecastYear = jsonData.SiteRep.DV.Location.Period[i].value.substring(0,4);
          forecastDate = new Date(forecastYear,forecastMonth,forecastDay);
          forecast = jsonData.SiteRep.DV.Location.Period[i].Rep[0];
          for (j = 0 ; j < 42; j++) {
            if (dateBoxData[j]["date"].getTime() === forecastDate.getTime()) {
              dateBoxData[j]["weather"].push(forecast);
              d3.select(".dateBox:nth-child("+(j+1)+")")
                .append("div")
                .attr("class","weatherDiv")
                .html(function(){
                  return "<p><i class='wi "+dp2icons[forecast["W"]]+"'></i><br />"+forecast["Dm"]+"&deg;C</p>"
                });
            };
          };

        };
      });
    });
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
        .html(function(d){
          return "<div class='dayNumber'>"+d["number"]+"</div>";
        });
  d3.select("#monthTitle h2")
    .html(months[iMonth] + " " + iYear);
  if (dateBoxData[0]["date"] <= forecastLimit && today <= dateBoxData[41]["date"]) {
    addWeatherData();
  };
}

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
    apiKey: GAPI_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function() {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.on("click", handleAuthClick);
    signoutButton.on("click", handleSignoutClick);
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    signedIn = true;
    if (settingsMenu.classed("showing")) {
      authorizeButton.classed("showing",false);
      signoutButton.classed("showing",true);
    };
    getImageSources();
    getMonthEvents(month, year);
  } else {
    signedIn = false;
    if (settingsMenu.classed("showing")) {
      authorizeButton.classed("showing",true);
      signoutButton.classed("showing",false);
    };
  };
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(d,i) {
  console.log("signing in")
  gapi.auth2.getAuthInstance().signIn();
}

/**
*  Sign out the user upon button click.
*/
function handleSignoutClick(d,i) {
  console.log("signing out")
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

function getImageSources() {
  gapi.client.drive.files.list({
    'pageSize': 100,
    'q': "mimeType='image/jpeg'",
    'pageToken': pageToken
  }).then(function(response) {
    pageToken = response.result.nextPageToken;
    var files = response.result.files;
    if (files && files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        //console.log(file.webContentLink);
        if (file.mimeType == "image/jpeg") {
          imgSources.push("https://drive.google.com/uc?export=view&id="+file.id)
        };
      }
      prepElevenSlides();
    } else {
      console.log('No files found.');
    };
  });
}

function hideSettings() {
  signoutButton.classed("showing",false);
  authorizeButton.classed("showing",false);
  detailBox.classed("showing",true);
  settingsMenu.classed("showing",false);
}

function showSettings() {
  settingsMenu.classed("showing",true);
  setTimeout(function(){
    detailBox.classed("showing",false);
    if (signedIn) {
      signoutButton.classed("showing",true);
    } else {
      authorizeButton.classed("showing",true);
    };
  },500);
}

function handleMenuClick() {
  this.classList.toggle("change");
  if (settingsMenu.classed("showing")) {
    hideSettings();
  } else {
    showSettings();
  };
}

function updateDateSummary(dateObject,summary){
  summary["date"] = dateObject.getDate();
  summary["month"] = dateObject.getMonth();
  summary["year"] = dateObject.getFullYear();
  summary["dayName"] = weekdays[(dateObject.getDay()-1)%7];
  summary["monthName"] = months[summary["month"]];
  summary["shortDate"] = summary["date"] + "/" + summary["month"] + "/"
                          + summary["year"].toString().substring(2);
  summary["longName"] =  summary["dayName"] + " "
                           + summary["date"] + getDateSuffix(summary["date"])
                           + " " + summary["monthName"] + " "
                           + summary["year"];
  summary["lastUpdate"] = new Date();
}

function updateTodaySummary(){
  d = new Date();
  updateDateSummary(d,todaySummary);
}

function launchCalendar(){
  // stop slideshow
  clearTimeout(slideTimer);
  d3.select("#carousel").classed("showing",false);
  clearTimeout(actionBarTimer);
  d3.select("#actionBar").classed("showing",false);
  // setup menu button
  d3.select("#settings .menu-icon-container")
    .on("click", handleMenuClick);
  d3.select("#detailBox").classed("showing",true);

  // weekday labels
  d3.select("#weekdayLabels").selectAll(".dayOfWeek")
    .data(weekdays)
    .enter()
      .append("div")
        .attr("class","dayOfWeek")
        .attr("id",function(d){return d;})
        .html(function(d){ return "<h3>" + d.substring(0, 2) + "</h3>" ;});

  // draw this month and select today
  today = new Date();
  date = today.getDate();
  month = today.getMonth();
  year = today.getFullYear();
  forecastLimit = new Date(year,month,date+5);
  d3.selectAll(".dateBox").remove();
  drawMonth(month,year);
  selected = d3.select(getBoxID(date,month,year));
  selected.each(selectBox);

  // make next/prev buttons work
  d3.select("#monthPrev")
    .on("click", function(){
      prevMonthLastDay = new Date(year,month,0);
      month = prevMonthLastDay.getMonth();
      year = prevMonthLastDay.getFullYear();
      d3.selectAll(".dateBox").remove();
      drawMonth(month,year);
      if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        getMonthEvents(month,year)
      };
    });
  d3.select("#monthNext")
    .on("click", function(){
      nextMonthDate = new Date(year,month,32);
      month = nextMonthDate.getMonth();
      year = nextMonthDate.getFullYear();
      d3.selectAll(".dateBox").remove();
      drawMonth(month,year);
      if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        getMonthEvents(month,year)
      };
    });
  // clicks on calendar reset timer
  d3.select("#calendarWrapper")
    .on("click", function(){
      console.log("staying alive...");
      restartCalendarTimer();
    });
//  start timer for Slideshow
  restartCalendarTimer();
}

function restartCalendarTimer(){
  clearTimeout(calendarTimer);
  calendarTimer = setTimeout(function(){
    launchSlideshow();
  },CALENDAR_KEEP_ALIVE_TIME);
}

function restartActionBarTimer(){
  clearTimeout(actionBarTimer);
  actionBarTimer = setTimeout(function(){
    d3.select("#actionBar")
      .classed("showing",false);
  },5000);
}

function showActionBar() {
  d3.select("#actionBar")
    .classed("showing",true)
    .on("click",function(){
      clearTimeout(actionBarTimer);
      actionBarTimer = setTimeout(function(){
        d3.select("#actionBar")
          .classed("showing",false);
      },5000);
    });
  restartActionBarTimer();
}

function prepElevenSlides() {
  for (var i=0; i<=10; i++) {
    d3.select("#carousel")
      .append("img")
        .attr("src",imgSources[imgCounter])
        .classed("slide",true)
        .on("click",showActionBar);
    imgCounter++;
  };
}

function removeSlide(position) {
  d3.select("#carousel img:nth-child("+position+")").remove();
}

function addSlide(end=true) {
  carousel=d3.select("#carousel");
  if (end) {
    carousel.append("img")
      .attr("src",imgSources[imgCounter])
      .classed("slide",true)
      .on("click",showActionBar);
  } else {
    var imgNumber = imgCounter - 12;
    if (imgNumber < 0) {
      imgNumber = imgNumber + 100;
    };
    carousel.insert("img",":first-child")
      .attr("src",imgSources[imgNumber])
      .classed("slide",true)
      .on("click",showActionBar);
  };
}

function showNextSlide(){
  removeSlide(1);
  addSlide();
  imgCounter++;
  if (imgCounter>99) {
    imgCounter=0;
  }
  if (currentImage) {
    currentImage.classed("showing",false);
  }
  currentImage = d3.select("#carousel img:nth-child("+slidePosition+")");
  currentImage.classed("showing",true);
  cycleSlideshow();
}

function showPreviousSlide(){
  removeSlide(11);
  addSlide(end=false)
  imgCounter--;
  if (imgCounter<0) {
    imgCounter=99;
  };
  if (currentImage) {
    currentImage.classed("showing",false);
  }
  currentImage = d3.select("#carousel img:nth-child("+slidePosition+")");
  currentImage.classed("showing",true);
  cycleSlideshow();
}

function handleNextSlideClick(){
  showNextSlide();
}

function handlePrevSlideClick(){
  showPreviousSlide();
}

function handleShowCalendarClick(){
  launchCalendar();
}

function cycleSlideshow() {
  clearTimeout(slideTimer);
  slideTimer = setTimeout(function () {
    showNextSlide();
  },SLIDE_CYCLE_TIME);
}

function launchSlideshow() {
  console.log("Launching slide show");
  d3.select("#carousel").classed("showing",true);
  currentImage = d3.select("#carousel img:nth-child("+slidePosition+")");
  currentImage.classed("showing",true);
  setupActionBar();
  cycleSlideshow();
}

function setupActionBar() {
  d3.select("#prev-slide").on("click",handlePrevSlideClick);
  d3.select("#next-slide").on("click",handleNextSlideClick);
  d3.select("#show-calendar").on("click",handleShowCalendarClick);
  updateTodaySummary();
  d3.select("#date-info")
    .html(function(){ return "<p>" + todaySummary["longName"] + "</p>" });
  d3.select("#weather-info")
    .html(function(){ return "<p><i class='wi "
                      + dp2icons[fiveDayForecast[0]["dayForecast"]["W"]]
                      + "'></i> "
                      + fiveDayForecast[0]["dayForecast"]["Dm"]
                      +"&deg;C</p>"});
}

launchCalendar();
getFiveDayForecast();
