type TLightOptions = {
  onConnect?: () => void;
  onClose?: () => void;
  onError?: () => void;
};

type TCommandResult = {
  id: number;
  result: string[];
};

type TCommandCallback = (result: TCommandResult) => void;
