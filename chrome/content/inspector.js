/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2008-2013 */

Components.utils.import("resource://calendar/modules/calUtils.jsm");

var gICSInspector = {
  getString: function II_getString(aStringName, aParams) {
    return calGetString("inspector", aStringName, aParams, "ics-inspector");
  },

  flushPrefs: function II_flushPrefs() {
    Components.classes["@mozilla.org/preferences-service;1"]
              .getService(Components.interfaces.nsIPrefService)
              .savePrefFile(null);
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
    cal.setPref(pref, event.target.getAttribute("checked") == "true");
  },

  calendarListTreeView: {
    cycleCell: function cycleCell(aRow, aCol) {
      var calendar = this.getCalendar(aRow);
      var composite = this.compositeCalendar;

      switch (aCol.element.getAttribute("anonid")) {
        case "status-treecol":
          calendar.readOnly = !calendar.readOnly;
          break;
        case "cache-treecol":
          var newValue = !calendar.getProperty("cache.enabled");
          calendar.setProperty("cache.enabled", newValue);
          break;
      }
      this.treebox.invalidateRow(aRow);

      return gICSInspector.calendarListTreeView.originals.cycleCell.call(this, aRow, aCol);
    },

    getRowProperties: function getRowProperties(aRow, aProps)  {
      let calendar = this.getCalendar(aRow);
      let composite = this.compositeCalendar;
      let props = []

      if (calendar.getProperty("requiresNetwork")) {
        props.push("requiresNetwork");
      }

      if (calendar.getProperty("cache.enabled")) {
        props.push("cached");
      }

      if (aProps) {
        props.map(cal.getAtomFromService).forEach(aProps.AppendElement, aProps);
        return gICSInspector.calendarListTreeView.originals.getRowProperties.call(this, aRow, aProps);
      } else {
        props.push(gICSInspector.calendarListTreeView.originals.getRowProperties.call(this, aRow, aProps));
        return props.join(" ");
      }
    },
  },


  loadCalendarListExtensions: function II_loadCalendarListExtensions() {
    let tree = document.getElementById("calendar-list-tree-widget");
    function getCol(x) document.getAnonymousElementByAttribute(tree, "anonid", x);

    let statusTreecol = getCol("status-treecol");
    let networkTreecol = createXULElement("treecol");
    let calendarnameTreecol = getCol("calendarname-treecol");
    let cacheTreecol = createXULElement("treecol");
    let scrollbarSpacer = getCol("scrollbar-spacer");

    // Show the column picker
    getCol("tree").removeAttribute("hidecolumnpicker");
    getCol("treecols").removeAttribute("hideheader");

    // Get the base ordinal to start icons after
    let ordinal = calendarnameTreecol.getAttribute("ordinal");

    // Add a column for requiresNetwork
    networkTreecol.setAttribute("anonid", "network-treecol");
    networkTreecol.setAttribute("hideheader", "true");
    networkTreecol.setAttribute("width", "20");
    networkTreecol.setAttribute("label", gICSInspector.getString("calendarTree.column.requiresNetwork"));
    networkTreecol.setAttribute("ordinal", ++ordinal);
    statusTreecol.parentNode.insertBefore(networkTreecol, statusTreecol);

    // Add a column for cache 
    cacheTreecol.setAttribute("anonid", "cache-treecol");
    cacheTreecol.setAttribute("hideheader", "true");
    cacheTreecol.setAttribute("width", "18");
    cacheTreecol.setAttribute("cycler", "true");
    cacheTreecol.setAttribute("label", gICSInspector.getString("calendarTree.column.cache"));
    cacheTreecol.setAttribute("ordinal", ++ordinal);
    statusTreecol.parentNode.insertBefore(cacheTreecol, statusTreecol);

    // Set up the cycler on the readOnly column
    statusTreecol.setAttribute("label", gICSInspector.getString("calendarTree.column.status"));
    statusTreecol.setAttribute("cycler", "true");
    statusTreecol.setAttribute("ordinal", ++ordinal);

    // Make sure the ordinal is correct for the spacer
    scrollbarSpacer.setAttribute("ordinal", ++ordinal);
    scrollbarSpacer.setAttribute("label", gICSInspector.getString("calendarTree.column.spacer"));

    // Add labels for remaining columns
    getCol("checkbox-treecol").setAttribute("label", gICSInspector.getString("calendarTree.column.checkbox"));
    getCol("color-treecol").setAttribute("label", gICSInspector.getString("calendarTree.column.color"));

    // Inject our view functions as defined in the object above
    let listView = gICSInspector.calendarListTreeView;
    let originals = {};
    for (let prop in listView) {
        originals[prop] = tree[prop];
        tree[prop] = listView[prop];
    }
    listView.originals = originals;
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

    gICSInspector.loadCalendarListExtensions();
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
