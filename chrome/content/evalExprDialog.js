/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2008-2014 */

Components.utils.import("resource://calendar/modules/calUtils.jsm");
Components.utils.import("resource://ics-inspector-vv/modules/VariablesView.jsm");

function cmdExec() {
  var shouldClose = document.getElementById("shouldClose").checked;
  var js = document.getElementById("txfExprInput").value;
  var thing = window.arguments[0].wrappedJSObject || window.arguments[0];
  if (window.arguments[0] instanceof Components.interfaces.calIItemBase) {
    var masterItem = document.getElementById("masterItem");
    if (masterItem.checked) {
      thing = thing.parentItem.wrappedJSObject || thing.parentItem;
    }
  } else if (window.arguments[0] instanceof Components.interfaces.calICalendar) {
    var targetCached = document.getElementById("targetCached");
    if (!targetCached.checked) {
      thing = thing.mUncachedCalendar.wrappedJSObject || thing.mUncachedCalendar;
    }
  }
  var f = new Function("target", js);
  try {
    var result = f(thing);
    if (result !== undefined) {
      alert(result);
    }
    return (shouldClose && (result === undefined || !!result));
  } catch (e) {
    return false;
  }
}

function onkey(e) {
  if (e.ctrlKey && e.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN) {
    document.getElementById("winEvalExpr").acceptDialog();
    e.preventDefault();
    e.stopPropagation();
  }
}

function onload(e) {
  function getString(x, p) cal.calGetString("inspector",
                                            "jsEval." + x,
                                            p,
                                            "ics-inspector");

  var masterItem = document.getElementById("masterItem");
  var targetCached = document.getElementById("targetCached");
  var thing = window.arguments[0];
  var desc = document.getElementById("evalDesc");

  // Set up variables view
  let view = new VariablesView(document.getElementById("calendar-vview"));

  if (thing instanceof Components.interfaces.calICalendar) {
    if (thing.wrappedJSObject.mUncachedCalendar) {
      view.addScope(getString("vview.cache"))
          .addItem("", { enumerable: true })
          .populate(thing.wrappedJSObject, { sorted: true });
      view.addScope(getString("vview.uncached"))
          .addItem("", { enumerable: true })
          .populate(thing.wrappedJSObject.mUncachedCalendar.wrappedJSObject, { sorted: true });

      view.getScopeAtIndex(1).expand();
    } else {
      targetCached.setAttribute("hidden", "true");
      view.rawObject = thing.wrappedJSObject;
    }
    masterItem.setAttribute("hidden", "true");
    desc.textContent = getString("calendar.desc");
    document.title = getString("calendar.title", [thing.name]);
  } else if (thing instanceof Components.interfaces.calIItemBase) {
    targetCached.setAttribute("hidden", "true");
    if (!thing.parentItem.recurrenceInfo) {
      masterItem.setAttribute("hidden", "true");
    }

    if (thing.parentItem == thing) {
      view.rawObject = thing.wrappedJSObject;
    } else {
      view.addScope(getString("vview.item"))
          .addItem("", { enumerable: true })
          .populate(thing.wrappedJSObject, { sorted: true });
      view.addScope(getString("vview.parentitem"))
          .addItem("", { enumerable: true })
          .populate(thing.parentItem.wrappedJSObject, { sorted: true });
      view.getScopeAtIndex(0).expand();
    }

    document.title = getString("item.title", [thing.title]);
    desc.textContent = getString("item.desc");
  }
}
