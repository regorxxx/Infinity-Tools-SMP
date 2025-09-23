'use strict';
//20/09/25

/*
	Output device priority
	----------------
	Auto-switch according to device priority
 */

/* global barProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, VK_SHIFT:readable, MF_GRAYED:readable, checkCompatible:readable, folders:readable, MF_ENABLED:readable, repeatFn:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, range:readable, isInt:readable, _b:readable */
include('..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, _save:readable, utf8:readable, _jsonParseFileCheck:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\callbacks_xxx.js');
/* global removeEventListenerSelf:readable */

var prefix = 'dp_'; // NOSONAR[global]
var version = '3.0.0'; // NOSONAR[global]

try { window.DefineScript('Output device priority button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars

checkCompatible('1.6.1', 'smp');
checkCompatible('1.4.0', 'fb');

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	bStartup: ['Force device at startup', true, { func: isBoolean }, true],
	bEnabled: ['Auto-device enabled', true, { func: isBoolean }, true],
	refreshRate: ['Check devices every X ms (0 to disable)', 600, { func: isInt, range: [[0, 0], [50, Infinity]] }, 600],
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false],
	bFixPlayback: ['Playback stop fix', true, { func: isBoolean }, true],
	fixInvalidated: ['Output invalidated fix (0 to disable)', 1, { func: isInt, range: [[0, 2]] }, 1],
	fixNoDevice: ['No device fix (-1 to disable)', -1, { func: isInt, eq: [-1, 1, 10, 25, 50] }, -1]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

const devicesFile = folders.data + 'devices.json';
const devicesPriorityFile = folders.data + 'devices_priority.json';

addButton({
	'Output device priority': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Auto-device', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 30 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'Auto-device',
		func: function () {
			const length = 5;
			const file = _isFile(devicesPriorityFile)
				? _jsonParseFileCheck(devicesPriorityFile, 'Priority list', 'Output device priority', utf8)
				: null;
			const priorityList = file || Array.from({ length }, () => { return { name: null, device_id: null }; });
			const menu = new _menu({ onBtnUp: () => devicePriority.priorityList = file || [] });
			menu.newEntry({ entryText: 'Device priority:', func: null, flags: MF_GRAYED });
			menu.newSeparator();
			menu.newEntry({
				entryText: 'Export device list' + (_isFile(devicesFile) ? '\t(overwrite)' : '\t(new)'), func: () => {
					fb.ShowPopupMessage('File is exported at:\n' + devicesFile + '\n\nExport first the device list with all the desired devices connected to use them at a later point (even if the devices are not connected).\n\n\'Set Device X\' menus will only show either currently connected devices or the ones from the exported list.\n\nIn other words, you can only assign devices to the priority list if they are available on the menus. A disconnected device, not available on the exported list, will be shown as \'Not connected device\', with its name at top. Functionality will be the same (for auto-switching purposes) but it will not be on the list of available devices, nor clickable (so you will not be able to set it to another position unless you connect it first).', 'Output device priority');
					const listExport = JSON.parse(fb.GetOutputDevices()); // Reformat with tabs
					if (!_save(devicesFile, JSON.stringify(listExport, null, '\t').replace(/\n/g, '\r\n'))) {
						console.log('Output device priority: file saving failed (' + devicesFile + ')');
					}
				}
			});
			{
				let options;
				const toAdd = [];
				const bFile = _isFile(devicesFile);
				if (bFile) {
					const newDevices = JSON.parse(fb.GetOutputDevices()); // Reformat with tabs
					options = _jsonParseFileCheck(devicesFile, 'Devices list', 'Output device priority', utf8);
					if (options) {
						newDevices.forEach((newDev) => {
							if (!options.some((oldDev) => { return oldDev.device_id === newDev.device_id || oldDev.name === newDev.name; })) {
								toAdd.push(newDev);
							}
						});
					}
				}
				menu.newEntry({
					entryText: 'Add new devices to list' + (bFile ? (toAdd.length ? '' : '\t-no new devices-') : '\t(export first)'), func: () => {
						fb.ShowPopupMessage('File is exported at:\n' + devicesFile + '\n\nAdds any device currently attached to the list if it\'s not present (no duplicates). Option is only available after exporting the list at least once.', 'Output device priority');
						if (!options) { return; }
						toAdd.forEach((newDev) => { options.push(newDev); });
						if (!_save(devicesFile, JSON.stringify(options, null, '\t').replace(/\n/g, '\r\n'))) {
							console.log('Output device priority: file saving failed (' + devicesFile + ')');
						}
						else { console.log('Output device priority: no new devices added.'); }
					}, flags: toAdd.length && bFile ? MF_ENABLED : MF_GRAYED
				});
			}
			menu.newSeparator();
			menu.newEntry({
				entryText: 'Enable Auto-Device', func: () => {
					this.buttonsProperties.bEnabled[1] = !this.buttonsProperties.bEnabled[1];
					overwriteProperties(this.buttonsProperties);
					this.switchActive();
					if (this.buttonsProperties.bEnabled[1]) {
						if (devicePriority.refreshRate !== 0) { devicePriority.refreshFuncId = devicePriority.refreshFunc(); }
						addEventListener('on_output_device_changed', devicePriority.callbackFunc.bind(devicePriority));
					} else {
						if (devicePriority.refreshRate !== 0) { clearInterval(devicePriority.refreshFuncId); }
						removeEventListener('on_output_device_changed', devicePriority.callbackFunc.bind(devicePriority));
					}
				}
			});
			menu.newCheckMenuLast(() => this.buttonsProperties.bEnabled[1]);
			{
				const subMenuName = menu.newMenu('Other settings');
				menu.newEntry({
					menuName: subMenuName,
					entryText: 'Force device on startup', func: () => {
						this.buttonsProperties.bStartup[1] = !this.buttonsProperties.bStartup[1];
						overwriteProperties(this.buttonsProperties);
					}
				});
				menu.newCheckMenuLast(() => this.buttonsProperties.bStartup[1]);
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName,
					entryText: 'Playback stop fix', func: () => {
						this.buttonsProperties.bFixPlayback[1] = !this.buttonsProperties.bFixPlayback[1];
						overwriteProperties(this.buttonsProperties);
						fb.ShowPopupMessage('Workaround for some instances where the output devices throws an error and playback is stopped. Now playback is resumed again.\n\nWorkaround for random instances where playback changes to beginning of track after device switching (foobar bug?). Now playback is forced at cached position after device switching. Multiple retries. Both changes should produce much smoother (and faster) output device switching now.', 'Auto-Device');
					}
				});
				menu.newCheckMenuLast(() => this.buttonsProperties.bFixPlayback[1]);
				{
					const subMenuNameFix = menu.newMenu('Output invalidated fix', subMenuName);
					menu.newEntry({ menuName: subMenuNameFix, entryText: 'Workaround using dummy device:', flags: MF_GRAYED });
					menu.newSeparator(subMenuNameFix);
					const options = [
						{ name: 'No Fix' },
						{ name: 'Null Output' },
						{ name: 'Primary Device' }
					];
					options.forEach((option, i) => {
						menu.newEntry({
							menuName: subMenuNameFix,
							entryText: option.name, func: () => {
								this.buttonsProperties.fixInvalidated[1] = i;
								overwriteProperties(this.buttonsProperties);
								if (this.buttonsProperties.fixInvalidated[1]) {
									fb.ShowPopupMessage('Workaround for some instances where the output devices throws an \'Output invalidated...\' error when disconnecting a Bluetooth device and the device is changed but muted.\n\nThe script tries first to change to a dummy device before switching to the desired device (which seems to fix the problem for some ASIO devices).', 'Auto-Device');
								}
							}
						});
					});
					menu.newCheckMenuLast(() => this.buttonsProperties.fixInvalidated[1], options.length);
				}
				{
					const subMenuNameFix = this.buttonsProperties.fixInvalidated[1]
						? menu.newMenu('No device fix', subMenuName)
						: menu.newMenu('No device fix\t(output invalidated disabled)', subMenuName, MF_GRAYED);
					menu.newEntry({ menuName: subMenuNameFix, entryText: 'Workaround forcing a device every X ms:', flags: MF_GRAYED });
					menu.newSeparator(subMenuNameFix);
					const options = [
						{ name: 'Disabled', val: -1 },
						{ name: 'Aggressive', val: 1 },
						{ name: '10 ms', val: 10 },
						{ name: '25 ms', val: 25 },
						{ name: '50 ms', val: 50 },
					];
					options.forEach((option) => {
						menu.newEntry({
							menuName: subMenuNameFix,
							entryText: option.name, func: () => {
								this.buttonsProperties.fixNoDevice[1] = option.val;
								overwriteProperties(this.buttonsProperties);
								if (this.buttonsProperties.fixNoDevice[1] !== -1) {
									fb.ShowPopupMessage('Workaround for some instances where foobar2000 opens the Preferences\\Playback\\Output window when disconnecting a device since it doesn\'t properly assign a device as fallback.\n\nThe script tries to check devices every X ms and assign a dummy device before switching to the desired device.', 'Auto-Device');
								}
							}
						});
					});
					menu.newCheckMenuLast(() => options.findIndex((o) => o.val === this.buttonsProperties.fixNoDevice[1]), options.length);
				}
			}
			menu.newSeparator();
			const subMenuName = [];
			const options = _isFile(devicesFile)
				? _jsonParseFileCheck(devicesFile, 'Devices list', 'Output device priority', utf8)
				: JSON.parse(fb.GetOutputDevices());
			const optionsName = [];
			range(1, length, 1).forEach((idx) => {
				subMenuName.push(menu.newMenu('Set Device ' + idx));
				const currMenu = subMenuName[idx - 1];
				const currEntry = priorityList[idx - 1];
				const currDev = Object.hasOwn(currEntry, 'name') ? currEntry.name : null;
				const bExclusive = currDev && currDev.includes('exclusive');
				const currDevR = currDev
					? currDev.replace('DS : ', '').replace('Default : ', '').replace('ASIO : ', '').replace(' [Exclusive]', '').replace(' exclusive', '') + (bExclusive ? '\t[exclusive]' : '')
					: '';
				{	// Header
					menu.newEntry({ menuName: currMenu, entryText: 'Current device: ' + (currDev ? currDevR.cut(20) : '-'), func: null, flags: MF_GRAYED });
					menu.newSeparator(currMenu);
				}
				{	// Volume
					const currVol = currDev && Object.hasOwn(currEntry, 'volume') ? currEntry.volume : null;
					menu.newEntry({
						menuName: currMenu, entryText: 'Set default volume' + '\t' + _b(currVol !== null ? 100 + currVol : 'default'), func: () => {
							let input;
							try {
								input = utils.InputBox(window.ID, 'Input volume value (from 0 to 100):\n(Empty to not change volume)', 'Output device priority', currVol !== null ? 100 + currVol : '', true);
								if (input === '') { input = null; }
								if (input !== null) { input = -100 + Math.abs(Number(input)); }
							} catch (e) { return; } // eslint-disable-line no-unused-vars
							if (input === currVol) { return; }
							priorityList[idx - 1].volume = input;
							if (!_save(devicesPriorityFile, JSON.stringify(priorityList, null, '\t').replace(/\n/g, '\r\n'))) {
								console.log('Output device priority: file saving failed (' + devicesPriorityFile + ')');
							}
						}, flags: currDev ? MF_ENABLED : MF_GRAYED
					});
					menu.newSeparator(currMenu);
				}
				{	// Device settings
					const subMenu = menu.newMenu('Device specific settings', currMenu);
					menu.newEntry({
						menuName: subMenu, entryText: 'No pause fix', func: () => {
							fb.ShowPopupMessage('Workaround for devices which restart playback from the beginning when pressing pause button. If active, playback is forced to be paused at the last known playback time value.', 'Auto-Device');
							priorityList[idx - 1].bFixPause = !priorityList[idx - 1].bFixPause;
							if (!_save(devicesPriorityFile, JSON.stringify(priorityList, null, '\t').replace(/\n/g, '\r\n'))) {
								console.log('Output device priority: file saving failed (' + devicesPriorityFile + ')');
							}
						}, flags: currDev ? MF_ENABLED : MF_GRAYED
					});
					menu.newCheckMenuLast(() => !!priorityList[idx - 1].bFixPause);
					menu.newSeparator(currMenu);
				}
				{	// Device list
					[{ name: 'None' }, { name: 'Not connected device' }, { name: 'sep' }, ...options].forEach((entry, index) => {
						// Create names for all entries
						if (menu.isSeparator(entry)) {
							menu.newSeparator(currMenu);
							optionsName.push(entry.name);
						}
						else {
							let deviceName = entry.name
								.replace('Default : ', '');
							const bExclusive = deviceName.includes('exclusive');
							deviceName = deviceName.replace(' [exclusive]', '').replace(' exclusive', '');
							deviceName = deviceName.cut(40);
							if (bExclusive) { deviceName += '\t[exclusive]'; }
							// Entries
							optionsName.push(deviceName);
							menu.newEntry({
								menuName: currMenu, entryText: deviceName, func: () => {
									priorityList[idx - 1] = entry.name !== 'None'
										? { name: entry.name, device_id: entry.device_id, output_id: entry.output_id }
										: { name: null, device_id: null, output_id: null };
									if (!_save(devicesPriorityFile, JSON.stringify(priorityList, null, '\t').replace(/\n/g, '\r\n'))) {
										console.log('Output device priority: file saving failed (' + devicesPriorityFile + ')');
									}
								}, flags: index === 1 ? MF_GRAYED : MF_ENABLED
							});
						}
					});
					menu.newCheckMenu(currMenu, optionsName[0], optionsName[optionsName.length - 1], () => {
						const currOption = Object.hasOwn(currEntry, 'name') ? currEntry.name : null;
						const id = currOption && currOption.length ? options.findIndex((item) => { return item.name === currOption; }) : 0;
						return (id !== -1 ? (id !== 0 ? id + 2 : 0) : 1);
					});
				}
			});
			menu.btn_up(this.currX, this.currY + this.currH);
		},
		description: function () {
			let info = 'Set output device priority for auto-switching.';
			// Modifiers
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1];
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift to bypass auto-switch on device change)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.headphones,
		update: { scriptName: 'Device-Priority-SMP', version }
	}),
});

// Default state
buttonsBar.buttons['Output device priority'].active = buttonsBar.buttons['Output device priority'].buttonsProperties.bEnabled[1];
// Helpers
const devicePriority = {
	nowPlaying: { time: -1, plsIdx: -1, itemIdx: -1, handle: null, bFixing: false, pauseTime: Infinity },
	bOmitCallback: false,
	referenceDevices: fb.GetOutputDevices(),
	refreshRate: buttonsBar.buttons['Output device priority'].buttonsProperties.refreshRate[1],
	refreshFunc: repeatFn(function () {
		const newDevices = fb.GetOutputDevices();
		if (newDevices !== this.referenceDevices) { cacheNowPlaying(); outputDevicePriority(); }
	}, buttonsBar.buttons['Output device priority'].buttonsProperties.refreshRate[1]),
	refreshFuncId: null,
	callbackFunc: function () {
		if (!this.properties.bEnabled[1]) { removeEventListenerSelf(); }
		if (this.bOmitCallback) { this.bOmitCallback = false; return; }
		cacheNowPlaying();
		this.manualDevice = null;
		outputDevicePriority();
	},
	isUserPaused: function () {
		return (Date.now() - this.nowPlaying.pauseTime) > 1000;
	},
	pauseFixFunc: function (reason) {
		if (!this.bFixPause) { removeEventListenerSelf(); }
		if (!this.properties.bEnabled[1]) { return; }
		if (reason !== 1) { return; }
		if (fb.IsPlaying) {
			const nowPlaying = fb.GetNowPlaying();
			if (!nowPlaying) { setTimeout(this.pauseFixFunc.bind(this), 60, reason); }
			else if (this.nowPlaying.handle && this.nowPlaying.handle.RawPath === nowPlaying.RawPath) {
				if (!fb.IsPaused) { fb.Pause(); }
				setTimeout(() => {
					fb.PlaybackTime = this.nowPlaying.time;
					if (!fb.IsPaused) { fb.Pause(); }
				}, 60);
			}
		}
	},
	bFixPause: false,
	properties: buttonsBar.buttons['Output device priority'].buttonsProperties,
	manualDevice: null,
	priorityList: _isFile(devicesPriorityFile)
		? _jsonParseFileCheck(devicesPriorityFile, 'Priority list', 'Output device priority', utf8) || []
		: []
};
function outputDevicePriority() {
	if (!devicePriority.properties.bEnabled[1]) { return; }
	const newDevices = fb.GetOutputDevices();
	if (utils.IsKeyPressed(VK_SHIFT)) {
		const currDevices = JSON.parse(newDevices);
		const manualDevice = currDevices.find((dev) => { return dev.active; });
		if (manualDevice) { devicePriority.manualDevice = manualDevice.name; }
		return;
	} else if (devicePriority.manualDevice !== null) {
		const oldIds = new Set(JSON.parse(devicePriority.referenceDevices).map((dev) => dev.device_id));
		const newIds = new Set(JSON.parse(newDevices).map((dev) => dev.device_id));
		if (oldIds.isEqual(newIds)) { return; }
	}
	if (!devicePriority.priorityList.length) { return; }
	devicePriority.referenceDevices = newDevices;
	const devices = JSON.parse(devicePriority.referenceDevices);
	const primOut = devicePriority.properties.fixInvalidated[1]
		? devicePriority.properties.fixInvalidated[1] === 1
			? devices.find((dev) => dev.name === 'Null Output')
			: devices.find((dev) => dev.name === 'Default : Primary Sound Driver')
		: void (0);
	let bDone = false;
	for (let device of devicePriority.priorityList) {
		if (typeof device !== 'object' || !Object.hasOwn(device, 'name')) { continue; }
		const idx = devices.findIndex((dev) => (dev.name === device.name || dev.device_id === device.device_id) && (!device.output_id || dev.output_id === device.output_id));
		if (idx !== -1) {
			const currDevice = devices[idx];
			const old = devicePriority.bFixPause;
			devicePriority.bFixPause = device.bFixPause;
			if (old !== devicePriority.bFixPause) {
				if (devicePriority.bFixPause) {
					addEventListener('on_playback_starting', devicePriority.pauseFixFunc.bind(devicePriority));
					addEventListener('on_playback_time', cacheNowPlaying);
				} else {
					removeEventListener('on_playback_starting', devicePriority.pauseFixFunc.bind(devicePriority));
					removeEventListener('on_playback_time', cacheNowPlaying);
				}
			}
			if (currDevice.active) { bDone = true; break; }
			devicePriority.bOmitCallback = true;
			if (primOut) { fb.SetOutputDevice(primOut.output_id, primOut.device_id); }
			fb.SetOutputDevice(currDevice.output_id, currDevice.device_id);
			console.log('Auto-Switch output device to: ', device.name, device.device_id);
			if (Object.hasOwn(device, 'volume') && device.volume !== null && fb.Volume !== device.volume) {
				fb.Volume = device.volume;
				console.log('Auto-Switch volume to: ' + (100 + fb.Volume));
			}
			// Try to fix playback
			if (devicePriority.properties.bFixPlayback[1]) {
				if (!devicePriority.isUserPaused() && fb.IsPaused) { fb.PlayOrPause(); } // Pausing on power off
				devicePriority.nowPlaying.bFixing = true;
				Promise.allSettled(
					[50, 100, 150, 200, 250, 300, 400, 600, 800, 1000, 1500, 2000].map((ms, i) => { // Playback restarted
						return new Promise((resolve) => {
							setTimeout(() => {
								fixNowPlaying(i + 1);
								resolve();
							}, ms);
						});
					})
				).then(() => {
					devicePriority.nowPlaying.bFixing = false;
				});
			}
			// Try to fix popup no device
			if (primOut && devicePriority.properties.fixNoDevice[1] > 0) {
				setTimeout(() => {
					const now = Date.now();
					const id = setInterval(() => {
						if (Date.now() - now > 2000) { clearInterval(id); }
						const devices = JSON.parse(fb.GetOutputDevices());
						if (devices.every((dev) => !dev.active)) {
							fb.SetOutputDevice(primOut.output_id, primOut.device_id);
							console.log('Output device priority: fixed no device.');
							clearInterval(id);
						}
					}, devicePriority.properties.fixNoDevice[1]);
				}, devicePriority.properties.fixNoDevice[1] <= 10 ? 10 : 25);
			}
			bDone = true;
			break;
		}
	}
	if (!bDone) { console.log('Output device priority: No devices matched the priority list.'); }
}

function cacheNowPlaying() {
	if (fb.IsPlaying) {
		if (!devicePriority.nowPlaying.bFixing) {
			const playingItem = plman.GetPlayingItemLocation();
			devicePriority.nowPlaying.time = -1;
			devicePriority.nowPlaying.plsIdx = -1;
			devicePriority.nowPlaying.itemIdx = -1;
			devicePriority.nowPlaying.handle = fb.GetNowPlaying();
			if (devicePriority.nowPlaying.handle && playingItem.IsValid) {
				devicePriority.nowPlaying.plsIdx = playingItem.PlaylistIndex;
				devicePriority.nowPlaying.itemIdx = playingItem.PlaylistItemIndex;
				devicePriority.nowPlaying.time = fb.PlaybackTime < Number.MAX_SAFE_INTEGER ? fb.PlaybackTime : 0;
				if (!fb.IsPaused && devicePriority.properties.bFixPlayback[1]) {
					devicePriority.nowPlaying.pauseTime = Infinity;
				}
			}
		}
	}
}

function fixNowPlaying(i) {
	// Workaround for Bluetooth devices pausing on power off
	if (!devicePriority.isUserPaused() && fb.IsPaused) { fb.PlayOrPause(); }
	// It was playing and something went wrong (like device not available)
	if ((!fb.IsPlaying || (fb.PlaybackTime < Number.MAX_SAFE_INTEGER ? fb.PlaybackTime : 0) < devicePriority.nowPlaying.time) && devicePriority.nowPlaying.handle !== null) {
		if (devicePriority.nowPlaying.plsIdx !== -1 && devicePriority.nowPlaying.plsIdx < plman.PlaylistCount) {
			const cache = { plsIdx: plman.ActivePlaylist, itemIdx: plman.GetPlaylistFocusItemIndex(plman.ActivePlaylist) };
			let bChanged = false;
			if (devicePriority.nowPlaying.plsIdx !== plman.ActivePlaylist) {
				plman.ActivePlaylist = devicePriority.nowPlaying.plsIdx;
				plman.SetPlaylistFocusItem(devicePriority.nowPlaying.plsIdx, devicePriority.nowPlaying.itemIdx);
				bChanged = true;
			} else if (cache.itemIdx !== devicePriority.nowPlaying.itemIdx) {
				plman.SetPlaylistFocusItem(devicePriority.nowPlaying.plsIdx, devicePriority.nowPlaying.itemIdx);
				bChanged = true;
			}
			fb.PlaybackTime = devicePriority.nowPlaying.time;
			if (!fb.IsPlaying) { fb.Play(); }
			if (bChanged) {
				plman.ActivePlaylist = cache.plsIdx;
				plman.SetPlaylistFocusItem(cache.plsIdx, cache.itemIdx);
			}
			console.log('Output device priority: fixed playback at ' + i + 'º retry.');
		}
	}
}

// Startup
if (devicePriority.properties.bEnabled[1]) {
	// Add callback
	addEventListener('on_output_device_changed', devicePriority.callbackFunc.bind(devicePriority));
	// Check device on startup
	if (devicePriority.properties.bStartup[1]) { outputDevicePriority(); }
	if (devicePriority.properties.bFixPlayback[1]) {
		if (fb.IsPlaying && fb.IsPaused) { devicePriority.nowPlaying.pauseTime = Date.now(); }
		addEventListener('on_playback_pause', (state) => {
			devicePriority.nowPlaying.pauseTime = state
				? Date.now()
				: Infinity;
		});
		addEventListener('on_playback_new_track', () => {
			devicePriority.nowPlaying.pauseTime = Infinity;
		});
		addEventListener('on_playback_stop', () => {
			devicePriority.nowPlaying.pauseTime = Infinity;
		});
	}
	// Listen to new devices connection
	if (devicePriority.refreshRate !== 0) { devicePriority.refreshFuncId = devicePriority.refreshFunc(); }
}