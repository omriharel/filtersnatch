import RelativeTime from "@yaireo/relative-time";
import isValidFilename from "valid-filename";
import { RadioGroup } from "@headlessui/react";
import { main } from "../wailsjs/go/models";
import { useEffect, useState } from "react";

const trimFilterExt = (filename: string) => {
  return filename.substring(0, filename.length - ".filter".length);
};

export interface FileEntryAndModeSelectorProps {
  prompt: string;
  entries?: main.FileListEntry[];
  modes: {
    name: string;
    render: string | (() => JSX.Element);
    inputMode: "entries" | "text" | "singleEntry";
    textInputPrompt?: string;
    onChosen: (choice: { entryName?: string; text?: string }) => void;
  }[];
  selectedMode?: string;
  selectedEntryName?: string;
  inputText?: string;
}

const FileEntryAndModeSelector = (props: FileEntryAndModeSelectorProps) => {
  const getModeByName = (name: string) => {
    return props.modes.find((mode) => mode.name === name)!;
  };

  const defaultMode = getModeByName(props.selectedMode || props.modes[0].name);
  const [selectedMode, setSelectedMode] = useState(defaultMode);

  const [selectedEntryName, setSelectedEntryName] = useState(
    props.selectedEntryName || ""
  );

  const [inputText, setInputText] = useState(props.inputText || "");
  const [now, setNow] = useState(new Date());

  const hasAtLeastOneEntry = props.entries && props.entries.length > 0;
  const entriesByDate = hasAtLeastOneEntry
    ? props.entries!.sort(
        (a, b) => +new Date(b.created_time) - +new Date(a.created_time)
      )
    : [];

  const newestEntry = hasAtLeastOneEntry ? entriesByDate[0] : undefined;

  const getRelativeTimeString = (entry: main.FileListEntry) => {
    if (+now - +new Date(entry.created_time) <= 60 * 1000) {
      return "just now";
    }

    const time = new RelativeTime({
      options: { dayPeriod: "narrow" },
    }).from(new Date(entry.created_time), now);

    return time;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!props.selectedEntryName) {
      setSelectedEntryName("");
    }
  }, [props.entries]);

  useEffect(() => {
    if (selectedMode.inputMode === "singleEntry") {
      setSelectedEntryName(newestEntry ? newestEntry.name : "");
    }
  }, [selectedMode, newestEntry]);

  useEffect(() => {
    selectedMode.onChosen({
      entryName: selectedEntryName,
      text: inputText,
    });
  }, [selectedEntryName, selectedMode, inputText]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-2xl text-slate-200">{props.prompt}</div>
      <div className="flex flex-row gap-4 h-48">
        <RadioGroup
          value={selectedMode.name}
          onChange={(mode: string) => {
            setSelectedMode(getModeByName(mode));
          }}
        >
          <div className="flex flex-col w-64 gap-4">
            {props.modes.map((mode) => (
              <RadioGroup.Option
                key={mode.name}
                value={mode.name}
                className={({ active, checked }) =>
                  `${
                    active
                      ? "ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-sky-300"
                      : ""
                  }
                      ${checked ? "bg-sky-600 text-white" : "bg-sky-900"}
                        relative flex cursor-pointer rounded-lg px-5 py-7 shadow-md focus:outline-none`
                }
              >
                {({ checked }) => (
                  <>
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-lg">
                          <RadioGroup.Description
                            as="span"
                            className={`inline ${
                              checked ? "text-sky-50" : "text-gray-400"
                            }`}
                          >
                            <span>
                              {typeof mode.render === "string"
                                ? mode.render
                                : mode.render()}
                            </span>{" "}
                          </RadioGroup.Description>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
        <div className="flex flex-1 ml-4">
          {selectedMode.inputMode === "entries" ? (
            hasAtLeastOneEntry ? (
              <RadioGroup
                value={selectedEntryName}
                onChange={(newEntryName) => {
                  setSelectedEntryName(newEntryName);
                }}
                className="flex flex-1 flex-col gap-3 place-content-start flex-wrap overflow-x-auto no-scrollbar snap-x"
              >
                {entriesByDate.map((entry) => (
                  <RadioGroup.Option
                    key={entry.name}
                    value={entry.name}
                    className={({ checked }) =>
                      `cursor-pointer snap-start rounded-md w-64 h-14 px-2 py-1 shadow-md focus:outline-none ${
                        checked
                          ? "from-sky-500 to-sky-700 bg-gradient-to-tl text-white"
                          : "bg-sky-900"
                      }`
                    }
                  >
                    {({ checked }) => (
                      <>
                        <div className="flex w-full items-center justify-between">
                          <div
                            className={`flex items-center ${
                              checked ? "w-5/6" : "w-full"
                            }`}
                          >
                            <div className="flex truncate text-md">
                              <RadioGroup.Description
                                as="div"
                                className={`flex-1 truncate ${
                                  checked ? "text-sky-50" : "text-gray-400"
                                }`}
                              >
                                <div className="truncate">
                                  {trimFilterExt(entry.name)}
                                  <span className="opacity-60">.filter</span>
                                </div>
                                <div className="text-sm opacity-80 italic">
                                  {getRelativeTimeString(entry)}
                                </div>
                              </RadioGroup.Description>
                            </div>
                          </div>
                          {checked && (
                            <div className="shrink-0">
                              <CheckIcon className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </RadioGroup.Option>
                ))}
              </RadioGroup>
            ) : (
              <NoFilesMessage>No filter files here.</NoFilesMessage>
            )
          ) : selectedMode.inputMode === "singleEntry" ? (
            newestEntry ? (
              <InfoMessage>
                <div className="text-xl italic text-sky-500 w-full">
                  Last downloaded
                </div>
                <div className="truncate w-full text-center">
                  {trimFilterExt(newestEntry.name)}
                  <span className="opacity-60">.filter</span>
                </div>
                <div className="italic text-lg text-slate-400">
                  {getRelativeTimeString(newestEntry)}
                </div>
              </InfoMessage>
            ) : (
              <NoFilesMessage>No filter files downloaded yet.</NoFilesMessage>
            )
          ) : (
            <div className="flex flex-1">
              <InputFilterNameBox
                prompt={selectedMode.textInputPrompt}
                value={inputText}
                onChange={(newValue: string) =>
                  setInputText(newValue ? `${newValue}.filter` : "")
                }
              ></InputFilterNameBox>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CheckIcon = (props: any) => {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx={12} cy={12} r={12} fill="#fff" opacity="0.2" />
      <path
        d="M7 13l3 3 7-7"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const InputFilterNameBox = (props: any) => {
  type validationState = "unset" | "pending" | "valid" | "invalid";
  const [inputText, setInputText] = useState<string>(
    props.value ? trimFilterExt(props.value) : ""
  );
  const [validState, setValidState] = useState<validationState>("unset");

  const validate = (initial: boolean) => {
    if (inputText.trim() === "") {
      setValidState("unset");
      if (!initial) {
        props.onChange("");
      }
      return;
    }

    if (isValidFilename(inputText.trim())) {
      setValidState("valid");
      return;
    }

    setValidState("invalid");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setValidState("pending");

    if (event.key === "Enter") {
      event.preventDefault();
      validate(false);
    }
  };

  useEffect(() => {
    if (validState === "valid") {
      props.onChange(inputText.trim());
    }
  }, [validState]);

  useEffect(() => validate(true), []);

  return (
    <GenericCenterMessage>
      <div className="text-xl flex flex-col mr-16 mb-6">
        <div className="text-sky-500 pb-4">{props.prompt || ""}</div>
        <div className="relative flex flex-row items-center rounded-md w-96 bg-slate-700">
          <input
            value={inputText}
            className="w-96 mr-16 pl-4 py-2 shadow-md focus:outline-none text-right text-slate-200 bg-transparent "
            onChange={(event) => setInputText(event.currentTarget.value)}
            onKeyDown={onKeyDown}
            onBlur={() => validate(false)}
          ></input>
          <span className="absolute right-4 text-slate-400">.filter</span>
          <span
            className={`absolute -right-10 text-4xl transition-colors duration-300 ${
              {
                unset: "text-gray-400",
                pending: "text-orange-400",
                valid: "text-green-400",
                invalid: "text-red-400",
              }[validState]
            }`}
          >
            ●
          </span>
        </div>
      </div>
    </GenericCenterMessage>
  );
};

const NoFilesMessage = (props: any) => {
  return (
    <div className="text-4xl text-slate-500 flex flex-1 m-2 rounded-2xl border-4 border-double border-slate-600">
      <GenericCenterMessage>{props.children}</GenericCenterMessage>
    </div>
  );
};

const InfoMessage = (props: any) => {
  return (
    <div className="text-3xl text-slate-300 flex flex-1 p-4 mx-10 my-6 rounded-2xl border-4 border-double border-sky-700">
      <GenericCenterMessage>{props.children}</GenericCenterMessage>
    </div>
  );
};

const GenericCenterMessage = (props: any) => {
  return <div className="grid flex-1 place-items-center">{props.children}</div>;
};

export default FileEntryAndModeSelector;
