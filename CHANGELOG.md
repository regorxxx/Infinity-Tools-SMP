# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)

## [Unreleased][]
### Added
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
- UI: updated icons for Playlist Tools submenu custom button for all new and renamed menus.
- UI: animation while buttons are processing is now much faster.
- UI: adjusted default colors to foobar2000's color settings and dark/light mode. Also adjusted dynamic hover color behavior and themed buttons (text color).
- UI: automatic dark mode detection on newest JSplitter and SMP versions. If the feature is not present, it will use light mode by default. It can be forced to any mode at the properties panel ('Dark mode: auto (0), enabled (1), disabled (2)').
- UI: icons based on images are now refreshed when changing foobar2000's theme (not requiring a panel reload).
- UI: slightly adjusted text and icon position on button down, to mimic native foobar2000's buttons behavior.
- UI: adjusted default settings on first installation to mimic native foobar2000's buttons appearance.
- Display TF button: better support for dynamic queries. Tooltip will show 'Global' instead of a reference to the track being used for special variables (like '#VOLUMEDB#').
- Export settings: now uses '[FOOBAR PROFILE FOLDER]\js_data\export' folder at exporting.
### Removed
- Playlist locks: removed workaround for bugged SMP playlists locks for newest marc2003's SMP mod versions since it was fixed at the component level. 'ExecuteDefaultAction' lock is now available. See [here](https://hydrogenaudio.org/index.php/topic,116669.msg1071792.html#msg1071792).
### Fixed
- UI: replaced offline font awesome cheatsheet link at some places. See [Issue 89](https://github.com/regorxxx/Playlist-Manager-SMP/issues/89).
- UI: fixed some repaint artifacts related to maintaining L. Mouse click down while moving within and outside the panel.
- UI: changing text color immediately clears icon mask cache for icons which rely on images instead of font.
- Display TF button: special variables for dynamic queries (like '#VOLUMEDB#') were replaced on button click with evaluated value, instead of displaying the original expression.
- Display TF button: display errors with expressions containing '|' char, which is now replaced by $char(124) automatically.

[Unreleased]: ../../compare/f039e12...HEAD