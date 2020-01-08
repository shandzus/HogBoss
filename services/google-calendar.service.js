
const { google } = require('googleapis');

var event = {
  'summary': 'Shirley Birthday',
  'description': 'No body really cares',
  'start': {
    'date': '2019-04-19',
  },
  'end': {
    'date': '2019-04-19',
  },
  'reminders': {
    'useDefault': false,
    'overrides': [
      {'method': 'email', 'minutes': 24 * 60},
      {'method': 'popup', 'minutes': 10},
    ],
  },
};

module.exports.listEvents = function (auth, cb) {
    const calendar = google.calendar({version: 'v3', auth});
    calendar.events.list({
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 2,
      singleEvents: true,
      orderBy: 'startTime',
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const events = res.data.items;
      if (events.length) {
        cb(events)
        //   console.log(events);
        // console.log('Upcoming 10 events:');
        // events.map((event, i) => {
        //     cb({start: event.start.dateTime || event.start.date, event: event.summary})
        // //   const start = event.start.dateTime || event.start.date;
        // //   console.log(`${start} - ${event.summary}`);
        // // cb(items);
        // });
      } else {
        console.log('No upcoming events found.');
      }
    });
  }


module.exports.insertEvent = function (auth, cb) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: event,
  }, (err, event) => {
    if (err) return console.log('The API returned an error during Event Insert: ' + err);
    console.log('Event created: %s', event.htmlLink);
    cb(event);
  });
}

module.exports.deleteEvent = function (auth, eventId) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.delete({
    auth: auth,
    calendarId: 'primary',
    eventId: eventId,
  }, (err) => {
    if (err) return console.log('The API returned an error during Event Delete: ' + err);
    console.log('Event deleted');
  });
}

module.exports.updateEvent = function (auth, eventId) {
  const calendar = google.calendar({version: 'v3', auth});
  const updEvent = event;

  calendar.events.get({
    calendarId: 'primary',
    eventId: eventId,
    resourse: updEvent
  }, (err, res) => {
    if (err) return console.log('The API returned an error during Event Get: ' + err);
    const event = res.data.items;
    console.log(updEvent);
  });

  updEvent.description = "Dave Cares"

  calendar.events.update({
    auth: auth,
    calendarId: 'primary',
    eventId: eventId,
    resource: updEvent
  }, (err) => {
    if (err) return console.log('The API returned an error during Event Update: ' + err);
    console.log('Event Updated');
  });
}


module.exports.insertCalendar = function (auth) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.calendars.insert({
    auth: auth,
    resource: {
      summary: "HogBoss"
    }
  }, (err) => {
    if (err) return console.log('The API returned an error during Calendar Creation: ' + err);
  });
}
