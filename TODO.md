core functionality:

- watch directories
- respond to directory change and stop/start watcher
- emit events on new file additions
- respond to new filter file addition if matches current configuration and replace target

UI (still core):

- allow pause/resume (also from tray)
- show current status (pending dirs, pending modes, watching, paused)
- show last filter replacement action

deployment:

- add build tags

QA:

- dont allow selecting same directory for both
- md5 on source and dest files?

marketing:

- github page

nice to have:

- transparency toggle
- actions taken log
- toggle: attempt to delete downloaded filter after successful overwrite
