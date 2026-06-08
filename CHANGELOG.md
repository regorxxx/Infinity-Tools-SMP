# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [2.0.0](#200---2026-04-28)
- [1.4.0](#140---2026-01-12)
- [1.3.0](#130---2026-01-01)
- [1.2.0](#120---2025-12-23)
- [1.1.0](#110---2025-12-12)
- [1.0.0](#100---2025-11-19)

## [Unreleased][]
### Added
- Playlist Tools\Playlist manipulation: new submenu with playlists sorting features.
- Playlist Tools\Playlist manipulation: new submenu with playlists creation features.
- Playlist Tools\Playlist manipulation: new submenu with playlists creation features.
- Playlist Tools\Playlist manipulation: new submenu to perform a query search on specific playlists (which also works with dynamic queries based on current selection).
- Quicksearch: added new setting for max tracks from selection processed by dynamic queries. Previously value was hardcoded (default 1000).
### Changed
- Playlist Tools\Playlist manipulation: menu cleanup and minor reordering.
- Quickmatch: added %INVOLVEDPEOPLE% to artist tags on new setups.
- UI: support for dark themed popups if JS host allows it.
- UI: improved blend color mode to use a mix of CUI/DUI colors when no art is available (like Biograhpy and Library-Tree-SMP do).
- Autobackup: improved logging in some cases.
- Helpers: updated curl.exe to v8.20.0-slim. See [here](https://github.com/lordmulder/cURL-build-win32).
- Helpers: updated 7za.exe to v26.01. See [here](https://www.7-zip.org/download.html).
### Removed
### Fixed

## [2.0.0] - 2026-04-28
### Added
- ListenBrainz Tools: added Discover releases feature: to discover latest releases not on your library or upcoming ones. It's fully based on [ListenBrainz fresh releases](https://listenbrainz.org/explore/fresh-releases/) and will display results as a formatted text table.
- Buttons: new button "Utils\Checksum" which is meant to greatly help with backup and integrity checks. Tool scans current selection and checks for checksum file for every parent directory (this is usually a folder per album) or creates a new one for every dir. Binary paths and arguments are customizable, by default it uses fsum (already bundled). Results are sent to console and/or popups. The main advantage of this tool over batch files and other scripts is path de-duplication, you can easily select 200 tracks and run it while ensuring the actual code only process every parent path once; while it works across libraries scattered at multiple disks, etc.
- Buttons: menu entry to remove all buttons (along their properties).
- UI: 'Top', 'Center' and 'Bottom' Y-Axis position settings. By default is set to 'Top'.
- UI: UI elements are now resizable using Alt + Ctrl + Mouse wheel. It works like 'Size and placement\Set scale...' menu entry.
- UI: added support for D2D draw mode if JS Host supports it (currently only JSplitter 3.7.8+ or 4.1.0+). It must be set per instance, at the properties panel ('Draw mode: GDI (0), D2D (1)'). If JS Host doesn't support it, it will fallback to GDI. Note D2D mode may produce UI artifacts under Wine or not be fully equivalent to GDI, use at your own consideration and only report problems to JS host component devs.
- UI: ported all background art effect settings to D2D effects. Note bloom will render in a similar way to GDI+ but mute and edge are noticeably different. There is a new setting while using D2D draw mode (see above) to force the GDI+ effect looks, in case D2D draw mode is preferred but also the previous effect looks. In the future, if the list of D2D effects is expanded, enabling that setting will make these new effects unavailable (since they will not have a GDI+ counterpart).
- UI: added multiple new background art effects and image histogram while using D2D draw mode. See [here](https://hydrogenaudio.org/index.php/topic,126743.msg1079362.html#msg1079362).
- UI: added new art mode 'By priority' which lets you set different art types by priority order to use if one is not available for current track. The submenu will show the list of art types set and the parent menu the actual one used. This feature also allows to specify between default, stub or embedded art (contrary to the other modes). Works like 'Album art' script bundled with JSP3 panel, see [here](https://hydrogenaudio.org/index.php/topic,116509.msg1079405.html#msg1079405).
- Autobackup: added some default paths related to foobar v2 and third party components.
### Changed
- Autobackup: improved input popup titles and descriptions.
- Autobackup: allows absolute and relative paths for backup output path setting, using the full path, ./profile, %FB2K_PROFILE_PATH% or %PROFILE% suffixes. Note absolute paths will only work if they reside on same drive than foobar2000. Use symlinks or other native Windows tools if you want to store such files at other places.
- Playlist Tools\Pools: modified some of the default presets and added new ones.
- Playlist Tools\Pools (Music Map): improvements on some of the default presets related to traditional music styles, now split between "oldies" and "all dates".
- Installation: panel menu, accessed through 'Ctrl + Win + R. Click' (which works globally on any script and panel, at any position), now also includes the script version number and a submenu to check and set auto-updates.
- UI: toolbar will now adjust button sizes according to Windows scale settings. It can still be further tweaked with the 3 available scaling settings. Note that Windows scaling setting only applies after foobar2000 is restarted; if you change DPI settings, you must restart the application. And it requires either JSplitter v4.0.4+/v3.7.2+ or SMP v1.6.2.25.05.23+. Beware updating will probably affect the effective size of buttons on existing installations, requiring scaling to be set to 1 in most cases now. See [here](https://hydrogenaudio.org/index.php/topic,128978.msg1079470.html#msg1079470).
- UI: new 'Edit all...' menu entry in tools with customizable menu entries, queries, presets, etc. which allows to easily edit entries on batch, instead of manually navigating the menus. This serves as a workaround of menu being closed everytime a menu entry is clicked on. See [Issue 7]/https://github.com/regorxxx/Infinity-Tools-SMP/issues/7).
- UI: improvements on dynamic colors handling for almost B&W art or with a lightly tinted by a single color.
- UI: improvements on dynamic colors handling related to K-means++ with OKLAB color space when using JSplitter v3.7.10+ or v4.1.0+ as JS host. See [here](https://hydrogenaudio.org/index.php/topic,126743.msg1078415.html#msg1078415).
- Settings: internal changes at properties for future releases. This update MUST be installed before any possible future release to ensure settings are not lost on upgrading.
- Settings: internal rename of file 'searchByDistance_artists.json' to 'musicmap_artists.json'. This update MUST be installed before any possible future release to ensure settings are not lost on upgrading.
- Settings: similar artists tag changed from 'SIMILAR ARTISTS SEARCHBYDISTANCE' to 'SIMILAR ARTISTS MUSICMAP'. On existing installations file at '.\profile\js_data\presets\global\globTags.json' must be manually updated if desired (or deleted to recreate it).
- Buttons: minor playback controls preset changes.
- Helpers: support for long paths (>260 chars) in multiple internal file handling functions.
- Readmes: general cleanup.
- Readmes: readmes submenus are now renamed to 'Help' in all instances.
### Removed
### Fixed
- Playlist Tools\Pools: fix to one of the default presets.
- Installation: panel menu, accessed through 'Ctrl + Win + R. Click' (which works globally on any script and panel, at any position), not being displayed in some cases.
- UI: missing settings for 'Share UI settings' feature.
- UI: small fixes to display of separators, new lines, etc. at menu button lists.
- UI: removed extra separator at background 'Art mode' submenu.
- UI: small fixes for background blend color mode.
- UI: fixed art cycling glitch on background folder mode after using the mouse wheel.
- UI: some default toolbar presets not being shown on first installation.
- Buttons: some minor fixes to repainting routines for loved button.
- Presets: playback controls preset not loading properly.
- Logging: spacers being shown twice at console logging (startup).

## [1.4.0] - 2026-01-12
### Added
- UI: added background framework found in all my other scripts, which can be tweaked at the background submenu within the toolbar menu (R. Click). By default is set to to not display any color or art, looking like previous releases. Note any setting at 'Colors' submenu is applied on top of the background, so the toolbar color, transparency or panel pseudo-transparency settings may also override background drawing. As a bonus, all features related to dynamic colors and color servers are also included, so it will work in conjunction with all other scripts making use of this feature.
- Wrapped: './profile/', '%FB2K_PROFILE_PATH%\' or \'%PROFILE%\' special variable support for latex CMD. Also improved input popup and readme to help with path CMD tweaking.
### Changed
- UI: all settings mentioning transparency have been changed to opacity, some properties will be lost on update as result.
- Wrapped: console logging of CMD commands now show paths relative to profile folder whenever possible, in other cases use-specific paths are cut to ensure no sensitive information is logged.
### Removed
### Fixed
- Wrapped: fix handling of non-number BPM values.

## [1.3.0] - 2026-01-01
### Added
- UI: added button new lines, which forces a new row for the next button. They can be added the same than separators and spacers, at 'Add button' submenu. They should work fine in left and center button positions, along reflow and normalized width... but beware of possible "conflicts" with the latter when the panel width is too small. In general it would be better to either use multiple rows manually or let the toolbar handle with reflow setting, but not both. Y-axis orientation is currently not supported for this feature.
### Changed
- UI: repainting performance improvements.
- Code cleanup and performance improvements if panel is disabled or during startup.
### Removed
### Fixed
- Wrapped: region statistics were not being created due to a typo on code since version [1.1.0](#110---2025-12-12).
- Wrapped: fix possible crash in case wrapped was run at the start of the year without enough data.
- UI: 'buttons_playback_rating' and 'buttons_playback_love' using highlight color in some cases when no selection was available.
- UI: bar menu showing up when moving a button at R. Click up.
- UI: minor fixes to R. Click behaviour on bar.

## [1.2.0] - 2025-12-23
### Added
- Playlist Tools\Tagging\Group Tagger: added preset -By Album (duration)- to calculate any tag aggregation weighted by track duration. i.e. '[$mul(%TAG%,%LENGTH_SECONDS%)]' as source tag and '%LENGTH_SECONDS%' as tag count.
- Buttons: new 'buttons_playback_rating' button, which supports any rating system (foo_playcount, foo_playcount_2003 or tags) and arbitrary number of stars. Clicking on the buttons directly rates the track(s). Has settings to follow playback or evaluate selection, like loved button. When using multiple tracks selection, half stars will be used to indicate that not all tracks have the max. rating found.
- Playlist Tools\Library Search\Import track list: added codepage popup when imported file is detected as a non UTF-8 file by Windows/SMP, so the user can force an specific codepage or rely on the detected one. See [here](https://hydrogenaudio.org/index.php/topic,128838.msg1074594.html#msg1074594).
### Changed
- Playlist Tools\Selection Manipulation\Find now playing track in: active and playing playlist are no longer grayed out. 'Show current playlist' setting hides the playing playlist, instead of the active playlist.
- UI: improvements on dynamic colors handling in some extreme cases with main and secondary colors being almost equal.
- Music Map: similar artist tagging now uses only the first Album Artist (or Artist), instead of joining them by commas, if the reference tack had multiple artists.
- Music Map: added fallback between %ARTIST% and %ALBUM ARTIST% tags similar artist tagging.
- Playlist Tools\Import track list: example txt file is now copied on custom path if no file is present and setting has not been changed yet. Such path is used as the default path, so it works on first run without any user intervention.
- Wrapped: adjusted default artist img stub to newest Biography mod version.
### Removed
### Fixed
- Music Map: similar artist tagging now works properly for selection with multi-value artist tags in all cases.
- UI: avoid repaint artifacts (button hover) due to bugged SMP behaviour when opening modal popups.
- Buttons: loved button not being refreshed on playback stop while using 'Follow now playing' setting.
- Buttons: loved button not being refreshed when changing 'Evaluate multiple tracks' setting.
- Playlist Tools\Library Search\Import track list: fixed errors with remapped fields by foobar2000 (artist, track, filename, ...).

## [1.1.0] - 2025-12-12
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
- UI: added button and entry name as title to input popups when changing button's settings at multiple places.
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
- Playlist Tools: fixed readme being shown 2 times at first init.
- UI: fixed minor artifacts at border drawing for full size buttons.
- Buttons: input popups at settings menu were not properly recognizing variable types (JSON, number, string, ...) in some cases, thus missing a lot of input checks and tips.
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


[Unreleased]: ../../compare/v2.0.0...HEAD
[2.0.0]: ../../compare/v.1.4.0...v2.0.0
[1.4.0]: ../../compare/v.1.3.0...v1.4.0
[1.3.0]: ../../compare/v.1.2.0...v1.3.0
[1.2.0]: ../../compare/v.1.1.0...v1.2.0
[1.1.0]: ../../compare/v.1.0.0...v1.1.0
[1.0.0]: ../../compare/5ae07355...v1.0.0