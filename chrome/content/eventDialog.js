/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2008-2014 */

var gICSInspector = {
    onLoad: function II_onLoad() {
        window.removeEventListener("load", gICSInspector.onLoad, false);

        setTimeout(function() {
          // Do so on a timeout to make sure all event dialog load
          // handlers complete first.
          if (window.opener.gICSInspector.shouldOpenAlarmDialog) {
              window.opener.gICSInspector.shouldOpenAlarmDialog = false;
              var reminderList = document.getElementById("item-alarm");
              reminderList.value = "custom";
              updateReminder();
          }

          if (window.opener.gICSInspector.shouldOpenRecurDialog) {
              window.opener.gICSInspector.shouldOpenRecurDialog = false;
              var recurList = document.getElementById("item-repeat");
              recurList.value = "custom";
              updateRepeat();
          }
        }, 0);
    },

    showOriginalICS: function() {
        let item = window.calendarItem;
        let uri = "chrome://ics-inspector/content/inspector.xul";
        window.openDialog(uri, item.hashId + "-orig", "chrome", [item], true);
    },

    showCurrentICS: function() {
        let item = saveItem();
        let uri = "chrome://ics-inspector/content/inspector.xul";
        window.openDialog(uri, item.hashId + "-current", "chrome", [item], true);
    }
};

window.addEventListener("load", gICSInspector.onLoad, false);
