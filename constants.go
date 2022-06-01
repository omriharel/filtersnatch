package main

type OverwriteStrategy string

const (
	OverwriteSelectedFile OverwriteStrategy = "selected_file"
	OverwriteNamedFile    OverwriteStrategy = "named_file"
)

type WatchStrategy string

const (
	WatchNewestFilterFile WatchStrategy = "newest_filter_file"
	WatchNamedFile        WatchStrategy = "named_file"
)

const (
	configKeyFiltersDirectory         = "filters.directory"
	configKeyFiltersOverwriteStrategy = "filters.overwrite_strategy"
	configKeyFiltersSelectedFile      = "filters.selected_file"

	configKeyDownloadsDirectory     = "downloads.directory"
	configKeyDownloadsWatchStrategy = "downloads.watch_strategy"
	configKeyDownloadsNamedFile     = "downloads.named_file"

	configKeyWindowStartInTray = "window.start_in_tray"
)
