'use strict';
//07/09/25

/* exported createFpMenuLeft */

include('..\\..\\helpers\\helpers_xxx.js');
/* global MF_STRING:readable, MF_GRAYED:readable, folders:readable,  */
include('..\\..\\helpers\\buttons_xxx.js');
/* global showButtonReadme:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, WshShell:readable, popup:readable, _deleteFile:readable, _save:readable, _saveSplitJson:readable, utf8:readable, _jsonParseFile:readable , _jsonParseFileSplit:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global round:readable, roughSizeOfObject:readable, SetReplacer:readable, _b:readable, _p:readable */
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global overwriteProperties:readable */
include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable */
include('..\\..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\..\\main\\fingerprint\\chromaprint-utils-js_fingerprint.js');
/* global chromaPrintUtils:readable, FastMap:readable,  */
include('..\\..\\main\\fingerprint\\fooid-utils-js_fingerprint.js');
/* global fooidUtils:readable */
include('..\\..\\main\\main_menu\\main_menu_custom.js');
/* global bindDynamicMenus:readable, deleteMainMenuDynamic:readable,  */

function createFpMenuLeft({ bSimulate = false } = {}) {
	if (bSimulate) {
		this.selItems = { Count: 2 };
		return createFpMenuLeft.bind(this)(false);
	}
	const menu = new _menu();
	// Safe Check
	if (!this.selItems || !this.selItems.Count) {
		this.selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
		if (!this.selItems || !this.selItems.Count) { this.selItems = null; console.log('Fingerprint Tools: No selected items.'); }
	}
	const ppt = this.buttonsProperties;
	// limits
	const maxSel = Number(ppt.iMaxSelection[1]); // Don't search when selecting more than these items
	// Args
	const fromHandleList = this.selItems;
	const playlistName = ppt.playlistName[1];
	const chromaTag = ppt.fpTagC[1];
	const fooidTag = ppt.fpTagF[1];
	const databaseHash = ppt.databaseHash[1];
	const databasePath = folders.data + 'fpChromaprintReverseMap.json';
	const databasePathSplit = databasePath.replace('.json', '0.json');
	const databaseIdxPath = folders.data + 'fpChromaprintReverseMapIdx.json';
	// Flags
	const bFlagsSel = this.selItems !== null && this.selItems.Count >= 1;
	const bFlagsMaxSel = bFlagsSel && this.selItems.Count <= maxSel;
	const bFlagsDb = _isFile(databasePath) || _isFile(databasePathSplit);
	const bFlagsFooid = utils.CheckComponent('foo_biometric', true);
	const bChromaprint = ppt.bChromaprint[1];
	const bFooId = ppt.bFooId[1];
	const flagsChroma = bChromaprint ? MF_STRING : MF_GRAYED;
	const flagsSel = bFlagsSel ? MF_STRING : MF_GRAYED;
	const flagsMaxSel = bFlagsMaxSel ? MF_STRING : MF_GRAYED;
	const flagsMulSel = bFlagsSel && this.selItems.Count >= 2 ? MF_STRING : MF_GRAYED;
	const flagsDb = bFlagsDb ? MF_STRING : MF_GRAYED;
	const flagsFooid = bFlagsFooid ? MF_STRING : MF_GRAYED;
	// Menus
	if (bChromaprint) {	// Execute comparison Chromaprint
		menu.newEntry({
			entryText: 'Compare selection by ChromaPrint' + (!bFlagsSel ? '\t(no selection)' : !bFlagsMaxSel ? '\t(selection > ' + maxSel + ')' : ''), func: () => {
				this.switchAnimation('ChromaPrint comparison', true);
				const bDone = chromaPrintUtils.compareFingerprints({ fromHandleList, toHandleList: fromHandleList, tagName: chromaTag, threshold: 0, bSendToPls: false, bPopup: true, bReadFiles: ppt.bReadFiles[1] });
				this.selItems = null;
				this.switchAnimation('ChromaPrint comparison', false);
				return bDone;
			}, flags: flagsChroma | flagsMaxSel | flagsMulSel, data: { bDynamicMenu: true }
		});
	}
	if (bFooId) {	// Execute comparison FooID
		menu.newEntry({
			entryText: 'Compare selection by FooID' + (!bFlagsSel ? '\t(no selection)' : !bFlagsMaxSel ? '\t(selection > ' + maxSel + ')' : ''), func: () => {
				this.switchAnimation('FooID comparison', true);
				const bDone = fooidUtils.compareFingerprints({ fromHandleList, toHandleList: fromHandleList, tagName: fooidTag, threshold: 0, bSendToPls: false, bPopup: true });
				this.selItems = null;
				this.switchAnimation('FooID comparison', false);
				return bDone;
			}, flags: flagsChroma | flagsMaxSel | flagsMulSel, data: { bDynamicMenu: true }
		});
	}
	menu.newSeparator();
	if (bChromaprint) {
		// Execute comparison ChromaPrint
		if (!ppt.bReadFiles[1]) {
			menu.newEntry({
				entryText: 'Search by similar ChromaPrint' + (!bFlagsSel ? '\t(no selection)' : !bFlagsMaxSel ? '\t(selection > ' + maxSel + ')' : ''), func: () => {
					this.switchAnimation('ChromaPrint search', true);
					const bDone = chromaPrintUtils.compareFingerprints({ fromHandleList, toHandleList: fb.GetLibraryItems(), tagName: chromaTag, threshold: ppt.thresholdC[1], playlistName });
					this.selItems = null;
					this.switchAnimation('ChromaPrint search', false);
					return bDone;
				}, flags: flagsChroma | flagsMaxSel | (ppt.bReadFiles[1] ? MF_GRAYED : MF_STRING), data: { bDynamicMenu: true }
			});
		}
		// Execute comparison ChromaPrint + database
		menu.newEntry({
			entryText: 'Search by similar ChromaPrint' + (ppt.bReadFiles[1] ? '' : ' (fast)') + (!bFlagsDb ? '\t(no database)' : (!bFlagsSel ? '\t(no selection)' : !bFlagsMaxSel ? '\t(selection > ' + maxSel + ')' : '')), func: () => {
				this.switchAnimation('ChromaPrint search', true);
				const bDone = chromaPrintUtils.compareFingerprintsFilter({
					fromHandleList,
					toHandleList: fb.GetLibraryItems(),
					tagName: chromaTag,
					threshold: ppt.thresholdC[1],
					playlistName,
					bReadFiles: ppt.bReadFiles[1],
					reverseDbPath: databasePath,
					reverseDbIdxPath: databaseIdxPath
				});
				this.selItems = null;
				this.switchAnimation('ChromaPrint search', false);
				return bDone;
			}, flags: flagsChroma | flagsDb | flagsMaxSel, data: { bDynamicMenu: true }
		});
	}
	if (bFooId) {	// Execute comparison FooId
		menu.newEntry({
			entryText: 'Search by similar FooID' + (!bFlagsSel ? '\t(no selection)' : !bFlagsMaxSel ? '\t(selection > ' + maxSel + ')' : ''), func: () => {
				this.switchAnimation('FooID search', true);
				const bDone = fooidUtils.compareFingerprints({ fromHandleList, toHandleList: fb.GetLibraryItems(), tagName: fooidTag, threshold: ppt.thresholdF[1], playlistName });
				this.selItems = null;
				this.switchAnimation('FooID search', false);
				return bDone;
			}, flags: flagsMaxSel, data: { bDynamicMenu: true }
		});
	}
	menu.newSeparator();
	{
		const menuName = menu.newMenu('Tagging');
		{	// Tag ChromaPrint
			menu.newEntry({
				menuName, entryText: 'Tag with ChromaPrint' + (!bFlagsSel ? '\t(no selection)' : ''), func: () => {
					this.switchAnimation('ChromaPrint tagging', true);
					// Rough estimation of processing time based on total duration... bitrate? Sample rate?
					const t = fromHandleList.CalcTotalDuration() / 3600 * 0.0029, h = Math.floor(t), m = Math.round((t - h) * 60);
					const tText = ((h ? h + ' h' : '') + (h && m ? ' ' : '') + (m ? m + ' min' : '')) || '< 1 min';
					const answer = WshShell.Popup('Tag selected tracks with ChromaPrint?\nEstimated time: ' + tText + '\n(based on selection\'s total duration)', 0, 'Fingerprint Tools', popup.question + popup.yes_no);
					if (answer === popup.no) { return; }
					// To avoid classes with other calls name the json with UUID
					fb.ShowConsole();
					const bDone = chromaPrintUtils.calculateFingerprints({ fromHandleList, tagName: chromaTag, bMerge: ppt.bMergeC[1] });
					this.selItems = null;
					// Change hash to force database reloading on next call
					if (databaseHash !== -1 && fromHandleList.Convert().some((handle) => { return fb.IsMetadbInMediaLibrary(handle); })) { ppt.databaseHash[1] += 1; overwriteProperties(ppt); }
					this.switchAnimation('ChromaPrint tagging', false);
					return bDone;
				}, flags: flagsSel, data: { bDynamicMenu: true }
			});
		}
		{	// Tag FooId
			menu.newEntry({
				menuName, entryText: 'Tag with FooID' + (!bFlagsFooid ? '\t(not installed)' : (!bFlagsSel ? '\t(no selection)' : '')), func: () => {
					this.switchAnimation('FooID tagging', true);
					// Tag
					if (bFlagsFooid) { fb.ShowConsole(); }
					const bDone = fooidUtils.calculateFingerprints({ fromHandleList });
					this.selItems = null;
					this.switchAnimation('FooID tagging', false);
					return bDone;
				}, flags: flagsSel | flagsFooid, data: { bDynamicMenu: true }
			});
		}
		menu.newSeparator(menuName);
		{	// ChromaPrint database
			menu.newEntry({
				menuName, entryText: (databaseHash !== -1 ? '(Re)c' : 'C') + 'reate ChromaPrint database...', func: async (bOmmit = false) => {
					this.switchAnimation('ChromaPrint database', true);
					const toHandleList = fb.GetLibraryItems();
					const newhash = chromaprintDatabaseHash(toHandleList);
					if (!bOmmit) {
						const answer = WshShell.Popup('Scan entire library for "' + chromaTag + '" tags and create a reverse indexed database for faster mathing?.\nNote library must be tagged with ChromaPrint first.\nRecreating the database is needed after adding or removing items (only updating the new additions/removals).', 0, 'Fingerprint Tools', popup.question + popup.yes_no);
						if (answer === popup.no) { this.switchAnimation('ChromaPrint database', false); return; }
						if (newhash === databaseHash) {
							const answer = WshShell.Popup('Previous database has same hash than new one, this may happen if no items have been added/removed (duration and total count remains the same) but fingerprint tags have been changed.\nRecreate it anyway? (will require reading tags from all tracks again)', 0, 'Fingerprint Tools', popup.question + popup.yes_no);
							if (answer === popup.no) { this.switchAnimation('ChromaPrint database', false); return; }
						}
					}
					// Delete all previous files
					if (newhash === databaseHash) {
						const [path, fileName, extension] = utils.SplitFilePath(databasePath);
						const files = utils.Glob(path + '\\' + fileName + '*' + extension);
						for (let file of files) { _deleteFile(file); }
					}
					let reverseMap, libraryMap;
					if (_isFile(databaseIdxPath) && (_isFile(databasePath) || _isFile(databasePathSplit))) {
						const toAddHandleList = new FbMetadbHandleList();
						const toDeleteIdx = new Set();
						let idxCount = 0;
						let oldData = _jsonParseFile(databaseIdxPath, utf8);
						if (oldData && oldData.length) {
							oldData = chromaPrintUtils.bFastMap ? new FastMap(oldData) : new Map(oldData);
							idxCount = oldData.size - 1;
							libraryMap = chromaPrintUtils.libraryMap({ toHandleList, bReverse: true });
							const oldKeys = new Set(Object.values(oldData));
							const newKeys = new Set(Object.keys(libraryMap));
							const toAdd = newKeys.difference(oldKeys);
							toAdd.forEach((key) => {
								console.log('ChromaPrint idx adding: ' + key);
								toAddHandleList.Add(toHandleList[libraryMap.get(key)]);
								oldData.set(++idxCount, key); // idx must be remapped to new positions
							});
							oldData.forEach((value, key) => {
								if (!newKeys.has(value)) { toDeleteIdx.add(Number(key)); }
							});
							if (toDeleteIdx.size) {
								toDeleteIdx.forEach((key) => {
									console.log('ChromaPrint idx deleting: ' + _p(key) + ' ' + oldData.get(key));
									oldData.delete(key);
								});
							}
							libraryMap = oldData;
						} else {
							libraryMap = chromaPrintUtils.libraryMap({ toHandleList, bReverse: false });
						}
						_save(databaseIdxPath, JSON.stringify(Object.entries(libraryMap)));
						oldData = libraryMap = null;
						if (toAddHandleList.Count || toDeleteIdx.size) {
							oldData = _jsonParseFileSplit(databasePath, 'Fingerprint inverse database', 'Database creation', utf8);
							if (oldData && oldData.length) {
								oldData = chromaPrintUtils.bFastMap ? new FastMap(oldData) : new Map(oldData);
								if (toAddHandleList.Count) {
									console.log('ChromaPrint fingerprint database adding: ' + toAddHandleList.Count + ' new items.');
									reverseMap = await chromaPrintUtils.reverseIndexingIter({ toHandleList: toAddHandleList, bReadFiles: ppt.bReadFiles[1] });
									reverseMap.forEach((value, key) => {
										value = new Set(Array.from(value, (idx) => idx + idxCount)); // idx must be remapped to new positions
										oldData.set(key, (new Set(oldData.get(key) || [])).union(value));
									});
								}
								if (toDeleteIdx.size) {
									console.log('ChromaPrint fingerprint database deleting idx: ' + [...toDeleteIdx].join(', '));
									oldData.forEach((value, key) => {
										const arrIdx = [...value].filter((idx) => !toDeleteIdx.has(idx));
										oldData.set(key, new Set(arrIdx));
									});
								}
								reverseMap = chromaPrintUtils.bFastMap ? Object.entries(oldData) : oldData.entries();
							}
						}
					} else {
						libraryMap = chromaPrintUtils.libraryMap({ toHandleList, bReverse: false });
						_save(databaseIdxPath, JSON.stringify(Object.entries(libraryMap)));
						libraryMap = null;
						reverseMap = await chromaPrintUtils.reverseIndexingIter({ toHandleList, bReadFiles: ppt.bReadFiles[1], ToEntries: true });
					}
					if (reverseMap) {
						// Split file if needed
						// Calculate in Mb, leave some margin before reaching 110 Mb, since size is an estimation
						// File size is usually 1.35 smaller than JS ram usage
						const fileSize = round(roughSizeOfObject(reverseMap) / 1024 ** 2 / 1.35, 1);
						if (fileSize > 20) {
							const dataLen = reverseMap.length;
							const newLen = round(dataLen / fileSize * 20, 0);
							_saveSplitJson(databasePath, reverseMap, SetReplacer, void (0), newLen);
						} else {
							_save(databasePath, JSON.stringify(reverseMap, SetReplacer));
						}
						reverseMap = null; // Free memory immediately, these are huge
					}
					ppt.databaseHash[1] = newhash;
					overwriteProperties(ppt);
					this.switchAnimation('ChromaPrint database', false);
				}, flags: flagsChroma
			});
		}
	}
	menu.newSeparator();
	{
		const config = menu.newMenu('Configuration');
		{
			const menuName = menu.newMenu('ChromaPrint', config);
			// Enable ChromaPrint
			menu.newEntry({
				menuName, entryText: 'Enable ChromaPrint tools', func: (bOmmit = false) => {
					if (!bOmmit) {
						const answer = WshShell.Popup('ChromaPrint tools may have RAM limitations on Foobar2000 x32 binaries.\nBeware it may produce crashes on big libraries (+50K tracks).\n\'LargeFieldsConfig.txt\' file (at profile folder) must also be configured to be able to read big tags, put a value large enough until the properties panel no longer shows a \'.\' as value (or use \'Read from files\' option).\nEnable at your own responsibility.', 0, 'Fingerprint Tools', popup.question + popup.yes_no);
						if (answer === popup.no) { return; }
					}
					ppt.bChromaprint[1] = !ppt.bChromaprint[1];
					overwriteProperties(ppt);
				}
			});
			menu.newCheckMenu(menuName, 'Enable ChromaPrint tools', void (0), () => ppt.bChromaprint[1]);
			// Enable FFprobe
			menu.newEntry({
				menuName, entryText: 'Read directly from files', func: () => {
					ppt.bReadFiles[1] = !ppt.bReadFiles[1];
					overwriteProperties(ppt);
					if (ppt.bReadFiles[1]) {
						fb.ShowPopupMessage('Instead of caching the fingerprint tag within foobar, tweaking the \'LargeFieldsConfig.txt\' file, fingerprint tag may be directly read from the files (not for files containing subsongs, like .iso or .cue files).\n\nCreating the database will be slower, since it will have to process the entire library reading from files, but it will offer similar performance afterwards bypassing some RAM limitations when caching the tag.', window.Name);
					}
				}, flags: flagsChroma
			});
			menu.newCheckMenu(menuName, 'Read directly from files', void (0), () => ppt.bReadFiles[1]);
			menu.newSeparator(menuName);
			// Scoring
			menu.newEntry({
				menuName, entryText: 'Score threshold' + '\t' + _b(ppt.thresholdC[1]), func: () => {
					const input = Input.number('int positive', ppt.thresholdC[1], 'Enter number: (>= 0 and <= 100)', 'Fingerprint Tools', ppt.thresholdC[3], [(input) => input >= 0 && input <= 100]);
					if (input === null) { return; }
					ppt.thresholdC[1] = input;
					overwriteProperties(ppt);
				}, flags: flagsChroma
			});
		}
		{
			const menuName = menu.newMenu('FooId', config);
			// Enable ChromaPrint
			menu.newEntry({
				menuName, entryText: 'Enable FooId tools', func: () => {
					ppt.bFooId[1] = !ppt.bFooId[1];
					overwriteProperties(ppt);
				}
			});
			menu.newCheckMenu(menuName, 'Enable FooId tools', void (0), () => ppt.bFooId[1]);
			menu.newSeparator(menuName);
			// Scoring
			menu.newEntry({
				menuName, entryText: 'Score threshold' + '\t' + _b(ppt.thresholdF[1]), func: () => {
					const input = Input.number('int positive', ppt.thresholdF[1], 'Enter number: (>= 0 and <= 100)', 'Fingerprint Tools', ppt.thresholdF[3], [(input) => input >= 0 && input <= 100]);
					if (input === null) { return; }
					ppt.thresholdF[1] = input;
					overwriteProperties(ppt);
				}, flags: flagsFooid
			});
		}
		menu.newSeparator(config);
		{	// Config max Selection
			menu.newEntry({
				menuName: config, entryText: 'Max selection allowed' + '\t' + _b(maxSel), func: () => {
					const input = Input.number('int positive', maxSel, 'Enter number: (greater than 0)', 'Fingerprint Tools', ppt.iMaxSelection[3], [(input) => input >= 0]);
					if (input === null) { return; }
					ppt.iMaxSelection[1] = input;
					overwriteProperties(ppt);
				}
			});
		}
		menu.newSeparator(config);
		{
			menu.newEntry({
				menuName: config, entryText: 'Create SMP dynamic menus', func: () => {
					ppt.bDynamicMenus[1] = !ppt.bDynamicMenus[1];
					overwriteProperties(ppt);
					// And create / delete menus
					const parentName = 'Fingerprint Tools';
					if (ppt.bDynamicMenus[1]) {
						fb.ShowPopupMessage('Remember to set different panel names to every buttons toolbar, otherwise menus will not be properly associated to a single panel.\n\nShift + Win + R. Click -> Configure panel... (\'edit\' at top)', window.Name);
						bindDynamicMenus({ menu: createFpMenuLeft.bind(this), parentName });
					} else {
						deleteMainMenuDynamic(parentName);
					}
				}
			});
			menu.newCheckMenu(config, 'Create SMP dynamic menus', void (0), () => { return ppt.bDynamicMenus[1]; });
			menu.newSeparator(config);
			menu.newEntry({ menuName: config, entryText: 'Readme...', func: () => showButtonReadme('buttons_fingerprint_tools.js') });

		}
	}
	if (databaseHash !== -1) {
		let bRecreate = popup.no;
		// Missing database?
		if (!_isFile(databasePath) && ! _isFile(databasePathSplit)) {
			ppt.databaseHash[1] = -1;
			overwriteProperties(ppt);
			bRecreate = WshShell.Popup('ChromaPrint database file is missing.\nRecreate it?', 0, 'Fingerprint Tools', popup.question + popup.yes_no);
		}
		// Check database is up to date and ask to recreate it otherwise
		else if (chromaprintDatabaseHash(fb.GetLibraryItems()) !== databaseHash) {
			bRecreate = WshShell.Popup('Previous ChromaPrint database may not be up to date.\nRecreate it?', 0, 'Fingerprint Tools', popup.question + popup.yes_no);
		}
		// Call the entry to recreate it directly without any more questions and continue with the menu
		if (bRecreate === popup.yes) { menu.btn_up(void (0), void (0), void (0), 'Tagging\\(Re)create ChromaPrint database...', void (0), void (0), void (0), { pos: 0, args: true }); }
	}
	return menu;
}

// Just cache total duration of library + item count.
// Don't consider file size since other tags not related to fingerprint may change... this case is covered at tagging step forcing an arbitrary hash change
function chromaprintDatabaseHash(libItems) {
	return round(libItems.CalcTotalDuration() + libItems.Count, 4);
}