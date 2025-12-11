# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [1.0.0](#100---2025-11-19)

## [Unreleased][]
### Added
- UI: experimental buttons alignment settings at toolbar contextual menu (R. Click). By default it uses 'Left' (previous behaviour). See [Issue 3](https://github.com/regorxxx/Infinity-Tools-SMP/issues/3).
- UI: added button spacers, with a size of 20 px scaled with DPI. They can be added the same than separators, at 'Add button' submenu. Multiple spacers can also be stacked to achieve desired width. See [Issue 3](https://github.com/regorxxx/Infinity-Tools-SMP/issues/3).
- UI: added icon outline setting, by default set to 0 px (disabled). Can be changed at 'Toolbar menu\Size and placement'.
- UI: added toolbar transparency setting, which controls the panel background (independently of the Buttons setting). Can be changed at 'Toolbar menu\Colors'. Note it only applies when a bar color has been set or if the parent window is not transparent (which uses the default CUI/DUI color).
- UI: added buttons' border transparency setting. Can be changed at 'Toolbar menu\Colors'.
- Playlist Tools\Pools: modified some of the default presets and added new ones.
- Display TF button: actions support for [Library-Tree-SMP](https://github.com/regorxxx/Library-Tree-SMP).
- Display TF button: new default presets.
- Buttons: new 'Playback controls' buttons submenu, with several new buttons related to playback to replace UI buttons: play, pause, shuffle, love tracks, etc. See [Issue 3](https://github.com/regorxxx/Infinity-Tools-SMP/issues/3).
- Buttons: added new presets as examples on toolbars on first init, aimed for playback control. See [Issue 3](https://github.com/regorxxx/Infinity-Tools-SMP/issues/3).
- Wrapped: exposed track album imgs processing timeout as setting.
- Wrapped: exposed logging settings.
### Changed
- UI: adjusted default colors to foobar2000's color settings and dark/light mode of toolbar when there is not button added yet.
- Playlist Tools: cut max entry length at 40 chars (previously 30).
- Playlist Tools: cleanup of first popup readme. Macros readme is no longer shown on first init.
- Wrapped: now supports locale file tags for playcount by region and city, if available; this data is merged to the one provided by [World-Map-SMP](github.com/regorxxx/World-Map-SMP). Uses the locale tag found at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globTags.json', by default 'LOCALE LAST.FM' (same than [Biography](https://hydrogenaudio.org/index.php/topic,112914.msg1071222.html#msg1071222) and [World-Map-SMP](github.com/regorxxx/World-Map-SMP)).
- Buttons: rename 'buttons_display_volume.js' to 'buttons_playback_volume.js'.
- Configuration: changed the global tags for duplicates removal to Title and Album Artist, i.e. Date was removed.
### Removed
### Fixed
- Wrapped: crashes or invalid handling if world map library data file is not present or corrupted. See [Issue 1](https://github.com/regorxxx/Infinity-Tools-SMP/issues/1).
- Wrapped: rare crashes if some track data was missing. See [Issue 2](https://github.com/regorxxx/Infinity-Tools-SMP/issues/2).
- Wrapped: unnecessary double processing with nconvert and exiftool in some cases.
- Wrapped: multiple type checks against bad input, like invalid BPM or key tags. See [Pull Request 5](https://github.com/regorxxx/Infinity-Tools-SMP/pull/5).
- Playlist Tools: fixed readme shown 2 times at first init.
- UI: fixed minor artifacts at border drawing for full size buttons.
- JSplitter: fixed compatibility bug with JSplitter (any version) due to improper constructor used on JS Host as reported [here](https://github.com/regorxxx/Infinity-Tools-SMP/pull/6) and [here](https://hydrogenaudio.org/index.php/topic,126743.msg1073615.html#msg1073615).

## [1.0.0] - 2025-11-19
### Added
- First release.
- Merged [Playlist-Tools-SMP](https://github.com/regorxxx/Playlist-Tools-SMP) script.
- Merged [Search-by-Distance-SMP](https://github.com/regorxxx/Search-by-Distance-SMP) script.
- Merged [ListenBrainz-SMP](https://github.com/regorxxx/ListenBrainz-SMP) script.
- Merged [Autobackup-SMP](https://github.com/regorxxx/Autobackup-SMP) script.
- Merged [Device-Priority-SMP](https://github.com/regorxxx/Device-Priority-SMP) script.
- Merged [Fingerprint-Tools-SMP](https://github.com/regorxxx/Fingerprint-Tools-SMP) script.
- Merged [Wrapped-SMP](https://github.com/regorxxx/Wrapped-SMP) script.
- Playlist Tools\Playlist Manipulation\Harmonic mix: new entries to create a new playlist with key sorting applied.
- Playlist Tools\Selection Manipulation\Expand (disjoint): added entry to limit number of tracks to select.
- Playlist Tools\Selection Manipulation\Expand (contiguous): added tool similar to 'Selection Manipulation\Expand (disjoint)' but limited to contiguous tracks, thus ensuring joint selections.
- Playlist Tools\Selection Manipulation\Expand (next): added tool similar to 'Selection Manipulation\Expand (disjoint)' but limited to next tracks to focused one.
- Playlist Tools\Selection Manipulation\Find prev. played track in: tool to find previously played track across all playlist, but also indicating the original playlist and position. See [here](https://hydrogenaudio.org/index.php/topic,128713.0.html).
- Playlist Tools: added default value for duplicates selection and smart shuffle bias.
- Music Map: added default value for duplicates selection and smart shuffle bias.
- Display TF button: now supports editable presets. 8 built-in presets are now available by default.
- Display TF button: added configurable actions on button click. Some of the actions are compatible with [Library-Tree-v2.4.0.mod.11](https://hydrogenaudio.org/index.php/topic,111060.msg1072147.html#msg1072147) or later.
- Presets: added Rating and Loved/Hated UI columns presets for DUI and CUI (at 'presets\UI').
- Presets: new predefined presets for forced query filters.
- Added support for [Biography-v1.4.2.mod.11](https://hydrogenaudio.org/index.php/topic,112914.msg1070993.html#msg1070993) similar artists database.
### Changed
- Playlist Tools\Playlist Manipulation\Harmonic mix: cleanup of some menu entries and code logic.
- Playlist Tools\Selection Manipulation\Advanced sort: cleanup of some menu entries and code logic.
- Playlist Tools\Presets: are now saved at '[FOOBAR PROFILE FOLDER]\js_data\export' folder when exported.
- Playlist Tools\Presets: individual entries can now be exported at the 'Edit entries from list' submenus as long as they are not the default ones.
- Playlist Tools: tools which output any file now use '[FOOBAR PROFILE FOLDER]\js_data\export' folder at exporting.
- Music Map: renamed 'Other tools' submenu to 'Tagging tools'.
- Presets: forced query presets are now saved into '[FOOBAR PROFILE FOLDER]\js_data\presets\filters\playlist_tools_filters.json' (instead of using the scripts/package folder).
- Presets: default presets are now saved into '[FOOBAR PROFILE FOLDER]\js_data\presets\defaults\playlist_tools_*.json' (instead of using the scripts/package folder).
- Fonts: fonts are no longer bundled at '_resources' folder, but found at: https://github.com/regorxxx/foobar2000-assets/tree/main/Fonts
- Binaries: external binaries are no longer bundled along scripts, but found at: https://github.com/regorxxx/foobar2000-assets/tree/main/binaries
- Configuration: global support for %fb2k_component_path%, %fb2k_profile_path% and %fb2k_path% in any input asking for paths.
- Configuration: improved handling of user definition files found at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\' in case they got corrupted. The corrupted file will be backed up at the same folder and a new one created. Popups will warn about it, no longer requiring user actions. See [here](https://hydrogenaudio.org/index.php/topic,120978.msg1071225.html#msg1071225).
- UI: background now uses the default DUI/CUI background color if the panel does not uses pseudo-transparency.
- UI: updated icons for Playlist Tools submenu custom button for all new and renamed menus.
- UI: animation while buttons are processing is now much faster.
- UI: adjusted default colors to foobar2000's color settings and dark/light mode. Also adjusted dynamic hover color behavior and themed buttons (text color).
- UI: automatic dark mode detection on newest JSplitter and SMP versions. If the feature is not present, it will use light mode by default. It can be forced to any mode at the properties panel ('Dark mode: auto (0), enabled (1), disabled (2)').
- UI: icons based on images are now refreshed when changing foobar2000's theme (not requiring a panel reload).
- UI: slightly adjusted text and icon position on button down, to mimic native foobar2000's buttons behavior.
- UI: adjusted default settings on first installation to mimic native foobar2000's buttons appearance.
- Display TF button: better support for dynamic queries. Tooltip will show 'Global' instead of a reference to the track being used for special variables (like '#VOLUMEDB#').
- Display TF button: double L. Click shows now playing or previously played track while stopped (if available).
- Export settings: now uses '[FOOBAR PROFILE FOLDER]\js_data\export' folder at exporting.
### Removed
- Playlist locks: removed workaround for bugged SMP playlists locks for newest marc2003's SMP mod versions since it was fixed at the component level. 'ExecuteDefaultAction' lock is now available. See [here](https://hydrogenaudio.org/index.php/topic,116669.msg1071792.html#msg1071792).
### Fixed
- UI: replaced offline font awesome cheatsheet link at some places. See [Issue 89](https://github.com/regorxxx/Playlist-Manager-SMP/issues/89).
- UI: fixed some repaint artifacts related to maintaining L. Mouse click down while moving within and outside the panel.
- UI: changing text color immediately clears icon mask cache for icons which rely on images instead of font.
- Display TF button: special variables for dynamic queries (like '#VOLUMEDB#') were replaced on button click with evaluated value, instead of displaying the original expression.
- Display TF button: display errors with expressions containing '|' char, which is now replaced by $char(124) automatically.
- Playlist Tools\Selection Manipulation\Move selection to\After playing now track: avoids processing when selection contains the now playing track too.
- Playlist Tools\Selection Manipulation\Move selection to\After playing now track: fixed wrong index position handling when selection was below the now playing track.
- Multiple foobar v2.25 file-relative fixes.


[Unreleased]: ../../compare/v1.0.0...HEAD
[1.0.0]: ../../compare/5ae07355...v1.0.0