'use strict';
//06/08/25

include('..\\..\\helpers\\helpers_xxx.js');
/* global globTags:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global getHandleListTagsV2:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global round:readable */
include('..\\..\\helpers-external\\fooid-utils-js\\fooid-utils-js.js');
/* global fooidUtils:readable */

fooidUtils.compareFingerprints = function compareFingerprints({
	fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
	toHandleList = fb.GetLibraryItems(),
	tagName = globTags.fooidFP,
	threshold = 85,
	playlistName = 'Search...',
	bSendToPls = true,
	bPopup = !!bSendToPls,
	bProfile = true,
}) {
	// Safecheck
	if (!fromHandleList || !fromHandleList.Count || !toHandleList || !toHandleList.Count) { return null; }
	const profile = bProfile ? new FbProfiler('Chromaprint search fingerprint') : null;
	// Get Tags
	const bSameList = fromHandleList === toHandleList;
	const fromTags = getHandleListTagsV2(fromHandleList, [tagName], { bMerged: true }).flat(1);
	const toTags = bSameList
		? fromTags
		: getHandleListTagsV2(toHandleList, [tagName], { bMerged: true }).flat(1);
	// Safecheck for improper set Library
	if (fromTags.every((val) => !val.length) || !bSameList && toTags.every((val) => !val.length)) {
		fb.ShowPopupMessage('Selection ' + (bSameList ? '' : 'or library') + ' has no FooId fingerprint tags.', 'Fingerprint Tag');
		return null;
	}
	// Compute similarity
	const simil = new Map();
	if (bSameList) { // Binary search
		const count = fromTags.length;
		for (let fromIdx = 0; fromIdx < count - 1; fromIdx++) {
			const fromTag = fromTags[fromIdx];
			if (fromTag && fromTag.length) {
				const fpFromTag = this.base64DecToArr(fromTag);  // Reuse the base64 value on all passes!
				for (let toIdx = fromIdx + 1; toIdx < count; toIdx++) {
					const toTag = fromTags[toIdx];
					if (toTag && toTag.length) {
						const fpToTag = this.base64DecToArr(toTag);
						const similarity = round(this.correlate(fpToTag, fpFromTag) * 100, 1);
						if (similarity > threshold) {
							// Add results at both entries
							if (simil.has(fromIdx)) { simil.set(fromIdx, simil.get(fromIdx).concat([{ fromIdx, toIdx, similarity }])); }
							else { simil.set(fromIdx, [{ fromIdx, toIdx, similarity }]); }
							// Reverse ids!
							if (simil.has(toIdx)) { simil.set(toIdx, simil.get(toIdx).concat([{ fromIdx: toIdx, toIdx: fromIdx, similarity }])); }
							else { simil.set(toIdx, [{ fromIdx: toIdx, toIdx: fromIdx, similarity }]); }
						}
					}
				}
			}
		}
	} else {
		fromTags.forEach((fromTag, fromIdx) => {
			if (fromTag && fromTag.length) {
				const fpFromTag = this.base64DecToArr(fromTag);  // Reuse the base64 value on all passes!
				toTags.forEach((toTag, toIdx) => {
					if (toTag && toTag.length) {
						const fpToTag = this.base64DecToArr(toTag);
						const similarity = round(this.correlate(fpToTag, fpFromTag) * 100, 1);
						if (similarity > threshold) {
							if (simil.has(fromIdx)) { simil.set(fromIdx, simil.get(fromIdx).concat([{ fromIdx, toIdx, similarity }])); }
							else { simil.set(fromIdx, [{ fromIdx, toIdx, similarity }]); }
						}
					}
				});
			}
		});
	}
	// Check results
	let outputHandleList = new FbMetadbHandleList();
	if (simil.size) {
		const outputItems = [];
		const report = [];
		simil.forEach((foundArr, i) => {
			if (simil.size === 2 && i) { return; }
			if (foundArr && foundArr.length) {
				foundArr.sort((a, b) => b.similarity - a.similarity);
				if (report.length) { report.push('\n'); }
				report.push('To: ' + fromHandleList[foundArr[0].fromIdx].Path);
				foundArr.forEach((foundObj) => {
					outputItems.push(toHandleList[foundObj.toIdx]);
					report.push('\t-> ' + toHandleList[foundObj.toIdx].Path + ' (' + foundObj.similarity + '%)');
				});
			}
		});
		if (outputItems.length) { outputHandleList = new FbMetadbHandleList(outputItems); }
		// Output to playlist
		const bFound = outputHandleList.Count !== 0;
		const header = bFound ? (threshold === 0 ? 'Comparison report:\n\n' : 'Similar tracks found:\n\n') : 'No similar tracks were found.';
		if (bSendToPls) {
			if (outputHandleList.Count) {
				// Clear playlist if needed. Preferred to removing it, since then we could undo later...
				// Look if target playlist already exists
				let i = 0;
				let plc = plman.PlaylistCount;
				while (i < plc) {
					if (plman.GetPlaylistName(i) === playlistName) {
						plman.ActivePlaylist = i;
						break;
					} else {
						i++;
					}
				}
				if (i === plc) { //if no playlist was found before
					plman.CreatePlaylist(plc, playlistName);
					plman.ActivePlaylist = plc;
				}
				if (plman.PlaylistItemCount(plman.ActivePlaylist)) {
					plman.UndoBackup(plman.ActivePlaylist);
					plman.ClearPlaylist(plman.ActivePlaylist);
				}
				// Create playlist
				console.log('Found: ' + outputItems.length + ' tracks');
				plman.InsertPlaylistItems(plman.ActivePlaylist, 0, outputHandleList);
				if (bPopup) { fb.ShowPopupMessage(header + report.join('\n'), 'Fingerprint Tag'); }
			} else if (bPopup) { fb.ShowPopupMessage(header, 'Fingerprint Tag'); }
		} else if (bPopup) {
			if (bFound) { fb.ShowPopupMessage(header + report.join('\n'), 'Fingerprint Tag'); }
			else { fb.ShowPopupMessage(header, 'Fingerprint Tag'); }
		}
	} else if (bSendToPls) { fb.ShowPopupMessage('No similar tracks were found.', 'Fingerprint Tag'); }
	if (bProfile) { profile.Print('Search fingerprints - completed in '); }
	return outputHandleList;
};

fooidUtils.calculateFingerprints = function calculateFingerprints({
	fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist)
}) {
	// Safecheck
	if (!fromHandleList || !fromHandleList.Count) { return false; }
	if (!utils.CheckComponent('foo_biometric', true)) { fb.ShowPopupMessage('foo_biometric component is not installed.', 'FooID Tag'); return; }
	console.log(fromHandleList.Count, 'items processed.'); // DEBUG
	const bSuccess = fb.RunContextCommandWithMetadb('Save fingerprint to file(s)', fromHandleList, 8);
	if (bSuccess) { console.log(fromHandleList.Count, 'items tagged.'); }
	return bSuccess;
};