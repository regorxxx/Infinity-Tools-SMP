'use strict';
//20/09/25

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_CONTROL:readable, VK_CONTROL:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable, showButtonReadme:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable  */
include('..\\helpers\\menu_xxx_extras.js');
/* global _createSubMenuEditEntries:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isInt:readable, isJSON:readable, isString:readable */
include('..\\helpers\\helpers_xxx_file.js');
/* global _explorer:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, checkProperty:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\main\\autobackup\\autobackup.js');
/* global AutoBackup:readable */

var prefix = 'bak'; // NOSONAR[global]
var version = '3.0.0'; // NOSONAR[global]

try { window.DefineScript('AutoBackup Button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	iPlaying: ['While playing (every X min, 0 = off)', 60, { func: isInt }, 60],
	iStop: ['When playback stops (after X min, 0 = off)', 5, { func: isInt }, 5],
	iInterval: ['Always, since last autosave (every X min, 0 = off)', 30, { func: isInt }, 30],
	iStart: ['On startup (after X min, 0 = off)', 5, { func: isInt }, 5],
	iTrack: ['Every X tracks (0 = off)', 0, { func: isInt }, 0],
	iClose: ['On Foobar2000 exit (after X secs, 0 = off)', 20, { func: isInt }, 20],
	iTrackSave: ['[Save] every X tracks (0 = off)', 5, { func: isInt }, 5],
	files: ['Files and Folders mask',
		JSON.stringify([
			// Foobar folders
			{ name: 'Main config', path: 'configuration' },
			{ name: 'Playlists', path: 'playlists*' },
			{ name: 'Library', path: 'library*' },
			{ name: 'Statistics V1', path: 'index-data' },
			{ name: 'VST presets', path: 'vst-presets' },
			{ name: 'DSP presets', path: 'dsp-presets' },
			// Foobar Files
			{ name: 'Theme', path: 'theme.fth' },
			{ name: 'Main config V2', path: 'config.sqlite' },
			{ name: 'Main dsp V2', path: 'config.fb2k-dsp' },
			{ name: 'Tags V2', path: 'metadb.sqlite' },
			{ name: 'File Operations', path: 'FileOps-Presets*' },
			{ name: 'Large Fields', path: 'LLargeFieldsConfig.txt' },
			// Components
			{ name: 'foo_input_dvda', path: 'dvda_metabase' },
			{ name: 'foo_input_sacd', path: 'sacd_metabase' },
			{ name: 'foo_upnp', path: 'foo_upnp*' },
			// JS scripts
			{ name: 'Playlist Organizer', path: 'pl_organizer.txt' },
			{ name: 'JS presets', path: 'js_data\\presets' },
			{ name: 'JS helpers', path: 'js_data\\helpers' },
			{ name: 'JS Buttons', path: 'js_data\\buttons_*' },
			{ name: 'Playlist-Manager-SMP', path: 'js_data\\playlistManager_*' },
			{ name: 'Device-Priority-SMP', path: 'js_data\\devices*' },
			{ name: 'ListenBrainz-SMP', path: 'js_data\\listenbrainz_*' },
			{ name: 'Playlist-Tools-SMP (1)', path: 'js_data\\playlistTools_*' },
			{ name: 'Playlist-Tools-SMP (2)', path: 'js_data\\pools_presets.json' },
			{ name: 'JS Similar Artists', path: 'js_data\\searchByDistance_artists.json' },
			{ name: 'World-Map-SMP', path: 'js_data\\worldMap*' }
		]),
		{ func: isJSON }],
	outputPath: ['Directory to store backup files', 'autobackup\\autobackup.', { func: isString }, 'autobackup\\autobackup.'],
	iBackups: ['Number of backups to keep', 20, { func: isInt }, 20],
	backupFormat: ['Backups file format replacers',
		JSON.stringify([
			{ name: 'Remove \\- :,', regex: '[\\- :,]', flag: 'g', replacer: '' },
			{ name: 'Replace T', regex: 'T', flag: 'g', replacer: '-' }
		]), { func: isJSON }
	],
	bAsync: ['Asynchronous backup processing', true, { func: isBoolean }, true],
	active: ['AutoBackup activated', true, { func: isBoolean }, true],
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false],
	bStartActive: ['Always active on startup', true, { func: isBoolean }, true],
	bHeadlessMode: ['Headless mode', false, { func: isBoolean }, false],
	backupsMaxSize: ['Max size of backup files (MB)', 5000, { func: isInt }, 5000],
	minDriveSize: ['Min free space on drive (MB)', 10000, { func: isInt }, 10000],
};
newButtonsProperties.files.push(newButtonsProperties.files[1]);
newButtonsProperties.backupFormat.push(newButtonsProperties.backupFormat[1]);

setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	AutoBackup: new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('AutoBackup', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'AutoBackup',
		func: function (mask) {
			if ((MK_CONTROL & mask) === MK_CONTROL) { // NOSONAR [bitwise]
				this.autoBackup.forceBackup();
			} else {
				// Menu
				clearTimeout(buttonsBar.hidden.id);
				const menu = new _menu({
					onBtnUp: () => { // Don't hide button while using menu
						buttonsBar.hidden.id = setTimeout(on_mouse_mbtn_up, buttonsBar.config.hiddenTimeout);
					}
				});
				{
					const menuName = menu.newMenu('Interval settings');
					['iPlaying', 'iStop', 'iInterval', 'iStart', 'iTrack', 'iClose', 'sep', 'iTrackSave'].forEach((key) => {
						if (menu.isSeparator(key)) { menu.newEntry({ menuName, entryText: key }); return; }
						const value = this.buttonsProperties[key][1];
						const entryText = this.buttonsProperties[key][0].replace(/[a-zA-Z]*\d*_*\d*\./, '') + '\t[' + value + ']';
						const unit = key === 'iTrack' || key === 'iTrackSave'
							? 'tracks'
							: key === 'iClose'
								? 'seconds'
								: 'minutes';
						menu.newEntry({
							menuName, entryText, func: () => {
								const input = Input.number('int', value, 'Enter ' + unit + ':\n(0 = off)', 'AutoBackup', this.buttonsProperties[key][3]);
								if (input === null) { return; }
								if (!checkProperty(this.buttonsProperties[key], input)) { return; } // Apply properties check which should be personalized for input value
								this.buttonsProperties[key][1] = input;
								this.autoBackup[key] = unit === 'minutes' ? input * 60 * 1000 : input;
								overwriteProperties(this.buttonsProperties);
							}
						});
						menu.newCheckMenuLast(() => { return !!this.buttonsProperties[key][1]; });
					});
				}
				_createSubMenuEditEntries(menu, void (0), {
					subMenuName: 'Files and folders to backup',
					name: 'AutoBackup',
					list: this.autoBackup.files,
					defaults: JSON.parse(this.buttonsProperties.files[3]),
					input: () => {
						const entry = {
							path: Input.string(
								'string', '',
								'Enter folder path relative to profile folder:\n' +
								'Ex: js_data\\presets'
								, 'AutoBackup', 'js_data\\presets', void (0), true
							)
						};
						if (!entry.path) { return; }
						return entry;
					},
					bNumbered: true,
					onBtnUp: (files) => {
						this.autoBackup.files = files;
						this.buttonsProperties.files[1] = JSON.stringify(files);
						overwriteProperties(this.buttonsProperties);
					}
				});
				{
					const menuName = menu.newMenu('Other settings');
					{
						const value = this.buttonsProperties.outputPath[1];
						const entryText = this.buttonsProperties.outputPath[0].replace(/[a-zA-Z]*\d*_*\d*\./, '') + '\t[' + value + ']';
						menu.newEntry({
							menuName, entryText, func: () => {
								const input = Input.string('string', value, 'Enter path relative to profile folder:', 'AutoBackup', this.buttonsProperties.outputPath[3]);
								if (input === null) { return; }
								if (!checkProperty(this.buttonsProperties.outputPath, input)) { return; } // Apply properties check which should be personalized for input value
								this.buttonsProperties.outputPath[1] = input;
								overwriteProperties(this.buttonsProperties);
							}
						});
					}
					_createSubMenuEditEntries(menu, menuName, {
						subMenuName: 'Backup file formatting',
						name: 'AutoBackup',
						list: this.autoBackup.backupFormat,
						defaults: JSON.parse(this.buttonsProperties.backupFormat[3]),
						input: () => {
							const entry = {
								...(Input.json(
									'object', JSON.stringify({ regex: '[\\- :,]', flag: 'g', replacer: '_' }),
									'Enter regex and replacer:\n' +
									'Ex: ' + JSON.stringify({ regex: '[\\- :,]', flag: 'g', replacer: '_' })
									, 'AutoBackup', JSON.stringify({ regex: '[\\- :,]', flag: 'g', replacer: '_' }), void (0), true
								) || {})
							};
							if (!Object.hasOwn(entry, 'regex') || !Object.hasOwn(entry, 'flag') || !Object.hasOwn(entry, 'replacer')) { return; }
							try { new RegExp(entry.regex, entry.flag); } catch (e) { return; } // eslint-disable-line no-unused-vars
							return entry;
						},
						bNumbered: true,
						onBtnUp: (backupFormat) => {
							this.autoBackup.backupFormat = backupFormat;
							this.buttonsProperties.backupFormat[1] = JSON.stringify(backupFormat);
							overwriteProperties(this.buttonsProperties);
						}
					});
					menu.newSeparator(menuName);
					{
						const value = this.buttonsProperties.iBackups[1];
						const entryText = this.buttonsProperties.iBackups[0].replace(/[a-zA-Z]*\d*_*\d*\./, '') + '\t[' + value + ']';
						menu.newEntry({
							menuName, entryText, func: () => {
								const input = Input.number('int', value, 'Enter number' + ':\n(0 = off)', 'AutoBackup', this.buttonsProperties.iBackups[3]);
								if (input === null) { return; }
								if (!checkProperty(this.buttonsProperties.iBackups, input)) { return; } // Apply properties check which should be personalized for input value
								this.buttonsProperties.iBackups[1] = input;
								overwriteProperties(this.buttonsProperties);
							}
						});
					}
					{
						const value = this.buttonsProperties.backupsMaxSize[1];
						const entryText = this.buttonsProperties.backupsMaxSize[0].replace(/[a-zA-Z]*\d*_*\d*\./, '') + '\t[' + value + ' MB]';
						menu.newEntry({
							menuName, entryText, func: () => {
								const input = Input.number('int', value, 'Enter MB' + ':\n(0 = off)', 'AutoBackup', this.buttonsProperties.backupsMaxSize[3]);
								if (input === null) { return; }
								if (!checkProperty(this.buttonsProperties.backupsMaxSize, input)) { return; } // Apply properties check which should be personalized for input value
								this.buttonsProperties.backupsMaxSize[1] = input;
								this.autoBackup.backupsMaxSize = input * 1024 * 1024;
								overwriteProperties(this.buttonsProperties);
							}
						});
					}
					{
						const value = this.buttonsProperties.minDriveSize[1];
						const entryText = this.buttonsProperties.minDriveSize[0].replace(/[a-zA-Z]*\d*_*\d*\./, '') + '\t[' + value + ' MB]';
						menu.newEntry({
							menuName, entryText, func: () => {
								const input = Input.number('int', value, 'Enter MB' + ':\n(0 = off)', 'AutoBackup', this.buttonsProperties.minDriveSize[3]);
								if (input === null) { return; }
								if (!checkProperty(this.buttonsProperties.minDriveSize, input)) { return; } // Apply properties check which should be personalized for input value
								this.buttonsProperties.minDriveSize[1] = input;
								this.autoBackup.minDriveSize = input * 1024 * 1024;
								overwriteProperties(this.buttonsProperties);
							}
						});
					}
					menu.newSeparator(menuName);
					['bAsync', 'sep', 'active', 'bStartActive'].forEach((key) => {
						if (menu.isSeparator(key)) { menu.newEntry({ menuName, entryText: key }); return; }
						const entryText = this.buttonsProperties[key][0].replace(/[a-zA-Z]*\d*_*\d*\./, '');
						menu.newEntry({
							menuName, entryText, func: () => {
								this.buttonsProperties[key][1] = !this.buttonsProperties[key][1];
								overwriteProperties(this.buttonsProperties);
								if (key === 'active') { this.active = this.autoBackup.active = this.buttonsProperties[key][1]; }
							}
						});
						menu.newCheckMenuLast(() => { return this.buttonsProperties[key][1]; });
					});
				}
				menu.newSeparator();
				{
					const entryText = this.buttonsProperties.active[0].replace(/[a-zA-Z]*\d*_*\d*\./, '');
					menu.newEntry({
						entryText, func: () => {
							this.buttonsProperties.active[1] = !this.buttonsProperties.active[1];
							overwriteProperties(this.buttonsProperties);
							this.active = this.autoBackup.active = this.buttonsProperties.active[1];
						}
					});
					menu.newCheckMenuLast(() => { return this.buttonsProperties.active[1]; });
				}
				menu.newSeparator();
				menu.newEntry({ entryText: 'Execute Save & Backup', func: this.autoBackup.forceBackup });
				menu.newSeparator();
				menu.newEntry({
					entryText: 'Open backup folder...', func: () => {
						_explorer(fb.ProfilePath + this.autoBackup.outputPath.split('\\').slice(0, -1).join('\\'));
					}
				});
				menu.newSeparator();
				menu.newEntry({ entryText: 'Readme...', func: () => showButtonReadme('buttons_utils_autobackup.js') });
				menu.btn_up(this.currX, this.currY + this.currH);
			}
		},
		description: function () {
			const bCtrl = utils.IsKeyPressed(VK_CONTROL);
			const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
			let info = 'AutoBackup foobar2000 config files:';
			// Entries
			const files = this.autoBackup.files;
			info += '\nEntries:\t' + [...new Set(files.map(e => e.name.replace(/ \(.*\)/, '')))].joinEvery(', ', 3, '\n\t');
			if (bCtrl || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Ctrl + L. Click to Save && Backup on demand)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.clock,
		variables: {
			autoBackup: new AutoBackup({
				iBackups: Number(newButtonsProperties.iBackups[1]),
				backupsMaxSize: Number(newButtonsProperties.backupsMaxSize[1]) * 1024 * 1024,
				bAsync: newButtonsProperties.bAsync[1],
				outputPath: newButtonsProperties.outputPath[1],
				files: JSON.parse(newButtonsProperties.files[1]),
				backupFormat: JSON.parse(newButtonsProperties.backupFormat[1]),
				iPlaying: Number(newButtonsProperties.iPlaying[1]) * 60000,
				iStop: Number(newButtonsProperties.iStop[1]) * 60000,
				iInterval: Number(newButtonsProperties.iInterval[1]) * 60000,
				iStart: Number(newButtonsProperties.iStart[1]) * 60000,
				iTrack: Number(newButtonsProperties.iTrack[1]),
				iClose: Number(newButtonsProperties.iClose[1]),
				iTrackSave: Number(newButtonsProperties.iTrackSave[1]),
				minDriveSize: Number(newButtonsProperties.minDriveSize[1]) * 1024 * 1024,
			})
		},
		onInit: function () {
			this.active = this.autoBackup.active = this.buttonsProperties.bStartActive[1] ? true : this.buttonsProperties.active[1];
			if (this.active !== this.buttonsProperties.active[1]) {
				this.buttonsProperties.active[1] = this.active;
				overwriteProperties(this.buttonsProperties);
			}
			this.bHeadlessMode = this.buttonsProperties.bHeadlessMode[1];
		},
		update: { scriptName: 'AutoBackup-SMP', version }
	})
});