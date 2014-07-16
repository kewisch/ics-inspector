/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Sun Microsystems code.
 *
 * The Initial Developer of the Original Code is
 *   Philipp Kewisch <mozilla@kewis.ch>
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var gICSInspector = {
  getString: function II_getString(aStringName, aParams) {
    return calGetString("inspector", aStringName, aParams, "ics-inspector");
  },
  inspectEvent: function II_inspectEvent() {
    var selectedItem = this.getSelectedEvent();
    if (selectedItem) {
      var uri = "chrome://ics-inspector/content/inspector.xul";
      window.openDialog(uri, selectedItem.hashId, "chrome", [selectedItem]);
    }
  },

  inspectTask: function II_inspectTask() {
    var selectedItem = this.getSelectedTask();
    if (selectedItem) {
      var uri = "chrome://ics-inspector/content/inspector.xul";
      window.openDialog(uri, selectedItem.hashId, "chrome", [selectedItem]);
    }
  },

  evaluateTask: function II_evaluateTask() {
    var item = this.getSelectedTask();
    var uri = "chrome://ics-inspector/content/evalExprDialog.xul";
    window.openDialog(uri, "evaluate-item-" + item.hashId, "chrome", item);
  },
  
  inspectCalendar: function II_inspectCalendar() {
    var selectedCalendar = getSelectedCalendar();
    if (selectedCalendar) {
      var listener = {
        mItems: [],
        onGetResult: function II_iC_onGetResult(aCalendar, aStatus, aItemType,
                                                aDetail, aCount, aItems) {
          this.mItems = this.mItems.concat(aItems);
        },
        onOperationComplete: function II_iC_onOperationComplete(aCalendar,
                                                                aStatus,
                                                                aOperationType,
                                                                aId, aDetail) {
          var uri = "chrome://ics-inspector/content/inspector.xul";
          window.openDialog(uri, "inspect-" + aCalendar.id, "chrome", this.mItems, aCalendar.name);
        }
      };

      selectedCalendar.getItems(Components.interfaces.calICalendar.ITEM_FILTER_ALL_ITEMS,
                                0, null, null, listener);
    }
  },

  evaluateCalendar: function II_evaluateCalendar() {
    var uri = "chrome://ics-inspector/content/evalExprDialog.xul";
    var calendar = getSelectedCalendar();
    window.openDialog(uri, "evaluate-" + calendar.id, "chrome", calendar);
  },

  evaluateItem: function II_evaluateItem(event) {
    // This is needed for 0.9 compatibility, for 1.0 only document.popupNode is
    // sufficient.
    var node = getParentNodeOrThis(document.popupNode,
                                   "calendar-month-day-box-item") ||
               getParentNodeOrThis(document.popupNode,
                                   "calendar-event-box") ||
               getParentNodeOrThis(document.popupNode,
                                   "calendar-editable-item");
    var item = node.mOccurrence;
    var uri = "chrome://ics-inspector/content/evalExprDialog.xul";
    window.openDialog(uri, "evaluate-item-" + item.hashId, "chrome", item);
  },

  shouldOpenAlarmDialog: false,
  openAlarmDialog: function II_openAlarmDialog() {
    var selectedItem = this.getSelectedEvent();
    gICSInspector.shouldOpenAlarmDialog = true;

    modifyEventWithDialog(selectedItem, null, false);
  },

  resetLog: function II_resetLog() {
    var selectedCalendar = getSelectedCalendar().wrappedJSObject;
    if (selectedCalendar.supportsChangeLog) {
      try {
        selectedCalendar.mCachedCalendar.QueryInterface(Components.interfaces.calICalendarProvider).deleteCalendar(selectedCalendar.mCachedCalendar);
      } catch (e) { }
      selectedCalendar.mUncachedCalendar.resetLog();

    }
  },

  agendaInspectEvent: function II_agendaInspectEvent() {
    var listItem  = document.getElementById("agenda-listbox").selectedItem;
    var selectedItem = listItem.getItem();
    if (selectedItem) {
      var uri = "chrome://ics-inspector/content/inspector.xul";
      window.openDialog(uri, selectedItem.hashId, "chrome", [selectedItem]);
    }
  },

  getSelectedEvent: function II_getSelectedEvent() {
    return currentView().getSelectedItems({})[0];
  },

  getSelectedTask: function II_getSelectedTask() {
    if (typeof getFocusedTaskTree != "undefined" ) {
      // 0.9
      var tt = getFocusedTaskTree();
      return tt && tt.selectedTasks[0];
    } else {
      // trunk
      var tasks = getSelectedTasks();
      return tasks && tasks.length && tasks[0];
    }
  },

  _enableOrDisableItem: function II__enableOrDisableItem(id, expr) {
    var el = document.getElementById(id);
    if (el) {
      if (expr) {
        el.removeAttribute("disabled");
      } else {
        el.setAttribute("disabled", "true");
      }
    }
  },

  setupCalendarListContextMenu: function II_setupCalendarListContextMenu(event) {
      var col = {};
      var row = {};
      var calendar;
      var calendarList = (typeof calendarListTreeView == "undefined" ?
        document.getElementById("calendar-list-tree-widget") :
        calendarListTreeView);
  
      if (document.popupNode.localName == "tree") {
          // Using VK_APPS to open the context menu will target the tree
          // itself. In that case we won't have a client point even for
          // opening the context menu. The "target" element should then be the
          // selected element.
          row.value =  calendarList.tree.currentIndex;
          calendar = calendarList.mCalendarList[row.value];
      } else {
          // Using the mouse, the context menu will open on the treechildren
          // element. Here we can use client points.
          calendar = calendarList.getCalendarFromEvent(event, col, row);
      }


      gICSInspector._enableOrDisableItem("ics-inspector-inspect-calendar", calendar);
      gICSInspector._enableOrDisableItem("ics-inspector-evaluate-calendar", calendar);
      gICSInspector._enableOrDisableItem("ics-inspector-cached-resetlog",
                                         calendar && calendar.wrappedJSObject.supportsChangeLog);
  },

  setupViewContextMenu: function II_setupViewContextMenu() {
    var selectedItem = gICSInspector.getSelectedEvent();
    gICSInspector._enableOrDisableItem("ics-inspector-inspect-event", selectedItem);
    gICSInspector._enableOrDisableItem("ics-inspector-item-inspect-event", selectedItem);
    gICSInspector._enableOrDisableItem("ics-inspector-eval-occurrence", selectedItem);
  },

  setupTaskContextMenu: function II_setupTaskContextMenu() {
    gICSInspector._enableOrDisableItem("ics-inspector-item-inspect-task",
                                       gICSInspector.getSelectedTask());
    gICSInspector._enableOrDisableItem("ics-inspector-eval-task",
                                       gICSInspector.getSelectedTask());
  },

  setDebugLog: function II_setDebugLog(event, verbose) {
    var pref = "calendar.debug.log" + (verbose ? ".verbose" : "");
   
    // No direct way to differ here, but 0.9 had an isBranch() function
    if (typeof isBranch != "undefined") {
      // 0.9
      setPref(pref, 'BOOL', event.target.getAttribute("checked") == "true");
    } else {
      // trunk
      setPref(pref, event.target.getAttribute("checked") == "true");
    }
  },

  load: function II_load() {
    window.removeEventListener("load", gICSInspector.load, false);

    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefService);
    var branch = prefService.getBranch("")
                            .QueryInterface(Components.interfaces.nsIPrefBranch2);
    branch.addObserver("calendar.debug.", gICSInspector, false);

    function addPSHandler(id, funcName) {
      var popup = document.getElementById(id);
      if (popup) {
        popup.addEventListener("popupshowing",
                               gICSInspector[funcName],
                               false);
      }
    }

    addPSHandler("context-menu", "setupViewContextMenu");
    addPSHandler("calendar-item-context-menu", "setupViewContextMenu");
    addPSHandler("calendar-view-context-menu", "setupViewContextMenu");
    addPSHandler("taskitem-context-menu", "setupTaskContextMenu");
    addPSHandler("list-calendars-context-menu", "setupCalendarListContextMenu");

    if (getPrefSafe("calendar.debug.log", false)) {
      document.getElementById("ics-inspector-debug-log").setAttribute("checked", "true");
    }
    if (getPrefSafe("calendar.debug.log.verbose", false)) {
      document.getElementById("ics-inspector-debug-log-verbose").setAttribute("checked", "true");
    }
  },

  unload: function II_unload() {
    window.removeEventListener("unload", gICSInspector.unload, false);

    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefService);
    var branch = prefService.getBranch("")
                            .QueryInterface(Components.interfaces.nsIPrefBranch2);
    branch.removeObserver("calendar.debug.", gICSInspector, false);

    function removePSHandler(id, funcName) {
      var popup = document.getElementById(id);
      if (popup) {
        popup.addEventListener("popupshowing",
                               gICSInspector[funcName],
                               false);
      }
    }

    removePSHandler("context-menu", "setupViewContextMenu");
    removePSHandler("calendar-item-context-menu", "setupViewContextMenu");
    removePSHandler("calendar-view-context-menu", "setupViewContextMenu");
    removePSHandler("taskitem-context-menu", "setupTaskContextMenu");
    removePSHandler("list-calendars-context-menu", "setupCalendarListContextMenu");
  },

  observe: function II_observe(aSubject, aTopic, aPrefName) {
    switch (aTopic) {
      case "nsPref:changed":
        switch (aPrefName) {
          case "calendar.debug.log":
            setElementValue("ics-inspector-debug-log",
                            getPrefSafe("calendar.debug.log", false) && "true",
                            "checked");
            break;
          case "calendar.debug.log.verbose":
            setElementValue("ics-inspector-debug-log-verbose",
                            getPrefSafe("calendar.debug.log.verbose", false) && "true",
                            "checked");
            break;
        }
        break;
    }
  }
};


window.addEventListener("load", gICSInspector.load, false);
window.addEventListener("unload", gICSInspector.unload, false);
