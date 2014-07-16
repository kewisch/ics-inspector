/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2008 */

var gICSInspectorUnifinder = {
  calUnifinderTreeViewSortItems: null,
  unifinderTreeView_sortItems: function II_unifinderTreeView_sortItems() {
    gICSInspectorUnifinder.updateUnifinderRowCountLabel();
    return gICSInspectorUnifinder.calUnifinderTreeViewSortItems
                                 .apply(unifinderTreeView, []);
  },

  calUnifinderTreeViewCaclulateIndexMap: null,
  unifinderTreeView_calculateIndexMap: function II_unifinderTreeView_sortItems() {
    gICSInspectorUnifinder.updateUnifinderRowCountLabel();
    return gICSInspectorUnifinder.calUnifinderTreeViewCalculateIndexMap
                                 .apply(unifinderTreeView, []);
  },

  updateUnifinderRowCountLabel: function II_updateUnifinderRowCountLabel() {
    var label = document.getElementById("ics-inspector-count-items-label");
    label.value = gICSInspector.getString("ics-inspector.totalitems.label",
                                          [unifinderTreeView.rowCount]);
  },

  load: function IIuf_load() {
    window.removeEventListener("load", gICSInspectorUnifinder.load, false);
    gICSInspectorUnifinder.updateUnifinderRowCountLabel();
  }
};
// Swap sorting function and index map function. On trunk we could use the
// TreeRowCountChanged event.
gICSInspectorUnifinder.calUnifinderTreeViewSortItems = unifinderTreeView.sortItems;
unifinderTreeView.sortItems = gICSInspectorUnifinder.unifinderTreeView_sortItems;
gICSInspectorUnifinder.calUnifinderTreeViewCalculateIndexMap = unifinderTreeView.calculateIndexMap;
unifinderTreeView.calculateIndexMap = gICSInspectorUnifinder.unifinderTreeView_calculateIndexMap;

window.addEventListener("load", gICSInspectorUnifinder.load, false);
