'use strict';
//20/09/25

/*
	Wrapped
	Provides global library statistics for a given period of time, similar to Spotify's wrapped
 */

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, globTags:readable, isPlayCount:readable, isEnhPlayCount:readable, isPlayCount2003:readable, folders:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable, MF_GRAYED:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isStringWeak:readable, _p:readable, isJSON:readable, capitalizeAll:readable, _b:readable, isInt:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\main\\main_menu\\main_menu_custom.js');
/* global bindDynamicMenus:readable, deleteMainMenuDynamic:readable */
include('helpers\\buttons_stats_wrapped_menu.js');
/* global wrappedMenu:readable */
include('..\\main\\playlist_manager\\playlist_manager_listenbrainz.js');
/* global ListenBrainz:readable */
include('..\\main\\spotify\\wrapped.js');
/* global wrapped:readable */

var prefix = 'wp'; // NOSONAR[global]
var version = '2.0.0'; // NOSONAR[global]

try { window.DefineScript('Wrapped button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) {  /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	queryFilter: ['Library query filter', globTags.rating + ' MISSING OR ' + globTags.rating + ' GREATER 2', { func: isStringWeak }, globTags.rating + ' MISSING OR ' + globTags.rating + ' GREATER 2'],
	tags: ['Tags', JSON.stringify(wrapped.tags), { func: isJSON }, JSON.stringify(wrapped.tags)],
	bFilterGenres: ['Filter non-recognized genre/styles', true, { func: isBoolean }, true],
	bOffline: ['Offline mode', false, { func: isBoolean }, false],
	bServicesListens: ['Use external listens', false, { func: isBoolean }, false],
	highBpmHalveFactor: ['% of high BPM tracks to halve', 30, { func: isInt, range: [[0, 100]] }, 30],
	lBrainzToken: ['ListenBrainz user token', '', { func: isStringWeak }, ''],
	lBrainzUser: ['ListenBrainz user', '', { func: isStringWeak }, ''],
	lBrainzEncrypt: ['Encrypt ListenBrainz user token', false, { func: isBoolean }, false],
	imageStubPath: ['Artists images stub path', '.\\yttm\\art_img\\$lower($cut(%1,1))\\%1\\', { func: isStringWeak }, false],
	latexCmd: ['LaTeX cmd for compiling into PDF', 'lualatex --enable-installer --interaction=nonstopmode --jobname=Wrapped_%4 --output-directory=%3 %1', { func: isStringWeak }, 'lualatex --enable-installer --interaction=nonstopmode --jobname=Wrapped_%4 --output-directory=%3 %1'],
	extraCmd: ['Extra cmd applied to output', JSON.stringify([]), { func: isJSON }, JSON.stringify([])],
	bDynamicMenus: ['Menus at  \'File\\Spider Monkey Panel\\...\'', false, { func: isBoolean }, false],
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false],
	filePaths: ['External database paths', JSON.stringify({
		listenBrainzArtists: '.\\profile\\' + folders.dataName + 'listenbrainz_artists.json',
		searchByDistanceArtists: '.\\profile\\' + folders.dataName + 'searchByDistance_artists.json',
		worldMapArtists: '.\\profile\\' + folders.dataName + 'worldMap.json'
	})]
};
newButtonsProperties.filePaths.push({ func: isJSON }, newButtonsProperties.filePaths[1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Wrapped': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Wrapped', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'Wrapped',
		func: function (mask) {
			if (mask === MK_SHIFT) {
				const menu = settingsMenu(
					this, true, ['buttons_stats_wrapped.js'],
					{
						bDynamicMenus:
							{ popup: 'Remember to set different panel names to every buttons toolbar, otherwise menus will not be properly associated to a single panel.\n\nShift + Win + R. Click -> Configure panel... (\'edit\' at top)' },
						bOffline:
							{ popup: 'On offline mode, no images will be downloaded from the web (but already existing images or local stub images will be used).' },
						bServicesListens:
							{ popup: 'Listens will be downloaded from server (ListenBrainz) and merged with local playback statistics. Don\'t forget to set the relevant tokens for those services.\n\nThese listens may also be used on offline mode as long as they have been downloaded at least once (and the associated user name has been set -token is not needed-).' },
						imageStubPath:
							{ input: 'Artists images stub path (.jpg or .png). If it starts with .\\, will be relative to foobar profile folder.\n\nEnter TF expression:\n(\'%1\' will be replaced internally with the artist name)' },
						tags: { bHide: true },
						extraCmd: { bHide: true },
					},
					{
						bDynamicMenus:
							(value) => {
								if (value) {
									bindDynamicMenus({
										menu: wrappedMenu.bind(this),
										parentName: 'Wrapped',
										entryCallback: (entry) => {
											const prefix = 'Wrapped';
											return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
										}
									});
								} else { deleteMainMenuDynamic('Wrapped'); }
							},
						'*': (value, key) => {
							const settingsKeys = ['bFilterGenres', 'bOffline', 'bServicesListens', 'highBpmHalveFactor', 'imageStubPath'];
							if (settingsKeys.includes(key)) {
								wrapped.settings[key] = value;
							} else if (['tags'].includes(key)) {
								Object.entries(value).forEach((pair) => {
									if (pair[1]) { wrapped.tags[pair[0]] = pair[1]; }
								});
							} else if ('lBrainzToken' === key) {
								wrapped.settings.tokens.listenBrainz = value
									? ListenBrainz.decryptToken({ lBrainzToken: value, bEncrypted: this.buttonsProperties.lBrainzEncrypt[1] })
									: '';
								if (wrapped.settings.tokens.listenBrainz) {
									ListenBrainz.retrieveUser(wrapped.settings.tokens.listenBrainz, false)
										.then((user) => {
											if (user) {
												wrapped.settings.tokens.listenBrainzUser = this.buttonsProperties.lBrainzUser[1] = user;
												overwriteProperties(this.buttonsProperties);
											}
										});
								}
							} else if ('lBrainzUser' === key) {
								wrapped.settings.tokens.listenBrainzUser = value;
							} else if ('filePaths' === key) {
								const filePaths = JSON.parse(this.buttonsProperties.filePaths[1]);
								for (let key in filePaths) {
									if (Object.hasOwn(wrapped.settings.filePaths, key)) {
										wrapped.settings.filePaths[key] = filePaths[key];
									}
								}
							}
						}
					},
					(/** @type {_menu} */ menu) => { // Append this menu entries to the config menu
						const menuName = menu.getMainMenuName();
						menu.newSeparator(menuName);
						{
							const subMenuName = menu.newMenu('Tag remap', menuName);
							menu.newEntry({ menuName: subMenuName, entryText: 'Tags used on report:', flags: MF_GRAYED });
							menu.newSeparator(subMenuName);
							const tags = JSON.parse(this.buttonsProperties.tags[1]);
							Object.keys(tags).forEach((key) => {
								menu.newEntry({
									menuName: subMenuName, entryText: capitalizeAll(key) + '\t' + _b(tags[key].cut(10)), func: () => {
										const input = Input.string('string', tags[key], 'Enter tag(s):\n\nSingle tags may be written with/without %.\nEx.: ARTIST\n\nMultiple tags must be separated by \', \' and must include %.\nEx.: %GENRE%, %STYLE%', 'Wrapped', 'ALBUM ARTIST');
										if (input === null) { return; }
										tags[key] = input;
										this.buttonsProperties.tags[1] = JSON.stringify(tags);
										overwriteProperties(this.buttonsProperties);
									}
								});
							});
						}
						menu.newSeparator(menuName);
						{
							const subMenuName = menu.newMenu('Extra CMD commands', menuName);
							menu.newEntry({ menuName: subMenuName, entryText: 'Applied to output:', flags: MF_GRAYED });
							menu.newSeparator(subMenuName);
							const cmds = JSON.parse(this.buttonsProperties.extraCmd[1]);
							cmds.concat(['sep', 'New command...']).forEach((cmd, i) => {
								if (cmd === 'sep') { !menu.isLastEntrySep && menu.newSeparator(subMenuName); }
								else {
									const bNew = cmd === 'New command...';
									menu.newEntry({
										menuName: subMenuName, entryText: bNew ? cmd : (i + '\t' + _b(cmd.cut(10))), func: () => {
											const input = Input.string('string', bNew ? '' : cmd, 'Enter CMD command:\n%1 - Input tex file path with quotes\n%2 - Output pdf file path with quotes\n%3 - Root path (for input/output files)\n%4 - Year or time period', 'Wrapped', 'gs -dQUIET -sDEVICE=pdfwrite -o %3\\temp.pdf $2');
											if (input === null) { return; }
											if (input.length) {
												cmds[i] = input;
											} else {
												cmds.splice(i, 1);
											}
											this.buttonsProperties.extraCmd[1] = JSON.stringify(cmds);
											overwriteProperties(this.buttonsProperties);
										}
									});
								}
							});
						}
					}
				);
				menu.btn_up(this.currX, this.currY + this.currH);
			} else {
				wrappedMenu.bind(this)().btn_up(this.currX, this.currY + this.currH);
			}
		},
		description: () => {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
			let info = '';
			info += 'Playback Statistics:\t' + (isPlayCount ? '\u2713' : '\u2717');
			info += '\nEnh. Playback Statistics:\t' + (isEnhPlayCount ? '\u2713' : '\u2717');
			info += '\nPlaycount 2003:\t\t' + (isPlayCount2003 ? '\u2713' : '\u2717');
			info += '\nExternal listens:\t\t' + (wrapped.settings.bServicesListens ? '\u2713' : '\u2717');
			info += '\nOffline mode:\t\t' + (wrapped.settings.bOffline ? '\u2713' : '\u2717');
			if (wrapped.settings.bServicesListens) {
				if (!wrapped.settings.bOffline) {
					info += '\nListenBrainz Token:\t' + (wrapped.settings.tokens.listenBrainz ? 'Ok' : ' -missing token-');
				}
				info += '\nListenBrainz User:\t' + (wrapped.settings.tokens.listenBrainzUser || ' -missing user-');
			}
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift + L. Click to open config menu)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.spotify,
		variables: {
			lBrainzTokenListener: false
		},
		listener: {
			on_notify_data: (parent, name, info) => {
				if (name === 'bio_imgChange' || name === 'biographyTags' || name === 'bio_chkTrackRev' || name === 'xxx-scripts: panel name reply' || name === 'precacheLibraryPaths') { return; }
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
					menu: wrappedMenu.bind({ buttonsProperties: this.buttonsProperties, prefix: '' }),
					parentName: 'Wrapped',
					entryCallback: (entry) => {
						const prefix = 'Wrapped';
						return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
					}
				});
			}
			// Retrieve token from other panels
			if (!this.buttonsProperties.lBrainzToken[1].length) {
				this.lBrainzTokenListener = true;
				setTimeout(() => window.NotifyOthers('xxx-scripts: lb token', null), 3000);
				setTimeout(() => { this.lBrainzTokenListener = false; }, 6000);
				overwriteProperties(this.buttonsProperties);
			}
			// Init wrapped settings
			['bFilterGenres', 'bOffline', 'bServicesListens', 'highBpmHalveFactor', 'imageStubPath']
				.forEach((key) => wrapped.settings[key] = this.buttonsProperties[key][1]);
			const filePaths = JSON.parse(this.buttonsProperties.filePaths[1]);
			for (let key in filePaths) {
				if (Object.hasOwn(wrapped.settings.filePaths, key)) {
					wrapped.settings.filePaths[key] = filePaths[key];
				}
			}
			Object.entries(JSON.parse(this.buttonsProperties.tags[1])).forEach((pair) => {
				if (pair[1]) { wrapped.tags[pair[0]] = pair[1]; }
			});
			// ListenBrainz token
			if (this.buttonsProperties.lBrainzToken[1] && !this.buttonsProperties.lBrainzEncrypt[1]) {
				wrapped.settings.tokens.listenBrainz = this.buttonsProperties.lBrainzToken[1];
			}
			if (this.buttonsProperties.lBrainzUser[1]) {
				wrapped.settings.tokens.listenBrainzUser = this.buttonsProperties.lBrainzUser[1];
			}
		},
		update: { scriptName: 'Wrapped-SMP', version }
	}),
});