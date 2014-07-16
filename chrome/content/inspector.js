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
      window.openDialog(uri, selectedItem.hashId, "chrome", selectedItem);
    }
  },

  inspectTask: function II_inspectTask() {
    var selectedItem = this.getSelectedTask();
    if (selectedItem) {
      var uri = "chrome://ics-inspector/content/inspector.xul";
      window.openDialog(uri, selectedItem.hashId, "chrome", selectedItem);
    }
  },

  agendaEditEvent: function II_agendaEditEvent() {
    var listItem  = document.getElementById("agenda-listbox").selectedItem;
    var selectedItem = listItem.getItem();
    if (selectedItem) {
      var uri = "chrome://ics-inspector/content/inspector.xul";
      window.openDialog(uri, selectedItem.hashId, "chrome", selectedItem);
    }
  },

  getSelectedEvent: function II_getSelectedEvent() {
    return currentView().getSelectedItems({})[0];
  },

  getSelectedTask: function II_getSelectedTask() {
    return getFocusedTaskTree().selectedTasks[0];
  },

  command_controller: {
    updateCommands: function II_cc_updateCommands() {
      goUpdateCommand("ics_inspector_inspect_event_command");
      goUpdateCommand("ics_inspector_inspect_task_command");
    },

    supportsCommand: function II_cc_supportsCommand(aCommand) {
      return (aCommand == "ics_inspector_inspect_event_command" ||
              aCommand == "ics_inspector_inspect_task_command");
    },

    isCommandEnabled: function II_cc_isCommandEnabled(aCommand) {
      switch (aCommand) {
        case "ics_inspector_inspect_event_command":
          return gICSInspector.getSelectedEvent() != null;
          break;
        case "ics_inspector_inspect_task_command":
          return gICSInspector.getSelectedTask() != null;
          break;
      }
      return false;
    },

    doCommand: function II_cc_doCommand(aCommand) {
      switch (aCommand) {
        case "ics_inspector_inspect_event_command":
          gICSInspector.inspectEvent();
          break;
        case "ics_inspector_inspect_task_command":
          gICSInspector.inspectTask();
          break;
      }
    }
  }
};




window.addEventListener("load", function load_II() {
    top.controllers.appendController(gICSInspector.command_controller);

    document.getElementById("context-menu")
            .addEventListener("popupshowing",
                              gICSInspector.command_controller.updateCommands,
                              false);
    document.getElementById("taskitem-context-menu")
            .addEventListener("popupshowing",
                              gICSInspector.command_controller.updateCommands,
                              false);
}, false);

window.addEventListener("unload", function II_unload() {
    top.controllers.removeController(gICSInspector.command_controller);

    document.getElementById("context-menu")
            .removeEventListener("popupshowing",
                                 gICSInspector.command_controller.updateCommands,
                                 false);
    document.getElementById("taskitem-context-menu")
            .removeEventListener("popupshowing",
                                 gICSInspector.command_controller.updateCommands,
                                 false);
}, false);
  
