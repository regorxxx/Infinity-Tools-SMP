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
- Presets: added Rating and Loved/Hated UI columns presets for DUI and CUI (at 'presets\UI').
- Added support for [Biography-v1.4.2.mod.11](https://hydrogenaudio.org/index.php/topic,112914.msg1070993.html#msg1070993) similar artists database.
### Changed
- Playlist Tools\Playlist Manipulation\Harmonic mix: cleanup of some menu entries and code logic.
- Playlist Tools\Selection Manipulation\Advanced sort: cleanup of some menu entries and code logic.
- Playlist Tools\Presets: are now saved at '[FOOBAR PROFILE FOLDER]\js_data\export' folder when exported.
- Playlist Tools\Presets: individual entries can now be exported at the 'Edit entries from list' submenus as long as they are not the default ones.
- Playlist Tools: tools which output any file now use '[FOOBAR PROFILE FOLDER]\js_data\export' folder at exporting.
- Music Map: renamed 'Other tools' submenu to 'Tagging tools'.
- UI: updated icons for Playlist Tools submenu custom button for all new and renamed menus.
- Fonts: fonts are no longer bundled at '_resources' folder, but found at: https://github.com/regorxxx/foobar2000-assets/tree/main/Fonts
- Binaries: external binaries are no longer bundled along scripts, but found at: https://github.com/regorxxx/foobar2000-assets/tree/main/binaries
- Settings: global support for %fb2k_component_path%, %fb2k_profile_path% and %fb2k_path% in any input asking for paths.
- UI: animation while buttons are processing is now much faster.
- UI: adjusted default colors to foobar2000's color settings and dark/light mode. Also adjusted dynamic hover color behavior and themed buttons (text color).
- UI: icons based on images are now refreshed when changing foobar2000's theme (not requiring a panel reload).
- UI: slightly adjusted text and icon position on button down, to mimic native foobar2000's buttons behavior.
- UI: adjusted default settings on first installation to mimic native foobar2000's buttons appearance.
- Export settings: now uses '[FOOBAR PROFILE FOLDER]\js_data\export' folder at exporting.
### Removed
### Fixed
- UI: fixed some repaint artifacts related to maintaining L. Mouse click down while moving within and outside the panel.

[Unreleased]: ../../compare/f039e12...HEAD