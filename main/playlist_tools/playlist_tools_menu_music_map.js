'use strict';
//08/03/26

/* global menusEnabled:readable, readmes:readable, menu:readable, newReadmeSep:readable, scriptName:readable, defaultArgs:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, menu_properties:writable, overwriteMenuProperties:readable, configMenu:readable, specialMenu:readable, deferFunc:readable, menu_propertiesBack:readable, createSmartShuffleMenu:readable */

/* global MF_GRAYED:readable, folders:readable, globTags:readable, _isFile:readable,  isStringWeak:readable, isBoolean:readable, MF_STRING:readable,Input:readable, doOnce:readable, debounce:readable, globQuery:readable, globQuery:readable, capitalize:readable, capitalizeAll:readable, focusFlags:readable, popup:readable, WshShell:readable, isFoobarV2:readable, isArrayEqual:readable, isJSON:readable */

// Music Map
{
	const scriptPath = folders.xxx + 'main\\search_by_distance\\search_by_distance.js';
	/* global SearchByDistance_properties:readable, updateCache:readable, sbd:readable, findStyleGenresMissingGraphCheck:readable, searchByDistance:readable, findStyleGenresMissingGraph:readable, music_graph_descriptors_culture:readable, graphDebug:readable, testGraphNodes:readable, testGraphNodeSets:readable, testGraphNodeSetsWithPath:readable, testGraphCulture:readable, cacheLink:writable, cacheLinkSet:writable, tagsCache:readable, calculateSimilarArtistsFromPls:readable, writeSimilarArtistsTags:readable, SearchByDistance_panelProperties:readable */ // eslint-disable-line no-unused-vars
	if (_isFile(scriptPath)) {
		if (!Object.hasOwn(menusEnabled, specialMenu) || menusEnabled[specialMenu] || !Object.hasOwn(menusEnabled, 'Pools (' + (typeof sbd !== 'undefined' ? sbd.name : 'Music Map') + ')') || menusEnabled['Pools (' + (typeof sbd !== 'undefined' ? sbd.name : 'Music Map') + ')']) {
			if (!Object.hasOwn(menu_properties, 'bHarmonicMixDoublePass')) { menu_properties['bHarmonicMixDoublePass'] = ['Harmonic mixing double pass to match more tracks', true]; }
			include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
			readmes[newReadmeSep()] = 'sep';
			readmes[sbd.name] = sbd.readmes.main;
			// Delete unused properties
			const toAdd = ['bAscii', 'bTagsCache', 'tags', 'genreStyleFilterTag', 'folksonomyWhitelistTag', 'folksonomyBlacklistTag', 'filePaths'];
			let toMerge = {}; // Deep copy
			toAdd.forEach((key) => {
				if (Object.hasOwn(SearchByDistance_properties, key)) {
					toMerge[key] = [...SearchByDistance_properties[key]];
					toMerge[key][0] = '\'' + sbd.name + '\' ' + toMerge[key][0];
				} else if (Object.hasOwn(SearchByDistance_panelProperties, key)) {
					toMerge[key] = [...SearchByDistance_panelProperties[key]];
					toMerge[key][0] = '\'' + sbd.name + '\' ' + toMerge[key][0];
				} else { console.log(scriptName + ': error merging ' + sbd.name + ' property (' + key + ')'); }
			});
			// Run once at startup
			deferFunc.push({
				name: sbd.name + ' initialization', func: () => {
					// Update cache with user set tags and genre/style check
					doOnce('Update ' + sbd.name + ' cache', debounce(updateCache, 3000))({ properties: menu_properties });
					if (!sbd.panelProperties.firstPopup[1]) {
						doOnce('findStyleGenresMissingGraphCheck', debounce(findStyleGenresMissingGraphCheck, 500))(menu_properties);
					}
				}
			});
			// And merge
			menu_properties = { ...menu_properties, ...toMerge }; // NOSONAR [global]
			// Other properties
			if (!Object.hasOwn(menu_properties, 'bSmartShuffleAdvc')) {
				menu_properties['bSmartShuffleAdvc'] = ['Smart shuffle extra conditions', true, { func: isBoolean }, true];
			}
			if (!Object.hasOwn(menu_properties, 'smartShuffleSortBias')) {
				menu_properties['smartShuffleSortBias'] = ['Smart shuffle sorting bias', 'random', { func: isStringWeak }, 'random'];
			}
			if (!Object.hasOwn(menu_properties, 'smartShuffleTag')) {
				menu_properties['smartShuffleTag'] = ['Smart shuffle tag', JSON.stringify([globTags.artist]), { func: isJSON }, JSON.stringify([globTags.artist])];
			}
			// Set default args
			const scriptDefaultArgs = { properties: menu_properties, bNegativeWeighting: true, bUseAntiInfluencesFilter: false, bUseInfluencesFilter: false, method: '', scoreFilter: 70, graphDistance: 100, poolFilteringTag: [], poolFilteringN: -1, bPoolFiltering: false, bRandomPick: true, bInversePick: false, probPick: 100, bSortRandom: false, bProgressiveListOrder: false, bInverseListOrder: false, bScatterInstrumentals: false, bSmartShuffle: true, bSmartShuffleAdvc: menu_properties.bSmartShuffleAdvc[1], smartShuffleSortBias: menu_properties.smartShuffleSortBias[1], artistRegionFilter: -1, bInKeyMixingPlaylist: false, bProgressiveListCreation: false, progressiveListCreationN: 1, bCreatePlaylist: true };
			// Menus
			if (!Object.hasOwn(menusEnabled, specialMenu) || menusEnabled[specialMenu]) {
				const loadMenus = (menuName, selArgs, entryArgs = []) => {
					selArgs.forEach((selArg) => {
						if (menu.isSeparator(selArg)) {
							let entryMenuName = Object.hasOwn(selArg, 'menu') ? selArg.menu : menuName;
							menu.newSeparator(entryMenuName);
						} else {
							const entryArg = entryArgs.find((item) => { return item.name === selArg.name; }) || {};
							let entryText = selArg.name;
							menu.newEntry({
								menuName, entryText, func: (args = { ...scriptDefaultArgs, ...defaultArgs, ...selArg.args, ...entryArg.args }) => {
									const globQuery = args.properties['forcedQuery'][1];
									if (Object.hasOwn(args, 'forcedQuery') && globQuery.length && args['forcedQuery'] !== globQuery) { // Join queries if needed
										args['forcedQuery'] = globQuery + ' AND ' + args['forcedQuery'];
									}
									// Set default values for tags
									const tags = JSON.parse(menu_properties.tags[1]);
									for (let key in tags) { tags[key].weight = 0; }
									for (let key in tags) {
										args.tags[key] = { ...tags[key], ...args.tags[key] };
									}
									searchByDistance(args);
								}, flags: focusFlags
							});
						}
					});
				};
				{	// -> Special playlists
					menu.newEntry({ menuName: specialMenu, entryText: 'Based on ' + sbd.name + ':', func: null, flags: MF_GRAYED });
					const selArgs = [
						{ name: 'sep' },
						{
							name: 'Influences from any date',
							args: {
								tags: { genre: { weight: 5 }, style: { weight: 5 }, mood: { weight: 15 }, key: { weight: 10 }, date: { weight: 0 }, bpm: { weight: 10 } },
								bUseInfluencesFilter: true, probPick: 100, scoreFilter: 40, graphDistance: 500, method: 'GRAPH'
							}
						},
						{
							name: 'Influences within 20 years',
							args: {
								tags: { genre: { weight: 5 }, style: { weight: 5 }, mood: { weight: 15 }, key: { weight: 10 }, date: { weight: 10, range: 20 }, bpm: { weight: 10 } },
								bUseInfluencesFilter: true, probPick: 100, scoreFilter: 40, graphDistance: 500, method: 'GRAPH'
							}
						},
						{ name: 'sep' },
						{
							name: 'Progressive playlist by genre/styles',
							args: {
								tags: { genre: { weight: 15 }, style: { weight: 5 }, mood: { weight: 30 }, key: { weight: 10 }, date: { weight: 5, range: 35 }, bpm: { weight: 10 } },
								probPick: 100, scoreFilter: 70, graphDistance: 200, method: 'GRAPH', bProgressiveListCreation: true, progressiveListCreationN: 3
							}
						},
						{
							name: 'Progressive playlist by mood',
							args: {
								tags: { genre: { weight: 20 }, style: { weight: 20 }, mood: { weight: 5 }, key: { weight: 20 }, date: { weight: 0 }, bpm: { weight: 0 } },
								probPick: 100, scoreFilter: 60, graphDistance: 300, method: 'GRAPH', bProgressiveListCreation: true, progressiveListCreationN: 3
							}
						},
						{ name: 'sep' },
						{
							name: 'Harmonic mix with similar genre/styles',
							args: {
								tags: { dynGenre: { weight: 20, range: 2 }, genre: { weight: 15 }, style: { weight: 15 }, mood: { weight: 0 }, key: { weight: 0 }, date: { weight: 5, range: 25 }, bpm: { weight: 0 } },
								probPick: 100, scoreFilter: 70, method: 'DYNGENRE', bInKeyMixingPlaylist: true
							}
						},
						{
							name: 'Harmonic mix with similar moods',
							args: {
								tags: { dynGenre: { weight: 10, range: 3 }, genre: { weight: 5 }, style: { weight: 5 }, mood: { weight: 35 }, key: { weight: 0 }, date: { weight: 5, range: 35 }, bpm: { weight: 0 } },
								probPick: 100, scoreFilter: 70, method: 'DYNGENRE', bInKeyMixingPlaylist: true
							}
						},
						{
							name: 'Harmonic mix with similar instrumental tracks',
							args: {
								tags: { dynGenre: { weight: 10, range: 3 }, genre: { weight: 5 }, style: { weight: 5 }, mood: { weight: 15 }, key: { weight: 0 }, date: { weight: 5, range: 35 }, bpm: { weight: 0 } },
								probPick: 100, scoreFilter: 70, method: 'DYNGENRE', bInKeyMixingPlaylist: true, forcedQuery: globQuery.instrumental
							}
						}
					];
					// Menus
					loadMenus(specialMenu, selArgs);
				}
			}
			if (!Object.hasOwn(menusEnabled, 'Tagging') || menusEnabled['Tagging']) {
				// Similar Artists
				menu.newSeparator('Tagging');
				const subMenu = menu.newMenu(sbd.name, 'Tagging');
				menu.newEntry({
					menuName: subMenu, entryText: 'Calculate similar artists tag', func: () => {
						calculateSimilarArtistsFromPls({
							items: plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
							properties: Object.fromEntries(toAdd.map((key) => {
								return Object.hasOwn(menu_properties, key)
									? [key, [...menu_properties[key]]]
									: null;
							}).filter(Boolean))
						});
					}
				});
				menu.newEntry({
					menuName: subMenu, entryText: 'Write similar artists tag', func: () => {
						writeSimilarArtistsTags({ file: folders.data + 'musicmap_artists.json', tagName: globTags.sbdSimilarArtist, windowName: scriptName + ': Write similar artists tag' });
					}, flags: _isFile(folders.data + 'musicmap_artists.json') ? MF_STRING : MF_GRAYED
				});
			}
			{	// -> Config menu
				if (!Object.hasOwn(menusEnabled, configMenu) || menusEnabled[configMenu] === true) {
					const createTagMenu = (menuName, options, flag = [], hook = null, entryNames = [], info = []) => {
						options.forEach((key, i) => {
							if (menu.isSeparator(key)) { menu.newSeparator(menuName); return; }
							const idxEnd = menu_properties[key][0].indexOf('(');
							const value = JSON.parse(menu_properties[key][1]).join(',');
							const entryText = (
								entryNames[i] ||
								menu_properties[key][0].substring(menu_properties[key][0].indexOf('.') + 1, idxEnd !== -1
									? idxEnd - 1
									: Infinity
								)
							).replace('\'' + sbd.name + '\' ', '') + '...' + '\t[' +
								(
									typeof value === 'string'
										? value.length ? value.cut(10) : '-disabled-'
										: value
								) + ']';
							menu.newEntry({
								menuName, entryText, func: () => {
									const example = '["GENRE","GENRE2"]';
									const input = Input.json('array strings', JSON.parse(menu_properties[key][1]), 'Enter tag(s) or TF expression(s): (JSON)\nSetting it to [] disables it, ["DEFAULT"] restores default settings.\n\nFor example:\n' + example + (info[i] ? info[i] : ''), sbd.name + ': ' + entryText.replace(/\t.*/, ''), example, void (0), true);
									if (input === null) { return; }
									menu_properties[key][1] = input.length === 1 && input[0].toUpperCase() === 'DEFAULT'
										? menu_properties[key][3]
										: JSON.stringify(input);
									if (hook) { hook(key, i, menu_properties); }
									overwriteMenuProperties; // Updates panel
								}, flags: (flag[i] !== void (0) ? flag[i] : false) ? MF_GRAYED : MF_STRING
							});
						});
					};
					{
						const subMenu = menu.newMenu(sbd.name, configMenu);
						{
							const submenuTwo = menu.newMenu('Tag remapping', subMenu);
							{	// Menu to configure tags
								menu.newEntry({ menuName: submenuTwo, entryText: 'Tag remapping (only this tool):', func: null, flags: MF_GRAYED });
								menu.newSeparator(submenuTwo);
								menu.newCondEntry({
									entryText: 'Tags (cond)', condFunc: () => {
										const tags = JSON.parse(menu_properties.tags[1]);
										const options = [...Object.keys(tags)];
										// Create menu on 2 places: tool config submenu and global tag submenu
										const configMenuTag = menu.findOrNewMenu('Tag remapping', configMenu);
										menu.newSeparator(configMenuTag);
										const configSubmenu = menu.newMenu(subMenu + '...', configMenuTag);
										options.forEach((key) => {
											const tag = tags[key];
											const value = tag.tf.join(',');
											const keyFormat = new Set(['dynGenre']).has(key)
												? capitalize(key)
												: capitalizeAll(key.replace(/(Genre|Style)/g, '/$1').replace(/(Region)/g, ' $1'), [' ', '/', '\\']);
											const entryText = keyFormat + '\t[' + (
												typeof value === 'string'
													? value.cut(10)
													: value
											) + ']';
											[configSubmenu, submenuTwo].forEach((sm) => {
												if (!tag.type.includes('virtual') || tag.type.includes('tfRemap')) {
													menu.newEntry({
														menuName: sm, entryText, func: () => {
															const example = '["GENRE","LASTFM_GENRE","GENRE2"]';
															const input = Input.json('array strings', tag.tf, 'Enter tag(s) or TF expression(s): (JSON)\n\nFor example:\n' + example, sbd.name, example, void (0), true);
															if (input === null) { return; }
															if (Object.hasOwn(defaultArgs, key)) { defaultArgs[key] = input; }
															tag.tf = input;
															menu_properties.tags[1] = JSON.stringify(tags);
															overwriteMenuProperties(); // Updates panel
															if (tag.type.includes('graph')) {
																const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
																if (answer === popup.yes) {
																	menu.btn_up(void (0), void (0), void (0), sbd.name + '\\Reset link cache');
																}
															}
														}
													});
												} else {
													menu.newEntry({ menuName: sm, entryText: keyFormat + '\t[virtual]', flags: MF_GRAYED });
												}
											});
										});
										[configSubmenu, submenuTwo].forEach((sm) => {
											menu.newSeparator(sm);
											{
												createTagMenu(sm, ['genreStyleFilterTag'], void (0), void (0), void (0), [
													'\n\nThese genre/style values will be filtered globally and not considered neither for tag similarity scoring nor for genre/style variation analysis.'
												]);
												menu.newCheckMenuLast(() => !!JSON.parse(menu_properties.genreStyleFilterTag[1]).length);
											}
											{
												createTagMenu(sm, ['folksonomyWhitelistTag'], void (0), void (0), void (0), [
													'\n\nOnly these values will be used when comparing folksonomy tags. Anything not listed here will be ignored.'
												]);
												menu.newCheckMenuLast(() => !!JSON.parse(menu_properties.folksonomyWhitelistTag[1]).length);
												createTagMenu(sm, ['folksonomyBlacklistTag'], void (0), void (0), void (0), [
													'\n\nThese values will be filtered when comparing folksonomy tags. Anything not listed here will used.'
												]);
												menu.newCheckMenuLast(() => !!JSON.parse(menu_properties.folksonomyBlacklistTag[1]).length && !JSON.parse(menu_properties.folksonomyWhitelistTag[1]).length);
											}
										});
										[configSubmenu, submenuTwo].forEach((sm) => {
											menu.newSeparator(sm);
											{	// Cache
												const options = ['bAscii', 'bTagsCache'];
												options.forEach((key) => {
													if (key === 'bTagsCache') { return; }
													const propObj = key === 'bTagsCache' ? sbd.panelProperties : menu_properties;
													const keyText = propObj[key][0];
													const entryText = (keyText.substring(keyText.indexOf('.') + 1).replace('\'' + sbd.name + '\' ', '') + (key === 'bTagsCache' && !isFoobarV2 ? '\t-only Fb >= 2.0-' : '')).replace('\'Search similar\' ', '');
													menu.newEntry({
														menuName: sm, entryText, func: () => {
															propObj[key][1] = !propObj[key][1];
															overwriteMenuProperties(); // Updates panel
															if (key === 'bAscii') {
																const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
																if (answer === popup.yes) {
																	menu.btn_up(void (0), void (0), void (0), sbd.name + '\\Reset link cache');
																}
															} else if (key === 'bTagsCache') {
																if (propObj.bTagsCache[1]) {
																	fb.ShowPopupMessage(
																		'This feature should only be enabled on Foobar2000 versions >= 2.0 32 bit.' +
																		'\n\nPrevious versions already cached tags values, thus not requiring it. Only enable it in case low memory mode is used, if better performance is desired. See:\n' +
																		'https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Version_2.0_Beta_Change_Log#Beta_20' +
																		'\n\nWarning: it may behave badly on really big libraries (+100K tracks) or if thousands of tracks are tagged/edited at the same time.\nIf you experience crashes or RAM allocation failures, disable it.'
																		, 'Tags cache');
																	tagsCache.load();
																	const answer = WshShell.Popup('Reset tags cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
																	if (answer === popup.yes) {
																		menu.btn_up(void (0), void (0), void (0), sbd.name + '\\Reset tags cache');
																	}
																} else {
																	tagsCache.unload();
																}
															}
														}, flags: key === 'bTagsCache' && !isFoobarV2 ? MF_GRAYED : MF_STRING
													});
													menu.newCheckMenu(sm, entryText, void (0), () => { return propObj[key][1]; });
												});
											}
										});
										[configSubmenu, submenuTwo].forEach((sm) => {
											menu.newSeparator(sm);
											menu.newEntry({
												menuName: sm, entryText: 'Restore defaults...', func: () => {
													menu_properties.tags[1] = menu_propertiesBack.tags[1];
													menu_properties.genreStyleFilterTag[1] = menu_propertiesBack.genreStyleFilterTag[1];
													overwriteMenuProperties(); // Force overwriting
													const newTags = JSON.parse(menu_properties.tags[1]);
													const newGraphTags = Object.values(newTags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity);
													const oldGraphTags = Object.values(tags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity);
													if (!isArrayEqual(newGraphTags, oldGraphTags)) {
														const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
														if (answer === popup.yes) {
															menu.btn_up(void (0), void (0), void (0), sbd.name + '\\Reset link cache');
														}
													}
												}
											});
										});
									}
								});
							}
						}
						menu.newSeparator(subMenu);
						// Find genre/styles not on graph
						menu.newEntry({
							menuName: subMenu, entryText: 'Find genres/styles not on Graph', func: () => {
								const tags = JSON.parse(menu_properties.tags[1]);
								findStyleGenresMissingGraph({
									genreStyleFilter: JSON.parse(menu_properties.genreStyleFilterTag[1]).filter(Boolean),
									genreStyleTag: Object.values(tags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity),
									bAscii: menu_properties.bAscii[1],
									bPopup: true
								});
							}
						});
					}
					menu.newSeparator(configMenu);
					{
						const subMenuName = 'Harmonic mixing';
						if (!menu.hasMenu(subMenuName, configMenu)) {
							menu.newMenu(subMenuName, configMenu);
							{	// bHarmonicMixDoublePass
								menu.newEntry({ menuName: subMenuName, entryText: 'For any tool which uses harmonic mixing:', func: null, flags: MF_GRAYED });
								menu.newSeparator(subMenuName);
								menu.newEntry({
									menuName: subMenuName, entryText: 'Enable double pass to match more tracks', func: () => {
										menu_properties['bHarmonicMixDoublePass'][1] = !menu_properties['bHarmonicMixDoublePass'][1];
										overwriteMenuProperties(); // Updates panel
									}
								});
								menu.newCheckMenu(subMenuName, 'Enable double pass to match more tracks', void (0), () => { return menu_properties['bHarmonicMixDoublePass'][1]; });
							}
						}
					}
					createSmartShuffleMenu(menu);
				} else { menuDisabled.push({ menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); } // NOSONAR [global]
			}
		}
	} else {
		menu.newEntry({ menuName: specialMenu, entryText: 'Based on ' + (typeof sbd !== 'undefined' ? sbd.name : 'Music Map') + ':', func: null, flags: MF_GRAYED });
		menu.newSeparator(specialMenu);
		menu.newEntry({ menuName: specialMenu, entryText: '-Not installed-', func: null, flags: MF_GRAYED });
	}
}