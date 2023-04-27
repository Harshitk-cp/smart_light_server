type TLightOptions = {
  onConnect?: () => void;
  onClose?: () => void;
  onError?: () => void;
};

type TBypassOptions = {
  onListening?: () => void;
  onClose?: () => void;
};

type TCommandResult = {
  id: number;
  result?: (string | number)[];
  error?: Record<string, string | number>;
};

type TCommandCallback = (result: TCommandResult) => void;
