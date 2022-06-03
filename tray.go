package main

import (
	"github.com/getlantern/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/omriharel/filtersnatch/icon"
)

func onTrayReady(app *App) {
	systray.SetIcon(icon.Data)
	systray.SetTitle("filtersnatch")
	systray.SetTooltip("filtersnatch")
	menuItemShowWindow := systray.AddMenuItem("Options", "Open configuration UI")
	systray.AddSeparator()

	if app.version != "" {
		versionInfo := systray.AddMenuItem(app.version, "")
		versionInfo.Disable()
		systray.AddSeparator()
	}

	menuItemQuit := systray.AddMenuItem("Quit", "Quit filtersnatch")

	go func() {
		for {
			select {
			case <-menuItemQuit.ClickedCh:
				systray.Quit()
			case <-menuItemShowWindow.ClickedCh:
				runtime.WindowShow(app.ctx)
			}
		}
	}()
}

func onTrayQuit(app *App) {
	runtime.Quit(app.ctx)
}
