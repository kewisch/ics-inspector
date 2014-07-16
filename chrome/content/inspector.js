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
          window.openDialog(uri, aCalendar.id, "chrome", this.mItems, aCalendar.name);
        }
      };

      selectedCalendar.getItems(Components.interfaces.calICalendar.ITEM_FILTER_ALL_ITEMS,
                                0, null, null, listener);
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
    var tt = getFocusedTaskTree();
    return tt && tt.selectedTasks[0];
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
  
      if (document.popupNode.localName == "tree") {
          // Using VK_APPS to open the context menu will target the tree
          // itself. In that case we won't have a client point even for
          // opening the context menu. The "target" element should then be the
          // selected element.
          row.value =  calendarListTreeView.tree.currentIndex;
          calendar = calendarListTreeView.mCalendarList[row.value];
      } else {
          // Using the mouse, the context menu will open on the treechildren
          // element. Here we can use client points.
          calendar = calendarListTreeView.getCalendarFromEvent(event, col, row);
      }


      gICSInspector._enableOrDisableItem("ics-inspector-inspect-calendar", calendar);
  },

  setupViewContextMenu: function II_setupViewContextMenu() {
    var selectedItem = gICSInspector.getSelectedEvent();
    gICSInspector._enableOrDisableItem("ics-inspector-inspect-event", selectedItem);
    gICSInspector._enableOrDisableItem("ics-inspector-item-inspect-event", selectedItem);
    gICSInspector._enableOrDisableItem("ics-inspector-view-inspect-event", selectedItem);
  },

  setupTaskContextMenu: function II_setupTaskContextMenu() {
    gICSInspector._enableOrDisableItem("ics-inspector-item-inspect-task",
                                       gICSInspector.getSelectedTask());
  },
      

  load: function II_load() {
    window.removeEventListener("load", gICSInspector.load, false);

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
  },

  unload: function II_unload() {
    window.removeEventListener("unload", gICSInspector.unload, false);

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
  }
};

window.addEventListener("load", gICSInspector.load, false);
window.addEventListener("unload", gICSInspector.unload, false);
