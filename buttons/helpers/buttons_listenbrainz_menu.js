'use strict';
//11/08/25

/* exported listenBrainzMenu */

include('..\\..\\helpers\\helpers_xxx.js');
/* global popup:readable, folders:readable, globTags:readable, MF_STRING:readable, MF_GRAYED:readable, VK_SHIFT:readable, globQuery:readable, isYouTube:readable, MF_MENUBREAK:readable, VK_CONTROL:readable */
include('..\\..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global WshShell:readable, _isFile:readable, _jsonParseFileCheck:readable, utf8:readable, _jsonParseFileCheck:readable, _jsonParseFileCheck:readable, _runCmd:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _b:readable, _t:readable, _q:readable, _p:readable, _asciify:readable, isArrayEqual:readable, isUUID:readable, range:readable, isString:readable */
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global overwriteProperties:readable */
include('..\\..\\helpers\\buttons_xxx_menu.js');
/* global _menu:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global sanitizeQueryVal:readable, sanitizeTagValIds:readable, sanitizeTagIds:readable, sanitizeQueryVal:readable,queryJoin:readable */
include('..\\..\\helpers\\helpers_xxx_tags_extra.js');
/* global getSimilarDataFromFile:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist:readable */
include('..\\..\\main\\playlist_manager\\playlist_manager_listenbrainz.js');
/* global ListenBrainz:readable, SimpleCrypto:readable */
include('..\\..\\main\\playlist_manager\\playlist_manager_listenbrainz_extra.js');
/* global Table:readable */
include('..\\..\\main\\playlist_manager\\playlist_manager_youtube.js');
/* global youTube:readable */
include('..\\..\\main\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicates:readable */
include('..\\..\\main\\main_menu\\main_menu_custom.js');

// listenBrainzMenu.bind(this)().btn_up(x, y)
function listenBrainzMenu({ bSimulate = false } = {}) {
	if (bSimulate) {
		this.selItems = { Count: 1 };
		return listenBrainzMenu.bind(this)(false);
	}
	// Helpers
	const lb = ListenBrainz;
	const properties = this.buttonsProperties || this.properties;
	const filePaths = JSON.parse(this.buttonsProperties.filePaths[1]);
	const feedbackTag = properties.feedbackTag[1];
	const bLookupMBIDs = properties.bLookupMBIDs[1];
	const bListenBrainz = isString(properties.lBrainzToken[1]);
	const bEncrypted = properties.lBrainzEncrypt[1];
	const getToken = () => lb.decryptToken({ lBrainzToken: properties.lBrainzToken[1], bEncrypted });
	async function checkLBToken(lBrainzToken = properties.lBrainzToken[1]) {
		if (!isString(lBrainzToken)) {
			const encryptToken = '********-****-****-****-************';
			const currToken = properties.lBrainzEncrypt[1] ? encryptToken : properties.lBrainzToken[1];
			try { lBrainzToken = utils.InputBox(window.ID, 'Enter ListenBrainz user token:', window.Name, currToken, true); }
			catch (e) { return false; } // eslint-disable-line no-unused-vars
			if (lBrainzToken === currToken || lBrainzToken === encryptToken) { return false; }
			if (isString(lBrainzToken)) {
				if (!(await lb.validateToken(lBrainzToken))) { fb.ShowPopupMessage('ListenBrainz Token not valid.', 'ListenBrainz'); return false; }
				const answer = WshShell.Popup('Do you want to encrypt the token?', 0, window.Name, popup.question + popup.yes_no);
				if (answer === popup.yes) {
					let pass = '';
					try { pass = utils.InputBox(window.ID, 'Enter a password:\n(will be required on every use)', window.Name, pass, true); }
					catch (e) { return false; } // eslint-disable-line no-unused-vars
					if (!isString(pass)) { return false; }
					lBrainzToken = new SimpleCrypto(pass).encrypt(lBrainzToken);
				}
				properties.lBrainzEncrypt[1] = answer === popup.yes;
			}
			properties.lBrainzToken[1] = lBrainzToken;
			overwriteProperties(properties);
		}
		return true;
	}
	// Update cache
	if (bListenBrainz) {
		lb.retrieveUser(getToken(), false).then((name) => {
			if (name) {
				properties.userCache[1] = name;
				overwriteProperties({ userCache: [...properties.userCache] });
			}
		});
	}
	// Get current selection and metadata
	const sel = this.sel || plman.ActivePlaylist !== -1 ? fb.GetFocusItem(true) : null;
	const info = sel ? sel.GetFileInfo() : null;
	const bioTags = this.bioTags || {};
	// Set tags for lookup and filter wrong values
	const tags = (JSON.parse(properties.tags[1]) || []).filter((tag) => {
		return tag && tag.tf && tag.tf.length && isString(tag.name) && tag.type;
	});
	tags.forEach((tag) => {
		tag.val = [];
		tag.valSet = new Set();
	});
	if (info) {
		tags.forEach((tag) => {
			tag.tf.forEach((tf, i) => {
				const idx = info.MetaFind(tf);
				tag.val.push([]);
				// File tags
				if (idx !== -1) {
					let count = info.MetaValueCount(idx);
					while (count--) {
						const val = info.MetaValue(idx, count).trim();
						tag.val[i].push(val);
						if (i === 0 || i !== 0 && !/TITLE|ALBUM_TRACKS/i.test(tag.type)) { tag.valSet.add(val); }
					}
				} else {
					// foo_uie_biography
					if (tf === 'LASTFM_SIMILAR_ARTIST') { // NOSONAR
						fb.TitleFormat('[%' + tf + '%]')
							.EvalWithMetadb(sel)
							.split('; ')
							.filter(Boolean)
							.slice(0, 10)
							.forEach((val) => {
								val = val.trim();
								tag.val[i].push(val);
								tag.valSet.add(val);
							});
					}
				}
				// Bio tags
				if (bioTags) {
					const key = Object.keys(bioTags).find((key) => key.toUpperCase() === tf);
					if (key) {
						let count = bioTags[key].length;
						while (count--) {
							const val = bioTags[key][count].trim();
							tag.val[i].push(val);
							if (i === 0 || i !== 0 && !/TITLE|ALBUM_TRACKS/i.test(tag.type)) { tag.valSet.add(val); }
						}
					}
				}
			});
		});
		// Similar artists tags
		[
			{ file: filePaths.listenBrainzArtists, dataId: 'artist', tag: globTags.lbSimilarArtist },
			{ file: filePaths.searchByDistanceArtists, dataId: 'artist', tag: globTags.sbdSimilarArtist }
		].forEach((option) => {
			if (_isFile(option.file)) {
				const dataId = option.dataId;
				const dataTag = option.tag;
				const tagId = globTags.artistRaw.toLowerCase();
				const selIds = [...(tags.find((tag) => tag.tf.some((tf) => tf.toLowerCase() === tagId)) || { valSet: [] }).valSet];
				if (selIds.length) {
					const data = getSimilarDataFromFile(option.file);
					const lbData = new Set();
					if (data) {
						data.forEach((item) => {
							if (selIds.some((id) => item[dataId] === id)) {
								item.val.slice(0, 10).forEach((val) => lbData.add(val.artist));
							}
						});
					}
					if (lbData.size) {
						const lbTag = tags.find((tag) => tag.tf.some((tf) => tf === dataTag));
						const idx = lbTag ? lbTag.tf.findIndex((tf) => tf === dataTag) : -1;
						if (idx !== -1) {
							lbTag.val[idx].push(...lbData);
							lbTag.valSet = lbTag.valSet.union(lbData);
						}
					}
				}
			}
		});
		// World map tags
		if (_isFile(filePaths.worldMapArtists)) {
			const dataId = 'artist';
			const selIds = [...(tags.find((tag) => tag.tf.some((tf) => tf.toLowerCase() === dataId)) || { valSet: [] }).valSet];
			if (selIds.length) {
				const data = _jsonParseFileCheck(filePaths.worldMapArtists, 'Tags json', window.Name, utf8);
				const worldMapData = new Set();
				if (data) {
					data.forEach((item) => {
						if (selIds.some((id) => item[dataId] === id)) {
							item.val.forEach((val) => worldMapData.add(val));
						}
					});
				}
				if (worldMapData.size) {
					const localeTag = tags.find((tag) => tag.tf.some((tf) => tf === 'LOCALE WORLD MAP'));
					const idx = localeTag ? localeTag.tf.findIndex((tf) => tf === 'LOCALE WORLD MAP') : -1;
					if (idx !== -1) {
						localeTag.val[idx].push(...worldMapData);
						localeTag.valSet = localeTag.valSet.union(worldMapData);
					}
				}
			}
		}
	}
	const importPlaylist = async (playlist, name) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		if (!await checkLBToken()) { return false; }
		const token = bListenBrainz ? getToken() : null;
		if (!token) { return; }
		this.switchAnimation('ListenBrainz data retrieval', true);
		lb.importPlaylist({ playlist_mbid: playlist.identifier.replace(lb.regEx, '') }, token)
			.then((jspf) => {
				if (jspf) {
					['extension', 'title'].forEach((key) => {
						if (!playlist[key]) { playlist[key] = jspf.playlist[key]; }
					});
					const data = lb.contentResolver(jspf, properties.forcedQuery[1], void (0), properties.bPlsMatchMBID[1]);
					const items = data.handleArr;
					const notFound = data.notFound;
					// Find missing tracks on YouTube
					if (notFound.length && properties.bYouTube[1] && isYouTube) {
						this.switchAnimation('YouTube Scrapping', true);
						// Add MBIDs to youTube track metadata
						notFound.forEach((track) => track.tags = {
							musicbrainz_trackid: track.identifier,
							musicbrainz_albumartistid: track.artistIdentifier[0],
							musicbrainz_artistid: track.artistIdentifier,
						});
						// Send request in parallel every x ms and process when all are done
						return Promise.parallel(notFound, youTube.searchForYoutubeTrack, 5).then((results) => {
							let j = 0;
							const itemsLen = items.length;
							results.forEach((result) => {
								for (void (0); j <= itemsLen; j++) {
									if (result.status !== 'fulfilled') { // Only code errors are output
										console.log('YouTube:', result.status, result.reason.message);
										break;
									}
									const link = result.value;
									if (!link || !link.length) { break; }
									if (!items[j]) {
										items[j] = link.url;
										break;
									}
								}
							});
							return items;
						})
							.finally(() => {
								this.switchAnimation('YouTube Scrapping', false);
							});
					} else {
						return items;
					}
				}
			}).then((items) => {
				const user = playlist.extension && playlist.extension[lb.jspfExt]
					? playlist.extension[lb.jspfExt].created_for
					: '';
				if (bShift) { items.shuffle(); }
				const idx = plman.FindOrCreatePlaylist('ListenBrainz: ' + (name || playlist.title) + (user ? ' ' + _p(user) : ''), true);
				plman.ClearPlaylist(idx);
				plman.AddPlaylistItemsOrLocations(idx, items.filter(Boolean), true);
				plman.ActivePlaylist = idx;
			})
			.finally(() => {
				if (this.isAnimationActive('ListenBrainz data retrieval')) { this.switchAnimation('ListenBrainz data retrieval', false); }
			});
	};
	// Menu
	const menu = new _menu();
	const selectedFlagsCount = (maxCount) => {
		return (idx = plman.ActivePlaylist) => {
			const count = this.selItems
				? (this.selItems.Count || 0)
				: idx !== -1
					? plman.GetPlaylistSelectedItems(idx).Count
					: 0;
			return (count && count <= maxCount ? MF_STRING : MF_GRAYED);
		};
	};
	const selectedCountTitle = (maxCount, idx = plman.ActivePlaylist) => {
		const count = this.selItems
			? (this.selItems.Count || 0)
			: idx !== -1
				? plman.GetPlaylistSelectedItems(idx).Count
				: 0;
		return (count
			? count <= maxCount ? '' : ' (< ' + maxCount + ' tracks)'
			: ''
		);
	};
	// Menu
	{	// Feedback
		const menuName = menu.newMenu('Set feedback (on selection)');
		menu.newEntry({ menuName, entryText: 'Set track status on ListenBrainz:', flags: MF_GRAYED });
		menu.newSeparator(menuName);
		[
			{ key: 'love', name: 'Love selected tracks' },
			{ key: 'hate', name: 'Hate selected tracks' },
			{ name: 'sep' },
			{ key: 'remove', name: 'Clear selected tracks' }
		].forEach((entry) => {
			if (menu.isSeparator(entry)) { menu.newSeparator(menuName); return; }
			menu.newEntry({
				menuName, entryText: entry.name + (bListenBrainz ? selectedCountTitle(25) : '\t(token not set)'), func: async () => {
					if (!await checkLBToken()) { return false; }
					const token = bListenBrainz ? getToken() : null;
					if (!token) { return; }
					const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
					const user = await lb.retrieveUser(token);
					// Check actual feedback
					this.switchAnimation('ListenBrainz data retrieval', true);
					const response = await lb.getFeedback(handleList, user, token, bLookupMBIDs);
					const sendMBIDs = [];
					if (response && response.length) {
						response.forEach((obj) => {
							if (!obj.recording_mbid) { return; } // Omit not found items
							if (obj.score === 1 && entry.key !== 'love' || obj.score === -1 && entry.key !== 'hate' || obj.score === 0 && entry.key !== 'remove') { sendMBIDs.push(obj.recording_mbid); }
						});
					} else {
						const mbids = await lb.getMBIDs(handleList, null, false);
						mbids.filter(Boolean).forEach((mbid) => sendMBIDs.push(mbid));
					}
					this.switchAnimation('ListenBrainz data retrieval', false);
					// Only update required tracks
					if (sendMBIDs.length) {
						this.switchAnimation('ListenBrainz data uploading', true);
						const response = await lb.sendFeedback(sendMBIDs, entry.key, token);
						this.switchAnimation('ListenBrainz data uploading', false);
						if (!response || !response.every(Boolean)) {
							if (user || isString(properties.userCache[1])) {
								console.log('ListenBrainz: Error connecting to server. Data has been cached and will be sent later...');
								const date = Date.now();
								const data = lb.cache.feedback.get(user || properties.userCache[1]) || {};
								if (!response) {
									sendMBIDs.forEach((mbid) => data[mbid] = { feedback: entry.key, date });
								} else {
									response.forEach((bUpdate, i) => {
										if (!bUpdate) { data[sendMBIDs[i]] = { feedback: entry.key, date }; }
									});
								}
								lb.cache.feedback.set(user || properties.userCache[1], data);
								setTimeout(this.saveCache, 0, user || properties.userCache[1]);
							} else {
								fb.ShowPopupMessage('Error connecting to server. Check console.\nUser has not been retrieved and feedback can not be saved to cache.', 'ListenBrainz');
							}
						}
					}
					if (properties.bTagFeedback[1]) {
						console.log('Tagging files...');
						const feedback = entry.key === 'love' ? 1 : entry.key === 'hate' ? -1 : '';
						const tags = Array(handleList.Count).fill('').map(() => { return { [feedbackTag]: feedback }; });
						handleList.UpdateFileInfoFromJSON(JSON.stringify(tags));
					}
				}, flags: bListenBrainz ? selectedFlagsCount(25) : MF_GRAYED, data: { bDynamicMenu: true }
			});
		});
		menu.newSeparator(menuName);
		// 100 track limit is imposed although the API with POST method allows an unlimited number
		menu.newEntry({
			menuName, entryText: 'Report for selected tracks' + (bListenBrainz ? selectedCountTitle(Infinity) : '\t(token not set)'), func: async () => {
				if (!await checkLBToken()) { return false; }
				const token = bListenBrainz ? getToken() : null;
				if (!token) { return; }
				const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
				this.switchAnimation('ListenBrainz data retrieval', true);
				const response = await lb.getFeedback(handleList, await lb.retrieveUser(token), token, bLookupMBIDs);
				this.switchAnimation('ListenBrainz data retrieval', false);
				const titles = fb.TitleFormat('%TITLE%').EvalWithMetadbs(handleList);
				const feedbacks = fb.TitleFormat(_b(_t(feedbackTag))).EvalWithMetadbs(handleList);
				const table = new Table;
				let loved = 0, hated = 0, mismatch = 0;
				response.forEach((obj, i) => {
					const title = titles[i];
					const score = obj.score === 1 ? 'love' : obj.score === -1 ? 'hate' : '-none-';
					const feedbackNum = Number(feedbacks[i]);
					const feedback = feedbackNum === 1 ? 'love' : feedbackNum === -1 ? 'hate' : '-none-';
					const bMismatch = feedback !== score;
					if (obj.score === 1 || feedbackNum === 1) { loved++; } else if (obj.score === -1 || feedbackNum === -1) { hated++; }
					if (bMismatch) { mismatch++; }
					table.cell('Title', title);
					table.cell('Online', score);
					table.cell('Tag', bMismatch
						? feedback !== '-none-'
							? feedback
							: '  \u2715  '
						: '  \u2713  ');
					table.newRow();
				});
				let report = 'Analyzed ' + response.length + ' tracks:\n  - Loved: ' + loved + '\n  - Hated: ' + hated + '\n  - Mismatch: ' + mismatch;
				report += '\n\n' + table.toString();
				fb.ShowPopupMessage(report, 'ListenBrainz Feedback');
			}, flags: bListenBrainz ? selectedFlagsCount(Infinity) : MF_GRAYED, data: { bDynamicMenu: true }
		});
	}
	{	// Feedback report
		const menuName = menu.newMenu('Get user tracks feedback');
		menu.newEntry({ menuName, entryText: 'By feedback: (Shift + Click to randomize)', flags: MF_GRAYED });
		menu.newSeparator(menuName);
		[
			{ key: 'love', name: 'Loved tracks', score: 1 },
			{ key: 'hate', name: 'Hated tracks', score: -1 }
		].forEach((entry) => {
			menu.newEntry({
				menuName, entryText: 'Find ' + entry.name + ' in library' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
					const bShift = utils.IsKeyPressed(VK_SHIFT);
					if (!await checkLBToken()) { return false; }
					const token = bListenBrainz ? getToken() : null;
					if (!token) { return; }
					this.switchAnimation('ListenBrainz data retrieval', true);
					const user = await (lb.retrieveUser(token));
					const response = await lb.getUserFeedback(user, { score: entry.score, offset: 0, count: lb.MAX_ITEMS_PER_GET, metadata: 'true' }, token);
					this.switchAnimation('ListenBrainz data retrieval', false);
					const mbids = [], titles = [], artists = [];
					const table = new Table;
					response.forEach((feedback) => {
						const mbid = feedback.recording_mbid;
						const trackMetadata = Object.hasOwn(feedback, 'track_metadata') ? feedback.track_metadata : null;
						const title = trackMetadata ? trackMetadata.track_name : '';
						const artist = trackMetadata ? trackMetadata.artist_name : '';
						titles.push(title);
						artists.push(artist);
						mbids.push(mbid);
						table.cell('Title', title);
						table.cell('Artist', artist);
						table.cell('MBID', mbid);
						table.newRow();
					});
					const queryArr = mbids.map((mbid, i) => {
						if (!mbid.length) { return; }
						const title = sanitizeQueryVal(sanitizeTagValIds(titles[i]));
						const artist = sanitizeQueryVal(sanitizeTagValIds(artists[i]));
						const bMeta = properties.bFeedbackLookup[1] && isString(title) && isString(artist);
						return 'MUSICBRAINZ_TRACKID IS ' + mbid + (bMeta ? ' OR (' + _q(sanitizeTagIds(_t(globTags.titleRaw))) + ' IS ' + title + ' AND ' + _q(sanitizeTagIds(globTags.artist)) + ' IS ' + artist + ')' : '');
					}).filter(Boolean);
					let query = queryJoin([queryJoin(queryArr, 'OR'), properties.feedbackQuery[1]], 'AND');
					let handleList;
					try { handleList = fb.GetQueryItems(fb.GetLibraryItems(), query); } // Sanity check
					catch (e) { fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return; } // eslint-disable-line no-unused-vars
					let report = entry.name + ': ' + response.length + '\n\n' + table.toString();
					// Find tracks with feedback tag, and insert them at the end without duplicates
					let libHandleList;
					query = feedbackTag + ' IS ' + entry.score;
					try { libHandleList = fb.GetQueryItems(fb.GetLibraryItems(), query); } // Sanity check
					catch (e) { fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return; } // eslint-disable-line no-unused-vars
					const copyHandleList = handleList.Clone();
					copyHandleList.Sort();
					let byTagHandleList = new FbMetadbHandleList();
					libHandleList.Convert().forEach((handle) => {
						if (copyHandleList.BSearch(handle) === -1) { byTagHandleList.Insert(byTagHandleList.Count, handle); }
					});
					// Insert in global list
					const byTagCount = byTagHandleList.Count;
					if (byTagCount) {
						byTagHandleList = removeDuplicates({ handleList: byTagHandleList, checkKeys: ['MUSICBRAINZ_TRACKID'], sortBias: globQuery.remDuplBias, bPreserveSort: false });
						handleList.InsertRange(handleList.Count, byTagHandleList);
						// Add to report
						const bRemovedDup = byTagHandleList.Count !== byTagCount;
						const titles = fb.TitleFormat('%TITLE%').EvalWithMetadbs(byTagHandleList);
						const artists = fb.TitleFormat('%ARTIST%').EvalWithMetadbs(byTagHandleList);
						const mbids = fb.TitleFormat('%MUSICBRAINZ_TRACKID%').EvalWithMetadbs(byTagHandleList);
						const table = new Table;
						for (let i = 0; i < byTagHandleList.Count; i++) {
							table.cell('Title', titles[i]);
							table.cell('Artist', artists[i]);
							table.cell('MBID', mbids[i]);
							table.newRow();
						}
						report += '\n\nAlso found these tracks tagged on library but not on ListenBrainz' + (bRemovedDup ? ', minus duplicates by MBID,\nTo retrieve the full list, use this query: ' + query : ':') + '\n\n' + table.toString();
					}
					fb.ShowPopupMessage(report, 'ListenBrainz ' + entry.name + ' ' + _p(user));
					if (bShift) { handleList = new FbMetadbHandleList(handleList.Convert().shuffle()); }
					sendToPlaylist(handleList, 'ListenBrainz ' + entry.name);
				}, flags: bListenBrainz ? MF_STRING : MF_GRAYED, data: { bDynamicMenu: true }
			});
		});
	}
	menu.newSeparator();
	{	// Site statistics
		const menuName = menu.newMenu('Statistics');
		menu.newEntry({ menuName, entryText: 'By Top Listens: (Shift + Click to randomize)', flags: MF_GRAYED });
		menu.newSeparator(menuName);
		['Sitewide', 'By user'].forEach((name, i) => {
			const subMenuName = menu.newMenu(name, menuName);
			[
				{ params: { range: 'this_week', count: lb.MAX_ITEMS_PER_GET }, name: 'Top tracks this week' },
				{ params: { range: 'this_month', count: lb.MAX_ITEMS_PER_GET }, name: 'Top tracks this month' },
				{ params: { range: 'this_year', count: lb.MAX_ITEMS_PER_GET }, name: 'Top tracks this year' },
				{ params: { range: 'all_time', count: lb.MAX_ITEMS_PER_GET }, name: 'Top tracks all time' }
			].forEach((entry) => {
				menu.newEntry({
					menuName: subMenuName, entryText: entry.name + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
						const bShift = utils.IsKeyPressed(VK_SHIFT);
						if (!await checkLBToken()) { return false; }
						const token = bListenBrainz ? getToken() : null;
						if (!token) { return; }
						const mbids = []; // Tracks
						const mbidsAlt = []; // Artists
						const tags = { TITLE: [], ARTIST: [], ALBUM: [] };
						this.switchAnimation('ListenBrainz data retrieval', true);
						const user = await (i ? lb.retrieveUser(token) : 'sitewide');
						lb.getTopRecordings(user, entry.params, token)
							.then((recordings) => {
								const table = new Table;
								recordings.forEach((recording) => {
									const mbid = recording.recording_mbid || '';
									const mbidAlt = (recording.artist_mbids || ['']).filter(Boolean);
									const title = recording.track_name || '';
									const artist = recording.artist_name || '';
									const release = recording.release_name || '';
									mbids.push(mbid);
									mbidsAlt.push(mbidAlt);
									tags.TITLE.push(title);
									tags.ARTIST.push(artist);
									tags.ALBUM.push(release);
									table.cell('Title', title);
									table.cell('Artist', artist);
									table.cell('MBID', mbid);
									table.newRow();
								});
								const report = entry.name + ': ' + recordings.length + '\n\n' + table.toString();
								fb.ShowPopupMessage(report, 'ListenBrainz ' + entry.name + ' ' + _p(user));
								const queryArr = mbids.map((mbid, i) => {
									const tagArr = ['TITLE', 'ARTIST', 'ALBUM']
										.map((key) => { return { key, val: sanitizeQueryVal(sanitizeTagValIds(tags[key][i])) }; });
									const bMBID = mbid.length > 0;
									const bMeta = tagArr.every((tag) => isString(tag.val));
									if (!bMeta && !bMBID) { return; }
									const query = queryJoin(
										[
											bMeta ? tagArr.map((tag) => { return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val; }).join(' AND ') : '',
											bMeta ? tagArr.slice(0, 2).map((tag) => { return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val; }).join(' AND ') + ' AND ' + globQuery.noLiveNone : '',
											bMBID ? 'MUSICBRAINZ_TRACKID IS ' + mbid : ''
										].filter(Boolean)
										, 'OR');
									return query;
								}).filter(Boolean);
								let libItems;
								if (isString(properties.forcedQuery[1])) {
									try { libItems = fb.GetQueryItems(fb.GetLibraryItems(), properties.forcedQuery[1]); } // Sanity check
									catch (e) { libItems = fb.GetLibraryItems(); } // eslint-disable-line no-unused-vars
								} else { libItems = fb.GetLibraryItems(); }
								const notFound = [];
								const items = queryArr.map((query, i) => {
									let itemHandleList;
									try { itemHandleList = fb.GetQueryItems(libItems, query); } // Sanity check
									catch (e) { fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return; } // eslint-disable-line no-unused-vars
									// Filter
									if (itemHandleList.Count) {
										itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID'], sortBias: globQuery.remDuplBias, bPreserveSort: false });
										itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle: properties.bAdvTitle[1] });
										return itemHandleList[0];
									}
									notFound.push({
										creator: tags.ARTIST[i],
										title: tags.TITLE[i],
										tags: {
											ALBUM: tags.ALBUM[i],
											MUSICBRAINZ_TRACKID: mbids[i],
											MUSICBRAINZ_ALBUMARTISTID: mbidsAlt[i][0],
											MUSICBRAINZ_ARTISTID: mbidsAlt[i]
										}
									});
									return null;
								});
								return { notFound, items };
							})
							.then(({ notFound, items }) => {
								if (notFound.length && properties.bYouTube[1] && isYouTube) {
									// Send request in parallel every x ms and process when all are done
									this.switchAnimation('YouTube Scrapping', true);
									return Promise.parallel(notFound, youTube.searchForYoutubeTrack, 5).then((results) => {
										let j = 0;
										const itemsLen = items.length;
										results.forEach((result) => {
											for (void (0); j <= itemsLen; j++) {
												if (result.status !== 'fulfilled') { // Only code errors are output
													console.log('YouTube:', result.status, result.reason.message);
													break;
												}
												const link = result.value;
												if (!link || !link.length) { break; }
												if (!items[j]) {
													items[j] = link.url;
													break;
												}
											}
										});
										return items;
									})
										.finally(() => {
											this.switchAnimation('YouTube Scrapping', false);
										});
								} else {
									return items;
								}
							})
							.then((items) => {
								if (bShift) { items.shuffle(); }
								const idx = plman.FindOrCreatePlaylist('ListenBrainz: ' + entry.name + ' ' + _p(user), true);
								plman.ClearPlaylist(idx);
								plman.AddPlaylistItemsOrLocations(idx, items.filter(Boolean), true);
								plman.ActivePlaylist = idx;
							})
							.finally(() => {
								if (this.isAnimationActive('ListenBrainz data retrieval')) { this.switchAnimation('ListenBrainz data retrieval', false); }
							});
					}, flags: bListenBrainz ? MF_STRING : MF_GRAYED, data: { bDynamicMenu: true }
				});
			});
		});
	}
	menu.newSeparator();
	{	// Selection
		const menuName = menu.newMenu('Track recommendations');
		menu.newEntry({ menuName, entryText: 'By selection:\t(Shift + Click to randomize)', flags: MF_GRAYED });
		menu.newSeparator(menuName);
		{
			if (tags.length) {
				tags.forEach((tag) => {
					const bSingle = tag.valSet.size <= 1;
					const subMenu = bSingle ? menuName : menu.newMenu(tag.name, menuName);
					if (tag.type === 'getPopularRecordingsBySimilarArtist' && !bSingle) {
						menu.newEntry({ menuName: subMenu, entryText: 'Top tracks by:', flags: MF_GRAYED });
						menu.newSeparator(subMenu);
					}
					if (tag.valSet.size === 0) { tag.valSet.add(''); }
					[...tag.valSet].sort((a, b) => a.localeCompare(b, void(0), { sensitivity: 'base' })).forEach((val, i) => {
						menu.newEntry({
							menuName: subMenu, entryText: bSingle ? tag.name + '\t[' + (val.cut(20) || (sel ? 'no tag' : 'no sel')) + ']' : val.cut(20), func: () => {
								switch (tag.type) {
									case 'getPopularRecordingsByArtist':
										runSimilar(tag.type, 'By artist top tracks', 50, val); break;
									case 'getPopularRecordingsBySimilarArtist':
										runSimilar(tag.type, 'By similar artists', void (0), val); break;
									case 'getRecordingsByTag':
										runSimilar(tag.type, 'By tag', 50, val); break;
									case 'retrieveSimilarArtists':
										runSimilar(tag.type, 'By similar artists', 'v1', val); break;
									case 'retrieveSimilarRecordings':
										runSimilar(tag.type, 'By similar tracks', 'v1', val); break;
								}
							}, flags: (val ? MF_STRING : MF_GRAYED) | (!bSingle && i % 8 === 0 && i ? MF_MENUBREAK : MF_STRING)
						});
					});
				});
			} else {
				menu.newEntry({ menuName, entryText: 'No entries enabled.', flags: MF_GRAYED });
			}
		}
		const runSimilar = async (type, reportTitle, args, val) => {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			if (!await checkLBToken()) { return false; }
			const token = bListenBrainz ? getToken() : null;
			if (!token) { return; }
			if (!sel) { return; }
			this.switchAnimation('ListenBrainz data retrieval', true);
			let selMbid;
			switch (type) {
				case 'getPopularRecordingsByArtist': {
					const selMbids = await lb.getArtistMBIDs(new FbMetadbHandleList(sel), token, bLookupMBIDs, false);
					const artistDic = await lb.joinArtistMBIDs([val], selMbids, token, true);
					selMbid = [(artistDic.find((entry) => entry.artist === val) || { mbids: [] }).mbids[0]].filter(Boolean);
					break;
				}
				case 'getPopularRecordingsBySimilarArtist': {
					const lookup = await lb.lookupArtistMBIDsByName([val], token);
					selMbid = lookup && lookup[0] ? [lookup[0].mbid] : null;
					type = 'getPopularRecordingsByArtist';
					break;
				}
				case 'retrieveSimilarArtists': {
					const selMbids = await lb.getArtistMBIDs(new FbMetadbHandleList(sel), token, bLookupMBIDs, false);
					const artistDic = await lb.joinArtistMBIDs([val], selMbids, token, true);
					selMbid = (artistDic.find((entry) => entry.artist === val) || { mbids: [] }).mbids[0];
					break;
				}
				case 'getRecordingsByTag': {
					selMbid = [val];
					break;
				}
				case 'retrieveSimilarRecordings': {
					selMbid = (await lb.getMBIDs(new FbMetadbHandleList(sel), token, bLookupMBIDs))[0];
					break;
				}
			}
			if (!selMbid || !selMbid.length) { this.switchAnimation('ListenBrainz data retrieval', false); return; }
			const mbids = [];
			const mbidsAlt = [];
			const tags = { TITLE: [], ARTIST: [], SCORE: [] };
			let count = 0;
			const user = await lb.retrieveUser(token);
			lb[type](selMbid, token, args)
				.then((recommendations) => {
					switch (type) {
						case 'retrieveSimilarArtists': { // [{artist_mbid, comment, gender, name, reference_mbid, score, type}, ...]
							recommendations.forEach((artist) => {
								mbids.push(artist.artist_mbid || '');
								tags.ARTIST.push(artist.name);
								tags.TITLE.push('');
								tags.SCORE.push(artist.score);
							});
							count = mbids.length;
							// Retrieve some recordings from given artists
							return lb.getPopularRecordingsByArtist(mbids.filter(Boolean), token, 5)
								.then((artistRecommendations) => { // [{artist_mbids, count, recording_mbid}, ...]
									let cache = '';
									const selection = [];
									artistRecommendations.forEach((recording) => {
										if (recording.artist_mbids && !isArrayEqual(cache, recording.artist_mbids)) {
											selection.push(recording);
											cache = recording.artist_mbids;
										} else { return; }
									});
									mbids.forEach((artist_mbid, i) => {
										const selLen = selection.length;
										mbidsAlt.push('');
										for (let j = 0; j < selLen; j++) {
											if (selection[j].artist_mbids.includes(artist_mbid)) {
												mbidsAlt[i] = selection.splice(j, 1)[0].recording_mbid;
												break;
											}
										}
									});
								})
								.then(() => { // Retrieve title info
									return lb.lookupRecordingInfoByMBIDs(mbidsAlt.filter(Boolean), ['recording_mbid', 'recording_name'], token);
								})
								.then((info) => {
									if (['recording_mbid', 'recording_name'].every((tag) => Object.hasOwn(info, tag))) {
										for (let i = 0; i < count; i++) {
											if (mbidsAlt[i] === info.recording_mbid[i]) {
												if (info.recording_name[i]) { tags.TITLE[i] = info.recording_name[i]; }
											}
										}
									}
								});
						}
						case 'retrieveSimilarRecordings': { // [{recording_mbid, recording_name, artist_credit_name, [artist_credit_mbids], caa_id, caa_release_mbid, canonical_recording_mbid, score, reference_mbid}, ...]
							recommendations.forEach((recording) => {
								mbids.push(recording.recording_mbid || '');
								mbidsAlt.push(recording['[artist_credit_mbids]'] || ['']);
								tags.TITLE.push(recording.recording_name);
								tags.ARTIST.push(recording.artist_credit_name);
								tags.SCORE.push(recording.score);
							});
							count = mbids.length;
							return true;
						}
						case 'getPopularRecordingsByArtist': { // [{artist_mbid, count, recording_mbid}, ...]
							recommendations.forEach((recording) => {
								mbids.push(recording.recording_mbid || '');
								mbidsAlt.push(recording.artist_mbid || '');
								tags.TITLE.push('');
								tags.ARTIST.push(val);
								tags.SCORE.push(recording.count);
							});
							count = mbids.length;
							// Retrieve title info
							return lb.lookupRecordingInfoByMBIDs(mbids.filter(Boolean), ['recording_mbid', 'recording_name'], token)
								.then((info) => {
									if (['recording_mbid', 'recording_name'].every((tag) => Object.hasOwn(info, tag))) {
										for (let i = 0; i < count; i++) {
											if (mbids[i] === info.recording_mbid[i]) {
												if (info.recording_name[i]) { tags.TITLE[i] = info.recording_name[i]; }
											}
										}
									}
								});
						}
						case 'getRecordingsByTag': { // [{recording_mbid}, ...]
							recommendations.forEach((recording) => {
								mbids.push(recording.recording_mbid || '');
								mbidsAlt.push(['']);
								tags.TITLE.push('');
								tags.ARTIST.push('');
								tags.SCORE.push('');
							});
							count = mbids.length;
							// Retrieve title info
							return lb.lookupRecordingInfoByMBIDs(mbids.filter(Boolean), ['artist_credit_name', 'recording_mbid', 'recording_name', '[artist_credit_mbids]'], token)
								.then((info) => {
									if (['artist_credit_name', 'recording_mbid', 'recording_name', '[artist_credit_mbids]'].every((tag) => Object.hasOwn(info, tag))) {
										for (let i = 0; i < count; i++) {
											if (mbids[i] === info.recording_mbid[i]) {
												if (info.recording_name[i]) { tags.TITLE[i] = info.recording_name[i]; }
												if (info.artist_credit_name[i]) { tags.ARTIST[i] = info.artist_credit_name[i]; }
												if (info['[artist_credit_mbids]'][i]) { mbidsAlt[i] = info['[artist_credit_mbids]'][i]; }
											}
										}
									}
								});
						}
					}
				})
				.then(() => {
					this.switchAnimation('ListenBrainz data retrieval', false);
					let libItems;
					if (isString(properties.forcedQuery[1])) {
						try { libItems = fb.GetQueryItems(fb.GetLibraryItems(), properties.forcedQuery[1]); } // Sanity check
						catch (e) { libItems = fb.GetLibraryItems(); } // eslint-disable-line no-unused-vars
					} else { libItems = fb.GetLibraryItems(); }
					const notFound = [];
					let items = [];
					switch (type) {
						case 'retrieveSimilarArtists': { // Just add a random track from every artist
							const queryArr = mbids.map((mbid, i) => {
								const mbidAlt = mbidsAlt[i];
								const tagArr = ['ARTIST', 'TITLE']
									.map((key) => { return { key, val: sanitizeQueryVal(sanitizeTagValIds(tags[key][i])) }; });
								const bMeta = tagArr.every((tag) => isString(tag.val));
								if (!isString(tagArr[0].val)) { return; }
								if (mbidAlt) { // Get specific recordings
									const query = queryJoin(
										[
											(bMeta
												? tagArr.map((tag) => { return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val; }).join(' AND ')
												: tagArr.slice(0, 1).map((tag) => { return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val; }).join(' AND ')
											) + ' AND ' + globQuery.noLiveNone,
											'MUSICBRAINZ_TRACKID IS ' + mbidAlt
										].filter(Boolean)
										, 'OR'
									);
									return query;
								} else { // Or any track by such artist
									const query = queryJoin(
										[
											queryJoin(
												[
													tagArr.slice(0, 1).map((tag) => { return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val; }).join(' AND ') + ' AND ' + globQuery.noLiveNone,
													'MUSICBRAINZ_ARTISTID IS ' + mbid + ' OR MUSICBRAINZ_ALBUMARTISTID IS ' + mbid
												].filter(Boolean)
												, 'OR'
											),
											'NOT (' + globTags.rating + ' IS 1 OR ' + globTags.rating + ' IS 2)'
										]
										, 'AND');
									return query;
								}
							}).filter(Boolean);
							items = queryArr.map((query, i) => {
								let itemHandleList;
								try { itemHandleList = fb.GetQueryItems(libItems, query); } // Sanity check
								catch (e) { fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return; } // eslint-disable-line no-unused-vars
								// Filter
								if (itemHandleList.Count) {
									itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID'], sortBias: globQuery.remDuplBias, bPreserveSort: false });
									itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle: properties.bAdvTitle[1] });
									return itemHandleList[0];
								}
								if (isString(tags.TITLE[i])) {
									notFound.push({
										creator: tags.ARTIST[i],
										title: tags.TITLE[i],
										tags: {
											MUSICBRAINZ_TRACKID: mbidsAlt[i],
											MUSICBRAINZ_ALBUMARTISTID: mbids[i],
											MUSICBRAINZ_ARTISTID: mbids[i]
										}
									});
								}
								return null;
							});
							// Add titles to report, since is a small amount, it's fine to iterate...
							const tfo = fb.TitleFormat('[%TITLE%]');
							items.forEach((handle, i) => {
								if (handle && !isString(tags.TITLE[i])) { tags.TITLE[i] = tfo.EvalWithMetadb(handle) || '  \u2715  '; }
							});
							break;
						}
						case 'getRecordingsByTag':
						case 'retrieveSimilarRecordings': {
							const queryArr = mbids.map((mbid, i) => {
								const tagArr = ['TITLE', 'ARTIST']
									.map((key) => { return { key, val: sanitizeQueryVal(_asciify(tags[key][i]).replace(/"/g, '')).toLowerCase() }; });
								const bMeta = tagArr.every((tag) => isString(tag.val));
								const query = queryJoin(
									[
										bMeta ? tagArr.map((tag) => { return tag.key + ' IS ' + tag.val; }).join(' AND ') + ' AND ' + globQuery.noLiveNone : '',
										'MUSICBRAINZ_TRACKID IS ' + mbid
									].filter(Boolean)
									, 'OR');
								return query;
							}).filter(Boolean);
							items = queryArr.map((query, i) => {
								let itemHandleList;
								try { itemHandleList = fb.GetQueryItems(libItems, query); } // Sanity check
								catch (e) { fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return; } // eslint-disable-line no-unused-vars
								// Filter
								if (itemHandleList.Count) {
									itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID'], sortBias: globQuery.remDuplBias, bPreserveSort: false });
									itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle: properties.bAdvTitle[1] });
									return itemHandleList[0];
								}
								notFound.push({ creator: tags.ARTIST[i], title: tags.TITLE[i], tags: { MUSICBRAINZ_TRACKID: mbids[i], MUSICBRAINZ_ALBUMARTISTID: mbidsAlt[i][0], MUSICBRAINZ_ARTISTID: mbidsAlt[i] } });
								return null;
							});
							break;
						}
						case 'getPopularRecordingsByArtist': {
							const queryArr = mbids.map((mbid, i) => {
								const tagArr = ['TITLE', 'ARTIST']
									.map((key) => { return { key, val: sanitizeQueryVal(_asciify(tags[key][i]).replace(/"/g, '')).toLowerCase() }; });
								const bMeta = tagArr.every((tag) => isString(tag.val));
								const query = queryJoin(
									[
										bMeta ? tagArr.map((tag) => { return tag.key + ' IS ' + tag.val; }).join(' AND ') + ' AND ' + globQuery.noLiveNone : '',
										'MUSICBRAINZ_TRACKID IS ' + mbid
									].filter(Boolean)
									, 'OR');
								return query;
							}).filter(Boolean);
							const artistItems = fb.GetQueryItems(libItems, 'ARTIST IS ' + tags.ARTIST[0] + ' OR ALBUM ARTIST IS ' + tags.ARTIST[0]);
							items = queryArr.map((query, i) => {
								let itemHandleList;
								try { itemHandleList = fb.GetQueryItems(artistItems, query); } // Sanity check
								catch (e) { fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return; } // eslint-disable-line no-unused-vars
								// Filter
								if (itemHandleList.Count) {
									itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID'], sortBias: globQuery.remDuplBias, bPreserveSort: false });
									itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle: properties.bAdvTitle[1] });
									return itemHandleList[0];
								}
								notFound.push({ creator: tags.ARTIST[i], title: tags.TITLE[i], tags: { MUSICBRAINZ_TRACKID: mbids[i], MUSICBRAINZ_ALBUMARTISTID: mbidsAlt[i], MUSICBRAINZ_ARTISTID: mbidsAlt[i] } });
								return null;
							});
							// Add titles to report, since is a small amount, it's fine to iterate...
							const tfo = fb.TitleFormat('[%TITLE%]');
							items.forEach((handle, i) => {
								if (handle && !isString(tags.TITLE[i])) { tags.TITLE[i] = tfo.EvalWithMetadb(handle) || '  \u2715  '; }
							});
							break;
						}
					}
					const table = new Table;
					mbids.forEach((mbid, i) => {
						table.cell('Title', tags.TITLE[i]);
						table.cell('Artist', tags.ARTIST[i]);
						table.cell('MBID', mbid);
						if (type !== 'getRecordingsByTag') { table.cell('Score', tags.SCORE[i]); }
						table.newRow();
					});
					const report = reportTitle + ': ' + count + '\n\n' + table.toString();
					fb.ShowPopupMessage(report, 'ListenBrainz ' + reportTitle + ' ' + _p(user));
					return { notFound, items };
				})
				.then(({ notFound, items }) => {
					if (notFound.length && properties.bYouTube[1] && isYouTube) {
						this.switchAnimation('YouTube Scrapping', true);
						const search = notFound.filter((t) => isString(t.title) && isString(t.creator));
						// Send request in parallel every x ms and process when all are done
						return Promise.parallel(search, youTube.searchForYoutubeTrack, 5).then((results) => {
							let j = 0;
							const itemsLen = items.length;
							results.forEach((result) => {
								for (void (0); j <= itemsLen; j++) {
									if (result.status !== 'fulfilled') { // Only code errors are output
										console.log('YouTube:', result.status, result.reason.message);
										break;
									}
									const link = result.value;
									if (!link || !link.length) { break; }
									if (!items[j]) {
										items[j] = link.url;
										break;
									}
								}
							});
							return items;
						})
							.finally(() => {
								this.switchAnimation('YouTube Scrapping', false);
							});
					} else {
						return items;
					}
				})
				.then((items) => {
					if (bShift) { items.shuffle(); }
					let plsName;
					switch (type) {
						case 'getPopularRecordingsByArtist':
							plsName = 'ListenBrainz: popular recordings by ' + val;
							break;
						case 'retrieveSimilarArtists':
							plsName = 'ListenBrainz: similar to ' + val;
							break;
						case 'getRecordingsByTag':
							plsName = 'ListenBrainz: radio ' + val;
							break;
						case 'retrieveSimilarRecordings':
							plsName = 'ListenBrainz: similar to ' + val;
							break;
					}
					const idx = plman.FindOrCreatePlaylist(plsName, true);
					plman.ClearPlaylist(idx);
					plman.AddPlaylistItemsOrLocations(idx, items.filter(Boolean), true);
					plman.ActivePlaylist = idx;
				})
				.finally(() => {
					if (this.isAnimationActive('ListenBrainz data retrieval')) { this.switchAnimation('ListenBrainz data retrieval', false); }
				});
		};
	}
	{	// User
		const menuName = menu.newMenu('User recommendations');
		const cachedUser = (bListenBrainz
			? lb.cache.user.get(getToken())
			: ''
		) || 'User';
		menu.newEntry({ menuName, entryText: 'By user: (Shift + Click to randomize)', flags: MF_GRAYED });
		menu.newSeparator(menuName);
		menu.newEntry({
			menuName, entryText: cachedUser + '\'s recommended tracks' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
				const bShift = utils.IsKeyPressed(VK_SHIFT);
				if (!await checkLBToken()) { return false; }
				const token = bListenBrainz ? getToken() : null;
				if (!token) { return; }
				this.switchAnimation('ListenBrainz user retrieval', true);
				const user = await lb.retrieveUser(token);
				this.switchAnimation('ListenBrainz user retrieval', false);
				lb.getRecommendedTracks(user, { count: lb.MAX_ITEMS_PER_GET }, 'Recommended tracks', token, properties.bYouTube[1] && isYouTube, bShift, this);
			}, flags: bListenBrainz ? MF_STRING : MF_GRAYED, data: { bDynamicMenu: true }
		});
		menu.newEntry({
			menuName, entryText: 'Recommended tracks from similar users' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
				const bShift = utils.IsKeyPressed(VK_SHIFT);
				if (!await checkLBToken()) { return false; }
				const token = bListenBrainz ? getToken() : null;
				if (!token) { return; }
				this.switchAnimation('ListenBrainz user retrieval', true);
				const user = await lb.retrieveUser(token);
				// Retrieve all and get first 10
				const similUsers = (await lb.retrieveSimilarUsers(user, token, 0)).slice(0, 9);
				this.switchAnimation('ListenBrainz user retrieval', false);
				if (!similUsers.length) { return; }
				const similUser = similUsers.shuffle()[0].user_name;
				this.switchAnimation('ListenBrainz user retrieval', false);
				lb.getRecommendedTracks(similUser, { count: lb.MAX_ITEMS_PER_GET }, 'Recommended tracks', token, properties.bYouTube[1] && isYouTube, bShift, this);
			}, flags: bListenBrainz ? MF_STRING : MF_GRAYED, data: { bDynamicMenu: true }
		});
	}
	menu.newSeparator();
	{	// Playlists
		const createPlaylistEntries = (playlists, sorting, menuName) => {
			sorting = sorting.toLowerCase();
			const count = playlists.length;
			if (count) {
				const padding = count.toString().length;
				let sortFunc;
				switch (sorting) {
					case 'cdate':
						sortFunc = (a, b) => a.date - b.date;
						break;
					case 'mdate':
						sortFunc = (a, b) => a.extension[lb.jspfExt].last_modified_at - b.extension[lb.jspfExt].last_modified_at;
						break;
					case 'name':
					default:
						sortFunc = (a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase(), void(0), { sensitivity: 'base' });
				}
				playlists.sort(sortFunc);
				const plsMenus = range(0, Math.ceil(count / 10) - 1).map((idx) => {
					const firstIdx = idx * 10;
					const lastIdx = (idx + 1) * 10;
					let first = null, last = null;
					switch (sorting) {
						case 'cdate':
							first = playlists[firstIdx].date.slice(0, 10);
							last = playlists[Math.min(count - 1, lastIdx - 1)].date.slice(0, 10);
							break;
						case 'mdate':
							first = playlists[firstIdx].extension[lb.jspfExt].last_modified_at.slice(0, 10);
							last = playlists[Math.min(count - 1, lastIdx - 1)].extension[lb.jspfExt].last_modified_at.slice(0, 10);
							break;
						case 'name':
						default:
							first = playlists[firstIdx].title[0].toUpperCase();
							last = playlists[Math.min(count - 1, lastIdx - 1)].title[0].toUpperCase();
					}
					const suffix = first !== null || last !== null
						? '   ' + _b(first + (last !== first ? ' - ' + last : ''))
						: '';
					return firstIdx.toString().padStart(padding, '0') + ' - ' + lastIdx.toString().padStart(padding, '0') + suffix;
				});
				return playlists.map((playlist, i) => {
					const idx = Math.floor(i / 10);
					const subMenu = count <= 10
						? menuName
						: plsMenus[idx];
					const entryText = playlist.title.replace(/ for \S+\b/, '');
					return { menuName: subMenu, entryText, func: async () => importPlaylist(playlist, entryText) };
				});
			}
			return [];
		};
		const menuNameMain = menu.newMenu('Playlists');
		{	// Playlists Recommendations
			const menuName = menu.newMenu('Playlists recommendations', menuNameMain);
			menu.newEntry({ menuName, entryText: 'By user: (Shift + Click to randomize)', flags: MF_GRAYED });
			menu.newSeparator(menuName);
			const plsEntries = createPlaylistEntries(this.userPlaylists.recommendations, 'mdate', menuName);
			if (plsEntries.length) {
				new Set(plsEntries.map((entry) => entry.menuName)).forEach((subMenu) => menu.findOrNewMenu(subMenu, subMenu === menuName ? menuNameMain : menuName));
				plsEntries.forEach((entry) => menu.newEntry(entry));
			} else {
				menu.newEntry({ menuName, entryText: '- None -', flags: MF_GRAYED });
			}
		}
		{	// User Playlists
			const menuName = menu.newMenu('User playlists', menuNameMain);
			menu.newEntry({ menuName, entryText: 'By user: (Shift + Click to randomize)', flags: MF_GRAYED });
			menu.newSeparator(menuName);
			const plsEntries = createPlaylistEntries(this.userPlaylists.user, properties.userPlaylistSort[1], menuName);
			if (plsEntries.length) {
				new Set(plsEntries.map((entry) => entry.menuName)).forEach((subMenu) => menu.findOrNewMenu(subMenu, subMenu === menuName ? menuNameMain : menuName));
				plsEntries.forEach((entry) => menu.newEntry(entry));
			} else {
				menu.newEntry({ menuName, entryText: '- None -', flags: MF_GRAYED });
			}
		}
		menu.newSeparator(menuNameMain);
		{	// Import/Export
			menu.newEntry({
				menuName: menuNameMain,
				entryText: 'Import playlist by MBID...', func: async () => {
					const identifier = Input.string('string', '', 'Enter Playlist MBID:', 'ListenBrainz Tools', '866b5a46-c474-4fae-8782-0f46240a9507', [(mbid) => isUUID(mbid.replace(lb.regEx, ''))]);
					if (identifier === null) { return; }
					importPlaylist({ identifier });
				}
			});
			menu.newEntry({
				menuName: menuNameMain,
				entryText: 'Export active playlist...' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
					if (!await checkLBToken()) { return false; }
					let playlist_mbid = '';
					const bLookupMBIDs = properties.bLookupMBIDs[1];
					const token = bListenBrainz ? lb.decryptToken({ lBrainzToken: properties.lBrainzToken[1], bEncrypted: properties.lBrainzEncrypt[1] }) : null;
					if (!token) { return false; }
					const name = plman.GetPlaylistName(plman.ActivePlaylist);
					const pls = this.userPlaylists.user.find((pls) => pls.title === name);
					if (pls) {
						console.log('Syncing playlist with ListenBrainz: ' + name);
						playlist_mbid = await lb.syncPlaylist({ name, nameId: name, extension: '.ui', playlist_mbid: pls.identifier.replace(lb.regEx, '') }, '', token, bLookupMBIDs);
					} else {
						console.log('Exporting playlist to ListenBrainz: ' + name);
						playlist_mbid = await lb.exportPlaylist({ name, nameId: name, extension: '.ui' }, '', token, bLookupMBIDs);
					}
					if (!playlist_mbid || typeof playlist_mbid !== 'string' || !isString(playlist_mbid)) { lb.consoleError('Playlist was not exported.'); return; }
					this.retrievePlaylists(false);
					if (properties.bSpotify[1]) {
						lb.retrieveUser(token).then((user) => lb.getUserServices(user, token)).then((services) => {
							if (services.includes('spotify')) {
								console.log('Exporting playlist to Spotify: ' + name);
								lb.exportPlaylistToService({ playlist_mbid }, 'spotify', token);
							}
						});
					}
				}, flags: bListenBrainz ? MF_STRING : MF_GRAYED
			});
		}
	}
	menu.newSeparator();
	{	// Other tools
		const menuName = menu.newMenu('Other tools');
		{	// MBIDs
			menu.newEntry({
				menuName,
				entryText: 'Retrieve MBIDs from selection' + (bListenBrainz ? selectedCountTitle(70) : '\t(token not set)'), func: async () => {
					if (!await checkLBToken()) { return false; }
					const token = bListenBrainz ? getToken() : null;
					if (!token) { return; }
					const tfo = fb.TitleFormat('%TITLE%');
					const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
					this.switchAnimation('ListenBrainz data retrieval', true);
					const response = await lb.lookupRecordingInfo(handleList, ['recording_name', 'recording_mbid'], token);
					this.switchAnimation('ListenBrainz data retrieval', false);
					if (!response) { return; }
					const table = new Table;
					response.recording_mbid.forEach((id, i) => {
						const bFound = isString(id);
						const title = bFound ? response.recording_name[i] : tfo.EvalWithMetadb(handleList[i]);
						const mbid = bFound ? id : '-not found-';
						table.cell('Title', title);
						table.cell('MBID', mbid);
						table.newRow();
					});
					const report = table.toString();
					fb.ShowPopupMessage(report, 'ListenBrainz');
				}, flags: bListenBrainz ? selectedFlagsCount(70) : MF_GRAYED, data: { bDynamicMenu: true }
			});
		}
		menu.newSeparator(menuName);
		{	// Similar artists
			menu.newEntry({
				menuName,
				entryText: 'Calculate similar artists tags' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
					if (!await checkLBToken()) { return false; }
					const token = bListenBrainz ? getToken() : null;
					if (!token) { return; }
					this.switchAnimation('ListenBrainz data retrieval', true);
					const response = await lb.calculateSimilarArtistsFromPls({ token, file: filePaths.listenBrainzArtists });
					this.switchAnimation('ListenBrainz data retrieval', false);
					if (!response) { return; }
				}, flags: bListenBrainz ? selectedFlagsCount(70) : MF_GRAYED, data: { bDynamicMenu: true }
			});
			menu.newEntry({
				menuName, entryText: 'Write similar artists tags', func: () => {
					lb.writeSimilarArtistsTags();
				}, flags: _isFile(folders.data + 'listenbrainz_artists.json') ? MF_STRING : MF_GRAYED
			});
		}
		menu.newSeparator(menuName);
		{	// Import listens
			menu.newEntry({
				menuName, entryText: 'Import Pano Scrobbler\'s listens...' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
					if (!await checkLBToken()) { return false; }
					const token = bListenBrainz ? lb.decryptToken({ lBrainzToken: properties.lBrainzToken[1], bEncrypted: properties.lBrainzEncrypt[1] }) : null;
					if (!token) { return false; }
					const file = Input.string('string', '', 'Enter .jsonl file path:\n\nImporting of duplicated listens is automatically handled by ListenBrainz servers, adding them only once. You can process the same file multiple times and only new listens will be added.', 'ListenBrainz Tools', folders.xxx + 'examples\\scrobbles_log.jsonl', [(file) => _isFile(file)]);
					if (file === null) { console.log('ListenBrainz tools:', Input.lastInput, 'not found.'); return false; }
					const event = 'scrobble';
					const payload = lb.parsePanoScrobblerJson(file, { client: this.scriptName, version: this.version }, event);
					lb.findPayloadMBIDs(payload);
					const data = await lb.processPayload(payload, token, event);
					lb.submitListens(data, token).then(
						() => WshShell.Popup('Listens imported successfully.', 0, 'ListenBrainz Tools', popup.info + popup.ok),
						() => WshShell.Popup('Error importing. Check console.', 0, 'ListenBrainz Tools', popup.info + popup.ok),
					);
				}, flags: bListenBrainz ? MF_STRING : MF_GRAYED
			});
			menu.newEntry({
				menuName, entryText: 'Import Pano Scrobbler\'s feedback...' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
					if (!await checkLBToken()) { return false; }
					const token = bListenBrainz ? lb.decryptToken({ lBrainzToken: properties.lBrainzToken[1], bEncrypted: properties.lBrainzEncrypt[1] }) : null;
					if (!token) { return false; }
					const file = Input.string('string', '', 'Enter .jsonl file path:\n\nImporting of duplicated feedback is automatically handled by the script, adding it only once.', 'ListenBrainz Tools', folders.xxx + 'examples\\scrobbles_log.jsonl', [(file) => _isFile(file)]);
					if (file === null) { console.log('ListenBrainz tools:', Input.lastInput, 'not found.'); return false; }
					const user = await lb.retrieveUser(token);
					const event = 'love';
					const payload = lb.parsePanoScrobblerJson(file, { client: this.scriptName, version: this.version }, event);
					lb.findPayloadMBIDs(payload);
					const mbids = (await lb.processPayload(payload, token, event)).map((e) => e.recording_mbid);
					// Check actual feedback
					this.switchAnimation('ListenBrainz data retrieval', true);
					const response = await lb.getFeedback(mbids, user, token, false);
					const sendMBIDs = [];
					if (response && response.length) {
						response.forEach((obj) => {
							if (!obj.recording_mbid) { return; } // Omit not found items
							if (obj.score !== 1) { sendMBIDs.push(obj.recording_mbid); }
						});
					} else {
						mbids.forEach((mbid) => sendMBIDs.push(mbid));
					}
					this.switchAnimation('ListenBrainz data retrieval', false);
					// Only update required tracks
					if (sendMBIDs.length) {
						this.switchAnimation('ListenBrainz data uploading', true);
						const response = await lb.sendFeedback(sendMBIDs, 'love', token);
						this.switchAnimation('ListenBrainz data uploading', false);
						if (!response || !response.every(Boolean)) {
							if (user || isString(properties.userCache[1])) {
								WshShell.Popup('Feedback imported successfully.', 0, 'ListenBrainz Tools', popup.info + popup.ok);
								console.log('ListenBrainz: Error connecting to server. Data has been cached and will be sent later...');
								const date = Date.now();
								const data = lb.cache.feedback.get(user || properties.userCache[1]) || {};
								if (!response) {
									sendMBIDs.forEach((mbid) => data[mbid] = { feedback: 'love', date });
								} else {
									response.forEach((bUpdate, i) => {
										if (!bUpdate) { data[sendMBIDs[i]] = { feedback: 'love', date }; }
									});
								}
								lb.cache.feedback.set(user || properties.userCache[1], data);
								setTimeout(this.saveCache, 0, user || properties.userCache[1]);
							} else {
								fb.ShowPopupMessage('Error connecting to server. Check console.\nUser has not been retrieved and feedback can not be saved to cache.', 'ListenBrainz');
							}
						}
					} else {
						WshShell.Popup('Feedback imported successfully, but no tracks needed updating.', 0, 'ListenBrainz Tools', popup.info + popup.ok);
					}
				}, flags: bListenBrainz ? MF_STRING : MF_GRAYED
			});
		}
		menu.newSeparator();
	}
	{	// Configuration
		const menuName = menu.newMenu('Settings');
		{
			const subMenuName = menu.newMenu('User', menuName);
			{
				menu.newEntry({
					menuName: subMenuName, entryText: 'Set token...', func: async () => {
						const bDone = await checkLBToken('');
						return bDone;
					}
				});
				menu.newCheckMenuLast(() => isString(properties.lBrainzToken[1]));
				menu.newEntry({
					menuName: subMenuName, entryText: 'Retrieve token from other panels...', func: () => {
						this.lBrainzTokenListener = true;
						let cache = { token: properties.lBrainzToken[1], encrypted: properties.lBrainzEncrypt[1] };
						window.NotifyOthers('xxx-scripts: lb token', null);
						setTimeout(() => {
							this.lBrainzTokenListener = false;
							fb.ShowPopupMessage('ListenBrainz token report:\n\nOld value:  ' + cache.toStr({ bClosure: true }) + '\nNew value:  ' + { token: properties.lBrainzToken[1], encrypted: properties.lBrainzEncrypt[1] }.toStr({ bClosure: true }), 'ListenBrainz');
						}, 1500);
					}
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Open user profile' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
						if (!await checkLBToken()) { return; }
						const token = bListenBrainz ? getToken() : null;
						if (!token) { return; }
						const user = await lb.retrieveUser(token);
						if (isString(user)) { _runCmd('CMD /C START https://listenbrainz.org/user/' + user + '/playlists/', false); }
					}, flags: bListenBrainz ? MF_STRING : MF_GRAYED
				});
			}
		}
		{
			const subMenuName = menu.newMenu('Playlists', menuName);
			{
				menu.newEntry({
					menuName: subMenuName, entryText: 'Match only by MBID', func: () => {
						properties.bPlsMatchMBID[1] = !properties.bPlsMatchMBID[1];
						if (properties.bPlsMatchMBID[1]) {
							fb.ShowPopupMessage('When importing playlists (not applicable to the other lookups), track are matched by MBID, Title + Artist or Title. Enabling this option skips all checks but the MBID one, greatly optimizing the library search and providing faster results.\n\nUse this option if most of your library have been tagged with MBIDs.', 'ListenBrainz');
						}
						overwriteProperties(properties);
					}
				});
				menu.newCheckMenuLast(() => properties.bPlsMatchMBID[1]);
			}
			{
				const subMenuNameTwo = menu.newMenu('Playlists sorting', subMenuName);
				const options = [
					{ entryText: 'By Created date', sort: 'cdate' },
					{ entryText: 'By Modified date', sort: 'mdate' },
					{ entryText: 'By Name', sort: 'name' },
				];
				options.forEach((entry) => {
					menu.newEntry({
						menuName: subMenuNameTwo, entryText: entry.entryText, func: () => {
							properties.userPlaylistSort[1] = entry.sort;
							overwriteProperties(properties);
						}
					});
				});
				menu.newCheckMenuLast(() => options.findIndex((opt) => opt.sort === properties.userPlaylistSort[1]), options);
			}
			menu.newSeparator(subMenuName);
			menu.newEntry({
				menuName: subMenuName, entryText: 'Create Daily jams', func: () => {
					const token = bListenBrainz ? getToken() : null;
					if (!token) { return; }
					if (!lb.isFollowing('troi-bot', token)) {
						if (properties.bPlsMatchMBID[1]) {
							fb.ShowPopupMessage('Daily jams are playlist automatically created by the ListenBrainz recommendation backend (troi) every day if you have enough listens data available. The feature is enabled by following a bot user named \'troi-bot\'.');
						}
						lb.followUser('troi-bot', getToken());
					} else { lb.unFollowUser('troi-bot', getToken()); }
				}, flags: bListenBrainz ? MF_STRING : MF_GRAYED
			});
			menu.newCheckMenuLast(() => lb.isFollowing('troi-bot', getToken()));
		}
		{
			const subMenuName = menu.newMenu('Feedback', menuName);
			{
				menu.newEntry({
					menuName: subMenuName, entryText: 'Match using tags', func: () => {
						properties.bFeedbackLookup[1] = !properties.bFeedbackLookup[1];
						if (properties.bFeedbackLookup[1]) {
							fb.ShowPopupMessage('When looking for loved/hated tracks on library, MUSICBRAINZ_TRACKID is used by default. Since some libraries may not be fully tagged, enabling this option will also try to find matches by TITLE and ARTIST. Note, however, this may output more tracks than desired, live versions, etc.', 'ListenBrainz');
						}
						overwriteProperties(properties);
					}
				});
				menu.newCheckMenuLast(() => properties.bFeedbackLookup[1]);
			}
			{
				menu.newEntry({
					menuName: subMenuName, entryText: 'Query filter for matches...', func: (cache) => {
						let input = '';
						try { input = utils.InputBox(window.ID, 'Enter query used to pre-filter library when retrieving tracks:\n\n(note files with a feedback tag will always be shown, even if the filter would discard them)', 'ListenBrainz Tools', cache || properties.feedbackQuery[1], true); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if ((!cache || cache !== input) && properties.feedbackQuery[1] === input) { return; }
						try { if (isString(input) && fb.GetQueryItems(fb.GetLibraryItems(), input).Count === 0) { throw new Error('No items'); } } // Sanity check
						catch (e) {
							if (e.message === 'No items') {
								fb.ShowPopupMessage('Query returns zero items on current library. Check it and add it again:\n' + input, 'ListenBrainz Tools');
							} else {
								fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'ListenBrainz Tools');
							}
							menu.retry({ pos: -1, args: input || properties.feedbackQuery[1] });
							return;
						}
						properties.feedbackQuery[1] = input;
						overwriteProperties(properties); // Updates panel
					}
				});
			}
		}
		menu.newSeparator(menuName);
		{
			const subMenuName = menu.newMenu('Track recommendations', menuName);
			menu.newEntry({ menuName: subMenuName, entryText: 'Tag remap: (Ctrl + Click to reset)', flags: MF_GRAYED });
			menu.newSeparator(subMenuName);
			const tags = JSON.parse(properties.tags[1]);
			tags.forEach((tag) => {
				menu.newEntry({
					menuName: subMenuName, entryText: tag.name + (tag.tf && tag.tf.length ? '' : '\t-disabled-'), func: () => {
						let input;
						if (utils.IsKeyPressed(VK_CONTROL)) {
							const defTag = JSON.parse(properties.tags[3])
								.find((defTag) => tag.name === defTag.name);
							if (defTag) { input = defTag.tf; }
						} else {
							input = Input.json('array strings', tag.tf, 'Enter tag(s) or TF expression(s):\n(JSON)\n\nSetting it to [] will disable the menu entry.', 'ListenBrainz Tools', '["ARTIST","ALBUM ARTIST"]', void (0), true);
							if (input === null) { return; }
						}
						tag.tf = input;
						properties.tags[1] = JSON.stringify(tags);
						overwriteProperties(properties);
					}
				});
			});
			menu.newSeparator(subMenuName);
			menu.newEntry({
				menuName: subMenuName, entryText: 'Restore defaults...', func: () => {
					properties.tags[1] = properties.tags[3];
					overwriteProperties(properties);
				}
			});
		}
		menu.newSeparator(menuName);
		menu.newEntry({
			menuName, entryText: 'Global query filter...', func: (cache) => {
				let input = '';
				try { input = utils.InputBox(window.ID, 'Enter global query used to pre-filter library:', 'ListenBrainz Tools', cache || properties.forcedQuery[1], true); }
				catch (e) { return; } // eslint-disable-line no-unused-vars
				if ((!cache || cache !== input) && properties.forcedQuery[1] === input) { return; }
				try { if (isString(input) && fb.GetQueryItems(fb.GetLibraryItems(), input).Count === 0) { throw new Error('No items'); } } // Sanity check
				catch (e) {
					if (e.message === 'No items') {
						fb.ShowPopupMessage('Query returns zero items on current library. Check it and add it again:\n' + input, 'ListenBrainz Tools');
					} else {
						fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'ListenBrainz Tools');
					}
					menu.retry({ pos: -1, args: input || properties.forcedQuery[1] });
					return;
				}
				properties.forcedQuery[1] = input;
				overwriteProperties(properties); // Updates panel
			}
		});
		{
			menu.newEntry({
				menuName, entryText: 'Lookup for missing track\'s MBIDs', func: () => {
					properties.bLookupMBIDs[1] = !properties.bLookupMBIDs[1];
					if (properties.bLookupMBIDs[1]) {
						fb.ShowPopupMessage('Exporting a playlist requires tracks to have \'MUSICBRAINZ_TRACKID\' tags on files.\n\nWhenever such tag is missing, the file can not be sent to ListenBrainz\'s online playlist. As workaround, the script may try to lookup missing MBIDs before exporting.\n\nNote results depend on the success of MusicBrainz api, so it\'s not guaranteed to find the proper match in all cases. Tag properly your files with Picard or foo_musicbrainz in such case.\n\nApi used:\nhttps://labs.api.listenbrainz.org/mbid-mapping', 'ListenBrainz');
					}
					overwriteProperties(properties);
				}, flags: bListenBrainz ? MF_STRING : MF_GRAYED
			});
			menu.newCheckMenuLast(() => properties.bLookupMBIDs[1]);
		}
		{
			menu.newEntry({
				menuName, entryText: 'Lookup for missing tracks on YouTube', func: () => {
					properties.bYouTube[1] = !properties.bYouTube[1];
					if (properties.bYouTube[1]) {
						fb.ShowPopupMessage('By default, tracks retrieved from ListenBrainz (to create playlists) are matched against the library.\n\nWhen this option is enabled, not found items will be replaced by YouTube links.\n\nUsing this option takes some seconds while scrapping YouTube, the button will be animated during the process.', 'ListenBrainz');
					}
					overwriteProperties(properties);
				}, flags: bListenBrainz && isYouTube ? MF_STRING : MF_GRAYED
			});
			menu.newCheckMenuLast(() => properties.bYouTube[1]);
		}
	}
	return menu;
}