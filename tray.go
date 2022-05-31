package main

import (
	"github.com/getlantern/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/omriharel/instantblade/icon"
)

func onTrayReady(app *App) {
	systray.SetIcon(icon.Data)
	systray.SetTitle("instantblade")
	systray.SetTooltip("instantblade")
	menuItemShowWindow := systray.AddMenuItem("Options", "")
	systray.AddSeparator()
	menuItemQuit := systray.AddMenuItem("Quit", "")

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
