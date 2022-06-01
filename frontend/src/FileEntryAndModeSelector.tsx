import RelativeTime from "@yaireo/relative-time";
import { RadioGroup } from "@headlessui/react";
import { main } from "../wailsjs/go/models";

export interface FileEntryAndModeSelectorProps {
  entries?: main.FileListEntry[];
  modes: {
    name: string;
    render: string | (() => JSX.Element);
    inputMode: "entries" | "text" | "singleEntry";
    onChosen: (choice: { entryName?: string; textInput?: string }) => void;
  }[];
  selectedMode?: string;
  selectedEntryName?: string;
  inputText?: string;
}

const FileEntryAndModeSelector = (props: FileEntryAndModeSelectorProps) => {
  return (
    <div className="flex flex-row gap-4 h-40">
      <div className="flex flex-col w-64 p-4 gap-4 bg-green-700">
        {props.modes.map((mode) => {
          return (
            <div key={`mode-${mode.name}`}>
              {typeof mode.render === "string" ? mode.render : mode.render()}
            </div>
          );
        })}
      </div>
      <div className="flex flex-1 flex-col p-4 gap-4 bg-red-700">
        {props.entries &&
          props.entries
            .sort(
              (a, b) => +new Date(b.created_time) - +new Date(a.created_time)
            )
            .map((entry) => {
              return (
                <div>
                  {entry.name} //{" "}
                  {new RelativeTime({ options: { dayPeriod: "narrow" } }).from(
                    new Date(entry.created_time)
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default FileEntryAndModeSelector;
