'use strict';
//26/09/25

/*
	Integrates ListenBrainz feedback and recommendations statistics within foobar2000 library.
*/

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globTags:readable, MK_SHIFT:readable, VK_SHIFT:readable, folders:readable, isYouTube:readable, globQuery:readable, debounce:readable, MF_GRAYED:readable, globRegExp:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isStringWeak:readable, isJSON:readable, isString:readable , _p:readable */
include('..\\helpers\\helpers_xxx_file.js');
/* global utf8:readable, _isFile:readable, _jsonParseFile:readable, _recycleFile:readable, _save:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\helpers\\helpers_xxx_tags.js');
/* global checkQuery:readable, sanitizeTagTfo:readable, checkQuery:readable */
include('..\\main\\main_menu\\main_menu_custom.js'); // Dynamic SMP menu
/* global deleteMainMenuDynamic:readable, bindDynamicMenus:readable */
include('..\\main\\playlist_manager\\playlist_manager_listenbrainz.js');
/* global ListenBrainz:readable */
include('..\\main\\bio\\bio_tags.js');
/* global lastfmListeners:readable */
include('helpers\\buttons_listenbrainz_menu.js'); // Button menu
/* global listenBrainzMenu:readable */
var prefix = 'lbt'; // NOSONAR[global]
var version = '3.0.0'; // NOSONAR[global]

try { window.DefineScript('ListenBrainz Tools Button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	lBrainzToken: ['ListenBrainz user token', '', { func: isStringWeak }, ''],
	lBrainzEncrypt: ['Encrypt ListenBrainz user token', false, { func: isBoolean }, false],
	bLookupMBIDs: ['Lookup for missing track MBIDs', true, { func: isBoolean }, true],
	bAdvTitle: ['Duplicates advanced RegExp title matching', true, { func: isBoolean }, true],
	bDynamicMenus: ['Menus at  \'File\\Spider Monkey Panel\\...\'', false, { func: isBoolean }, false],
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false],
	bYouTube: ['Lookup for missing tracks on YouTube', isYouTube, { func: isBoolean }, isYouTube],
	firstPopup: ['ListenBrainz Tools: Fired once', false, { func: isBoolean }, false],
	bTagFeedback: ['Tag files with feedback', false, { func: isBoolean }, false],
	feedbackTag: ['Feedback tag', globTags.feedback, { func: isString }, globTags.feedback],
	feedbackCache: ['Feedback cache file', '.\\profile\\' + folders.dataName + 'listenbrainz_feedback.json', { func: isString }, '.\\profile\\' + folders.dataName + 'listenbrainz_feedback.json'],
	feedbackQuery: ['Query to pre-filter feedback matches', globQuery.filter, { func: (query) => { return checkQuery(query, true); } }, globQuery.filter],
	bFeedbackLookup: ['Lookup feedback tracks using tags', true, { func: isBoolean }, true],
	userCache: ['User name cache', '', { func: isStringWeak }, ''],
	bPlsMatchMBID: ['Match only by MBID', false, { func: isBoolean }, false],
	forcedQuery: ['Forced query to pre-filter database', globQuery.filter, { func: (query) => { return checkQuery(query, true); } }, globQuery.filter],
	userPlaylistSort: ['User playlist sorting by', 'name', { func: (s) => isString(s) && ['name', 'cdate', 'mdate'].includes(s) }, 'name'],
	bSpotify: ['Export to Spotify', true, { func: isBoolean }, true],
	tags: ['Tags remap for lookups', JSON.stringify([
		{ name: 'Artist top tracks', tf: [...new Set([globTags.artistRaw, 'ARTIST', 'ALBUM ARTIST'])], type: 'getPopularRecordingsByArtist' },
		// {name: 'Artist shuffle', tf: [...new Set([globTags.artistRaw, 'ARTIST', 'ALBUM ARTIST'], type: '??'}, TODO
		{ name: 'Similar artists to', tf: [...new Set([globTags.artistRaw, 'ARTIST', 'ALBUM ARTIST'])], type: 'retrieveSimilarArtists' },
		{ name: 'Similar artists', tf: [...new Set([globTags.sbdSimilarArtist, 'LASTFM_SIMILAR_ARTIST', 'SIMILAR ARTISTS LAST.FM', globTags.lbSimilarArtist])], type: 'getPopularRecordingsBySimilarArtist' },
		{ name: 'Similar tracks', tf: [globTags.titleRaw], type: 'retrieveSimilarRecordings' },
		{ name: 'Genre & Style(s)', tf: [...new Set([globTags.genre, globTags.style, 'GENRE', 'STYLE', 'ARTIST GENRE LAST.FM', 'ARTIST GENRE ALLMUSIC', 'ALBUM GENRE LAST.FM', 'ALBUM GENRE ALLMUSIC', 'ALBUM GENRE WIKIPEDIA', 'ARTIST GENRE WIKIPEDIA'])], type: 'getRecordingsByTag' },
		{ name: 'Folksonomy & Date(s)', tf: [...new Set([globTags.folksonomy, 'FOLKSONOMY', 'OCCASION', 'ALBUMOCCASION', globTags.locale, 'LOCALE', 'LOCALE LAST.FM', 'DATE', 'LOCALE WORLD MAP'])], type: 'getRecordingsByTag' },
		{ name: 'Mood & Theme(s)', tf: [...new Set([globTags.mood, 'MOOD', 'THEME', 'ALBUMMOOD', 'ALBUM THEME ALLMUSIC', 'ALBUM MOOD ALLMUSIC'])], type: 'getRecordingsByTag' }
	])],
	filePaths: ['External database paths', JSON.stringify({
		listenBrainzArtists: '.\\profile\\' + folders.dataName + 'listenbrainz_artists.json',
		searchByDistanceArtists: '.\\profile\\' + folders.dataName + 'searchByDistance_artists.json',
		worldMapArtists: '.\\profile\\' + folders.dataName + 'worldMap.json'
	})]
};
newButtonsProperties.tags.push({ func: isJSON }, newButtonsProperties.tags[1]);
newButtonsProperties.filePaths.push({ func: isJSON }, newButtonsProperties.filePaths[1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'ListenBrainz Tools': new ThemedButton({
		coordinates: { x: 0, y: 0, w: 100, h: 22 },
		text: 'ListenBrainz',
		func: function (mask) {
			if (mask === MK_SHIFT) {
				settingsMenu(
					this, true, ['buttons_listenbrainz_tools.js'],
					{
						bAdvTitle: { popup: globRegExp.title.desc },
						bDynamicMenus: { popup: 'Remember to set different panel names to every buttons toolbar, otherwise menus will not be properly associated to a single panel.\n\nShift + Win + R. Click -> Configure panel... (\'edit\' at top)' },
						tags: {
							input: 'Enter value:\n(JSON)\n\nUse the \'Tag remap\' submenu to easily set individual tags.',
							bHide: true
						},
					},
					{
						bDynamicMenus:
							(value) => {
								if (value) {
									bindDynamicMenus({
										menu: listenBrainzMenu.bind(this),
										parentName: 'ListenBrainz',
										entryCallback: (entry) => {
											const prefix = 'ListenBrainz' + (/sitewide.*/i.test(entry.menuName)
												? ': Sitewide '
												: ': User '
											);
											return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
										}
									});
								} else { deleteMainMenuDynamic('ListenBrainz'); }
							}
					},
					(menu) => { // Append this menu entries to the config menu
						const menuName = menu.getMainMenuName();
						menu.newSeparator(menuName);
						const subMenuName = menu.newMenu('Tag remap...', menuName);
						menu.newEntry({ menuName: subMenuName, entryText: 'Available entries:', flags: MF_GRAYED });
						menu.newSeparator(subMenuName);
						const tags = JSON.parse(this.buttonsProperties.tags[1]);
						tags.forEach((tag) => {
							menu.newEntry({
								menuName: subMenuName, entryText: tag.name + (tag.tf && tag.tf.length ? '' : '\t-disabled-'), func: () => {
									const input = Input.json('array strings', tag.tf, 'Enter tag(s) or TF expression(s):\n(JSON)\n\nSetting it to [] will disable the menu entry.', 'ListenBrainz Tools', '["ARTIST","ALBUM ARTIST"]', void (0), true);
									if (input === null) { return; }
									tag.tf = input;
									this.buttonsProperties.tags[1] = JSON.stringify(tags);
									overwriteProperties(this.buttonsProperties);
								}
							});
						});
					}
				).btn_up(this.currX, this.currY + this.currH);
			} else {
				this.retrievePlaylists(false);
				if (!ListenBrainz.cache.following.size) { this.retrieveFollowing(); }
				listenBrainzMenu.bind(this)().btn_up(this.currX, this.currY + this.currH);
			}
		},
		description: function () {
			const token = this.buttonsProperties.lBrainzToken[1];
			const bEncrypted = this.buttonsProperties.lBrainzEncrypt[1];
			const bListenBrainz = token.length;
			this.retrieveUser(token, bEncrypted);
			const user = ListenBrainz.cache.user.get(token) || '';
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
			const selMul = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null;
			const data = (ListenBrainz.cache.feedback ? [...ListenBrainz.cache.feedback] : [['', {}]]).filter((userData) => userData[0] === user);
			let infoMul = '';
			if (selMul && selMul.Count > 1) {
				infoMul = ' (multiple tracks selected: ' + selMul.Count + ')';
			}
			const sel = fb.GetFocusItem();
			let info = 'No track selected\nSome menus disabled';
			if (sel) {
				const feedbackTag = this.buttonsProperties.feedbackTag[1];
				let tfo = fb.TitleFormat(
					'$puts(info,' + globTags.artist + ' / %TRACK% - %TITLE%)' +
					'Current track:	$ifgreater($len($get(info)),50,$cut($get(info),50)...,$get(info))' +
					'[$and(%' + feedbackTag + '%)$crlf()Feedback:	$select($add(%' + feedbackTag + '%,2),' + sanitizeTagTfo(chars.sadEmoji) + ' Hated...,-,' + sanitizeTagTfo(chars.loveEmojiCycle(2000)) + ' Loved!)]' // Only show if tag is present
				);
				info = 'Playlist:		' + (plman.ActivePlaylist !== -1 ? plman.GetPlaylistName(plman.ActivePlaylist) : '-none-') + infoMul + '\n';
				info += tfo.EvalWithMetadb(sel);
			}
			info += '\nToken:\t\t' + (bListenBrainz ? 'Ok' : ' -missing token-');
			info += '\nUser Playlists:\t' + (this.userPlaylists.recommendations.length ? 'Ok' : ' -missing-');
			info += '\nCache:\t\t' + (data.length ? Object.keys(data[0][1]).length : 0) + ' item(s)';
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift + L. Click to open advanced config menu)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: folders.xxx + 'images\\icons\\listenbrainz_64.png', gFontIcon: null,
		variables: {
			lBrainzTokenListener: false, userPlaylists: { recommendations: [], user: [] }, bioSelectionMode: 'Prefer nowplaying', bioTags: {},
			retrieveUser: debounce((parent, token, bEncrypted) => {
				ListenBrainz.retrieveUser(ListenBrainz.decryptToken({ lBrainzToken: token, bEncrypted }), false);
			}, 2500, true)
		},
		listener: {
			on_notify_data: (parent, name, info) => {
				lastfmListeners.on_notify_data(parent, name, info);
				if (name === 'bio_imgChange' || name === 'biographyTags' || name === 'bio_chkTrackRev' || name === 'xxx-scripts: panel name reply' || name === 'xxx-scripts: precacheLibraryPaths') { return; }
				switch (name) {
					case 'xxx-scripts: lb token': {
						if (parent.buttonsProperties.lBrainzToken[1].length) { window.NotifyOthers('xxx-scripts: lb token reply', { lBrainzToken: parent.buttonsProperties.lBrainzToken[1], lBrainzEncrypt: parent.buttonsProperties.lBrainzEncrypt[1], name: window.Name + ' - ' + parent.name }); }
						break;
					}
					case 'xxx-scripts: lb token reply': {
						if (parent.lBrainzTokenListener) {
							console.log('lb token reply: using token from another instance.', window.Name + ' - ' + parent.name, _p('from ' + info.name));
							parent.buttonsProperties.lBrainzToken[1] = info.lBrainzToken;
							parent.buttonsProperties.lBrainzEncrypt[1] = info.lBrainzEncrypt;
							overwriteProperties(parent.buttonsProperties);
							ListenBrainz.cache.key = null;
							parent.lBrainzTokenListener = false;
							this.retrievePlaylists(false);
							this.retrieveFollowing();
						}
						break;
					}
				}
			},
		},
		onInit: function () {
			// Create dynamic menus
			if (this.buttonsProperties.bDynamicMenus[1]) {
				bindDynamicMenus({
					menu: listenBrainzMenu.bind(this),
					parentName: 'ListenBrainz',
					entryCallback: (entry) => {
						const prefix = 'ListenBrainz' + (/sitewide.*/i.test(entry.menuName)
							? ': Sitewide '
							: /by user.*/i.test(entry.menuName)
								? ': User '
								: ': '
						);
						return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
					}
				});
			}
			const lb = ListenBrainz;
			// Retrieve token from other panels
			if (!this.buttonsProperties.firstPopup[1] && !this.buttonsProperties.lBrainzToken[1].length) {
				this.lBrainzTokenListener = true;
				setTimeout(() => window.NotifyOthers('xxx-scripts: lb token', null), 3000);
				setTimeout(() => { this.lBrainzTokenListener = false; }, 6000);
				this.buttonsProperties.firstPopup[1] = true;
				overwriteProperties(this.buttonsProperties);
			}
			// Retrieve user playlists at startup and every 30 min, also every time button is clicked
			this.retrievePlaylists = (bLoop) => {
				const token = this.buttonsProperties.lBrainzToken[1];
				const bListenBrainz = token.length;
				const bEncrypted = this.buttonsProperties.lBrainzEncrypt[1];
				if (!bListenBrainz || (bEncrypted && !lb.cache.key)) {
					this.userPlaylists.recommendations.length = 0;
					if (bLoop) { setTimeout(this.retrievePlaylists, 1800000, true); }
					return Promise.resolve(false);
				}
				this.switchAnimation('ListenBrainz retrieve user playlists', true);
				return lb.retrieveUser(lb.decryptToken({ lBrainzToken: token, bEncrypted }), false)
					.then((user) => {
						if (user && user.length) {
							return Promise.allSettled([
								lb.retrieveUserRecommendedPlaylistsNames(user, { offset: 0, count: lb.MAX_ITEMS_PER_GET }, lb.decryptToken({ lBrainzToken: token, bEncrypted }))
									.then((playlists) => {
										this.userPlaylists.recommendations.length = 0;
										if (playlists.length) {
											playlists.forEach((obj) => this.userPlaylists.recommendations.push(obj.playlist));
										}
									}),
								lb.retrieveUserPlaylistsNames(user, { offset: 0, count: lb.MAX_ITEMS_PER_GET }, lb.decryptToken({ lBrainzToken: token, bEncrypted }))
									.then((playlists) => {
										this.userPlaylists.user.length = 0;
										if (playlists.length) {
											playlists.forEach((obj) => this.userPlaylists.user.push(obj.playlist));
										}
									})
							]);
						}
					}).finally(() => {
						this.switchAnimation('ListenBrainz retrieve user playlists', false);
						if (bLoop) { setTimeout(this.retrievePlaylists, 1800000, true); }
					});
			};
			setTimeout(this.retrievePlaylists, 20000, true);
			// Load feedback cache
			lb.cache.feedback = new Map();
			const cacheFile = this.buttonsProperties.feedbackCache[1];
			if (_isFile(cacheFile)) {
				const data = _jsonParseFile(cacheFile, utf8);
				if (data) {
					data.forEach((userData) => {
						lb.cache.feedback.set(userData.name, userData.cache);
					});
				}
			}
			// Save cache
			this.saveCache = (user) => {
				const newData = [];
				const data = [...lb.cache.feedback]
					.filter((userData) => userData[0] === user)
					.map((userData) => { return { name: userData[0], cache: userData[1] }; });
				if (!data.length) { return; }
				const cacheFile = this.buttonsProperties.feedbackCache[1];
				if (_isFile(cacheFile)) {
					const oldData = _jsonParseFile(cacheFile, utf8);
					_recycleFile(cacheFile, true);
					const idx = oldData.findIndex((userData) => userData.name === user);
					if (idx !== -1) {
						oldData[idx] = data[0];
					} else {
						oldData.push(data[0]);
					}
					oldData.forEach((userData) => newData.push(userData));
				} else {
					newData.push(data[0]);
				}
				_save(cacheFile, JSON.stringify(newData));
			};
			// Send feedback cache every 10 min
			this.sendFeedbackCache = async () => {
				const token = this.buttonsProperties.lBrainzToken[1];
				const bEncrypted = this.buttonsProperties.lBrainzEncrypt[1];
				const user = await lb.retrieveUser(lb.decryptToken({ lBrainzToken: token, bEncrypted }), false);
				const promises = [];
				let count = 0;
				lb.cache.feedback.forEach((data, dataUser) => {
					if (dataUser !== user) { return; }
					const sendMBIDs = Object.keys(data);
					if (sendMBIDs.length) {
						const queue = { love: [], hate: [], remove: [] };
						sendMBIDs.forEach((mbid) => {
							queue[data[mbid].feedback].push(mbid);
						});
						this.switchAnimation('ListenBrainz feedback cache uploading', true);
						Object.keys(queue).forEach((key) => {
							if (queue[key].length) {
								const mbids = queue[key].slice(0, 25);
								promises.push(
									lb.sendFeedback(mbids, key, lb.decryptToken({ lBrainzToken: token, bEncrypted }), void (0), false)
										.then((response) => {
											if (response) {
												let bDone = false;
												(Array.isArray(response) ? response : [response]).forEach((bSent, i) => {
													if (bSent) {
														delete data[mbids[i]];
														count++;
														bDone = true;
													}
												});
												return bDone;
											}
										})
								);
							}
						});
						this.switchAnimation('ListenBrainz feedback cache uploading', false);
					}
				});
				Promise.allSettled(promises).then((results) => {
					if (results.some((p) => p.status === 'fulfilled' && p.value)) {
						this.saveCache(user);
						console.log('ListenBrainz: submitted ' + count + ' item(s) from the feedback cache.');
					}
				});
			};
			setInterval(this.sendFeedbackCache, 600000);
			setTimeout(this.sendFeedbackCache, 5000);
			// Retrieve list of following users
			this.retrieveFollowing = () => {
				const token = this.buttonsProperties.lBrainzToken[1];
				const bListenBrainz = token.length;
				const bEncrypted = this.buttonsProperties.lBrainzEncrypt[1];
				if (!bListenBrainz || (bEncrypted && !lb.cache.key)) { return; }
				lb.retrieveUser(lb.decryptToken({ lBrainzToken: token, bEncrypted }), false).then((user) => {
					if (user) { lb.retrieveFollowing(user, token); }
				});
			};
			setTimeout(this.retrieveFollowing, 3000);
		},
		update: { scriptName: 'ListenBrainz-SMP', version }
	}),
});