/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2012 */

Components.utils.import("resource://calendar/modules/calUtils.jsm");

var gICSInspector = {
    updateWeekStarts: function updateWeekStarts(value) {
        cal.setPref("calendar.week.start", parseInt(value, 10));

        updatePrintState();
        refreshHtml();
    },
    updateDaysOff: function updateDaysOff(event) {
        let prefName = event.target.getAttribute("prefName");
        cal.setPref("calendar.week." + prefName, !event.target.checked);

        updatePrintState();
        refreshHtml();
    },
    loadDaysOff: function loadDaysOff() {
        const prefNames = ["d0sundaysoff", "d1mondaysoff", "d2tuesdaysoff",
                           "d3wednesdaysoff", "d4thursdaysoff", "d5fridaysoff",
                           "d6saturdaysoff"];
        for (let i = 0; i < 7; i++) {
            let cb = document.getElementById("dayoff" + i);
            cb.checked = !cal.getPrefSafe("calendar.week." + prefNames[i], false);
        }
    }
};

window.addEventListener("load", function() { gICSInspector.loadDaysOff(); }, false);
