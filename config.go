package main

import (
	"context"
	"os"
	"path/filepath"

	"github.com/adrg/xdg"
	"github.com/spf13/viper"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const configDirAndName = "filtersnatch/config.yaml"

func NewConfig(ctx context.Context) (*viper.Viper, error) {
	configPath, err := xdg.ConfigFile(configDirAndName)
	if err != nil {
		return nil, err
	}

	config := viper.New()
	config.SetConfigName("config")
	config.AddConfigPath(filepath.Dir(configPath))
	config.SetConfigType("yaml")

	config.SetDefault(configKeyFiltersDirectory, os.ExpandEnv(defaultLootFilterDirectory))
	config.SetDefault(configKeyFiltersOverwriteStrategy, OverwriteSelectedFile)
	config.SetDefault(configKeyFiltersSelectedFile, nil)

	config.SetDefault(configKeyDownloadsDirectory, os.ExpandEnv(xdg.UserDirs.Download))
	config.SetDefault(configKeyDownloadsWatchStrategy, WatchNewestFilterFile)
	config.SetDefault(configKeyDownloadsNamedFile, nil)

	config.SetDefault(configKeyWindowStartInTray, false)

	err = config.ReadInConfig()
	if err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			runtime.LogWarningf(ctx, "Config not found, creating at path: %s", configPath)

			// create config file at target path if doesn't exist
			err = config.SafeWriteConfig()
			if err != nil {
				runtime.LogErrorf(ctx, "Failed to write config: %w", err)
				return nil, err
			}

			return config, nil
		}

		// return error in any other error case
		runtime.LogErrorf(ctx, "Another error loading config: %w", err)
		return nil, err
	}

	// return loaded config
	runtime.LogInfo(ctx, "Loaded config successfully")
	return config, nil
}
