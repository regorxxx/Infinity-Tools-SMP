'use strict';
//08/10/25

/* exported AutoBackup */

include('..\\..\\helpers\\helpers_xxx.js');
/* global doOnce:readable, folders:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global round:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _createFolder:readable, getFiles:readable, _recycleFile:readable, getPathMeta:readable, created:readable, _isFile:readable, _isFolder:readable, _deleteFile:readable, _deleteFolder:readable, _copyFile:readable, _copyFolder:readable */
include('..\\..\\helpers\\helpers_xxx_file_zip.js');
/* global _zip:readable */

function AutoBackup({
	iBackups = 20,
	backupsMaxSize = 1024 * 1024 * 5000,
	bAsync = true,
	iPlaying = 60 * 60 * 1000,
	iStop = 60 * 60 * 1000,
	iInterval = 10 * 60 * 1000,
	iStart = 10 * 60 * 1000,
	iTrack = 0,
	iTrackSave = 0,
	iClose = 20,
	iOldDay = Math.min(Math.max(Math.round(iBackups / 4), 1), iBackups),
	iOldWeek = Math.min(Math.max(Math.round(iBackups / 5), 1), iBackups),
	iOldMonth = Math.min(Math.max(Math.round(iBackups / 10), 1), iBackups),
	iOldYear = Math.min(Math.max(Math.round(iBackups / 10), 1), iBackups),
	minDriveSize = backupsMaxSize * 2,
	outputPath, files, backupFormat,
	zipArgs = ''
} = {}) {
	this.addEventListeners = () => {
		this.listeners = [
			addEventListener('on_playback_new_track', () => {
				if (!this.counter.timePlaying) { this.counter.timePlaying = Date.now(); }
				else { this.increaseTrackCounter(); }
			}),
			addEventListener('on_playback_stop', (reason) => {
				if (reason === 0 || reason === 1) {
					this.counter.timePlaying = 0;
					if (!this.counter.timePaused) { this.counter.timePaused = Date.now(); }
				}
			}),
			addEventListener('on_playback_pause', (state) => {
				if (state && !this.counter.timePaused) { this.counter.timePaused = Date.now(); }
				if (!state && this.counter.timePaused) {
					if (this.counter.timePlaying) { this.counter.timePlaying = Date.now() - (this.counter.timePaused - this.counter.timePlaying); }
					this.counter.timePaused = 0;
				}
			}),
			addEventListener('on_script_unload', () => {
				if (this.active && this.iClose) {
					if (!this.checkDriveSpace(false)) { return; }
					this.backup({ reason: 'unload', bAsync: true, timeout: this.iClose });
				}
			}),
		];
	};

	this.init = () => {
		this.addEventListeners();
		this.id = setInterval(this.backupDebounced, 2500);
		this.active = true;
		this.counter.timeInit = Date.now();
	};

	this.clear = () => {
		this.listeners.forEach((listener) => removeEventListener(listener.event, void (0), listener.id));
		if (this.id !== null) {
			clearInterval(this.id);
			this.id = null;
		}
		this.counter.lastBackup = 0;
		for (let key in this.counter) {
			this.counter[key] = 0;
		}
	};

	this.saveFooConfig = (now) => {
		if (typeof now !== 'undefined') { this.counter.lastSave = now; }
		try { fb.RunMainMenuCommand('Save configuration'); } catch (e) { console.log(e); return false; }
		return true;
	};

	this.getFreeSpace = () => {
		const driveMeta = getPathMeta(fb.ProfilePath, 'B');
		return driveMeta.size.free || 0;
	};

	this.increaseTrackCounter = () => {
		if (this.counter.savePlayedTracks < 0) { this.counter.savePlayedTracks = 0; }
		if (this.counter.backupPlayedTracks < 0) { this.counter.backupPlayedTracks = 0; }
		this.counter.savePlayedTracks++;
		this.counter.backupPlayedTracks++;
	};

	this.checkDriveSpace = (bShowPopup = true) => {
		if (this.minDriveSize) {
			const space = this.getFreeSpace();
			if (space < this.minDriveSize) {
				bShowPopup && doOnce('AutoBackup: full drive',
					() => {
						fb.ShowPopupMessage(
							'Free drive space is under the minimum threshold:\n' +
							round(space / 1024 ** 2, 1) + ' MB < ' + round(this.minDriveSize / 1024 ** 2, 1) + ' MB'
							, 'AutoBackup'
						);
					})();
				return false;
			}
		}
		return true;
	};

	this.popFilesByDate = (files, key, toPop) => {
		const len = files.length;
		const now = new Date();
		const thisYear = now.getUTCFullYear();
		const thisMonth = now.getUTCMonth();
		const thisDay = now.getUTCDate();
		const thisWeek = Math.floor(thisDay / 7);
		for (let i = 0, out = 0, fileYear, fileMonth, fileWeek, fileDay, bDone; i < (len - out); i++) {
			if (out >= len || out >= toPop) { break; }
			const file = files[i];
			fileYear = file.created.getUTCFullYear();
			fileMonth = file.created.getUTCMonth();
			fileDay = file.created.getUTCDate();
			fileWeek = Math.floor(fileDay / 7);
			switch (key.toLowerCase()) {
				case 'year': {
					if (thisYear !== fileYear) {
						bDone = files.splice(i, 1).length === 1;
					}
					break;
				}
				case 'month': {
					if (thisYear === fileYear && thisMonth !== fileMonth) {
						bDone = files.splice(i, 1).length === 1;
					}
					break;
				}
				case 'week': {
					if (thisYear === fileYear && thisMonth === fileMonth && thisWeek !== fileWeek) {
						bDone = files.splice(i, 1).length === 1;
					}
					break;
				}
				case 'day': {
					if (thisYear === fileYear && thisMonth === fileMonth && thisWeek === fileWeek && thisDay !== fileDay) {
						bDone = files.splice(i, 1).length === 1;
					}
					break;
				}
			}
			if (bDone) { i--; out++; } //NOSONAR
		}
		return files;
	};

	this.popFilesByDateKey = (files, key) => {
		let toPop;
		switch (key.toLowerCase()) {
			case 'year': toPop = this.iOldYear; break;
			case 'month': toPop = this.iOldMonth; break;
			case 'week': toPop = this.iOldWeek; break;
			case 'day': toPop = this.iOldDay; break;
		}
		return this.popFilesByDate(files, key, toPop);
	};

	this.deleteOldFiles = (iBackups, backupsMaxSize, folderPath) => {
		if (iBackups <= 0 && backupsMaxSize <= 0) { return false; }
		let files = getFiles(folderPath, new Set(['.zip']))
			.filter((path) => path.startsWith(fb.ProfilePath + outputPath))
			.map((path) => {
				return { path, created: new Date(created(path)), size: backupsMaxSize > 0 ? utils.GetFileSize(path) : 0 };
			})
			.sort((a, b) => b.created - a.created);
		let totalFiles = iBackups > 0 ? files.length : null;
		let totalSize = backupsMaxSize > 0 ? files.reduce((acc, curr) => acc + curr.size, 0) : null;
		// Take out files from specific date ranges from rotation
		files = ['year', 'month', 'week', 'day'].reduce((acc, key) => this.popFilesByDateKey(acc, key), files);
		const deleteBackupFile = () => {
			const toDelete = files.pop();
			if (toDelete) {
				_recycleFile(toDelete.path, true);
				totalFiles--;
				totalSize -= toDelete.size;
				return true;
			}
			return false;
		};
		// Delete by number
		if (iBackups > 0 && totalFiles > 0) {
			while (totalFiles >= iBackups) {
				if (!deleteBackupFile()) { break; }
			}
		}
		// Delete by file size
		if (backupsMaxSize > 0 && totalFiles > 0) {
			while (totalSize >= backupsMaxSize) {
				if (!deleteBackupFile()) { break; }
			}
		}
		return true;
	};

	this.createTempFile = (path, tempPath) => {
		if (_isFile(path)) {
			_deleteFile(tempPath);
			_copyFile(path, tempPath);
			return true;
		} else if (_isFolder(path)) {
			_deleteFolder(tempPath);
			_copyFolder(path, tempPath);
			return true;
		}
		return false;
	};

	this.deleteTempFiles = (fileMask, idx) => {
		fileMask.forEach((path, i) => {
			if (Array.isArray(path)) { this.deleteTempFiles(path, i); }
			else if (this.files[typeof idx === 'undefined' ? i : idx].bCopy && path.startsWith(folders.temp)) {
				if (_isFile(path)) { _deleteFile(path, true); }
				else if (_isFolder(path)) { _deleteFolder(path, true); }
			}
		});
	};

	this.backup = ({ iBackups = this.iBackups, backupsMaxSize = this.backupsMaxSize, bAsync = this.bAsync, outputPath = this.outputPath, reason = '', timeout = 0 } = {}) => {
		if (timeout) { bAsync = true; }
		let test = !bAsync ? new FbProfiler('AutoBackup') : null;
		const folderPath = fb.ProfilePath + outputPath.split('\\').slice(0, -1).join('\\') + '\\' || '';
		_createFolder(folderPath);
		this.deleteOldFiles(iBackups, backupsMaxSize, folderPath);
		if (reason.toLowerCase() !== 'forced' && !this.checkDriveSpace()) { return false; }
		const fileMask = this.files.map((e) => e.path);
		const backupFormat = this.backupFormat;
		const zipName = backupFormat.reduce(
			(acc, curr) => acc.replace(new RegExp(curr.regex, curr.flag), curr.replacer),
			new Date().toISOString().split('.')[0]
		);
		// Create a copy for files which may be blocked under foobar v2
		fileMask.forEach((path, i) => {
			if (this.files[i].bCopy) {
				if (this.createTempFile(fb.ProfilePath + path, folders.temp + path)) {
					fileMask[i] = folders.temp + path;
				} else if (path.includes('*')) {
					fileMask[i] = utils.Glob(fb.ProfilePath + path, 0).map((p) => {
						this.createTempFile(p, folders.temp + p.replace(fb.ProfilePath, ''));
						return folders.temp + p.replace(fb.ProfilePath, '');
					});
				}
			}
		});
		_zip(fileMask.flat(Infinity), fb.ProfilePath + outputPath + zipName + '.zip', bAsync, fb.ProfilePath, timeout, this.zipArgs || '');
		if (timeout) {
			console.log(this.name + ' (' + reason + '): Scheduled backup of items on ' + timeout + ' seconds to\n\t ' + outputPath + zipName); // DEBUG
		} else {
			console.log(this.name + ' (' + reason + '): Backed up items to\n\t ' + outputPath + zipName); // DEBUG
		}
		// Delete the file copies
		if (!bAsync) {
			this.deleteTempFiles(fileMask);
			test.Print(reason);
		} else if (reason !== 'unload') {
			const id = setInterval(() => {
				if (_isFile(fb.ProfilePath + outputPath + zipName + '.zip')) {
					this.deleteTempFiles(fileMask);
					clearInterval(id);
				}
			}, this.backupMinInterval);
		}
		return true;
	};
	this.backupDebounced = () => {
		if (!this.active) { return false; }
		const now = Date.now();
		// Save routines
		let bSaved = false;
		let bDecrTracks = false;
		if ((now - this.counter.lastSave) >= this.backupMinInterval) {
			if (this.iTrackSave && this.counter.timePlaying && this.counter.savePlayedTracks >= this.iTrackSave) {
				this.saveFooConfig(now);
				this.counter.savePlayedTracks -= this.iTrackSave;
				bDecrTracks = bSaved = true;
			}
		}
		// Backup routines
		if ((now - this.counter.lastBackup) >= this.backupMinInterval) {
			// Run every X minutes should only fire when there are no other conditions or
			// if they have fired at least once after startup. No configuration changes
			// are expected if the program was not used at all... (ignoring corner cases)
			const bAllowInterval = !(this.iPlaying || this.iTrack || this.iStart) || this.counter.lastBackup;
			if (this.iPlaying && this.counter.timePlaying && (now - this.counter.timePlaying) >= this.iPlaying) {
				if (!bSaved) { this.saveFooConfig(now); }
				setTimeout(() => this.backup({ reason: 'playing' }), this.configTimeout);
				this.counter.lastBackup = now;
				this.counter.timePlaying += this.iPlaying;
			} else if (this.iStop && this.counter.timePaused && (now - this.counter.timePaused) >= this.iStop) {
				if (!bSaved) { this.saveFooConfig(now); }
				setTimeout(() => this.backup({ reason: 'paused' }), this.configTimeout);
				this.counter.lastBackup = now;
				this.counter.timePaused = 0;
			} else if (this.iTrack && this.counter.timePlaying && this.counter.backupPlayedTracks >= this.iTrack) {
				if (!bSaved) { this.saveFooConfig(now); }
				setTimeout(() => this.backup({ reason: 'tracks' }), this.configTimeout);
				this.counter.lastBackup = now;
				if (!bDecrTracks) { this.counter.backupPlayedTracks -= this.iTrack; }
			} else if (this.iStart && this.counter.timeInit && (now - this.counter.timeInit) >= this.iStart) {
				if (!bSaved) { this.saveFooConfig(now); }
				setTimeout(() => this.backup({ reason: 'startup' }), this.configTimeout);
				this.counter.lastBackup = now;
				this.counter.timeInit = 0;
			} else if (this.iInterval && bAllowInterval && (now - this.counter.lastBackup) >= this.iInterval) {
				if (!bSaved) { this.saveFooConfig(now); }
				setTimeout(() => this.backup({ reason: 'interval' }), this.configTimeout);
				this.counter.lastBackup = now;
			}
		}
		return this.counter.lastBackup === now;
	};
	this.forceBackup = () => {
		return this.saveFooConfig() && setTimeout(() => this.backup({ reason: 'forced' }), this.configTimeout);
	};
	// Internals
	this.counter = {
		savePlayedTracks: 0,
		backupPlayedTracks: 0,
		timePlaying: 0,
		timePaused: 0,
		timeInit: 0,
		lastBackup: 0,
		lastSave: 0,
	};
	this.id = null;
	this.listeners = [];
	this.active = true;
	this.name = 'AutoBackup-SMP';
	this.backupMinInterval = 40000;
	this.configTimeout = 2000;
	// Vars
	this.iBackups = iBackups;
	this.backupsMaxSize = backupsMaxSize;
	this.bAsync = bAsync;
	this.outputPath = outputPath;
	this.files = files;
	this.backupFormat = backupFormat;
	this.iPlaying = iPlaying;
	this.iStop = iStop;
	this.iInterval = iInterval;
	this.iStart = iStart;
	this.iTrack = iTrack;
	this.iTrackSave = iTrackSave;
	this.iClose = iClose;
	this.minDriveSize = minDriveSize;
	this.iOldYear = iOldYear;
	this.iOldMonth = iOldMonth;
	this.iOldWeek = iOldWeek;
	this.iOldDay = iOldDay;
	this.zipArgs = zipArgs || '';

	this.init();
}