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
- Playlist tools\Playlist Manipulation\Harmonic mix: new entries to create a new playlist with key sorting applied.
- Playlist tools\Selection Manipulation\Expand (disjoint): added entry to limit number of tracks to select.
- Playlist tools\Selection Manipulation\Expand (contiguous): added tool similar to 'Selection Manipulation\Expand (disjoint)' but limited to contiguous tracks, thus ensuring joint selections.
- Playlist tools\Selection Manipulation\Expand (next): added tool similar to 'Selection Manipulation\Expand (disjoint)' but limited to next tracks to focused one.
### Changed
- Playlist tools\Playlist Manipulation\Harmonic mix: cleanup of some menu entries and code logic.
- Playlist tools\Selection Manipulation\Advanced sort: cleanup of some menu entries and code logic.
- UI: updated icons for Playlist Tools submenu custom button for all new and renamed menus.
- Fonts: fonts are no longer bundled at '_resources' folder, but found at: https://github.com/regorxxx/foobar2000-assets/tree/main/Fonts
- Settings: global support for %fb2k_component_path%, %fb2k_profile_path% and %fb2k_path% in any input asking for paths.
- Autobackup: minimal allowed interval for saving set to 40 seconds. This is mostly an internal change to be on the safe side with foobar2000 v2.
### Removed
### Fixed
- Autobackup: critical bugfix for '[Save] every x tracks' setting. If backup 'Every x tracks' was set to 0, the tool tried to save foobar2000 configuration every 30 seconds (the minimum interval allowed).
- Export settings: added missing buttons file on zip.
- Import settings: multiple fixes to extra data files importing.

[Unreleased]: ../../compare/f039e12...HEAD