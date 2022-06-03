import { Popover, Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import {
  ChooseFiltersDir,
  ChooseDownloadsDir,
  ListFiltersInDir,
  GetConfigJSON,
  SetStartInTrayAndUpdateConfig,
  SetDownloadsStrategyAndUpdateConfig,
  SetFiltersStrategyAndUpdateConfig,
} from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import {
  WindowHide,
  WindowMinimise,
  EventsOn,
  EventsOff,
  LogDebug,
} from "../wailsjs/runtime";
import FileEntryAndModeSelector from "./FileEntryAndModeSelector";

const App = () => {
  const [chosenFiltersDir, setChosenFiltersDir] = useState("");
  const [chosenFilterOverwriteStrategy, setChosenFilterOverwriteStrategy] =
    useState("");
  const [chosenFilterFile, setChosenFilterFile] = useState("");

  const [chosenDownloadsDir, setChosenDownloadsDir] = useState("");
  const [chosenDownloadsWatchedFile, setChosenDownloadsWatchedFile] =
    useState("");
  const [chosenDownloadsWatchStrategy, setChosenDownloadsWatchStrategy] =
    useState("");

  const [startInTray, setStartInTray] = useState(false);

  const [filtersInFiltersDir, setFiltersInFiltersDir] =
    useState<main.FileListEntry[]>();
  const [filtersInDownloadsDir, setFiltersInDownloadsDir] =
    useState<main.FileListEntry[]>();

  const [configLoaded, setConfigLoaded] = useState(false);

  const refreshFiltersInFiltersDir = () => {
    if (chosenFiltersDir) {
      LogDebug("Refreshing filters dir contents");
      ListFiltersInDir(chosenFiltersDir).then((filters) => {
        setFiltersInFiltersDir(filters as main.FileListEntry[]);
      });
    }
  };

  const refreshFiltersInDownloadsDir = () => {
    if (chosenDownloadsDir) {
      LogDebug("Refreshing downloads dir contents");
      ListFiltersInDir(chosenDownloadsDir).then((filters) => {
        setFiltersInDownloadsDir(filters as main.FileListEntry[]);
      });
    }
  };

  useEffect(() => {
    GetConfigJSON().then((config) => {
      setChosenFiltersDir(config.filters_directory);
      setChosenFilterOverwriteStrategy(config.filters_overwrite_strategy);
      setChosenFilterFile(config.filters_selected_file);

      setChosenDownloadsDir(config.downloads_directory);
      setChosenDownloadsWatchStrategy(config.downloads_watch_strategy);
      setChosenDownloadsWatchedFile(config.downloads_named_file);

      setStartInTray(config.start_in_tray);

      setConfigLoaded(true);
    });
  }, []);

  useEffect(() => {
    EventsOn("watch_event_triggered", () => {
      refreshFiltersInDownloadsDir();
      refreshFiltersInFiltersDir();
    });
    EventsOn("filter_file_replaced", () => {
      refreshFiltersInFiltersDir();
    });
    return () => {
      EventsOff("watch_event_triggered");
      EventsOff("filter_file_replaced");
    };
  }, [chosenFiltersDir, chosenDownloadsDir]);

  useEffect(() => {
    if (configLoaded) {
      refreshFiltersInFiltersDir();
    }
  }, [chosenFiltersDir, configLoaded]);

  useEffect(() => {
    if (configLoaded) {
      refreshFiltersInDownloadsDir();
    }
  }, [chosenDownloadsDir, configLoaded]);

  return (
    <div
      id="app"
      className="p-6 bg-slate-800 bg-opacity-95 h-screen text-white select-none"
    >
      <div className="flex flex-col gap-8">
        <div className="flex h-20 gap-5">
          <div className="flex flex-col justify-start">
            <div className="text-6xl text-slate-300 italic">
              <span className="text-gray-400">filter</span>
              snatch
            </div>
            <div className="text-lg italic text-slate-300">
              filter file watcher & replacer
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-8">
            <PreferencesPanel startInTrayInitialValue={startInTray} />
          </div>
          <div className="flex-1"></div>
          <div
            className="-mt-2 flex self-start text-5xl text-slate-500 cursor-grab"
            data-wails-drag
          >
            ⁙
          </div>
          <div
            className="-mt-2 flex self-start text-5xl text-slate-500 cursor-pointer"
            onClick={() => WindowMinimise()}
          >
            _
          </div>
          <div
            className="-mt-2 mr-2 flex self-start text-5xl text-slate-500 cursor-pointer"
            onClick={() => WindowHide()}
          >
            x
          </div>
        </div>
        <div className="grid grid-cols-1 grid-flow-col auto-cols-min gap-4">
          <div
            className={[
              "h-14 px-4 rounded-lg border-2 flex justify-center",
              chosenFiltersDir ? "border-green-500" : "border-red-500",
            ].join(" ")}
          >
            <div className="truncate place-self-center">
              {chosenFiltersDir || "No Path of Exile filters directory chosen"}
            </div>
          </div>

          <div
            className={[
              "h-14 px-4 rounded-lg border-2 flex justify-center",
              chosenDownloadsDir ? "border-green-500" : "border-red-500",
            ].join(" ")}
          >
            <div className="truncate place-self-center">
              {chosenDownloadsDir || "No downloads directory chosen"}
            </div>
          </div>

          <div className="col-span-2 row-start-2 col-start-1">
            {configLoaded && (
              <FileEntryAndModeSelector
                prompt={"Filter file to be replaced:"}
                entries={filtersInFiltersDir}
                modes={[
                  {
                    name: "selected_file",
                    render: "Select existing file",
                    onChosen: ({ entryName }) => {
                      LogDebug(
                        "Selected filter file to overwrite: " + entryName
                      );
                      SetFiltersStrategyAndUpdateConfig(
                        "selected_file",
                        entryName || ""
                      );

                      setChosenFilterFile(entryName || "");
                    },
                    inputMode: "entries",
                  },
                  {
                    name: "named_file",
                    render: "Specify exact file name",
                    onChosen: ({ text }) => {
                      LogDebug("Selected exact file to overwrite: " + text);
                      SetFiltersStrategyAndUpdateConfig(
                        "named_file",
                        text || ""
                      );

                      if (text) {
                        setChosenFilterFile(text);
                      }
                    },
                    inputMode: "text",
                    textInputPrompt: "(Over)write only this filter file:",
                  },
                ]}
                selectedMode={chosenFilterOverwriteStrategy}
                selectedEntryName={
                  chosenFilterOverwriteStrategy === "selected_file"
                    ? chosenFilterFile
                    : undefined
                }
                inputText={
                  chosenFilterOverwriteStrategy === "named_file"
                    ? chosenFilterFile
                    : undefined
                }
              />
            )}
          </div>

          <div className="col-span-2 row-start-3 col-start-1 text-center text-7xl opacity-20 font-extrabold">
            ⬆ ⬆ ⬆
          </div>

          <div className="col-span-2 row-start-5 col-start-1">
            {configLoaded && (
              <FileEntryAndModeSelector
                prompt={"When a new filter is downloaded:"}
                entries={filtersInDownloadsDir}
                modes={[
                  {
                    name: "newest_filter_file",
                    render: () => (
                      <>
                        Use newest{" "}
                        <span className="font-mono text-base text-slate-200">
                          *.filter
                        </span>{" "}
                        file
                      </>
                    ),
                    inputMode: "singleEntry",
                    onChosen: ({ entryName }) => {
                      if (!entryName) {
                        return;
                      }

                      LogDebug(
                        "Selected to take newest filter file: " + entryName
                      );
                      SetDownloadsStrategyAndUpdateConfig(
                        "newest_filter_file",
                        ""
                      );
                    },
                  },
                  {
                    name: "named_file",
                    render: "Specify exact file name",
                    inputMode: "text",
                    textInputPrompt: "Only take a filter with this exact name:",
                    onChosen: ({ text }) => {
                      LogDebug("Selected to take only exact file: " + text);
                      SetDownloadsStrategyAndUpdateConfig(
                        "named_file",
                        text || ""
                      );

                      if (text) {
                        setChosenDownloadsWatchedFile(text);
                      }
                    },
                  },
                ]}
                selectedMode={chosenDownloadsWatchStrategy}
                inputText={
                  chosenDownloadsWatchStrategy === "named_file"
                    ? chosenDownloadsWatchedFile
                    : undefined
                }
              ></FileEntryAndModeSelector>
            )}
          </div>

          <button
            className="flex-1 flex content-start items-center rounded-md px-4 my-0.5 bg-slate-700 shadow-md whitespace-nowrap text-xl"
            onClick={() =>
              ChooseFiltersDir().then(
                (chosenDir) => chosenDir && setChosenFiltersDir(chosenDir)
              )
            }
          >
            📂 Choose filters directory...
          </button>
          <button
            className="flex-1 flex content-start items-center rounded-md px-4 my-0.5 bg-slate-700 shadow-md whitespace-nowrap text-xl"
            onClick={() =>
              ChooseDownloadsDir().then(
                (chosenDir) => chosenDir && setChosenDownloadsDir(chosenDir)
              )
            }
          >
            📂 Choose downloads directory...
          </button>
        </div>
      </div>
    </div>
  );
};

const PreferencesPanel = (props: { startInTrayInitialValue: boolean }) => {
  return (
    <Popover className="relative">
      <Popover.Button className="text-slate-500 focus:outline-none flex gap-1 items-center">
        <div className="text-3xl">⚙</div>
        <div className="text-xl mb-0.5">settings</div>
      </Popover.Button>

      <Popover.Panel className="absolute z-10 mt-4 -translate-x-[26%] h-48 w-64">
        <div className="grid grid-cols-1 place-items-center p-6 gap-4 rounded-xl bg-opacity-80 backdrop-blur-md shadow-xl bg-slate-700">
          <ToggleSwitch
            enabled={props.startInTrayInitialValue}
            label="Start in tray"
            onChange={(newValue) => {
              LogDebug("Updating start in tray option to: " + newValue);
              SetStartInTrayAndUpdateConfig(newValue);
            }}
          ></ToggleSwitch>
        </div>
      </Popover.Panel>
    </Popover>
  );
};

const ToggleSwitch = (props: {
  enabled: boolean;
  label?: string;
  onChange: (enabled: boolean) => void;
}) => {
  const [enabled, setEnabled] = useState(props.enabled);

  const onChange = (newValue: boolean) => {
    setEnabled(newValue);
    props.onChange(newValue);
  };

  return (
    <Switch.Group>
      <div className="flex items-center">
        {props.label && (
          <Switch.Label className="mr-2 mt-1 text-lg">
            {props.label}
          </Switch.Label>
        )}
        <Switch
          checked={enabled}
          onChange={onChange}
          className={`${enabled ? "bg-green-500" : "bg-slate-500"}
          relative scale-75 inline-flex h-[38px] w-[74px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
        >
          <span
            aria-hidden="true"
            className={`${enabled ? "translate-x-9" : "translate-x-0"}
            pointer-events-none inline-block h-[34px] w-[34px] transform rounded-full bg-slate-100 shadow-lg ring-0 transition duration-200 ease-in-out`}
          />
        </Switch>
      </div>
    </Switch.Group>
  );
};

export default App;
