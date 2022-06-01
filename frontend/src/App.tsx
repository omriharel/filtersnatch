import { useEffect, useState } from "react";
import {
  ChooseFiltersDir,
  ChooseDownloadsDir,
  ListFiltersInDir,
} from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import { WindowHide, WindowMinimise } from "../wailsjs/runtime";
import FileEntryAndModeSelector from "./FileEntryAndModeSelector";

const App = () => {
  const [chosenFiltersDir, setChosenFiltersDir] = useState("");
  const [chosenDownloadsDir, setChosenDownloadsDir] = useState("");

  const [filtersInFiltersDir, setFiltersInFiltersDir] =
    useState<main.FileListEntry[]>();
  const [filtersInDownloadsDir, setFiltersInDownloadsDir] =
    useState<main.FileListEntry[]>();

  useEffect(() => {
    if (chosenFiltersDir) {
      ListFiltersInDir(chosenFiltersDir).then((filters) => {
        setFiltersInFiltersDir(filters as main.FileListEntry[]);
      });
    }
  }, [chosenFiltersDir]);

  useEffect(() => {
    if (chosenDownloadsDir) {
      ListFiltersInDir(chosenDownloadsDir).then((filters) => {
        setFiltersInDownloadsDir(filters as main.FileListEntry[]);
      });
    }
  }, [chosenDownloadsDir]);

  return (
    <div
      id="app"
      className="p-6 bg-slate-800 bg-opacity-95 h-screen text-white select-none"
    >
      <div className="flex flex-col gap-8">
        <div className="flex h-20 gap-5">
          <div className="flex flex-col flex-1 justify-start">
            <div className="text-6xl text-slate-300 italic">
              <span className="text-gray-400">instant</span>
              blade
            </div>
            <div className="text-lg italic text-slate-300">
              filter file watcher & replacer
            </div>
          </div>
          <div
            className="flex text-5xl text-slate-500 cursor-grab"
            data-wails-drag
          >
            ⁙
          </div>
          <div
            className="flex text-5xl text-slate-500 cursor-pointer"
            onClick={() => WindowMinimise()}
          >
            _
          </div>
          <div
            className="flex text-5xl text-slate-500 cursor-pointer"
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

          <div className={["col-span-2 row-start-2 col-start-1"].join(" ")}>
            <FileEntryAndModeSelector
              entries={filtersInFiltersDir}
              modes={[]}
            />
          </div>
          <div
            className={[
              "col-span-2 row-start-4 col-start-1",
              chosenDownloadsDir ? "" : "",
            ].join(" ")}
          >
            <FileEntryAndModeSelector
              entries={filtersInDownloadsDir}
              modes={[
                {
                  name: "newest_filter_file",
                  render: () => (
                    <>
                      Use newest <span className="font-mono">.filter</span> file
                    </>
                  ),
                  inputMode: "singleEntry",
                  onChosen: () => {},
                },
                {
                  name: "named_file",
                  render: "Choose specific file name",
                  inputMode: "text",
                  onChosen: () => {},
                },
              ]}
            ></FileEntryAndModeSelector>
          </div>

          <button
            className="flex-1 flex content-start items-center rounded-md px-4 my-0.5 bg-blue-600 whitespace-nowrap text-xl"
            onClick={() =>
              ChooseFiltersDir().then(
                (chosenDir) => chosenDir && setChosenFiltersDir(chosenDir)
              )
            }
          >
            📂 Choose filters directory...
          </button>
          <button
            className="flex-1 flex content-start items-center rounded-md px-4 my-0.5 bg-blue-600 whitespace-nowrap text-xl"
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

export default App;
