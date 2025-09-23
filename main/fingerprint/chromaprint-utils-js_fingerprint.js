'use strict';
//09/08/25

include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable, globTags:readable,  */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global getHandleListTagsV2:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global round:readable, require:readable, range:readable, _p:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, _deleteFile:readable, _jsonParseFileSplit:readable, _jsonParseFile:readable, _jsonParseFileCheck:readable, utf8:readable, _runHidden:readable */
include('..\\..\\helpers-external\\chromaprint-utils-js\\chromaprint-utils-js.js');
/* global chromaPrintUtils:readable */
include('..\\tags\\ffprobe-utils.js');
/* global ffprobeUtils:readable */
const FastMap = require('..\\helpers-external\\fastmap-0.1.2\\fastmap');

chromaPrintUtils.bFastMap = true; // Uses FastMap object implementation: has, set, get, forEach. value can NOT be 0, null or undefined
chromaPrintUtils.tagLen = Infinity; // How many ints are used for comparison. 844 is the default fingerprint length for AcoustId. Infinity will use the entire array of values if possible (slower)
chromaPrintUtils.reverseIdxLen = 4; // Digits used to group elements at the reverse index map: i.e. [9534]55625213. > 3 may result in memory overflow on foobar2000 for huge databases if using too many values (below)
chromaPrintUtils.tagLenReverse = 700; // How many ints are checked for the reverse indexing database
// 4, Infinity, 700

// Checks provided tracks' fingerprints one by one against all the library. Slow!
chromaPrintUtils.compareFingerprints = async function compareFingerprints({
	fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
	toHandleList = fb.GetLibraryItems(),
	tagName = globTags.acoustidFP,
	threshold = 85,
	tagLen = this.tagLen,
	playlistName = 'Search...',
	bSendToPls = true,
	bPopup = bSendToPls,
	bProfile = true,
	bReadFiles = false
}) {
	// Safecheck
	if (!fromHandleList || !fromHandleList.Count || !toHandleList || !toHandleList.Count) { return null; }
	const bSameList = fromHandleList === toHandleList;
	if (bReadFiles && !bSameList && toHandleList.Count > 200) {
		fb.ShowPopupMessage('Reading directly from files is disabled for a number of tracks greater than 200.\n\nUse the database option instead.', 'Fingerprint Tag');
		return null;
	}
	const profile = bProfile ? new FbProfiler('ChromaPrint search fingerprint') : null;
	// Get Tags
	const fromTags = (bReadFiles
		? await ffprobeUtils.getTags(fromHandleList, tagName).then((tags) => { return tags.map((obj) => [obj[tagName]]); })
		: getHandleListTagsV2(fromHandleList, [tagName], { bMerged: true, splitBy: null })
	).map((array) => { return array.map((item) => { return item.split(','); }).flat(1).map((item) => { return item ? Number(item) : void (0); }).filter(Boolean); });
	const toTags = bSameList
		? fromTags
		: (bReadFiles
			? await ffprobeUtils.getTags(toHandleList, tagName).then((tags) => { return tags.map((obj) => [obj[tagName]]); })
			: getHandleListTagsV2(toHandleList, [tagName], { bMerged: true, splitBy: null })
		).map((array) => { return array.map((item) => { return item.split(','); }).flat(1).map((item) => { return item ? Number(item) : void (0); }).filter(Boolean); });
	// Safecheck for improper set Library
	if (fromTags.every((val) => !val.length) || !bSameList && toTags.every((val) => !val.length)) {
		fb.ShowPopupMessage('Selection has no ChromaPrint fingerprint tags or Foobar2000 has not be configured to read the full tag (on v1.6.X).\n\nEither configure \'LargeFieldsConfig.txt\' properly or use \'Read directly from files\' option.', 'Fingerprint Tag');
		return null;
	}
	// Compute similarity
	const simil = new Map();
	if (bSameList) { // Binary search
		const count = fromTags.length;
		for (let fromIdx = 0; fromIdx < count - 1; fromIdx++) {
			const fromTag = fromTags[fromIdx];
			let fromTagLen = fromTag ? fromTag.length : null;
			if (fromTagLen) {
				for (let toIdx = fromIdx + 1; toIdx < count; toIdx++) {
					const toTag = fromTags[toIdx];
					let toTagLen = toTag ? toTag.length : null;
					if (toTagLen) {
						const similarity = round(this.correlate(toTagLen > tagLen ? toTag.slice(0, tagLen) : toTag, fromTagLen > tagLen ? fromTag.slice(0, tagLen) : fromTag) * 100, 1);
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
	} else { // Compare entire arrays
		fromTags.forEach((fromTag, fromIdx) => {
			let fromTagLen = fromTag ? fromTag.length : null;
			if (fromTagLen) {
				toTags.forEach((toTag, toIdx) => {
					let toTagLen = toTag ? toTag.length : null;
					if (toTagLen) {
						const similarity = round(this.correlate(toTagLen > tagLen ? toTag.slice(0, tagLen) : toTag, fromTagLen > tagLen ? fromTag.slice(0, tagLen) : fromTag) * 100, 1);
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
				report.push('To: ' + fromHandleList[foundArr[0].fromIdx].Path); // It's the same on entire array...
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
			if (bFound) {
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
	} else if (bPopup) { fb.ShowPopupMessage('No similar tracks were found.', 'Fingerprint Tag'); }
	if (bProfile) { profile.Print('Search fingerprints - completed in '); }
	return outputHandleList;
};

// Checks provided tracks' fingerprints against a rounded-fp database. Then performs full comparison against the found partial matches.
chromaPrintUtils.compareFingerprintsFilter = async function compareFingerprints({
	fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
	toHandleList = fb.GetLibraryItems(),
	tagName = globTags.acoustidFP,
	reverseDbPath = folders.data + 'fpChromaprintReverseMap.json',
	reverseDbIdxPath = folders.data + 'fpChromaprintReverseMapIdx.json',
	threshold = 85,
	thresholdFilter = 45,
	tagLen = this.tagLen,
	playlistName = 'Search...',
	bSendToPls = true,
	bProfile = true,
	bFastMap = this.bFastMap,
	bReadFiles = false
}) {
	// Safecheck
	if (!fromHandleList || !fromHandleList.Count || !toHandleList || !toHandleList.Count) { return null; }
	const profile = bProfile ? new FbProfiler('ChromaPrint search fingerprint') : null;
	// Get Tags
	const fromTags = (bReadFiles
		? await ffprobeUtils.getTags(fromHandleList, tagName).then((tags) => { return tags.map((obj) => [obj[tagName]]); })
		: getHandleListTagsV2(fromHandleList, [tagName], { bMerged: true, splitBy: null })
	).map((array) => { return array.map((item) => { return item.split(','); }).flat(1).map((item) => { return item ? Number(item) : void (0); }).filter(Boolean); });
	// Get reverse map of tags
	let data = null;
	if (_isFile(reverseDbPath) || _isFile(reverseDbPath.replace('.json', '0.json'))) {
		data = _jsonParseFileSplit(reverseDbPath, 'Fingerprint inverse database', 'ChromaPrint search', utf8);
		if (!data || !data.length) { console.popup('Database corrupt: ' + reverseDbPath, 'Fingerprint Tag'); return; }
	} else { console.popup('Database not found: ' + reverseDbPath, 'Fingerprint Tag'); return; }
	let reverseMap = bFastMap ? new FastMap(data) : new Map(data);
	data = null; // Free mem immediately
	let currReverseMapIdx = chromaPrintUtils.libraryMap({ toHandleList, bReverse: true });
	if (_isFile(reverseDbIdxPath)) {
		data = _jsonParseFile(reverseDbIdxPath, utf8);
		if (!data || !data.length) { console.popup('Database corrupt: ' + reverseDbIdxPath, 'Fingerprint Tag'); return; }
	} else { console.popup('Database not found: ' + reverseDbIdxPath, 'Fingerprint Tag'); return; }
	let oldReverseMapIdx = bFastMap ? new FastMap(data) : new Map(data);
	data = null;
	// Get subset of matches which match at least one tag
	const matches = this.reverseIdxMatch({ reverseMap, fromTags, threshold: thresholdFilter, zeroMatch: thresholdFilter ? null : new Set(range(0, toHandleList.Count, 1)) }).filter(String);
	reverseMap.clear(); reverseMap = null; // Free mem immediately
	// Compute similarity for the previous subset
	const simil = new Map();
	const matchLen = matches.length;
	for (let i = 0; i < matchLen; i++) {
		const fromTag = fromTags[i];
		let fromTagLen = fromTag ? fromTag.length : null;
		if (fromTagLen) {
			const list = matches[i];
			for (let match of list) {
				const oldIdx = oldReverseMapIdx.get(match.idx);
				if (typeof oldIdx === 'undefined') { console.popup('Database corrupt: ' + reverseDbIdxPath + '\n\nUnknown index found: ' + match.idx, 'Fingerprint Tag'); continue; }
				const idx = currReverseMapIdx.get(oldIdx);
				if (typeof idx === 'undefined') { console.popup('Database corrupt: ' + reverseDbPath + '\n\nUnknown track found: ' + _p(match.idx) + ' ' + oldIdx, 'Fingerprint Tag'); return; }
				const toTag = (bReadFiles
					? await ffprobeUtils.getTags(new FbMetadbHandleList(toHandleList[idx]), tagName).then((tags) => { return tags.map((obj) => [obj[tagName]]); })
					: getHandleListTagsV2(new FbMetadbHandleList(toHandleList[idx]), [tagName], { bMerged: true, splitBy: null })
				)[0].map((item) => { return item.split(','); }).flat(1).map((item) => { return item ? Number(item) : void (0); }).filter(Boolean);
				let toTagLen = toTag ? toTag.length : null;
				if (toTagLen) {
					const similarity = round(this.correlate(toTagLen > tagLen ? toTag.slice(0, tagLen) : toTag, fromTagLen > tagLen ? fromTag.slice(0, tagLen) : fromTag) * 100, 1);
					if (similarity > threshold) {
						if (simil.has(i)) { simil.set(i, simil.get(i).concat([{ idx, similarity }])); }
						else { simil.set(i, [{ idx, similarity }]); }
					}
				}
			}
		}
	}
	oldReverseMapIdx.clear(); oldReverseMapIdx = null; // Free mem immediately
	currReverseMapIdx.clear(); currReverseMapIdx = null; // Free mem immediately
	// Check results
	let outputHandleList = new FbMetadbHandleList();
	if (simil.size) {
		const outputItems = [];
		const report = [];
		simil.forEach((foundArr, i) => {
			if (simil.size === 2 && i) { return; }
			if (foundArr && foundArr.length) {
				foundArr.forEach((foundObj) => {
					outputItems.push(toHandleList[foundObj.idx]);
					report.push(toHandleList[foundObj.idx].Path + ' (' + foundObj.similarity + '%)');
				});
			}
		});
		if (outputItems.length) { outputHandleList = new FbMetadbHandleList(outputItems); }
		// Output to playlist
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
				fb.ShowPopupMessage('Similar tracks found:\n' + report.join('\n'), 'Fingerprint Tag');
			} else { fb.ShowPopupMessage('No similar tracks were found.', 'Fingerprint Tag'); }
		}
	} else if (bSendToPls) { fb.ShowPopupMessage('No similar tracks were found.', 'Fingerprint Tag'); }
	if (bProfile) { profile.Print('Search fingerprints - completed in '); }
	return outputHandleList;
};

chromaPrintUtils.calculateFingerprints = function calculateFingerprints({
	fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
	tagName = globTags.acoustidFP,
	bMerge = true,
	fpcalcPath = folders.xxx + 'helpers-external\\fpcalc\\fpcalc.exe',
	bDebug = false,
	bProfile = true,
	bQuiet = false
}) {
	// Safecheck
	if (!fromHandleList || !fromHandleList.Count) { return false; }
	if (!_isFile(fpcalcPath)) { fb.ShowPopupMessage('fpcalc executable not found:\n' + fpcalcPath, 'Fingerprint Tag'); }
	const profile = bProfile ? new FbProfiler('ChromaPrint fingerprint') : null;
	const handleListArr = fromHandleList.Convert();
	const totalTracks = handleListArr.length, numTracks = 100, maxCount = Math.ceil(totalTracks / numTracks);
	let totalItems = 0;
	let bDone = true;
	let failedItems = [];
	const calcFp = (count) => {
		const currMax = (count + 1) === maxCount ? totalTracks : (count + 1) * numTracks;
		console.log('Processing items: ' + currMax + '/' + totalTracks);
		const items = [];
		const fp = [];
		const fpcalcJSON = folders.temp + 'fpcalc' + (new Date().toDateString() + Date.now()).split(' ').join('_') + '.json';
		let prevProgress = -1, iSteps = (count + 1) === maxCount ? currMax : numTracks;
		handleListArr.slice(count * numTracks, currMax).forEach((handle, i) => {
			const path = handle.Path;
			if (_isFile(path)) {
				if (bDebug) { console.log(fpcalcPath + ' -raw -json "' + path + '">"' + fpcalcJSON + '"'); }
				_runHidden(fpcalcPath.replace('.exe', '.bat'), path, fpcalcJSON, fpcalcPath);
				const data = _jsonParseFileCheck(fpcalcJSON);
				if (data && Object.hasOwn(data, 'fingerprint')) {
					items.push(handle);
					fp.push(data.fingerprint);
				} else { failedItems.push(path); }
				const progress = Math.round((i + 1) / iSteps * 10) * 10;
				if (progress > prevProgress) { prevProgress = progress; console.log('Fingerprinting ' + progress + '%.'); }
			} else { failedItems.push(path); }
		});
		_deleteFile(fpcalcJSON);
		const itemsLength = items.length;
		totalItems += itemsLength;
		if (itemsLength) {
			const tags = [];
			for (let i = 0; i < itemsLength; ++i) {
				if (fp[i]) { tags.push({ [tagName]: bMerge ? fp[i].join(', ') : fp[i] }); }
			}
			if (itemsLength === tags.length) {
				new FbMetadbHandleList(items).UpdateFileInfoFromJSON(JSON.stringify(tags));
				if (maxCount > 1) { console.log(itemsLength, 'items tagged.'); } // Don't repeat this line when all is done in 1 step. Will be printed also later
			} else { bDone = false; console.log('Tagging failed: unknown error.'); }
		}
	};
	for (let count = 0; count < maxCount; count++) {
		calcFp(count);
	}
	const failedItemsLen = failedItems.length;
	const report = totalTracks + ' items processed.\n' + totalItems + ' items tagged.\n' + failedItemsLen + ' items failed.' + (failedItemsLen ? '\n\nFailed items may be re-scanned in case the files were blocked. For more info, see this:\n https://github.com/regorxxx/Playlist-Tools-SMP/wiki/Known-problems-or-limitations#fingerprint-chromaprint-or-fooid-and-ebur-128-ffmpeg-tagging--fails-with-some-tracks' + '\n\nList of failed items:\n' + failedItems.join('\n') : '');
	if (bQuiet) { console.log('Fingerprint Tag:\n\t' + report.replace(/\n/g, '\n\t')); }
	else { console.popup(report, 'Fingerprint Tag'); }
	if (bProfile) { profile.Print('Save fingerprints to files - completed in '); }
	return bDone;
};

chromaPrintUtils.libraryMap = function libraryMap({
	toHandleList = fb.GetLibraryItems(),
	bFastMap = this.bFastMap,
	bReverse = false
}) {
	const libMap = bFastMap ? new FastMap() : new Map();
	if (bReverse) {
		toHandleList.GetLibraryRelativePaths().forEach((path, idx) => { libMap.set(path, idx); });
	} else {
		toHandleList.GetLibraryRelativePaths().forEach((path, idx) => { libMap.set(idx, path); });
	}
	return libMap;
};

// Iterative version of fp reverse indexing. Using entire library at once results on memory overflows
chromaPrintUtils.reverseIndexingIter = async function reverseIndexingIter({
	toHandleList = null,
	bFastMap = this.bFastMap,
	reverseIdxLen = this.reverseIdxLen,
	tagLen = this.tagLenReverse,
	tagName = globTags.acoustidFP,
	bProfile = true,
	bReadFiles = false,
	bToEntries = false
}) {
	const profile = bProfile ? new FbProfiler('ChromaPrint fingerprint') : null;
	const toHandleListArr = toHandleList.Convert();
	const totalTracks = toHandleListArr.length, numTracks = (bReadFiles ? 100 : 10000), maxCount = Math.ceil(totalTracks / numTracks);
	let reverseMap = bFastMap ? new FastMap() : new Map();
	let prevProgress = -1;
	for (let count = 0; count < maxCount; count++) {
		const currOffset = count * numTracks;
		const currMax = (count + 1) === maxCount ? totalTracks : currOffset + numTracks;
		const toTags = bReadFiles
			? await ffprobeUtils.getTags(new FbMetadbHandleList(toHandleListArr.slice(currOffset, currMax)), tagName)
				.then((tags) => { return tags.map((obj) => [obj[tagName]]); })
			: getHandleListTagsV2(new FbMetadbHandleList(toHandleListArr.slice(currOffset, currMax)), [tagName], { bMerged: true, splitBy: null });
		this.reverseIndexing({ toTags, prevMap: reverseMap, currOffset, bFastMap, reverseIdxLen, tagLen, bProfile: false, bConsole: false });
		const progress = Math.round(currMax / totalTracks * 10) * 10;
		if (progress > prevProgress) { prevProgress = progress; console.log('Creating fingerprint database ' + progress + '%.'); }
	}
	if (bProfile) { profile.Print('Create reverse indexed database for ' + totalTracks + ' files - completed in '); }
	if (reverseMap.size === 0) {
		fb.ShowPopupMessage('Library has no ChromaPrint fingerprint tags or Foobar2000 has not be configured to read the full tag (on v1.6.X).\n\nEither configure \'LargeFieldsConfig.txt\' properly or use \'Read directly from files\' option.', 'Fingerprint Tag');
	}
	return bToEntries
		? bFastMap
			? Object.entries(reverseMap)
			: reverseMap.entries()
		: reverseMap;
};

// Creates a database of all fp tags from the library using only a truncated value. The keys are the fp
// values, pointing to the handle indexes on the library as values.
// Must be used along a library map pointing indexes to file paths when reusing it after restarting foobar2000.
// Indexes don't remain constant for the same file even if the library doesn't change in size on startup!
// So indexes must be matched to a path, and then those paths used to find again the new indexes
// Why don't use paths directly as values? Memory overflow at utils.WriteTextFile(). Also the same value
// will appear a hundred times.... wasting a lot of memory
chromaPrintUtils.reverseIndexing = function reverseIndexing({
	toTags = null,
	toSplitTags = null,
	bFastMap = this.bFastMap,
	prevMap = null,
	currOffset = 0,
	reverseIdxLen = this.reverseIdxLen,
	tagLen = this.tagLenReverse,
	bProfile = true,
	bConsole = true
}) {
	if (!toTags && !toSplitTags) { return null; }
	const profile = bProfile ? new FbProfiler('ChromaPrint fingerprint') : null;
	// Split original tags in arrays of ints if they are joined with comma, etc.
	let splitTags = toTags.map((array) => array.filter(Boolean))
		|| toSplitTags
			.map((array) => { return array.map((item) => { return item.split(','); }).flat(1).map((item) => { return item ? Number(item) : void (0); }).filter(Boolean); });
	// Create inverse map with every fp tag pointing to every handle which features it
	// Position doesn't matter
	const reverseMap = bFastMap ? (prevMap || new FastMap()) : (prevMap || new Map()); // [[integer, set([idx])], ...]
	let prevProgress = -1, iSteps = splitTags.length;
	splitTags.forEach((array, idx) => {
		if (array[0]) {
			let splitArr = array.map((item) => { return item.split(','); }).flat(1).slice(0, tagLen).map((item) => { return item ? Number(item) : void (0); }).filter(Boolean);
			splitArr.forEach((tag) => {
				const truncate = tag.toString().slice(0, reverseIdxLen);
				if (!reverseMap.has(truncate)) { reverseMap.set(truncate, new Set([idx + currOffset])); } // When a number appears multiple times, it's only counted once
				else { reverseMap.set(truncate, reverseMap.get(truncate).add(idx + currOffset)); }
			});
			if (bConsole) {
				const progress = Math.round((idx + 1) / iSteps * 10) * 10;
				if (progress > prevProgress) { prevProgress = progress; console.log('Creating fingerprint database ' + progress + '%.'); }
			}
		}
	});
	if (bProfile) { profile.Print('Create reverse indexed database for ' + iSteps + ' files - completed in '); }
	return reverseMap;
};

// Count how many times a rounded fp value matches the database
chromaPrintUtils.reverseIdxMatch = function reverseIdxMatch({
	fromTags,
	reverseMap,
	threshold = 50,
	zeroMatch = null, // new Set(range(0, toTags.length, 1)) when threshold is Zero
	bFastMap = this.bFastMap,
	reverseIdxLen = this.reverseIdxLen
}) {
	if (!reverseMap || !fromTags) { return []; }
	if (!threshold && !zeroMatch) { return []; }
	// Find how many fp tag ints match the inverse indexing
	let matches = [];  // [{idx, similarity}, ...]
	fromTags.forEach((array) => {
		let count = bFastMap ? new FastMap() : new Map(); // [[idx, count], ...]
		// Count matches
		array.slice(0, this.tagLenReverse).forEach((tag) => {
			const truncate = tag.toString().slice(0, reverseIdxLen);
			const idxArr = threshold ? reverseMap.get(truncate) : zeroMatch;
			if (idxArr) {
				idxArr.forEach((idx) => {
					count.set(idx, (count.get(idx) || 0) + 1);
				});
			}
		});
		// Over threshold?
		let jMatches = [];
		count.forEach((value, idx) => {
			const similarity = value / Math.min(this.tagLenReverse, array.length) * 100; // This similarity doesn't take into account neither the position of the tag, nor frequency... doesn't replace fingerprint comparison
			if (similarity > threshold) { jMatches.push({ idx, similarity: round(similarity, 1) }); }
		});
		matches.push(jMatches);
	});
	return matches;
};