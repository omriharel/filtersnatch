package main

type OverwriteStrategy string

const (
	OverwriteSelectedFile OverwriteStrategy = "selected_file"
	OverwriteNamedFile    OverwriteStrategy = "named_file"
)

func parseOverwriteStrategy(strategy string) (OverwriteStrategy, bool) {
	switch strategy {
	case string(OverwriteSelectedFile):
		return OverwriteSelectedFile, true
	case string(OverwriteNamedFile):
		return OverwriteNamedFile, true
	}

	return "", false
}

type WatchStrategy string

const (
	WatchNewestFilterFile WatchStrategy = "newest_filter_file"
	WatchNamedFile        WatchStrategy = "named_file"
)

func parseWatchStrategy(strategy string) (WatchStrategy, bool) {
	switch strategy {
	case string(WatchNewestFilterFile):
		return WatchNewestFilterFile, true
	case string(WatchNamedFile):
		return WatchNamedFile, true
	}

	return "", false
}

const (
	eventWatchEventTriggered = "watch_event_triggered"
	eventFilterFileReplaced  = "filter_file_replaced"
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
