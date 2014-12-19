/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2008-2014 */

Components.utils.import("resource://gre/modules/NetUtil.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");

var II_calendar, II_items;

function II_load() {
  var items = window.arguments[0];
  var forceReadOnly = window.arguments[2];
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
    document.title = document.getElementById("ics-inspector-strings")
                             .getFormattedString("ics-inspector.dialog.title", [items[0].title]);
  } else {
    var serializer = Components.classes["@mozilla.org/calendar/ics-serializer;1"]
                               .createInstance(Components.interfaces.calIIcsSerializer);
    serializer.addItems(items, items.length);
    textbox.value = serializer.serializeToString();
    document.title = document.getElementById("ics-inspector-strings")
                             .getFormattedString("ics-inspector.dialog.title", [window.arguments[1]]);

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
    item.calendar = oldItem.calendar;
    II_calendar.modifyItem(item, oldItem, listener);
  }
  return false;
}

function II_saveAs() {
  let textbox = document.getElementById('ics-inspector-textbox');
  let nsIFilePicker = Components.interfaces.nsIFilePicker;
  let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  let wildmat = "*.ics";
  let fileType = document.getElementById("calendar-strings").getFormattedString("filterIcs", [wildmat]);

  fp.appendFilter(fileType, wildmat);
  fp.appendFilters(nsIFilePicker.filterAll);
  fp.init(window, document.documentElement.getAttribute("buttonlabelaccept"), nsIFilePicker.modeSave);

  if (fp.show() != nsIFilePicker.returnCancel) {
    let ostream = FileUtils.openSafeFileOutputStream(fp.file);
    let converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                              .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";
    NetUtil.asyncCopy(converter.convertToInputStream(textbox.value), ostream);
  }
}

function II_setReadOnly() {
  var textbox = document.getElementById('ics-inspector-textbox');
  textbox.setAttribute("readonly", "true");
  document.documentElement.getButton("accept").setAttribute("hidden", "true");
}

function II_keypress(e) {
  if ((e.ctrlKey || e.metaKey) && e.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN) {
    document.documentElement.acceptDialog();
    e.preventDefault();
    e.stopPropagation();
  }
}
