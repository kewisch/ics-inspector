/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2008-2014 */

var II_calendar, II_items;

function II_load() {
  var items = window.arguments[0];
  var forceReadOnly = window.arguments[2];
  var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                      .getService(Components.interfaces.nsIStringBundleService);
  var props = sbs.createBundle("chrome://ics-inspector/locale/inspector.properties");
  var textbox = document.getElementById('ics-inspector-textbox');

  II_items = {};

  if (forceReadOnly) {
    II_setReadOnly();
  }

  for each (let item in items) {
    II_items[item.id] = item;
    if (II_calendar && II_calendar.id != item.calendar.id) {
      II_setReadOnly();
    }
    if (item.calendar.readOnly) {
      II_setReadOnly();
    }
    II_calendar = item.calendar;
  }

  if (items.length == 1) {
    textbox.value = items[0].icalString;
    document.title = props.formatStringFromName("ics-inspector.dialog.title", [items[0].title], 1);
  } else {
    var serializer = Components.classes["@mozilla.org/calendar/ics-serializer;1"]
                               .createInstance(Components.interfaces.calIIcsSerializer);
    serializer.addItems(items, items.length);
    textbox.value = serializer.serializeToString();
    document.title = props.formatStringFromName("ics-inspector.dialog.title", [window.arguments[1]], 1);

  }
}

function II_saveItem() {
  let parser = Components.classes["@mozilla.org/calendar/ics-parser;1"]
                         .createInstance(Components.interfaces.calIIcsParser);
  let textbox = document.getElementById('ics-inspector-textbox');

  var listener = {
    remaining: window.arguments[0].length,
    onOperationComplete: function() {
      if (--this.remaining == 0) {
        window.close();
      }
    }
  };

  parser.parseString(textbox.value);
  for each (let item in parser.getItems({})) {
    let oldItem = II_items[item.id];
    II_calendar.modifyItem(item, oldItem, listener);
  }
  return false;
}

function II_setReadOnly() {
  var textbox = document.getElementById('ics-inspector-textbox');
  textbox.setAttribute("readonly", "true");
  document.documentElement.getButton("accept").setAttribute("hidden", "true");
}
