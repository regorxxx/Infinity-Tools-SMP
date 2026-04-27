'use strict';
//27/04/26

/* exported createButtonsMenu, onRbtnUpImportSettings */

/* global buttonsPath:readable, buttonsBar:readable, barProperties:readable, buttonStates:readable, buttonSizeCheck:readable,moveButton:readable, addButtonSeparator:readable, showButtonReadme:readable, forEachButton:readable, addButtonSpacer:readable, addButtonNewLine:readable, background:readable */

include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable, MF_GRAYED:readable, MF_STRING:readable, VK_CONTROL:readable, VK_SHIFT:readable, globSettings:readable, checkUpdate:readable, clone:readable */
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable, getPropertiesPairs:readable, deleteProperties:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global require:readable, capitalizeAll:readable, round:readable, _p:readable, capitalize:readable, _b:readable, strNumCollator:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global findRecursiveFile:readable, _open:readable, _isFile:readable, utf8:readable, _save:readable, _isFolder:readable, _createFolder:readable, WshShell:readable, _explorer:readable, getFiles:readable, _moveFile:readable, popup:readable */
include('..\\..\\helpers\\helpers_xxx_UI.js');
/* global RGBA:readable, toRGB:readable, _scale:readable */
include('..\\..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\..\\helpers\\helpers_xxx_export.js');
/* global exportSettings:readable, importSettings:readable */
include('..\\..\\helpers-external\\namethatcolor\\ntc.js');
/* global ntc:readable */
include('..\\..\\main\\window\\window_xxx_background_menu.js');
/* global createBackgroundMenu:readable */
const Chroma = require('..\\helpers-external\\chroma.js\\chroma.min'); // Relative to helpers folder

function createButtonsMenu(name) {
	const menu = new _menu();
	menu.clear(true); // Reset on every call
	const files = findRecursiveFile('*.js', [folders.xxx + 'buttons']); // without \\ at end looks only on parent folder
	// Header
	menu.newEntry({ entryText: 'Toolbar configuration:', func: null, flags: MF_GRAYED });
	menu.newSeparator();
	if (!_isFolder(folders.data)) { _createFolder(folders.data); }
	const notAllowedDup = new Set(['buttons_device_priority.js', 'buttons_device_switcher.js', 'buttons_fingerprint_tools.js', 'buttons_lastfm_tools.js', 'buttons_listenbrainz_tools.js', 'buttons_music_map_basic.js', 'buttons_playback_love.js', 'buttons_playback_next.js', 'buttons_playback_order.js', 'buttons_playback_pause.js', 'buttons_playback_play.js', 'buttons_playback_prev.js', 'buttons_playback_random.js', 'buttons_playback_rating.js', 'buttons_playback_stop.js', 'buttons_playback_volume.js', 'buttons_playlist_history.js', 'buttons_playlist_tools_macros.js', 'buttons_playlist_tools_pool.js', 'buttons_playlist_tools.js', 'buttons_stats_wrapped.js', 'buttons_tags_save_tags.js', 'buttons_utils_autobackup.js']);
	const requirePlaylistTools = new Set(['buttons_playlist_tools_macros.js', 'buttons_playlist_tools_macro_custom.js', 'buttons_playlist_tools_pool.js', 'buttons_playlist_tools_submenu_custom.js']);
	const subCategories = ['_fingerprint_', '_listenbrainz_', '_music_map', '_search_', '_tags_', '_playlist_tools', '_playlist_', '_stats_', '_device_', '_display_', '_lastfm_', '_utils_', '_playback_', '_others_']; // By order of priority if it matches multiple strings
	const buttonsPathNames = new Set(buttonsPath.map((path) => { return path.split('\\').pop(); }));
	function isAllowed(fileName) { return !notAllowedDup.has(fileName) || !buttonsPathNames.has(fileName); }
	function isAllowedV2(fileName) { return !requirePlaylistTools.has(fileName) || buttonsPathNames.has('buttons_playlist_tools.js'); }
	function parseSubMenuFolder(s) {
		switch (s) {
			case '_device_': return 'Output devices';
			case '_display_': return 'Display && TF';
			case '_fingerprint_': return 'Fingerprint Tools';
			case '_lastfm_':
			case '_listenbrainz_': return 'ListenBrainz && Last.fm';
			case '_playback_': return 'Playback control';
			case '_playlist_': return 'Playlist handling';
			case '_playlist_tools': return 'Playlist Tools';
			case '_others_': return 'Other tools';
			case '_search_': return '(Quick)Search';
			case '_music_map': return typeof sbd !== 'undefined' ? sbd.name : 'Music Map';
			case '_stats_': return 'Library statistics';
			case '_tags_': return 'Tagging tools';
			case 'Settings, Tags and Queries': return s;
			default: return capitalizeAll(s.replace(/_/g, '').trim());
		}
	}
	{
		const subMenu = menu.newMenu('Add button');
		menu.newEntry({ menuName: subMenu, entryText: 'Ctrl + L. Click opens readme:', flags: MF_GRAYED });
		menu.newSeparator(subMenu);
		[...new Set(files.map((path) => {
			const entryText = path.split('\\').pop();
			return subCategories.find((folder) => entryText.includes(folder)) || 'Others';
		}))]
			.filter(Boolean)
			.map(parseSubMenuFolder)
			.sort(strNumCollator.compare)
			.forEach((subMenuFolder) => menu.findOrNewMenu(subMenuFolder, subMenu));
		files.forEach((path) => {
			const fileName = path.split('\\').pop();
			let entryText = fileName + (isAllowed(fileName)
				? (isAllowedV2(fileName)
					? '' : '\t(Playlist Tools)'
				) : '\t(1 allowed)');
			let subMenuFolder = subCategories.find((folder) => entryText.includes(folder)) || 'Others';
			if (subMenuFolder && subMenuFolder.length) {
				subMenuFolder = parseSubMenuFolder(subMenuFolder);
				subMenuFolder = menu.findOrNewMenu(subMenuFolder, subMenu);
			}
			entryText = entryText.replace('buttons_', '').replace('others_', '');
			menu.newEntry({
				menuName: subMenuFolder, entryText, func: () => {
					const bOnlyReadme = utils.IsKeyPressed(VK_CONTROL);
					if (!bOnlyReadme) {
						buttonsPath.push(path);
						const fileNames = buttonsPath.map((path) => { return path.split('\\').pop(); });
						_save(folders.data + name + '.json', JSON.stringify(fileNames, null, '\t').replace(/\n/g, '\r\n'));
					}
					showButtonReadme(fileName);
					if (!bOnlyReadme) { window.Reload(); }
				}, flags: isAllowed(fileName) && isAllowedV2(fileName) ? MF_STRING : MF_GRAYED
			});
		});
		menu.newSeparator(subMenu);
		menu.newEntry({
			menuName: subMenu, entryText: 'Toolbar separator', func: () => {
				buttonsPath.push('separator');
				const fileNames = buttonsPath.map((path) => { return path.split('\\').pop(); });
				_save(folders.data + name + '.json', JSON.stringify(fileNames, null, '\t').replace(/\n/g, '\r\n'));
				const newKeys = Object.keys(addButtonSeparator());
				buttonsBar.listKeys.push(newKeys);
			}
		});
		menu.newEntry({
			menuName: subMenu, entryText: 'Toolbar spacer', func: () => {
				buttonsPath.push('spacer');
				const fileNames = buttonsPath.map((path) => { return path.split('\\').pop(); });
				_save(folders.data + name + '.json', JSON.stringify(fileNames, null, '\t').replace(/\n/g, '\r\n'));
				const newKeys = Object.keys(addButtonSpacer());
				buttonsBar.listKeys.push(newKeys);
			}
		});
		menu.newEntry({
			menuName: subMenu, entryText: 'Toolbar new line', func: () => {
				buttonsPath.push('newline');
				const fileNames = buttonsPath.map((path) => { return path.split('\\').pop(); });
				_save(folders.data + name + '.json', JSON.stringify(fileNames, null, '\t').replace(/\n/g, '\r\n'));
				const newKeys = Object.keys(addButtonNewLine());
				buttonsBar.listKeys.push(newKeys);
			}
		});
	}
	{
		const subMenu = menu.newMenu('Remove button');
		buttonsPath.forEach((path, idx) => {
			let buttonName = path.split('\\').pop();
			if (['separator', 'newline', 'spacer'].includes(buttonName)) { buttonName = '-- ' + buttonName + ' --'; }
			menu.newEntry({
				menuName: subMenu, entryText: buttonName + '\t(' + (idx + 1) + ')', func: () => {
					// Remove button
					buttonsPath.splice(idx, 1);
					// Remove properties
					// Since properties have a prefix according to their loading order when there are multiple instances of the same
					// script, removing a button when there are other 'clones' means the other buttons will get their properties names
					// shifted by one. They need to be adjusted or buttons at greater indexes will inherit properties from lower ones!
					const properties = buttonsBar.list[idx];
					if (properties) { deleteProperties(properties); } // Delete current position
					// Retrieves Id
					const keys = properties ? Object.keys(properties) : [];
					if (keys.length) {
						const prefix = properties[Object.keys(properties)[0]][0].split('_')[0];
						const currentId = prefix.slice(0, prefix.length - 1);
						let currentIdNumber = Number(prefix[prefix.length - 1]);
						buttonsBar.list.splice(idx, 1); // Deletes from the list
						// Rewrite other Ids starting at the current number
						buttonsBar.list.forEach((oldProperties, newIdx) => {
							if (newIdx >= idx) {
								const oldKeys = oldProperties ? Object.keys(oldProperties) : [];
								if (oldKeys.length) {
									const oldPrefix = oldProperties[oldKeys[0]][0].split('_')[0];
									const oldId = oldPrefix.slice(0, oldPrefix.length - 1);
									if (oldId === currentId) {
										const backup = getPropertiesPairs(oldProperties, '', 0, false); // First refresh from panel
										deleteProperties(oldProperties); // Delete it at panel
										for (const key in backup) { // Update Id
											if (!Object.hasOwn(backup, key)) { continue; }
											backup[key][0] = backup[key][0].replace(oldPrefix, oldId + currentIdNumber);
										}
										setProperties(backup, '', 0, false, true); // And restore at new position
										currentIdNumber++;
									}
								}
							}
						});
					}
					// Save and reload
					const fileNames = buttonsPath.map((path) => path.split('\\').pop());
					_save(folders.data + name + '.json', JSON.stringify(fileNames, null, '\t').replace(/\n/g, '\r\n'));
					window.Reload();
				}
			});
		});
		menu.newSeparator(subMenu);
		menu.newEntry({
			menuName: subMenu, entryText: 'Remove all', func: () => {
				// Remove buttons
				buttonsPath.length = 0;
				buttonsBar.list.forEach((properties) => properties && deleteProperties(properties));
				// Save and reload
				const fileNames = buttonsPath.map((path) => path.split('\\').pop());
				_save(folders.data + name + '.json', JSON.stringify(fileNames, null, '\t').replace(/\n/g, '\r\n'));
				window.Reload();
			}
		});
	}
	{
		const subMenu = menu.newMenu('Change button position');
		menu.newEntry({ menuName: subMenu, entryText: 'Or pressing R. Click over buttons:', flags: MF_GRAYED });
		menu.newSeparator(subMenu);
		buttonsPath.forEach((path, idx) => {
			menu.newEntry({
				menuName: subMenu, entryText: path.split('\\').pop() + '\t(' + (idx + 1) + ')', func: () => {
					const input = Input.number('int positive', idx + 1, 'Enter new position:\n(1 - ' + buttonsPath.length + ')', 'Buttons bar: button position', buttonsPath.length, [n => n > 0 && n <= buttonsPath.length]);
					if (input === null) { return; }
					moveButton(buttonsBar.listKeys[idx][0], buttonsBar.listKeys[input - 1][0]);
				}, flags: buttonsPath.length > 1 ? MF_STRING : MF_GRAYED
			});
		});
	}
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Restore all buttons', func: () => {
			const answer = WshShell.Popup('This will maintain the current layout but delete any customized setting on all buttons. Are you sure?', 0, 'Toolbar', popup.question + popup.yes_no);
			if (answer === popup.yes) {
				// Remove all properties and reload
				buttonsBar.list.forEach((properties) => { deleteProperties(properties); });
				window.Reload();
			}
		}
	});
	menu.newSeparator();
	{
		const menuName = menu.newMenu('Colors');
		const getColorName = (val) => val !== -1 && val !== null && typeof val !== 'undefined'
			? (ntc.name(Chroma(val).hex())[1] || '').toString() || 'unknown'
			: '-none-';
		menu.newEntry({ menuName, entryText: 'UI colors: (Ctrl + Click to reset)', flags: MF_GRAYED });
		menu.newSeparator(menuName);
		menu.newEntry({
			menuName, entryText: 'Set custom bar color...' + '\t[' + getColorName(barProperties.toolbarColor[1]) + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					buttonsBar.config.bToolbar = false; // buttons_xxx.js
					barProperties.toolbarColor[1] = buttonsBar.config.toolbarColor = barProperties.toolbarColor[3];
				} else {
					barProperties.toolbarColor[1] = utils.ColourPicker(window.ID, barProperties.toolbarColor[1]);
					console.log('Toolbar (' + window.FullPanelName + '): Selected color ->\n\t Android: ' + barProperties.toolbarColor[1] + ' - RGB: ' + Chroma(barProperties.toolbarColor[1]).rgb());
					buttonsBar.config.bToolbar = true; // buttons_xxx.js
					buttonsBar.config.toolbarColor = barProperties.toolbarColor[1]; // buttons_xxx.js
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newEntry({
			menuName, entryText: 'Set custom button color...' + '\t[' + getColorName(barProperties.buttonColor[1]) + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.buttonColor[1] = buttonsBar.config.buttonColor = buttonsBar.config.default.buttonColor;
				} else {
					barProperties.buttonColor[1] = utils.ColourPicker(window.ID, barProperties.buttonColor[1]);
					console.log('Toolbar (' + window.FullPanelName + '): Selected color ->\n\t Android: ' + barProperties.buttonColor[1] + ' - RGB: ' + Chroma(barProperties.buttonColor[1]).rgb());
					buttonsBar.config.buttonColor = barProperties.buttonColor[1]; // buttons_xxx.js
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] ? MF_STRING : MF_GRAYED
		});
		menu.newEntry({
			menuName, entryText: 'Set custom text color...' + '\t[' + getColorName(barProperties.textColor[1]) + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.textColor[1] = buttonsBar.config.textColor = buttonsBar.config.default.buttonColor;
				} else {
					barProperties.textColor[1] = utils.ColourPicker(window.ID, barProperties.textColor[1]);
					console.log('Toolbar (' + window.Name + '): Selected color ->\n\t Android: ' + barProperties.textColor[1] + ' - RGB: ' + Chroma(barProperties.textColor[1]).rgb());
					buttonsBar.config.textColor = barProperties.textColor[1]; // buttons_xxx.js
				}
				forEachButton((button) => { button.clearIconCache(); });
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newSeparator(menuName);
		menu.newEntry({
			menuName, entryText: 'Set custom hover color...' + '\t[' + getColorName(barProperties.hoverColor[1]) + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.hoverColor[1] = buttonsBar.config.hoverColor = buttonsBar.config.default.hoverColor;
				} else if (utils.IsKeyPressed(VK_SHIFT)) {
					barProperties.hoverColor[1] = buttonsBar.config.hoverColor = -1;
				} else {
					barProperties.hoverColor[1] = utils.ColourPicker(window.ID, barProperties.hoverColor[1]);
					console.log('Toolbar (' + window.FullPanelName + '): Selected color ->\n\t Android: ' + barProperties.hoverColor[1] + ' - RGB: ' + Chroma(barProperties.hoverColor[1]).rgb());
					buttonsBar.config.hoverColor = barProperties.hoverColor[1]; // buttons_xxx.js
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] && !barProperties.bDynHoverColor[1] ? MF_STRING : MF_GRAYED
		});
		menu.newEntry({
			menuName, entryText: 'Use dynamic hover color', func: () => {
				buttonsBar.config.bDynHoverColor = barProperties.bDynHoverColor[1] = !barProperties.bDynHoverColor[1]; // buttons_xxx.js
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] && (!barProperties.bOnNotifyColors[1] || buttonsBar.config.hoverColor === -1) ? MF_STRING : MF_GRAYED
		});
		menu.newCheckMenuLast(() => barProperties.bDynHoverColor[1] && (!barProperties.bOnNotifyColors[1] || buttonsBar.config.hoverColor === -1));
		menu.newEntry({
			menuName, entryText: 'Use hover color gradient', func: () => {
				buttonsBar.config.bHoverGrad = barProperties.bHoverGrad[1] = !barProperties.bHoverGrad[1]; // buttons_xxx.js
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] && (barProperties.hoverColor[1] !== -1 || barProperties.bDynHoverColor[1]) ? MF_STRING : MF_GRAYED
		});
		menu.newCheckMenuLast(() => barProperties.bHoverGrad[1]);
		menu.newEntry({
			menuName, entryText: 'Use buttons\' borders on hover', func: () => {
				buttonsBar.config.bBorders = barProperties.bBorders[1] = !barProperties.bBorders[1];
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] ? MF_STRING : MF_GRAYED
		});
		menu.newCheckMenuLast(() => barProperties.bBorders[1]);
		menu.newSeparator(menuName);
		menu.newEntry({
			menuName, entryText: 'Set active button color...' + '\t[' + getColorName(barProperties.activeColor[1]) + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.activeColor[1] = buttonsBar.config.activeColor = buttonsBar.config.default.activeColor;
				} else {
					barProperties.activeColor[1] = utils.ColourPicker(window.ID, barProperties.activeColor[1]);
					console.log('Toolbar (' + window.FullPanelName + '): Selected color ->\n\t Android: ' + barProperties.activeColor[1] + ' - RGB: ' + Chroma(barProperties.activeColor[1]).rgb());
					buttonsBar.config.activeColor = barProperties.activeColor[1]; // buttons_xxx.js
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newEntry({
			menuName, entryText: 'Set animation button colors...', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.animationColors[1] = JSON.stringify(buttonsBar.config.default.animationColors);
					buttonsBar.config.animationColors = buttonsBar.config.default.animationColors;
				} else {
					let colors = JSON.parse(barProperties.animationColors[1]);
					colors = [RGBA(...toRGB(utils.ColourPicker(window.ID, colors[0])), 50), RGBA(...toRGB(utils.ColourPicker(window.ID, colors[1])), 30)];
					console.log('Toolbar (' + window.FullPanelName + '): Selected color ->' + colors.map((col) => '\n\t Android: ' + col + ' - RGB: ' + Chroma(col).rgb()).join(''));
					barProperties.animationColors[1] = JSON.stringify(colors);
					buttonsBar.config.animationColors = colors; // buttons_xxx.js
				}
				overwriteProperties(barProperties);
				window.Repaint(); // Note existing animations will use the previous colors, since the (default) colors are applied per animation once before firing
			}
		});
		menu.newSeparator(menuName);
		menu.newEntry({
			menuName, entryText: 'Set toolbar opacity...' + '\t[' + buttonsBar.config.toolbarOpacity + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.toolbarOpacity[1] = buttonsBar.config.toolbarOpacity = buttonsBar.config.default.toolbarOpacity;
				} else {
					const input = Input.number('int positive', buttonsBar.config.toolbarOpacity, 'Enter value:\n0 is transparent, 100 is opaque.\n(0 to 100)', 'Buttons bar: toolbar opacity', 50, [n => n <= 100]);
					if (input === null) { return; }
					barProperties.toolbarOpacity[1] = buttonsBar.config.toolbarOpacity = input;
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: buttonsBar.config.toolbarColor !== -1 || !window.IsTransparent ? MF_STRING : MF_GRAYED
		});
		menu.newEntry({
			menuName, entryText: 'Set buttons opacity...' + '\t[' + buttonsBar.config.buttonOpacity + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.buttonOpacity[1] = buttonsBar.config.buttonOpacity = buttonsBar.config.default.buttonOpacity;
				} else {
					const input = Input.number('int positive', buttonsBar.config.buttonOpacity, 'Enter value:\n0 is transparent, 100 is opaque.\n(0 to 100)', 'Buttons bar: buttons opacity', 50, [n => n <= 100]);
					if (input === null) { return; }
					barProperties.buttonOpacity[1] = buttonsBar.config.buttonOpacity = input;
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] && (barProperties.bOnNotifyColors[1] || buttonsBar.config.hoverColor !== -1 || buttonsBar.config.bDynHoverColor) ? MF_STRING : MF_GRAYED
		});
		menu.newEntry({
			menuName, entryText: 'Set border opacity...' + '\t[' + buttonsBar.config.buttonBorderOpacity + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.buttonBorderOpacity[1] = buttonsBar.config.buttonBorderOpacity = buttonsBar.config.default.buttonBorderOpacity;
				} else {
					const input = Input.number('int positive', buttonsBar.config.buttonBorderOpacity, 'Enter value:\n0 is transparent, 100 is opaque.\n(0 to 100)', 'Buttons bar: buttons\' border opacity', 50, [n => n <= 100]);
					if (input === null) { return; }
					barProperties.buttonBorderOpacity[1] = buttonsBar.config.buttonBorderOpacity = input;
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: !barProperties.bBgButtons[1] && buttonsBar.config.bBorders ? MF_STRING : MF_GRAYED
		});
		menu.newSeparator(menuName);
		menu.newEntry({
			menuName, entryText: 'Use themed buttons', func: () => {
				barProperties.bBgButtons[1] = !barProperties.bBgButtons[1];
				if (buttonsBar.useThemeManager) {
					let gTheme;
					try { gTheme = window.CreateThemeManager('Button'); } catch (e) { gTheme = null; } // eslint-disable-line no-unused-vars
					if (!gTheme) {
						buttonsBar.config.bUseThemeManager = false;
						console.popup('Buttons: window.CreateThemeManager(\'Button\') failed, using non-themed buttons', 'Toolbar');
					}
				}
				overwriteProperties(barProperties);
				buttonsBar.config.partAndStateID = barProperties.bBgButtons[1] ? 1 : 6; // buttons_xxx.js
				window.Repaint();
			}
		});
		menu.newCheckMenuLast(() => barProperties.bBgButtons[1]);
		menu.newSeparator(menuName);
		{
			const subMenu = menu.newMenu('Dynamic colors', menuName);
			menu.newEntry({
				menuName: subMenu, entryText: 'Dynamic (background art mode)', func: () => {
					barProperties.bDynamicColors[1] = !(barProperties.bDynamicColors[1] && background.useCoverColors);
					if (barProperties.bDynamicColors[1] && barProperties.bOnNotifyColors[1]) { fb.ShowPopupMessage('Warning: Dynamic colors (background art mode) and Color-server listening are enabled at the same time.\n\nThis setting may probably produce glitches since 2 color sources are being used, while one tries to override the other.\n\nIt\'s recommended to only use one of these features, unless you know what you are doing.', window.ScriptInfo.Name + ': Dynamic colors'); }
					overwriteProperties(barProperties);
					if (barProperties.bDynamicColors[1]) {
						// Ensure it's applied with compatible settings
						background.changeConfig({
							bRepaint: false, callbackArgs: { bSaveProperties: true },
							config: !background.useCover
								? { coverMode: background.getDefaultCoverMode(), coverModeOptions: { alpha: 0, bProcessColors: true } }
								: { coverModeOptions: { bProcessColors: true } },
						});
						background.updateImageBg(true);
					} else {
						background.changeConfig({ config: { colorModeOptions: { color: JSON.parse(barProperties.background[1]).colorModeOptions.color } }, callbackArgs: { bSaveProperties: false } });
						background.callbacks.artColors(void (0), true);
						overwriteProperties(barProperties);
					}
				},
				checkFunc: () => barProperties.bDynamicColors[1] && background.useCoverColors,
			});
			menu.newEntry({
				menuName: subMenu, entryText: 'Also apply to background color', func: () => {
					barProperties.bDynamicColorsBg[1] = !barProperties.bDynamicColorsBg[1];
					if (!barProperties.bDynamicColorsBg[1]) {
						background.changeConfig({ config: { colorModeOptions: { color: JSON.parse(barProperties.background[1]).colorModeOptions.color } }, callbackArgs: { bSaveProperties: false } });
					}
					overwriteProperties(barProperties);
					background.updateImageBg(true);
					if (barProperties.bOnNotifyColors[1]) {
						window.NotifyOthers('Colors: ask color scheme', window.ScriptInfo.Name + ': set color scheme');
						window.NotifyOthers('Colors: ask color', window.ScriptInfo.Name + ': set colors');
					}
				}, flags: barProperties.bDynamicColors[1] || barProperties.bOnNotifyColors[1] ? MF_STRING : MF_GRAYED,
				checkFunc: () => barProperties.bDynamicColorsBg[1]
			});
			menu.newSeparator(subMenu);
			menu.newEntry({
				menuName: subMenu, entryText: 'Listen to color-servers', func: () => {
					barProperties.bOnNotifyColors[1] = !barProperties.bOnNotifyColors[1];
					if (barProperties.bDynamicColors[1] && barProperties.bOnNotifyColors[1]) { fb.ShowPopupMessage('Warning: Dynamic colors (background art mode) and Color-server listening are enabled at the same time.\n\nThis setting may probably produce glitches since 2 color sources are being used, while one tries to override the other.\n\nIt\'s recommended to only use one of these features, unless you know what you are doing.', window.ScriptInfo.Name + ': Dynamic colors'); }
					overwriteProperties(barProperties);
					if (barProperties.bOnNotifyColors[1]) {
						window.NotifyOthers('Colors: ask color scheme', window.ScriptInfo.Name + ': set color scheme');
						window.NotifyOthers('Colors: ask color', window.ScriptInfo.Name + ': set colors');
					} else if (!barProperties.bDynamicColors[1]) {
						background.callbacks.artColors(void (0), true);
					}
				},
				checkFunc: () => barProperties.bOnNotifyColors[1]
			});
			menu.newEntry({
				menuName: subMenu, entryText: 'Act as color-server', func: () => {
					barProperties.bNotifyColors[1] = !(barProperties.bNotifyColors[1] && background.useCoverColors);
					overwriteProperties(barProperties);
					if (barProperties.bNotifyColors[1]) {
						if (background.scheme) { window.NotifyOthers('Colors: set color scheme', background.scheme); }
						else if (!background.useCoverColors) {
							background.changeConfig({
								bRepaint: false, callbackArgs: { bSaveProperties: true },
								config: !background.useCover
									? { coverMode: background.getDefaultCoverMode(), coverModeOptions: { alpha: 0, bProcessColors: true } }
									: { coverModeOptions: { bProcessColors: true } },
							});
						}
					}
				},
				checkFunc: () => barProperties.bNotifyColors[1] && background.useCoverColors
			});
		}
		menu.newSeparator(menuName);
		menu.newEntry({
			menuName, entryText: 'Reset all configuration...', func: () => {
				barProperties.toolbarColor[1] = -1;
				barProperties.buttonColor[1] = -1;
				buttonsBar.config.toolbarColor = buttonsBar.config.default.toolbarColor;
				buttonsBar.config.buttonColor = buttonsBar.config.default.buttonColor;
				barProperties.buttonOpacity[1] = buttonsBar.config.buttonOpacity = buttonsBar.config.default.buttonOpacity;
				barProperties.toolbarOpacity[1] = buttonsBar.config.toolbarOpacity = buttonsBar.config.default.toolbarOpacity;
				barProperties.buttonBorderOpacity[1] = buttonsBar.config.buttonBorderOpacity = buttonsBar.config.default.buttonBorderOpacity;
				barProperties.textColor[1] = buttonsBar.config.textColor = buttonsBar.config.default.textColor;
				barProperties.activeColor[1] = buttonsBar.config.activeColor = buttonsBar.config.default.activeColor;
				barProperties.animationColors[1] = JSON.stringify(buttonsBar.config.default.animationColors);
				buttonsBar.config.animationColors = buttonsBar.config.default.animationColors;
				buttonsBar.config.bToolbar = buttonsBar.config.default.bToolbar;
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
	}
	{
		const menuName = menu.newMenu('Size and placement');
		const orientation = barProperties.orientation[1].toLowerCase();
		menu.newEntry({ menuName, entryText: 'UI placement: (Ctrl + Click to reset)', flags: MF_GRAYED });
		menu.newSeparator(menuName);
		menu.newEntry({
			menuName, entryText: 'Set scale...' + '\t[' + round(buttonsBar.config.scale, 2) + ']', func: () => {
				let input;
				if (utils.IsKeyPressed(VK_CONTROL)) {
					input = buttonsBar.config.default.scale;
				} else {
					input = Input.number('real positive', buttonsBar.config.scale, 'Enter value:\n(real number > 0)', 'Buttons bar: global scale', 0.8, [n => n > 0 && n < Infinity]);
					if (input === null) { return; }
				}
				barProperties.scale[1] = buttonsBar.config.scale = input; // buttons_xxx.js
				const bApplyAll = WshShell.Popup('Also apply to text and icons?', 0, 'Buttons bar', popup.question + popup.yes_no) === popup.yes;
				if (bApplyAll) {
					barProperties.iconScale[1] = buttonsBar.config.iconScale = buttonsBar.config.scale;
					barProperties.textScale[1] = buttonsBar.config.textScale = buttonsBar.config.scale;
					buttonsBar.config.buttonMargin = _scale(buttonsBar.config.default.buttonMargin * buttonsBar.config.scale, false);
				}
				overwriteProperties(barProperties);
				window.Reload();
			}
		});
		menu.newEntry({
			menuName, entryText: 'Set text scale...' + '\t[' + round(buttonsBar.config.textScale, 2) + ']', func: () => {
				let input;
				if (utils.IsKeyPressed(VK_CONTROL)) {
					input = buttonsBar.config.default.textScale;
				} else {
					input = Input.number('real positive', buttonsBar.config.textScale, 'Enter value:\n(real number > 0)', 'Buttons bar: text scale', 0.8, [n => n > 0 && n < Infinity]);
					if (input === null) { return; }
				}
				forEachButton((button) => { button.changeTextScale(input); });
				barProperties.textScale[1] = buttonsBar.config.textScale = input;
				overwriteProperties(barProperties);
				window.Repaint();
				buttonSizeCheck();
			}
			, flags: buttonsBar.config.bIconMode ? MF_GRAYED : MF_STRING
		});
		menu.newEntry({
			menuName, entryText: 'Set icon scale...' + '\t[' + round(buttonsBar.config.iconScale, 2) + ']', func: () => {
				let input;
				if (utils.IsKeyPressed(VK_CONTROL)) {
					input = buttonsBar.config.default.iconScale;
				} else {
					input = Input.number('real positive', buttonsBar.config.iconScale, 'Enter value:\n(real number > 0)', 'Buttons bar: icon scale', 0.8, [n => n > 0 && n < Infinity]);
					if (input === null) { return; }
				}
				barProperties.iconScale[1] = buttonsBar.config.iconScale = input;
				overwriteProperties(barProperties);
				window.Reload();
			}
		});
		menu.newSeparator(menuName);
		menu.newEntry({
			menuName, entryText: 'Set button offset...' + '\t[' + Object.values(buttonsBar.config.offset.button) + ']', func: () => {
				let input;
				if (utils.IsKeyPressed(VK_CONTROL)) {
					input = buttonsBar.config.default.offset.button;
				} else {
					input = Input.json('object', buttonsBar.config.offset.button, 'Enter values:\n(integer finite numbers)', 'Buttons bar: button offset', '{"x": 4, "y" : 6}', [v => Number.isFinite(v) && Number.isInteger(v)]);
					if (input === null) { return; }
				}
				buttonsBar.config.offset.button = input; // buttons_xxx.js
				barProperties.offset[1] = JSON.stringify(buttonsBar.config.offset);
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newEntry({
			menuName, entryText: 'Set text offset...' + '\t[' + Object.values(buttonsBar.config.offset.text) + ']', func: () => {
				let input;
				if (utils.IsKeyPressed(VK_CONTROL)) {
					input = buttonsBar.config.default.offset.text;
				} else {
					input = Input.json('object', buttonsBar.config.offset.text, 'Enter values:\n(integer finite numbers)', 'Buttons bar: text offset', '{"x": 4, "y" : 6}', [v => Number.isFinite(v) && Number.isInteger(v)]);
					if (input === null) { return; }
				}
				buttonsBar.config.offset.text = input; // buttons_xxx.js
				barProperties.offset[1] = JSON.stringify(buttonsBar.config.offset);
				overwriteProperties(barProperties);
				window.Repaint();
			}
			, flags: buttonsBar.config.bIconMode ? MF_GRAYED : MF_STRING
		});
		menu.newEntry({
			menuName, entryText: 'Set icon offset...' + '\t[' + Object.values(buttonsBar.config.offset.icon) + ']', func: () => {
				let input;
				if (utils.IsKeyPressed(VK_CONTROL)) {
					input = buttonsBar.config.default.offset.icon;
				} else {
					input = Input.json('object', buttonsBar.config.offset.icon, 'Enter values:\n(integer finite numbers)', 'Buttons bar: icon offset', '{"x": 4, "y" : 6}', [v => Number.isFinite(v) && Number.isInteger(v)]);
					if (input === null) { return; }
				}
				buttonsBar.config.offset.icon = input; // buttons_xxx.js
				barProperties.offset[1] = JSON.stringify(buttonsBar.config.offset);
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newSeparator(menuName);
		menu.newEntry({
			menuName, entryText: 'Set icon outline...' + '\t[' + buttonsBar.config.outlineIcon + ']', func: () => {
				if (utils.IsKeyPressed(VK_CONTROL)) {
					barProperties.outlineIcon[1] = buttonsBar.config.outlineIcon = buttonsBar.config.default.outlineIcon;
				} else {
					const input = Input.number('int positive', buttonsBar.config.outlineIcon, 'Enter value:\n(px)', 'Buttons bar: icon outline', 0, [n => n <= Infinity]);
					if (input === null) { return; }
					barProperties.outlineIcon[1] = buttonsBar.config.outlineIcon = input;
				}
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newSeparator(menuName);
		{
			const currPos = buttonsBar.config.bIconMode
				? buttonsBar.config.textPosition === 'top'
					? 'bottom'
					: buttonsBar.config.textPosition.replace('bottom', 'top').replace(/left|right/, 'center')
				: buttonsBar.config.textPosition;
			const subMenuName = menu.newMenu(
				buttonsBar.config.bIconMode
					? 'Icon position' + '\t' + _b(capitalize(currPos))
					: 'Text position' + '\t' + _b(capitalize(currPos))
				, menuName);
			const options = buttonsBar.config.bIconMode ? ['top', 'bottom', 'center'] : ['top', 'bottom', 'left', 'right'];
			menu.newEntry({ menuName: subMenuName, entryText: 'Relative to button\'s size:', flags: MF_GRAYED });
			menu.newSeparator(subMenuName);
			options.forEach((o) => {
				const pos = buttonsBar.config.bIconMode
					? o === 'top' ? 'bottom' : o.replace('bottom', 'top')
					: o;
				menu.newEntry({
					menuName: subMenuName, entryText: capitalize(pos), func: () => {
						buttonsBar.config.textPosition = barProperties.textPosition[1] = o.replace('center', 'right');
						overwriteProperties(barProperties);
						window.Reload();
					}
				});
			});
			menu.newCheckMenuLast(() => {
				return options.indexOf(
					buttonsBar.config.bIconMode
						? buttonsBar.config.textPosition.replace(/left|right/, 'center')
						: buttonsBar.config.textPosition
				);
			}, options.length);
		}
		{
			const currPos = buttonsBar.config.xButtonPosition;
			const subMenuName = menu.newMenu('Button X-axis position' + '\t' + _b(capitalize(currPos)), menuName);
			menu.newEntry({ menuName: subMenuName, entryText: 'Relative to panel\'s size:', flags: MF_GRAYED });
			menu.newSeparator(subMenuName);
			const options = ['left', 'center'];
			options.forEach((o, i) => {
				menu.newEntry({
					menuName: subMenuName, entryText: capitalize(o) + (i !== 0 ? '\t (experimental)' : ''), func: () => {
						buttonsBar.config.xButtonPosition = barProperties.xButtonPosition[1] = o;
						overwriteProperties(barProperties);
						window.Reload();
					}
				});
			});
			menu.newCheckMenuLast(() => { return options.indexOf(currPos); }, options.length);
		}
		{
			const currPos = buttonsBar.config.yButtonPosition;
			const subMenuName = menu.newMenu('Button Y-axis position' + '\t' + _b(capitalize(currPos)), menuName);
			menu.newEntry({ menuName: subMenuName, entryText: 'Relative to panel\'s size:', flags: MF_GRAYED });
			menu.newSeparator(subMenuName);
			const options = ['top', 'center', 'bottom'];
			options.forEach((o, i) => {
				menu.newEntry({
					menuName: subMenuName, entryText: capitalize(o) + (i !== 0 ? '\t (experimental)' : ''), func: () => {
						buttonsBar.config.yButtonPosition = barProperties.yButtonPosition[1] = o;
						overwriteProperties(barProperties);
						window.Reload();
					}
				});
			});
			menu.newCheckMenuLast(() => { return options.indexOf(currPos); }, options.length);
		}
		menu.newSeparator(menuName);
		menu.newEntry({
			menuName, entryText: 'Reflow buttons according to ' + (orientation === 'x' ? 'width' : 'height'), func: () => {
				buttonsBar.config.bReflow = barProperties.bReflow[1] = !barProperties.bReflow[1];
				overwriteProperties(barProperties);
				window.Repaint();
			}
		});
		menu.newCheckMenuLast(() => barProperties.bReflow[1]);
		menu.newEntry({
			menuName, entryText: 'Normalize buttons ' + (buttonsBar.config.bReflow ? 'size' : (orientation === 'x' ? 'height' : 'width')), func: () => {
				buttonsBar.config.bAlignSize = barProperties.bAlignSize[1] = !barProperties.bAlignSize[1];
				overwriteProperties(barProperties);
				window.Repaint();
			}, flags: barProperties.bFullSize[1] ? MF_GRAYED : MF_STRING
		});
		menu.newCheckMenuLast(() => barProperties.bAlignSize[1]);
		menu.newEntry({
			menuName, entryText: 'Full size buttons', func: () => {
				buttonsBar.config.bFullSize = barProperties.bFullSize[1] = !barProperties.bFullSize[1];
				overwriteProperties(barProperties);

				if (buttonsBar.config.bFullSize) {
					if (forEachButton((button) => button.isNewLine)) { fb.ShowPopupMessage('Full size buttons don\'t support multiple lines within a toolbar.\n\nNew lines will be silently ignored.', 'Buttons bar: full size buttons'); }
				} else {
					forEachButton((button) => { button.currH = button.h; });
				}
				window.Repaint();
			}
		});
		menu.newCheckMenuLast(() => barProperties.bFullSize[1]);
	}
	{
		const menuName = menu.newMenu('Other UI settings');
		menu.newEntry({
			menuName, entryText: 'Show mouse shortcuts on tooltip', func: () => {
				barProperties.bTooltipInfo[1] = !barProperties.bTooltipInfo[1];
				overwriteProperties(barProperties);
			}
		});
		menu.newCheckMenuLast(() => barProperties.bTooltipInfo[1]);
		menu.newEntry({
			menuName, entryText: 'Show properties IDs on tooltip', func: () => {
				buttonsBar.config.bShowID = barProperties.bShowId[1] = !barProperties.bShowId[1];
				overwriteProperties(barProperties);
			}
		});
		menu.newCheckMenuLast(() => barProperties.bShowId[1]);
		menu.newSeparator(menuName);
		const orientation = barProperties.orientation[1].toLowerCase();
		menu.newEntry({
			menuName, entryText: 'Toolbar orientation \t[' + orientation.toUpperCase() + ']', func: () => {
				buttonsBar.config.orientation = barProperties.orientation[1] = orientation === 'x' ? 'y' : 'x';
				overwriteProperties(barProperties);
				window.Reload();
			}
		});
		{
			const subMenu = menu.newMenu('Icons-only mode', menuName);
			menu.newEntry({
				menuName: subMenu, entryText: 'Force for all buttons', func: () => {
					buttonsBar.config.bIconMode = barProperties.bIconMode[1] = !barProperties.bIconMode[1];
					overwriteProperties(barProperties);
					// When normalizing size, sizes are dynamically calculated on paint... so need to force it
					if (buttonsBar.config.bAlignSize) {
						buttonsBar.config.bAlignSize = false; // buttons_xxx.js
						window.Repaint(true);
						buttonsBar.config.bAlignSize = true; // buttons_xxx.js
					}
					window.Repaint(true);
				}
			});
			menu.newCheckMenuLast(() => buttonsBar.config.bIconMode);
			menu.newEntry({
				menuName: subMenu, entryText: 'Expand on mouse over' + (buttonsBar.config.orientation === 'y' ? '\t[Y]' : ''), func: () => {
					buttonsBar.config.bIconModeExpand = barProperties.bIconModeExpand[1] = !barProperties.bIconModeExpand[1];
					overwriteProperties(barProperties);
					window.Repaint();
				}, flags: buttonsBar.config.orientation === 'x' ? MF_STRING : MF_GRAYED
			});
			menu.newCheckMenuLast(() => buttonsBar.config.bIconModeExpand);
			menu.newSeparator(subMenu);
			buttonsBar.listKeys.forEach((arrKeys, idx) => {
				const bHeadless = arrKeys.every((key) => buttonsBar.buttons[key].state === buttonStates.hide);
				const entryText = buttonsPath[idx].split('\\').pop() + '\t' + (bHeadless ? ' [headless] ' : '') + _p(idx + 1);
				if (arrKeys.some((key) => Object.hasOwn(buttonsBar.buttons[key], 'bIconMode'))) {
					menu.newEntry({
						menuName: subMenu, entryText, func: () => {
							let cache;
							for (let key of arrKeys) {
								const button = buttonsBar.buttons[key];
								const properties = button.buttonsProperties;
								if (Object.hasOwn(properties, 'bIconMode')) {
									// A single button file may have multiple buttons sharing the same properties or not
									if (JSON.stringify(cache) !== JSON.stringify(properties)) {
										properties.bIconMode[1] = !properties.bIconMode[1];
										overwriteProperties(properties);
										cache = properties;
									}
									button.bIconMode = properties.bIconMode[1];
								}
							}
							window.Repaint();
						}, flags: buttonsBar.config.bIconMode || bHeadless ? MF_GRAYED : MF_STRING
					});
					menu.newCheckMenuLast(() => arrKeys.some((key) => buttonsBar.buttons[key].isIconMode()));
				} else {
					menu.newEntry({ menuName: subMenu, entryText, flags: MF_GRAYED });
					menu.newCheckMenuLast(() => arrKeys.some((key) => buttonsBar.buttons[key].isIconMode()));
				}
			});
			menu.newSeparator(subMenu);
			menu.newEntry({
				menuName: subMenu, entryText: 'Restore every button', func: () => {
					buttonsBar.listKeys.forEach((arrKeys) => {
						if (arrKeys.some((key) => Object.hasOwn(buttonsBar.buttons[key], 'bIconMode'))) {
							for (let key of arrKeys) {
								const button = buttonsBar.buttons[key];
								const properties = button.buttonsProperties;
								if (Object.hasOwn(properties, 'bIconMode')) {
									properties.bIconMode[1] = false;
									overwriteProperties(properties);
									button.bIconMode = false;
								}
							}
						}
					});
					window.Repaint();
				}, flags: buttonsBar.config.bIconMode ? MF_GRAYED : MF_STRING
			});
		}
		menu.newSeparator(menuName);
		{
			const keys = buttonsBar.listKeys.map((arr) => arr.filter((key) => Object.hasOwn(buttonsBar.buttons[key].buttonsProperties, 'bHeadlessMode'))).flat(Infinity).filter(Boolean);
			const checkHeadless = () => keys.every((key) => !Object.hasOwn(buttonsBar.buttons[key], 'bHeadlessMode') || buttonsBar.buttons[key].isHeadlessMode());
			const subMenu = menu.newMenu('Headless mode' + (keys.length ? '' : '\t[none]'), menuName, keys.length ? MF_STRING : MF_GRAYED);
			menu.newEntry({
				menuName: subMenu, entryText: 'Enable for all buttons', func: () => {
					buttonsBar.listKeys.forEach((arrKeys) => {
						if (arrKeys.some((key) => Object.hasOwn(buttonsBar.buttons[key].buttonsProperties, 'bHeadlessMode'))) {
							for (let key of arrKeys) {
								const button = buttonsBar.buttons[key];
								const properties = button.buttonsProperties;
								if (Object.hasOwn(properties, 'bHeadlessMode')) {
									button.bHeadlessMode = properties.bHeadlessMode[1] = true;
									overwriteProperties(properties);
								}
							}
						}
					});
					window.Repaint(true);
				}, flags: checkHeadless() ? MF_GRAYED : MF_STRING
			});
			menu.newCheckMenuLast(checkHeadless);
			menu.newSeparator(subMenu);
			buttonsBar.listKeys.forEach((arrKeys, idx) => {
				if (arrKeys.some((key) => Object.hasOwn(buttonsBar.buttons[key].buttonsProperties, 'bHeadlessMode'))) {
					const entryText = buttonsPath[idx].split('\\').pop() + '\t(' + (idx + 1) + ')';
					menu.newEntry({
						menuName: subMenu, entryText, func: () => {
							let cache;
							for (let key of arrKeys) {
								const button = buttonsBar.buttons[key];
								const properties = button.buttonsProperties;
								if (Object.hasOwn(properties, 'bHeadlessMode')) {
									// A single button file may have multiple buttons sharing the same properties or not
									if (JSON.stringify(cache) !== JSON.stringify(properties)) {
										properties.bHeadlessMode[1] = !properties.bHeadlessMode[1];
										overwriteProperties(properties);
										cache = properties;
									}
									button.bHeadlessMode = properties.bHeadlessMode[1];
								}
							}
							window.Repaint(true);
						}, flags: buttonsBar.config.bIconMode ? MF_GRAYED : MF_STRING
					});
					menu.newCheckMenuLast(() => { return arrKeys.every((key) => !Object.hasOwn(buttonsBar.buttons[key], 'bHeadlessMode') || buttonsBar.buttons[key].isHeadlessMode()); });
				}
			});
			menu.newSeparator(subMenu);
			menu.newEntry({
				menuName: subMenu, entryText: 'Restore every button', func: () => {
					buttonsBar.listKeys.forEach((arrKeys) => {
						if (arrKeys.some((key) => Object.hasOwn(buttonsBar.buttons[key].buttonsProperties, 'bHeadlessMode'))) {
							for (let key of arrKeys) {
								const button = buttonsBar.buttons[key];
								const properties = button.buttonsProperties;
								if (Object.hasOwn(properties, 'bHeadlessMode')) {
									button.bHeadlessMode = properties.bHeadlessMode[1] = false;
									overwriteProperties(properties);
								}
							}
						}
					});
					window.Repaint(true);
				}, flags: buttonsBar.config.bIconMode ? MF_GRAYED : MF_STRING
			});
		}
	}
	menu.newSeparator();
	createBackgroundMenu.call(background, { menuName: 'Background' }, menu, { nameColors: true });
	menu.newSeparator();
	{
		const subMenu = menu.newMenu('Other settings');
		menu.newEntry({
			menuName: subMenu, entryText: 'Asynchronous loading (startup)', func: () => {
				barProperties.bLoadAsync[1] = !barProperties.bLoadAsync[1];
				overwriteProperties(barProperties);
			}
		});
		menu.newCheckMenuLast(() => barProperties.bLoadAsync[1]);
	}
	menu.newSeparator();
	{
		const subMenu = menu.newMenu('Updates');
		menu.newEntry({
			menuName: subMenu, entryText: 'Automatically check for updates', func: () => {
				barProperties.bAutoUpdateCheck[1] = !barProperties.bAutoUpdateCheck[1];
				overwriteProperties(barProperties);
				if (barProperties.bAutoUpdateCheck[1]) {
					if (typeof checkUpdate === 'undefined') { include('..\\..\\helpers\\helpers_xxx_web_update.js'); }
					checkUpdate({ bDownload: globSettings.bAutoUpdateDownload, bOpenWeb: globSettings.bAutoUpdateOpenWeb, bDisableWarning: false });
				}
			}
		});
		menu.newCheckMenuLast(() => barProperties.bAutoUpdateCheck[1]);
		menu.newSeparator(subMenu);
		menu.newEntry({
			menuName: subMenu, entryText: 'Check for updates...', func: () => {
				if (typeof checkUpdate === 'undefined') { include('..\\..\\helpers\\helpers_xxx_web_update.js'); }
				checkUpdate({ bDownload: globSettings.bAutoUpdateDownload, bOpenWeb: globSettings.bAutoUpdateOpenWeb, bDisableWarning: false })
					.then((result) => {
						if (!result) { fb.ShowPopupMessage('No updates found.', window.FullPanelName + ': Update check'); }
					});
			}
		});
	}
	menu.newSeparator();
	{
		const subMenu = menu.newMenu('Help');
		menu.newEntry({
			menuName: subMenu, entryText: 'Toolbar', func: () => {
				const readmePath = folders.xxx + 'helpers\\readme\\toolbar.txt';
				const readme = _open(readmePath, utf8);
				if (readme.length) { fb.ShowPopupMessage(readme, 'Toolbar'); }
			}
		});
		if (buttonsBar.readmeList) {
			// Process
			menu.newSeparator(subMenu);
			menu.findOrNewMenu('Settings, Tags and Queries', subMenu);
			menu.newSeparator(subMenu);
			Object.keys(buttonsBar.readmeList).forEach((fileName) => {
				const readmeFile = Object.hasOwn(buttonsBar.readmeList, fileName) ? buttonsBar.readmeList[fileName] : '';
				if (!readmeFile.length || !_isFile(folders.xxx + 'helpers\\readme\\' + readmeFile)) { return; }
				let subMenuFolder = subCategories.find((folder) => fileName.includes(folder)) || (fileName.endsWith('.js') ? 'Others' : 'Settings, Tags and Queries');
				subMenuFolder = parseSubMenuFolder(subMenuFolder);
				subMenuFolder = menu.findOrNewMenu(subMenuFolder, subMenu);
				const entryText = fileName.replace('buttons_', '');
				menu.newEntry({
					menuName: subMenuFolder, entryText, func: () => {
						if (_isFile(folders.xxx + 'helpers\\readme\\' + readmeFile)) {
							fb.ShowPopupMessage(_open(folders.xxx + 'helpers\\readme\\' + readmeFile, utf8), readmeFile);
						}
					}
				});
			});
		}
	}
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Share UI settings...', func: () => {
			const keys = ['Colors', 'Size and placement'];
			const answer = WshShell.Popup('Share current UI settings with other panels?\nSettings which will be copied:\n\n' + keys.join(', '), 0, window.FullPanelName + ': Toolbar', popup.question + popup.yes_no);
			if (answer === popup.yes) {
				const obj = clone(barProperties);
				window.NotifyOthers(window.ScriptInfo.Name + ': share UI settings', obj);
			}
		}
	});
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Open buttons file...', func: () => {
			_explorer(folders.data + barProperties.name[1] + '.json');
		}
	});
	return menu;
}

function onRbtnUpImportSettings(properties = this.properties || {}) {
	const menu = new _menu();
	menu.newEntry({ entryText: 'Panel menu: ' + window.Name, flags: MF_GRAYED });
	menu.newEntry({ entryText: 'Version: ' + window.ScriptInfo.Version, flags: MF_GRAYED });
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Export panel settings...', func: () => {
			exportSettings(
				properties,
				[
					properties.name[1] + '.json',
					Object.hasOwn(buttonsBar.buttons, 'ListenBrainz Tools') ? 'listenbrainz_*.json' : '',
					...(Object.hasOwn(buttonsBar.buttons, 'Playlist Tools') ? ['playlistTools_*.json', 'check_library_tags_exclusion.json'] : ['']),
					/* global sbd:readable */
					typeof sbd !== 'undefined'
						? Object.keys(buttonsBar.buttons).some((key) => key.startsWith(sbd.name)) ? 'musicmap_*.json' : ''
						: '',
					Object.hasOwn(buttonsBar.buttons, 'Output device priority') ? 'devices*.json' : '',
					Object.hasOwn(buttonsBar.buttons, 'Fingerprint Tools') ? 'fpChromaprintReverseMap*.json' : '',
				],
				window.ScriptInfo.Name
			);
		}
	});
	menu.newEntry({
		entryText: 'Import panel settings...', func: () => {
			const dataPaths = new Set();
			importSettings(
				{
					onLoadSettings: (settings, bFound, panelName) => { // eslint-disable-line no-unused-vars
						if (settings) {
							[
								settings.name[1] + '.json',
								'listenbrainz_*.json',
								'playlistTools_*.json',
								'listenbrainz_*.json',
								'check_library_tags_exclusion*.json',
								'musicmap_*.json',
								'devices*.json',
								'fpChromaprintReverseMap*.json'
							].forEach((mask) => dataPaths.add(mask));
							console.log(panelName + ': importing data files\n\t ' + [...dataPaths].join('\n\t '));
							return true;
						}
						return false;
					},
					onUnzipData: (importPath, panelName) => { // eslint-disable-line no-unused-vars
						return getFiles(importPath, new Set(['.json']))
							.map((file) => {
								const newFile = [...dataPaths]
									.some((mask) => utils.PathWildcardMatch(mask, file.replace(importPath, '')))
									? file.replace(importPath, folders.data)
									: '';
								if (newFile) {
									dataPaths.delete(newFile);
									return _moveFile(file, newFile);
								}
								return false;
							})
							.every(Boolean);
					}
				},
				properties,
				window.ScriptInfo.Name
			);
		}
	});
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Share UI settings...', func: () => {
			createButtonsMenu().btn_up(0, 0, void (0), 'Share UI settings...');
		}
	});
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Configure panel...', func: () => window.ShowConfigureV2()
	});
	menu.newEntry({
		entryText: 'Panel properties...', func: () => window.ShowProperties()
	});
	menu.newSeparator();
	{
		const subMenu = menu.newMenu('Updates');
		menu.newEntry({
			menuName: subMenu, entryText: 'Automatically check for updates', func: () => {
				properties.bAutoUpdateCheck[1] = !properties.bAutoUpdateCheck[1];
				overwriteProperties(properties);
				if (properties.bAutoUpdateCheck[1]) {
					if (typeof checkUpdate === 'undefined') { include('..\\..\\helpers\\helpers_xxx_web_update.js'); }
					checkUpdate({ bDownload: globSettings.bAutoUpdateDownload, bOpenWeb: globSettings.bAutoUpdateOpenWeb, bDisableWarning: false });
				}
			}
		});
		menu.newCheckMenuLast(() => properties.bAutoUpdateCheck[1]);
		menu.newSeparator(subMenu);
		menu.newEntry({
			menuName: subMenu, entryText: 'Check for updates...', func: () => {
				if (typeof checkUpdate === 'undefined') { include('..\\..\\helpers\\helpers_xxx_web_update.js'); }
				checkUpdate({ bDownload: globSettings.bAutoUpdateDownload, bOpenWeb: globSettings.bAutoUpdateOpenWeb, bDisableWarning: false })
					.then((result) => {
						if (!result) { fb.ShowPopupMessage('No updates found.', window.FullPanelName + ': Update check'); }
					});
			}
		});
	}
	menu.newSeparator();
	menu.newEntry({
		entryText: 'Reload panel', func: () => window.Reload()
	});
	return menu;
}